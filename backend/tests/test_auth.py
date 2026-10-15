"""Auth API: CSRF issue, signup, login, OTP, refresh rotation/reuse detection, logout, me."""

from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import timedelta
from typing import Any

import httpx
import pytest
import time_machine
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Environment, Settings
from app.core.cookies import ACCESS_COOKIE, CART_COOKIE, CSRF_COOKIE, CSRF_HEADER, REFRESH_COOKIE
from app.core.security import create_access_token, sha256_hex, sign_cart_token, verify_password
from app.models import OtpCode, RefreshToken, User
from app.models.enums import NotificationKind
from app.services import auth as auth_service
from app.services import cart as cart_service
from app.services import notifications as notifications_service
from tests.factories import DEFAULT_PASSWORD

PASSWORD = "Sunrise2026"


# ---- helpers ---------------------------------------------------------------------------------


def set_cookie_headers(response: httpx.Response, name: str) -> list[str]:
    return [h for h in response.headers.get_list("set-cookie") if h.split("=", 1)[0] == name]


def cookie_attrs(header: str) -> dict[str, str]:
    attrs: dict[str, str] = {}
    for part in header.split(";")[1:]:
        key, _, value = part.strip().partition("=")
        attrs[key.lower()] = value
    return attrs


def resync_csrf(client: TestClient, response: httpx.Response) -> None:
    """The server rotates ``dl_csrf`` on login/logout; mirror the new value like the SPA does."""
    token = response.cookies.get(CSRF_COOKIE)
    assert token
    client.cookies.delete(CSRF_COOKIE)
    client.cookies.set(CSRF_COOKIE, token)
    client.headers[CSRF_HEADER] = token


def use_cookie(client: TestClient, name: str, value: str) -> None:
    client.cookies.delete(name)
    client.cookies.set(name, value)


def assert_error(response: httpx.Response, status: int, code: str) -> dict[str, Any]:
    assert response.status_code == status, response.text
    body: dict[str, Any] = response.json()
    assert body["error"]["code"] == code
    return body


@pytest.fixture
def notify_calls(monkeypatch: pytest.MonkeyPatch) -> list[dict[str, Any]]:
    calls: list[dict[str, Any]] = []

    def fake_notify(db: Session, kind: NotificationKind, **kwargs: Any) -> list[Any]:
        calls.append({"kind": kind, **kwargs})
        return []

    monkeypatch.setattr(notifications_service, "notify", fake_notify)
    return calls


def signup_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "email": "Asha.Verma@Example.com",
        "password": PASSWORD,
        "full_name": "Asha Verma",
        "phone": "+919812345678",
    }
    payload.update(overrides)
    return payload


def do_login(client: TestClient, email: str, password: str = DEFAULT_PASSWORD) -> httpx.Response:
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def request_code(client: TestClient, email: str) -> str:
    response = client.post("/api/v1/auth/otp/request", json={"email": email})
    assert response.status_code == 202, response.text
    code = response.json()["dev_code"]
    assert isinstance(code, str)
    return code


# ---- issueCsrfToken --------------------------------------------------------------------------


def test_issue_csrf_token_sets_readable_cookie(anon_client: TestClient) -> None:
    response = anon_client.get("/api/v1/auth/csrf")
    assert response.status_code == 200
    token = response.json()["csrf_token"]
    [header] = set_cookie_headers(response, CSRF_COOKIE)
    assert header.startswith(f"{CSRF_COOKIE}={token};")
    attrs = cookie_attrs(header)
    assert "httponly" not in attrs
    assert attrs["path"] == "/"
    assert attrs["samesite"].lower() == "lax"
    assert attrs["max-age"] == str(7 * 24 * 3600)
    assert "secure" not in attrs


def test_issued_csrf_token_unlocks_unsafe_requests(anon_client: TestClient) -> None:
    blocked = anon_client.post("/api/v1/auth/logout")
    assert_error(blocked, 403, "CSRF_FAILED")
    token = anon_client.get("/api/v1/auth/csrf").json()["csrf_token"]
    anon_client.headers[CSRF_HEADER] = token
    assert anon_client.post("/api/v1/auth/logout").status_code == 204


