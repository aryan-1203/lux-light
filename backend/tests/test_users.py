"""Users API: profile, password change (session revocation), address book."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

import httpx
import pytest
import time_machine
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.cookies import ACCESS_COOKIE, REFRESH_COOKIE
from app.core.security import verify_password
from app.models import Address, RefreshToken, User
from app.services import auth as auth_service
from tests.factories import DEFAULT_PASSWORD, make_address

ADDRESSES = "/api/v1/users/me/addresses"


def assert_error(response: httpx.Response, status: int, code: str) -> dict[str, Any]:
    assert response.status_code == status, response.text
    body: dict[str, Any] = response.json()
    assert body["error"]["code"] == code
    return body


def address_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "label": "Home",
        "full_name": "Priya Sharma",
        "phone": "+919800000001",
        "line1": "14 Hill Road, Bandra West",
        "city": "Mumbai",
        "state_code": "27",
        "pincode": "400050",
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def user(make_user: Callable[..., User]) -> User:
    return make_user(full_name="Priya Sharma", phone="+919800000001")


@pytest.fixture
def authed(login_as: Callable[[User], TestClient], user: User) -> TestClient:
    return login_as(user)


# ---- profile ---------------------------------------------------------------------------------


def test_get_profile(authed: TestClient, user: User) -> None:
    response = authed.get("/api/v1/users/me")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == user.id
    assert body["full_name"] == "Priya Sharma"
    assert body["has_password"] is True


def test_get_profile_unauthenticated(client: TestClient) -> None:
    assert_error(client.get("/api/v1/users/me"), 401, "UNAUTHENTICATED")


def test_update_profile_partial(authed: TestClient, db: Session, user: User) -> None:
    response = authed.patch(
        "/api/v1/users/me", json={"full_name": "  Priya S Sharma ", "marketing_opt_in": True}
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["full_name"] == "Priya S Sharma"
    assert body["marketing_opt_in"] is True
    assert body["phone"] == "+919800000001"  # untouched
    cleared = authed.patch("/api/v1/users/me", json={"phone": None})
    assert cleared.status_code == 200
    assert cleared.json()["phone"] is None
    db.refresh(user)
    assert user.phone is None
    assert user.full_name == "Priya S Sharma"


@pytest.mark.parametrize(
    "payload",
    [{"phone": "9800000001"}, {"full_name": ""}, {"email": "new@example.com"}, {"marketing_opt_in": "maybe"}],
)
def test_update_profile_validation(authed: TestClient, payload: dict[str, Any]) -> None:
    assert_error(authed.patch("/api/v1/users/me", json=payload), 422, "VALIDATION_ERROR")


def test_update_profile_auth_and_csrf(client: TestClient, anon_client: TestClient, user: User) -> None:
    assert_error(client.patch("/api/v1/users/me", json={"full_name": "X"}), 401, "UNAUTHENTICATED")
    from app.core.security import create_access_token

    anon_client.cookies.set(ACCESS_COOKIE, create_access_token(user.id, user.role))
    assert_error(anon_client.patch("/api/v1/users/me", json={"full_name": "X"}), 403, "CSRF_FAILED")


# ---- password --------------------------------------------------------------------------------


def test_change_password_revokes_other_sessions(authed: TestClient, db: Session, user: User) -> None:
    info = auth_service.ClientInfo(ip="10.0.0.1", user_agent="other device")
    _, other_session = auth_service.issue_session(db, user, info)
    response = authed.put(
        "/api/v1/users/me/password",
        json={"current_password": DEFAULT_PASSWORD, "new_password": "BrighterMornings9"},
    )
    assert response.status_code == 204, response.text
    assert response.content == b""
    db.refresh(user)
    assert user.password_hash is not None
    assert verify_password("BrighterMornings9", user.password_hash)
    db.refresh(other_session)
    assert other_session.revoked_at is not None
    # This client keeps a fresh session.
    new_refresh = response.cookies.get(REFRESH_COOKIE)
    assert new_refresh
    assert response.cookies.get(ACCESS_COOKIE)
    active = db.scalars(
        select(RefreshToken).where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
    ).all()
    assert len(active) == 1


def test_change_password_wrong_current(authed: TestClient) -> None:
    response = authed.put(
        "/api/v1/users/me/password",
        json={"current_password": "Wrong-pass1", "new_password": "BrighterMornings9"},
    )
    assert_error(response, 400, "AUTH_PASSWORD_INCORRECT")
    missing = authed.put("/api/v1/users/me/password", json={"new_password": "BrighterMornings9"})
    assert_error(missing, 400, "AUTH_PASSWORD_INCORRECT")


def test_change_password_sets_first_password_for_otp_account(
    login_as: Callable[[User], TestClient], make_user: Callable[..., User], db: Session
) -> None:
    otp_user = make_user(password=None)
    response = login_as(otp_user).put("/api/v1/users/me/password", json={"new_password": "FirstPass2026"})
    assert response.status_code == 204
    db.refresh(otp_user)
    assert otp_user.password_hash is not None
    assert verify_password("FirstPass2026", otp_user.password_hash)


@pytest.mark.parametrize("new_password", ["short1", "lettersonly", "1234567890"])
def test_change_password_policy(authed: TestClient, new_password: str) -> None:
    response = authed.put(
        "/api/v1/users/me/password", json={"current_password": DEFAULT_PASSWORD, "new_password": new_password}
    )
    assert_error(response, 422, "VALIDATION_ERROR")


def test_change_password_auth_and_csrf(client: TestClient, anon_client: TestClient) -> None:
    payload = {"new_password": "BrighterMornings9"}
    assert_error(client.put("/api/v1/users/me/password", json=payload), 401, "UNAUTHENTICATED")
    assert_error(anon_client.put("/api/v1/users/me/password", json=payload), 403, "CSRF_FAILED")


def test_change_password_rate_limited_per_user(
    frozen_time: time_machine.Traveller, authed: TestClient
) -> None:
    payload = {"current_password": "Wrong-pass1", "new_password": "BrighterMornings9"}
    for _ in range(5):
        assert authed.put("/api/v1/users/me/password", json=payload).status_code == 400
    response = authed.put("/api/v1/users/me/password", json=payload)
    assert_error(response, 429, "RATE_LIMITED")
    assert int(response.headers["Retry-After"]) > 0


# ---- addresses -------------------------------------------------------------------------------


def test_list_addresses_default_first(authed: TestClient, db: Session, user: User) -> None:
    assert authed.get(ADDRESSES).json() == {"items": []}
    other = make_address(db, user, is_default=False, city="Pune")
    default = make_address(db, user, is_default=True)
    items = authed.get(ADDRESSES).json()["items"]
    assert [a["id"] for a in items] == [default.id, other.id]
    assert items[0]["state"] == "Maharashtra"
    assert items[0]["country"] == "IN"


def test_list_addresses_only_mine(authed: TestClient, db: Session, make_user: Callable[..., User]) -> None:
    make_address(db, make_user())
    assert authed.get(ADDRESSES).json()["items"] == []


def test_list_addresses_unauthenticated(client: TestClient) -> None:
    assert_error(client.get(ADDRESSES), 401, "UNAUTHENTICATED")


def test_create_address_first_becomes_default(authed: TestClient) -> None:
    response = authed.post(
        ADDRESSES, json=address_payload(state_code="29", pincode="560034", city="Bengaluru")
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["is_default"] is True
    assert body["state"] == "Karnataka"
    assert body["state_code"] == "29"
    assert body["line2"] is None
    assert body["landmark"] is None
    second = authed.post(ADDRESSES, json=address_payload(label="Office")).json()
    assert second["is_default"] is False


def test_create_address_new_default_unsets_previous(authed: TestClient, db: Session, user: User) -> None:
    first = authed.post(ADDRESSES, json=address_payload()).json()
    second = authed.post(ADDRESSES, json=address_payload(label="Office", is_default=True)).json()
    assert second["is_default"] is True
    defaults = db.scalars(
        select(Address.id).where(Address.user_id == user.id, Address.is_default.is_(True))
    ).all()
    assert list(defaults) == [second["id"]]
    assert first["id"] != second["id"]


def test_create_address_limit(authed: TestClient, db: Session, user: User) -> None:
    for i in range(10):
        make_address(db, user, is_default=(i == 0))
    body = assert_error(authed.post(ADDRESSES, json=address_payload()), 409, "ADDRESS_LIMIT")
    assert body["error"]["details"] == {"max_addresses": 10}


@pytest.mark.parametrize(
    "overrides",
    [
        {"pincode": "040005"},
        {"pincode": "40005"},
        {"pincode": "4000501"},
        {"state_code": "25"},
        {"state_code": "99"},
        {"phone": "+911234567890"},
        {"line1": "ab"},
        {"city": "X"},
        {"full_name": ""},
        {"country": "US"},
    ],
)
def test_create_address_validation(authed: TestClient, overrides: dict[str, Any]) -> None:
    assert_error(authed.post(ADDRESSES, json=address_payload(**overrides)), 422, "VALIDATION_ERROR")


def test_create_address_auth_and_csrf(client: TestClient, anon_client: TestClient) -> None:
    assert_error(client.post(ADDRESSES, json=address_payload()), 401, "UNAUTHENTICATED")
    assert_error(anon_client.post(ADDRESSES, json=address_payload()), 403, "CSRF_FAILED")


def test_update_address_fields_and_state(authed: TestClient, db: Session, user: User) -> None:
    address = make_address(db, user)
    response = authed.patch(
        f"{ADDRESSES}/{address.id}",
        json={
            "state_code": "07",
            "city": "New Delhi",
            "pincode": "110001",
            "landmark": "Near metro",
            "label": None,
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["state"] == "Delhi"
    assert body["state_code"] == "07"
    assert body["city"] == "New Delhi"
    assert body["landmark"] == "Near metro"
    assert body["label"] is None
    assert body["line1"] == address.line1


def test_update_address_default_handling(authed: TestClient, db: Session, user: User) -> None:
    first = make_address(db, user, is_default=True)
    second = make_address(db, user, is_default=False)
    made_default = authed.patch(f"{ADDRESSES}/{second.id}", json={"is_default": True})
    assert made_default.json()["is_default"] is True
    db.refresh(first)
    assert first.is_default is False
    # Un-defaulting the default promotes the oldest other address.
    authed.patch(f"{ADDRESSES}/{second.id}", json={"is_default": False})
    db.refresh(first)
    db.refresh(second)
    assert first.is_default is True
    assert second.is_default is False


def test_update_address_only_address_stays_default(authed: TestClient, db: Session, user: User) -> None:
    only = make_address(db, user, is_default=True)
    response = authed.patch(f"{ADDRESSES}/{only.id}", json={"is_default": False})
    assert response.status_code == 200
    assert response.json()["is_default"] is True


def test_update_address_not_found(authed: TestClient, db: Session, make_user: Callable[..., User]) -> None:
    foreign = make_address(db, make_user())
    assert_error(authed.patch(f"{ADDRESSES}/{foreign.id}", json={"city": "Pune"}), 404, "ADDRESS_NOT_FOUND")
    assert_error(authed.patch(f"{ADDRESSES}/999999999", json={"city": "Pune"}), 404, "ADDRESS_NOT_FOUND")


@pytest.mark.parametrize(
    "payload", [{"full_name": None}, {"pincode": "12345"}, {"is_default": None}, {"zip": "1"}]
)
def test_update_address_validation(
    authed: TestClient, db: Session, user: User, payload: dict[str, Any]
) -> None:
    address = make_address(db, user)
    assert_error(authed.patch(f"{ADDRESSES}/{address.id}", json=payload), 422, "VALIDATION_ERROR")


def test_update_address_bad_id_auth_and_csrf(
    client: TestClient, anon_client: TestClient, authed: TestClient
) -> None:
    assert_error(authed.patch(f"{ADDRESSES}/0", json={"city": "Pune"}), 422, "VALIDATION_ERROR")
    anon_client.cookies.clear()
    assert_error(anon_client.patch(f"{ADDRESSES}/1", json={"city": "Pune"}), 403, "CSRF_FAILED")


def test_update_address_unauthenticated(app: Any) -> None:
    from tests.conftest import make_client

    with make_client(app) as fresh:
        assert_error(fresh.patch(f"{ADDRESSES}/1", json={"city": "Pune"}), 401, "UNAUTHENTICATED")


def test_delete_address_promotes_new_default(authed: TestClient, db: Session, user: User) -> None:
    default = make_address(db, user, is_default=True)
    other = make_address(db, user, is_default=False)
    response = authed.delete(f"{ADDRESSES}/{default.id}")
    assert response.status_code == 204
    assert response.content == b""
    assert db.scalar(select(Address).where(Address.id == default.id)) is None
    db.refresh(other)
    assert other.is_default is True


def test_delete_address_not_found_and_validation(
    authed: TestClient, db: Session, make_user: Callable[..., User]
) -> None:
    foreign = make_address(db, make_user())
    assert_error(authed.delete(f"{ADDRESSES}/{foreign.id}"), 404, "ADDRESS_NOT_FOUND")
    assert db.get(Address, foreign.id) is not None
    assert_error(authed.delete(f"{ADDRESSES}/abc"), 422, "VALIDATION_ERROR")


def test_delete_address_auth_and_csrf(app: Any, anon_client: TestClient) -> None:
    from tests.conftest import make_client

    with make_client(app) as fresh:
        assert_error(fresh.delete(f"{ADDRESSES}/1"), 401, "UNAUTHENTICATED")
    assert_error(anon_client.delete(f"{ADDRESSES}/1"), 403, "CSRF_FAILED")
