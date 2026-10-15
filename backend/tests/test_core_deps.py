from __future__ import annotations

from collections.abc import Callable, Iterator
from datetime import timedelta
from typing import Any

import pytest
import time_machine
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker
from starlette.responses import Response

from app.api import deps
from app.api.deps import AdminUser, CurrentUser, DbSession, OptionalUser, StaffUser
from app.core.cookies import ACCESS_COOKIE, CART_COOKIE
from app.core.errors import register_exception_handlers
from app.core.security import create_access_token, sign_cart_token
from app.models import Category, User
from app.models.enums import UserRole
from tests import factories


@pytest.fixture
def deps_app(session_factory: sessionmaker[Session]) -> Iterator[TestClient]:
    app = FastAPI()
    register_exception_handlers(app)

    def _get_db() -> Iterator[Session]:
        session = session_factory()
        try:
            yield session
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    app.dependency_overrides[deps.get_db] = _get_db

    @app.get("/me")
    def me(user: CurrentUser) -> dict[str, Any]:
        return {"id": user.id, "role": user.role.value}

    @app.get("/maybe")
    def maybe(user: OptionalUser) -> dict[str, Any]:
        return {"id": user.id if user else None}

    @app.get("/staff")
    def staff(user: StaffUser) -> dict[str, Any]:
        return {"id": user.id}

    @app.get("/admin")
    def admin(user: AdminUser) -> dict[str, Any]:
        return {"id": user.id}

    @app.get("/cart-token")
    def cart_token(request: Request) -> dict[str, Any]:
        return {"token": deps.get_cart_token(request), "ip": deps.get_client_ip(request)}

    @app.get("/set-cart")
    def set_cart(response: Response) -> dict[str, bool]:
        deps.set_cart_cookie(response, "guest-token")
        return {"ok": True}

    @app.get("/clear-cart")
    def clear_cart(response: Response) -> dict[str, bool]:
        deps.clear_cart_cookie(response)
        return {"ok": True}

    @app.post("/fail-after-write")
    def fail_after_write(db: DbSession) -> None:
        db.add(Category(slug="rolled-back", name="x"))
        db.flush()
        raise RuntimeError("boom")

    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


def _auth(client: TestClient, user: User) -> None:
    client.cookies.set(ACCESS_COOKIE, create_access_token(user.id, user.role))


def test_current_user_requires_cookie(deps_app: TestClient) -> None:
    response = deps_app.get("/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"


def test_current_user_valid(deps_app: TestClient, make_user: Callable[..., User]) -> None:
    user = make_user()
    _auth(deps_app, user)
    assert deps_app.get("/me").json() == {"id": user.id, "role": "customer"}


def test_expired_token_is_reported_even_on_optional_routes(
    deps_app: TestClient, make_user: Callable[..., User], frozen_time: time_machine.Traveller
) -> None:
    user = make_user()
    _auth(deps_app, user)
    frozen_time.shift(timedelta(minutes=20))
    for path in ("/me", "/maybe"):
        response = deps_app.get(path)
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "AUTH_TOKEN_EXPIRED"


def test_invalid_token_clears_access_cookie(deps_app: TestClient) -> None:
    deps_app.cookies.set(ACCESS_COOKIE, "garbage")
    response = deps_app.get("/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"
    set_cookie = response.headers["set-cookie"]
    assert set_cookie.startswith(f"{ACCESS_COOKIE}=")
    assert "Max-Age=0" in set_cookie


def test_deleted_user_is_unauthenticated(deps_app: TestClient) -> None:
    deps_app.cookies.set(ACCESS_COOKIE, create_access_token(987654321, UserRole.CUSTOMER))
    response = deps_app.get("/me")
    assert response.status_code == 401
    assert "set-cookie" in response.headers


def test_blocked_user_is_rejected(deps_app: TestClient, make_user: Callable[..., User]) -> None:
    user = make_user(is_active=False)
    _auth(deps_app, user)
    response = deps_app.get("/me")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "AUTH_ACCOUNT_DISABLED"
    cleared = response.headers.get_list("set-cookie")
    assert any(c.startswith("dl_access=") for c in cleared)
    assert any(c.startswith("dl_refresh=") and "Path=/api/v1/auth" in c for c in cleared)


def test_optional_user_without_cookie_is_guest(deps_app: TestClient) -> None:
    assert deps_app.get("/maybe").json() == {"id": None}


@pytest.mark.parametrize(
    ("role", "staff_status", "admin_status"),
    [(UserRole.CUSTOMER, 403, 403), (UserRole.STAFF, 200, 403), (UserRole.ADMIN, 200, 200)],
)
def test_role_guards(
    deps_app: TestClient, make_user: Callable[..., User], role: UserRole, staff_status: int, admin_status: int
) -> None:
    _auth(deps_app, make_user(role=role))
    staff = deps_app.get("/staff")
    admin = deps_app.get("/admin")
    assert staff.status_code == staff_status
    assert admin.status_code == admin_status
    if staff_status == 403:
        assert staff.json()["error"]["code"] == "FORBIDDEN"


def test_cart_cookie_helpers(deps_app: TestClient) -> None:
    assert deps_app.get("/cart-token").json()["token"] is None
    deps_app.cookies.set(CART_COOKIE, sign_cart_token("guest-token"))
    body = deps_app.get("/cart-token").json()
    assert body["token"] == "guest-token"
    assert body["ip"] == "testclient"
    deps_app.cookies.set(CART_COOKIE, "guest-token.forgedsignature000000000000000000")
    assert deps_app.get("/cart-token").json()["token"] is None
    set_header = deps_app.get("/set-cart").headers["set-cookie"]
    assert set_header.startswith(f"{CART_COOKIE}=guest-token.")
    assert "HttpOnly" in set_header
    assert "Max-Age=5184000" in set_header
    assert "Max-Age=0" in deps_app.get("/clear-cart").headers["set-cookie"]


def test_get_db_rolls_back_on_error(deps_app: TestClient, db: Session) -> None:
    assert deps_app.post("/fail-after-write").status_code == 500
    assert db.scalar(select(Category).where(Category.slug == "rolled-back")) is None


def test_login_as_fixture(client: TestClient, login_as: Callable[[User], TestClient], db: Session) -> None:
    user = factories.make_user(db, role=UserRole.ADMIN)
    login_as(user)
    assert client.cookies.get(ACCESS_COOKIE)