# ---- signup ----------------------------------------------------------------------------------


def test_signup_creates_user_and_session(
    client: TestClient, db: Session, notify_calls: list[dict[str, Any]]
) -> None:
    response = client.post("/api/v1/auth/signup", json=signup_payload())
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["is_new_user"] is True
    assert body["cart_merged"] is False
    user_out = body["user"]
    assert user_out["email"] == "asha.verma@example.com"
    assert user_out["has_password"] is True
    assert user_out["email_verified"] is False
    assert user_out["role"] == "customer"

    user = db.scalar(select(User).where(User.email == "asha.verma@example.com"))
    assert user is not None
    assert user.password_hash
    assert user.password_hash != PASSWORD
    assert verify_password(PASSWORD, user.password_hash)
    assert user.last_login_at is not None

    [access] = set_cookie_headers(response, ACCESS_COOKIE)
    [refresh] = set_cookie_headers(response, REFRESH_COOKIE)
    assert "httponly" in cookie_attrs(access)
    assert cookie_attrs(access)["path"] == "/"
    assert cookie_attrs(access)["max-age"] == str(15 * 60)
    assert "httponly" in cookie_attrs(refresh)
    assert cookie_attrs(refresh)["path"] == "/api/v1/auth"
    assert cookie_attrs(refresh)["max-age"] == str(30 * 24 * 3600)
    assert set_cookie_headers(response, CSRF_COOKIE), "CSRF cookie must be rotated on login"
    assert [c["kind"] for c in notify_calls] == [NotificationKind.WELCOME]

    raw_refresh = response.cookies.get(REFRESH_COOKIE)
    row = db.scalar(select(RefreshToken).where(RefreshToken.user_id == user.id))
    assert row is not None
    assert row.token_hash == sha256_hex(raw_refresh)
    assert row.token_hash != raw_refresh

    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["id"] == user.id


def test_signup_email_taken_is_case_insensitive(client: TestClient, make_user: Callable[..., User]) -> None:
    make_user(email="taken@example.com")
    response = client.post("/api/v1/auth/signup", json=signup_payload(email="TAKEN@example.com"))
    assert_error(response, 409, "AUTH_EMAIL_TAKEN")


@pytest.mark.parametrize(
    "overrides",
    [
        {"password": "onlyletters"},
        {"password": "12345678"},
        {"password": "a1"},
        {"email": "not-an-email"},
        {"phone": "9812345678"},
        {"phone": "+915812345678"},
        {"full_name": ""},
        {"role": "admin"},
    ],
)
def test_signup_validation_errors(client: TestClient, overrides: dict[str, Any]) -> None:
    response = client.post("/api/v1/auth/signup", json=signup_payload(**overrides))
    body = assert_error(response, 422, "VALIDATION_ERROR")
    assert body["error"]["details"]["fields"]


def test_signup_requires_csrf(anon_client: TestClient) -> None:
    assert_error(anon_client.post("/api/v1/auth/signup", json=signup_payload()), 403, "CSRF_FAILED")


def test_signup_rate_limited_per_ip(client: TestClient, frozen_time: time_machine.Traveller) -> None:
    for i in range(5):
        response = client.post("/api/v1/auth/signup", json=signup_payload(email=f"rl{i}@example.com"))
        assert response.status_code == 201
        resync_csrf(client, response)
    response = client.post("/api/v1/auth/signup", json=signup_payload(email="rl9@example.com"))
    assert_error(response, 429, "RATE_LIMITED")
    assert int(response.headers["Retry-After"]) > 0


def test_signup_merges_guest_cart_and_clears_cookie(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    seen: list[str | None] = []

    def fake_merge(db: Session, guest_token: str | None, user: User) -> bool:
        seen.append(guest_token)
        return True

    monkeypatch.setattr(cart_service, "merge_guest_cart", fake_merge)
    client.cookies.set(CART_COOKIE, sign_cart_token("guest-cart-token"))
    response = client.post("/api/v1/auth/signup", json=signup_payload())
    assert response.status_code == 201
    assert response.json()["cart_merged"] is True
    assert seen == ["guest-cart-token"]
    [cleared] = set_cookie_headers(response, CART_COOKIE)
    assert cookie_attrs(cleared)["max-age"] == "0"


def test_signup_tolerates_unimplemented_cart_merge(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def not_ready(db: Session, guest_token: str | None, user: User) -> bool:
        raise NotImplementedError

    monkeypatch.setattr(cart_service, "merge_guest_cart", not_ready)
    client.cookies.set(CART_COOKIE, sign_cart_token("guest-cart-token"))
    response = client.post("/api/v1/auth/signup", json=signup_payload())
    assert response.status_code == 201
    assert response.json()["cart_merged"] is False


def test_tampered_cart_cookie_is_not_merged(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    seen: list[str | None] = []
    monkeypatch.setattr(cart_service, "merge_guest_cart", lambda db, token, user: seen.append(token) or True)
    client.cookies.set(CART_COOKIE, "forged.0123456789abcdef0123456789abcdef")
    response = client.post("/api/v1/auth/signup", json=signup_payload())
    assert response.status_code == 201
    assert response.json()["cart_merged"] is False
    assert seen == []


def test_session_cookies_are_secure_in_production(
    client: TestClient, settings: Settings, make_user: Callable[..., User]
) -> None:
    object.__setattr__(settings, "ENV", Environment.PRODUCTION)
    user = make_user()
    response = do_login(client, user.email)
    assert response.status_code == 200
    for name in (ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE):
        [header] = set_cookie_headers(response, name)
        assert "secure" in cookie_attrs(header)


# ---- login -----------------------------------------------------------------------------------


def test_login_success(client: TestClient, db: Session, make_user: Callable[..., User]) -> None:
    user = make_user(email="priya@example.com")
    response = do_login(client, "Priya@Example.com")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["user"]["id"] == user.id
    assert body["is_new_user"] is False
    assert response.cookies.get(ACCESS_COOKIE)
    db.refresh(user)
    assert user.last_login_at is not None


def test_login_rotates_csrf_cookie(client: TestClient, make_user: Callable[..., User]) -> None:
    user = make_user()
    response = do_login(client, user.email)
    old_header = client.headers[CSRF_HEADER]
    new_token = response.cookies.get(CSRF_COOKIE)
    assert new_token
    assert new_token != old_header
    resync_csrf(client, response)
    assert client.patch("/api/v1/users/me", json={"full_name": "New Name"}).status_code == 200


def test_login_no_account_enumeration(client: TestClient, make_user: Callable[..., User]) -> None:
    make_user(email="known@example.com")
    make_user(email="otp-only@example.com", password=None)
    wrong_password = assert_error(
        do_login(client, "known@example.com", "Wrong-pass1"), 401, "AUTH_INVALID_CREDENTIALS"
    )
    unknown = assert_error(do_login(client, "nobody@example.com"), 401, "AUTH_INVALID_CREDENTIALS")
    otp_only = assert_error(do_login(client, "otp-only@example.com"), 401, "AUTH_INVALID_CREDENTIALS")
    assert wrong_password == unknown == otp_only


def test_login_blocked_account(client: TestClient, make_user: Callable[..., User]) -> None:
    user = make_user(is_active=False)
    response = assert_error(do_login(client, user.email), 403, "AUTH_ACCOUNT_DISABLED")
    assert response["error"]["message"]
    # A wrong password never reveals that the account is blocked.
    assert_error(do_login(client, user.email, "Wrong-pass1"), 401, "AUTH_INVALID_CREDENTIALS")


def test_login_validation_error(client: TestClient) -> None:
    assert_error(client.post("/api/v1/auth/login", json={"email": "a@example.com"}), 422, "VALIDATION_ERROR")


def test_login_requires_csrf(anon_client: TestClient) -> None:
    response = anon_client.post("/api/v1/auth/login", json={"email": "a@example.com", "password": "x"})
    assert_error(response, 403, "CSRF_FAILED")


def test_login_rate_limited_per_email(
    client: TestClient, make_user: Callable[..., User], frozen_time: time_machine.Traveller
) -> None:
    user = make_user()
    for _ in range(5):
        assert do_login(client, user.email, "Wrong-pass1").status_code == 401
    response = do_login(client, user.email)
    assert_error(response, 429, "RATE_LIMITED")
    assert int(response.headers["Retry-After"]) > 0
    # Other emails from the same IP are still allowed (IP limit is 10 / 5 min).
    assert do_login(client, "other@example.com", "Wrong-pass1").status_code == 401


def test_login_rate_limited_per_ip(client: TestClient, frozen_time: time_machine.Traveller) -> None:
    for i in range(10):
        assert do_login(client, f"user{i}@example.com", "Wrong-pass1").status_code == 401
    response = do_login(client, "user99@example.com", "Wrong-pass1")
    assert_error(response, 429, "RATE_LIMITED")
    assert "Retry-After" in response.headers


# ---- requestOtp ------------------------------------------------------------------------------


def test_request_otp_issues_hashed_code_and_emails_it(
    client: TestClient,
    db: Session,
    notify_calls: list[dict[str, Any]],
    frozen_time: time_machine.Traveller,
) -> None:
    response = client.post("/api/v1/auth/otp/request", json={"email": "New.Person@example.com"})
    assert response.status_code == 202, response.text
    body = response.json()
    assert body["expires_in_seconds"] == 600
    assert body["resend_after_seconds"] == 60
    code = body["dev_code"]
    assert isinstance(code, str)
    assert len(code) == 6
    assert code.isdigit()

    otp = db.scalar(select(OtpCode).where(OtpCode.email == "new.person@example.com"))
    assert otp is not None
    assert otp.code_hash != code
    assert len(otp.code_hash) == 64
    assert code not in otp.code_hash
    assert otp.max_attempts == 5
    assert otp.attempts == 0
    assert (otp.expires_at - otp.created_at) == timedelta(minutes=10)
    # No account is created by requesting a code.
    assert db.scalar(select(User).where(User.email == "new.person@example.com")) is None
    [call] = notify_calls
    assert call["kind"] is NotificationKind.OTP_LOGIN
    assert call["email"] == "new.person@example.com"
    assert call["context"]["code"] == code


def test_request_otp_same_response_for_known_and_unknown_email(
    client: TestClient, make_user: Callable[..., User]
) -> None:
    make_user(email="known@example.com")
    known = client.post("/api/v1/auth/otp/request", json={"email": "known@example.com"})
    unknown = client.post("/api/v1/auth/otp/request", json={"email": "unknown@example.com"})
    assert known.status_code == unknown.status_code == 202
    assert known.json().keys() == unknown.json().keys()
    assert known.json()["message"] == unknown.json()["message"]


def test_request_otp_dev_code_hidden_without_echo_or_in_production(
    client: TestClient, settings: Settings
) -> None:
    object.__setattr__(settings, "OTP_DEV_ECHO", False)
    first = client.post("/api/v1/auth/otp/request", json={"email": "a@example.com"})
    assert first.status_code == 202
    assert first.json()["dev_code"] is None
    object.__setattr__(settings, "OTP_DEV_ECHO", True)
    object.__setattr__(settings, "ENV", Environment.PRODUCTION)
    second = client.post("/api/v1/auth/otp/request", json={"email": "b@example.com"})
    assert second.status_code == 202
    assert second.json()["dev_code"] is None


def test_request_otp_tolerates_unimplemented_notifications(client: TestClient) -> None:
    # notifications.notify may still be a stub: the code is issued regardless.
    assert request_code(client, "stub@example.com")


def test_request_otp_resend_invalidates_previous_code(
    client: TestClient, db: Session, frozen_time: time_machine.Traveller
) -> None:
    first = request_code(client, "resend@example.com")
    too_soon = client.post("/api/v1/auth/otp/request", json={"email": "resend@example.com"})
    assert_error(too_soon, 429, "RATE_LIMITED")
    assert 1 <= int(too_soon.headers["Retry-After"]) <= 61
    frozen_time.shift(timedelta(seconds=61))
    second = request_code(client, "resend@example.com")
    rows = db.scalars(select(OtpCode).where(OtpCode.email == "resend@example.com").order_by(OtpCode.id)).all()
    assert len(rows) == 2
    assert rows[0].consumed_at is not None
    assert rows[1].consumed_at is None
    stale = client.post("/api/v1/auth/otp/verify", json={"email": "resend@example.com", "code": first})
    if first != second:
        assert_error(stale, 400, "AUTH_OTP_INVALID")


def test_request_otp_rate_limited_per_email(client: TestClient, frozen_time: time_machine.Traveller) -> None:
    for _ in range(3):
        request_code(client, "limited@example.com")
        frozen_time.shift(timedelta(seconds=61))
    response = client.post("/api/v1/auth/otp/request", json={"email": "limited@example.com"})
    assert_error(response, 429, "RATE_LIMITED")
    assert "Retry-After" in response.headers


def test_request_otp_rate_limited_per_ip(client: TestClient, frozen_time: time_machine.Traveller) -> None:
    for i in range(10):
        request_code(client, f"ip{i}@example.com")
    response = client.post("/api/v1/auth/otp/request", json={"email": "ip99@example.com"})
    assert_error(response, 429, "RATE_LIMITED")
    assert "Retry-After" in response.headers


def test_request_otp_blocked_account_gets_generic_response(
    client: TestClient, db: Session, make_user: Callable[..., User]
) -> None:
    user = make_user(is_active=False)
    response = client.post("/api/v1/auth/otp/request", json={"email": user.email})
    assert response.status_code == 202
    assert (
        db.scalar(select(OtpCode).where(OtpCode.email == user.email, OtpCode.consumed_at.is_(None))) is None
    )


def test_request_otp_validation_and_csrf(client: TestClient, anon_client: TestClient) -> None:
    assert_error(client.post("/api/v1/auth/otp/request", json={"email": "nope"}), 422, "VALIDATION_ERROR")
    assert_error(
        anon_client.post("/api/v1/auth/otp/request", json={"email": "a@example.com"}), 403, "CSRF_FAILED"
    )


def test_otp_logs_never_contain_code_or_email(client: TestClient, caplog: pytest.LogCaptureFixture) -> None:
    with caplog.at_level(logging.DEBUG):
        code = request_code(client, "private.person@example.com")
        client.post("/api/v1/auth/otp/verify", json={"email": "private.person@example.com", "code": code})
    assert code not in caplog.text
    assert "private.person@example.com" not in caplog.text


# ---- verifyOtp -------------------------------------------------------------------------------


def test_verify_otp_creates_account_for_new_email(
    client: TestClient, db: Session, notify_calls: list[dict[str, Any]]
) -> None:
    code = request_code(client, "fresh@example.com")
    response = client.post("/api/v1/auth/otp/verify", json={"email": "Fresh@example.com", "code": code})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["is_new_user"] is True
    assert body["user"]["has_password"] is False
    assert body["user"]["email_verified"] is True
    assert response.cookies.get(ACCESS_COOKIE)
    assert response.cookies.get(REFRESH_COOKIE)
    user = db.scalar(select(User).where(User.email == "fresh@example.com"))
    assert user is not None
    assert user.password_hash is None
    assert user.email_verified_at is not None
    otp = db.scalar(select(OtpCode).where(OtpCode.email == "fresh@example.com"))
    assert otp is not None
    assert otp.consumed_at is not None
    assert NotificationKind.WELCOME in [c["kind"] for c in notify_calls]


def test_verify_otp_existing_user_logs_in(client: TestClient, make_user: Callable[..., User]) -> None:
    user = make_user(email="existing@example.com")
    code = request_code(client, user.email)
    response = client.post("/api/v1/auth/otp/verify", json={"email": user.email, "code": code})
    assert response.status_code == 200
    assert response.json()["is_new_user"] is False
    assert response.json()["user"]["id"] == user.id
    assert response.json()["user"]["email_verified"] is True


def test_verify_otp_merges_guest_cart(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(cart_service, "merge_guest_cart", lambda db, token, user: token == "guest-token")
    code = request_code(client, "cart@example.com")
    client.cookies.set(CART_COOKIE, sign_cart_token("guest-token"))
    response = client.post("/api/v1/auth/otp/verify", json={"email": "cart@example.com", "code": code})
    assert response.status_code == 200
    assert response.json()["cart_merged"] is True


def wrong_code(code: str) -> str:
    return f"{(int(code) + 1) % 1_000_000:06d}"


def test_verify_otp_wrong_code_counts_attempts(client: TestClient, db: Session) -> None:
    code = request_code(client, "wrong@example.com")
    response = client.post(
        "/api/v1/auth/otp/verify", json={"email": "wrong@example.com", "code": wrong_code(code)}
    )
    body = assert_error(response, 400, "AUTH_OTP_INVALID")
    assert body["error"]["details"]["attempts_remaining"] == 4
    otp = db.scalar(select(OtpCode).where(OtpCode.email == "wrong@example.com"))
    assert otp is not None
    db.refresh(otp)
    assert otp.attempts == 1, "the failed attempt must be committed despite the error response"
    ok = client.post("/api/v1/auth/otp/verify", json={"email": "wrong@example.com", "code": code})
    assert ok.status_code == 200


def test_verify_otp_too_many_attempts(client: TestClient) -> None:
    code = request_code(client, "brute@example.com")
    bad = wrong_code(code)
    for _ in range(4):
        response = client.post("/api/v1/auth/otp/verify", json={"email": "brute@example.com", "code": bad})
        assert_error(response, 400, "AUTH_OTP_INVALID")
    fifth = client.post("/api/v1/auth/otp/verify", json={"email": "brute@example.com", "code": bad})
    assert_error(fifth, 429, "AUTH_OTP_TOO_MANY_ATTEMPTS")
    # The code is burnt: even the right code no longer works.
    after = client.post("/api/v1/auth/otp/verify", json={"email": "brute@example.com", "code": code})
    assert_error(after, 400, "AUTH_OTP_EXPIRED")


def test_verify_otp_attempts_exhausted_on_existing_row(client: TestClient, db: Session) -> None:
    code = request_code(client, "maxed@example.com")
    otp = db.scalar(select(OtpCode).where(OtpCode.email == "maxed@example.com"))
    assert otp is not None
    otp.attempts = otp.max_attempts
    db.flush()
    response = client.post("/api/v1/auth/otp/verify", json={"email": "maxed@example.com", "code": code})
    assert_error(response, 429, "AUTH_OTP_TOO_MANY_ATTEMPTS")


def test_verify_otp_expired_code(client: TestClient, frozen_time: time_machine.Traveller) -> None:
    code = request_code(client, "late@example.com")
    frozen_time.shift(timedelta(minutes=10, seconds=1))
    response = client.post("/api/v1/auth/otp/verify", json={"email": "late@example.com", "code": code})
    assert_error(response, 400, "AUTH_OTP_EXPIRED")


def test_verify_otp_without_code_and_reuse(client: TestClient) -> None:
    none = client.post("/api/v1/auth/otp/verify", json={"email": "never@example.com", "code": "123456"})
    assert_error(none, 400, "AUTH_OTP_EXPIRED")
    code = request_code(client, "once@example.com")
    first = client.post("/api/v1/auth/otp/verify", json={"email": "once@example.com", "code": code})
    assert first.status_code == 200
    resync_csrf(client, first)
    reused = client.post("/api/v1/auth/otp/verify", json={"email": "once@example.com", "code": code})
    assert_error(reused, 400, "AUTH_OTP_EXPIRED")


def test_verify_otp_blocked_account(client: TestClient, make_user: Callable[..., User], db: Session) -> None:
    user = make_user(email="blocked-otp@example.com")
    code = request_code(client, user.email)
    user.is_active = False
    db.flush()
    response = client.post("/api/v1/auth/otp/verify", json={"email": user.email, "code": code})
    assert_error(response, 403, "AUTH_ACCOUNT_DISABLED")


@pytest.mark.parametrize("code", ["12345", "abcdef", "1234567"])
def test_verify_otp_validation_error(client: TestClient, code: str) -> None:
    response = client.post("/api/v1/auth/otp/verify", json={"email": "a@example.com", "code": code})
    assert_error(response, 422, "VALIDATION_ERROR")


def test_verify_otp_requires_csrf(anon_client: TestClient) -> None:
    response = anon_client.post("/api/v1/auth/otp/verify", json={"email": "a@example.com", "code": "123456"})
    assert_error(response, 403, "CSRF_FAILED")


def test_verify_otp_rate_limited_per_email(client: TestClient, frozen_time: time_machine.Traveller) -> None:
    for _ in range(10):
        response = client.post(
            "/api/v1/auth/otp/verify", json={"email": "spray@example.com", "code": "000000"}
        )
        assert response.status_code == 400
    response = client.post("/api/v1/auth/otp/verify", json={"email": "spray@example.com", "code": "000000"})
    assert_error(response, 429, "RATE_LIMITED")
    assert "Retry-After" in response.headers


# ---- refreshSession --------------------------------------------------------------------------


def logged_in(client: TestClient, user: User) -> httpx.Response:
    response = do_login(client, user.email)
    assert response.status_code == 200
    resync_csrf(client, response)
    return response


def test_refresh_session_rotates_token(
    client: TestClient, db: Session, make_user: Callable[..., User]
) -> None:
    user = make_user()
    first = logged_in(client, user).cookies.get(REFRESH_COOKIE)
    assert first
    response = client.post("/api/v1/auth/refresh")
    assert response.status_code == 200, response.text
    assert response.json()["user"]["id"] == user.id
    second = response.cookies.get(REFRESH_COOKIE)
    assert second
    assert second != first
    assert response.cookies.get(ACCESS_COOKIE)
    old = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == sha256_hex(first)))
    new = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == sha256_hex(second)))
    assert old is not None
    assert new is not None
    assert old.revoked_at is not None
    assert old.replaced_by_id == new.id
    assert new.revoked_at is None
    assert new.family_id == old.family_id


def test_refresh_session_reuse_revokes_family(
    client: TestClient, db: Session, make_user: Callable[..., User]
) -> None:
    user = make_user()
    first = logged_in(client, user).cookies.get(REFRESH_COOKIE)
    assert first
    second = client.post("/api/v1/auth/refresh").cookies.get(REFRESH_COOKIE)
    assert second

    use_cookie(client, REFRESH_COOKIE, first)  # attacker replays the rotated token
    replay = client.post("/api/v1/auth/refresh")
    assert_error(replay, 401, "AUTH_REFRESH_INVALID")
    cleared = set_cookie_headers(replay, ACCESS_COOKIE) + set_cookie_headers(replay, REFRESH_COOKIE)
    assert cleared
    assert all(cookie_attrs(h)["max-age"] == "0" for h in cleared)

    rows = db.scalars(select(RefreshToken).where(RefreshToken.user_id == user.id)).all()
    for row in rows:
        db.refresh(row)
    assert rows
    assert all(row.revoked_at is not None for row in rows)

    use_cookie(client, REFRESH_COOKIE, second)  # the legitimate latest token is dead too
    assert_error(client.post("/api/v1/auth/refresh"), 401, "AUTH_REFRESH_INVALID")


def test_refresh_session_missing_unknown_or_expired(
    client: TestClient, make_user: Callable[..., User], frozen_time: time_machine.Traveller
) -> None:
    assert_error(client.post("/api/v1/auth/refresh"), 401, "AUTH_REFRESH_INVALID")
    use_cookie(client, REFRESH_COOKIE, "not-a-real-token")
    assert_error(client.post("/api/v1/auth/refresh"), 401, "AUTH_REFRESH_INVALID")
    user = make_user()
    token = logged_in(client, user).cookies.get(REFRESH_COOKIE)
    assert token
    frozen_time.shift(timedelta(days=30, seconds=1))
    use_cookie(client, REFRESH_COOKIE, token)
    assert_error(client.post("/api/v1/auth/refresh"), 401, "AUTH_REFRESH_INVALID")


def test_refresh_session_blocked_user(
    client: TestClient, db: Session, make_user: Callable[..., User]
) -> None:
    user = make_user()
    logged_in(client, user)
    user.is_active = False
    db.flush()
    assert_error(client.post("/api/v1/auth/refresh"), 403, "AUTH_ACCOUNT_DISABLED")


def test_refresh_session_requires_csrf(anon_client: TestClient) -> None:
    assert_error(anon_client.post("/api/v1/auth/refresh"), 403, "CSRF_FAILED")


def test_refresh_session_rate_limited(client: TestClient, frozen_time: time_machine.Traveller) -> None:
    for _ in range(30):
        assert client.post("/api/v1/auth/refresh").status_code == 401
    response = client.post("/api/v1/auth/refresh")
    assert_error(response, 429, "RATE_LIMITED")
    assert "Retry-After" in response.headers


def test_revoke_all_refresh_tokens(db: Session, make_user: Callable[..., User]) -> None:
    user = make_user()
    other = make_user()
    client_info = auth_service.ClientInfo(ip="127.0.0.1", user_agent="pytest")
    for _ in range(3):
        auth_service.issue_session(db, user, client_info)
    auth_service.issue_session(db, other, client_info)
    assert auth_service.revoke_all_refresh_tokens(db, user.id) == 3
    assert auth_service.revoke_all_refresh_tokens(db, user.id) == 0
    remaining = db.scalars(select(RefreshToken).where(RefreshToken.user_id == other.id)).all()
    assert [r.revoked_at for r in remaining] == [None]


# ---- logout ----------------------------------------------------------------------------------


def test_logout_revokes_and_clears(client: TestClient, db: Session, make_user: Callable[..., User]) -> None:
    user = make_user()
    token = logged_in(client, user).cookies.get(REFRESH_COOKIE)
    assert token
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 204
    assert response.content == b""
    for name in (ACCESS_COOKIE, REFRESH_COOKIE, CART_COOKIE):
        [header] = set_cookie_headers(response, name)
        assert cookie_attrs(header)["max-age"] == "0"
    assert cookie_attrs(set_cookie_headers(response, REFRESH_COOKIE)[0])["path"] == "/api/v1/auth"
    assert set_cookie_headers(response, CSRF_COOKIE)
    row = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == sha256_hex(token)))
    assert row is not None
    db.refresh(row)
    assert row.revoked_at is not None


def test_logout_without_session_and_with_expired_access(
    client: TestClient, make_user: Callable[..., User], frozen_time: time_machine.Traveller
) -> None:
    first = client.post("/api/v1/auth/logout")
    assert first.status_code == 204
    resync_csrf(client, first)
    user = make_user()
    client.cookies.set(ACCESS_COOKIE, create_access_token(user.id, user.role))
    frozen_time.shift(timedelta(minutes=16))
    assert client.post("/api/v1/auth/logout").status_code == 204


def test_logout_requires_csrf(anon_client: TestClient) -> None:
    assert_error(anon_client.post("/api/v1/auth/logout"), 403, "CSRF_FAILED")


# ---- getMe -----------------------------------------------------------------------------------


def test_get_me_returns_profile(
    login_as: Callable[[User], TestClient], make_user: Callable[..., User]
) -> None:
    user = make_user(full_name="Arjun Rao", phone="+919800000002", marketing_opt_in=True)
    response = login_as(user).get("/api/v1/auth/me")
    assert response.status_code == 200
    assert response.json() == {
        "id": user.id,
        "email": user.email,
        "full_name": "Arjun Rao",
        "phone": "+919800000002",
        "role": "customer",
        "email_verified": False,
        "has_password": True,
        "marketing_opt_in": True,
        "created_at": response.json()["created_at"],
    }


def test_get_me_unauthenticated_and_expired(
    client: TestClient, make_user: Callable[..., User], frozen_time: time_machine.Traveller
) -> None:
    assert_error(client.get("/api/v1/auth/me"), 401, "UNAUTHENTICATED")
    user = make_user()
    client.cookies.set(ACCESS_COOKIE, create_access_token(user.id, user.role))
    frozen_time.shift(timedelta(minutes=16))
    assert_error(client.get("/api/v1/auth/me"), 401, "AUTH_TOKEN_EXPIRED")
    client.cookies.set(ACCESS_COOKIE, "garbage")
    assert_error(client.get("/api/v1/auth/me"), 401, "UNAUTHENTICATED")


def test_get_me_blocked_user(login_as: Callable[[User], TestClient], make_user: Callable[..., User]) -> None:
    user = make_user(is_active=False)
    assert_error(login_as(user).get("/api/v1/auth/me"), 403, "AUTH_ACCOUNT_DISABLED")
