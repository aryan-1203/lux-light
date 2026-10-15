"""Auth service (PLAN §1.3): sessions, rotating refresh tokens, email OTP. Owner: Backend Core.

* Refresh tokens are opaque 32-byte values; only their sha256 is stored. Every use rotates the token
  (old row ``revoked_at`` + ``replaced_by_id``); presenting a revoked token revokes its whole family.
* OTP codes are 6 digits, HMAC-hashed with a key derived from ``SECRET_KEY``, valid 10 minutes,
  5 attempts; requesting a new code consumes the previous unconsumed ones.
* Errors never reveal whether an account exists (login → ``AUTH_INVALID_CREDENTIALS``; OTP request
  always 202). Nothing here logs emails, codes or tokens.
"""

from __future__ import annotations

import logging
import secrets
import uuid
from dataclasses import dataclass
from datetime import timedelta
from functools import lru_cache
from typing import Final

from fastapi import BackgroundTasks
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from starlette.responses import Response

from app.core import clock, cookies
from app.core.config import get_settings
from app.core.errors import (
    AppError,
    BadRequestError,
    ConflictError,
    ForbiddenError,
    RateLimitedError,
    UnauthorizedError,
)
from app.core.rate_limit import check_rate_limit
from app.core.security import (
    create_access_token,
    hash_password,
    hmac_hex,
    ip_hash,
    new_opaque_token,
    password_needs_rehash,
    sha256_hex,
    verify_password,
)
from app.models import OtpCode, RefreshToken, User
from app.models.enums import NotificationKind, OtpPurpose
from app.schemas.auth import SignupRequest
from app.services import cart as cart_service
from app.services import notifications as notifications_service

logger = logging.getLogger("app.auth")

OTP_LENGTH: Final = 6
OTP_TTL: Final = timedelta(minutes=10)
OTP_MAX_ATTEMPTS: Final = 5
OTP_RESEND_AFTER: Final = timedelta(seconds=60)
USER_AGENT_MAX: Final = 255

# Per-email limits (per-IP limits are route dependencies). PLAN / contract x-rate-limit.
LOGIN_EMAIL_LIMIT: Final = (5, 300)
OTP_REQUEST_EMAIL_LIMIT: Final = (3, 600)
OTP_VERIFY_EMAIL_LIMIT: Final = (10, 600)

INVALID_CREDENTIALS_MESSAGE: Final = "Incorrect email or password."
ACCOUNT_DISABLED_MESSAGE: Final = "This account has been disabled. Please contact support."


@dataclass(frozen=True)
class SessionTokens:
    access_token: str
    refresh_token: str


@dataclass(frozen=True)
class ClientInfo:
    ip: str
    user_agent: str | None


class CommitBeforeRaiseError(Exception):
    """Raised when state changes (OTP attempt counters, revoked token families) must be committed
    before the wrapped ``error`` is returned to the client (``get_db`` rolls back on exceptions)."""

    def __init__(self, error: AppError) -> None:
        super().__init__(error.code)
        self.error = error


# ---- helpers -----------------------------------------------------------------------------------


def email_key(email: str) -> str:
    """Keyed, non-reversible identifier for rate-limit keys (never put raw emails in keys/logs)."""
    return hmac_hex(get_settings().SECRET_KEY, "rl-email:" + email.strip().lower())[:32]


def _otp_hash(email: str, code: str) -> str:
    otp_key = hmac_hex(get_settings().SECRET_KEY, "dawnlit-otp-v1")
    return hmac_hex(otp_key, f"{email}:{code}")


@lru_cache(maxsize=1)
def _dummy_password_hash() -> str:
    return hash_password(secrets.token_urlsafe(16))


def clear_auth_cookie_headers() -> list[str]:
    scratch = Response()
    cookies.clear_auth_cookies(scratch)
    return [value.decode("latin-1") for key, value in scratch.raw_headers if key == b"set-cookie"]


def _refresh_invalid(*, clear_cookies: bool = True) -> UnauthorizedError:
    error = UnauthorizedError("AUTH_REFRESH_INVALID", "Your session has ended. Please log in again.")
    if clear_cookies:
        error.set_cookies.extend(clear_auth_cookie_headers())
    return error


def _account_disabled() -> ForbiddenError:
    error = ForbiddenError("AUTH_ACCOUNT_DISABLED", ACCOUNT_DISABLED_MESSAGE)
    error.set_cookies.extend(clear_auth_cookie_headers())
    return error


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.strip().lower()))


# ---- sessions ----------------------------------------------------------------------------------


def issue_session(
    db: Session, user: User, client: ClientInfo, *, family_id: str | None = None
) -> tuple[SessionTokens, RefreshToken]:
    """Create a refresh-token row (new family unless given) and an access JWT."""
    raw = new_opaque_token(32)
    row = RefreshToken(
        user_id=user.id,
        token_hash=sha256_hex(raw),
        family_id=family_id or uuid.uuid4().hex,
        expires_at=clock.now_utc() + timedelta(days=get_settings().REFRESH_TOKEN_TTL_DAYS),
        user_agent=client.user_agent[:USER_AGENT_MAX] if client.user_agent else None,
        ip_hash=ip_hash(client.ip),
    )
    db.add(row)
    db.flush()
    return SessionTokens(create_access_token(user.id, user.role), raw), row


def mark_logged_in(user: User) -> None:
    user.last_login_at = clock.now_utc()


def revoke_all_refresh_tokens(db: Session, user_id: int) -> int:
    """Revoke every active refresh token of the user (admin block, password change); returns count."""
    result = db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=clock.now_utc())
        .execution_options(synchronize_session=False)
    )
    db.flush()
    return int(getattr(result, "rowcount", 0) or 0)


def _revoke_family(db: Session, family_id: str) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.family_id == family_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=clock.now_utc())
        .execution_options(synchronize_session=False)
    )
    db.flush()


def rotate_refresh_token(
    db: Session, raw_token: str | None, client: ClientInfo
) -> tuple[User, SessionTokens]:
    """Validate + rotate. 401 ``AUTH_REFRESH_INVALID``; 403 ``AUTH_ACCOUNT_DISABLED``.

    Reuse of a revoked token revokes the whole family (raised as ``CommitBeforeRaiseError``)."""
    if not raw_token or len(raw_token) > 128:
        raise _refresh_invalid()
    row = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == sha256_hex(raw_token)).with_for_update()
    )
    if row is None:
        raise _refresh_invalid()
    now = clock.now_utc()
    if row.revoked_at is not None:
        logger.warning("refresh token reuse detected; revoking token family (user_id=%s)", row.user_id)
        _revoke_family(db, row.family_id)
        raise CommitBeforeRaiseError(_refresh_invalid())
    if row.expires_at <= now:
        raise _refresh_invalid()
    user = db.get(User, row.user_id)
    if user is None:
        raise _refresh_invalid()
    if not user.is_active:
        _revoke_family(db, row.family_id)
        raise CommitBeforeRaiseError(_account_disabled())
    tokens, new_row = issue_session(db, user, client, family_id=row.family_id)
    row.revoked_at = now
    row.replaced_by_id = new_row.id
    db.flush()
    return user, tokens


def revoke_refresh_token(db: Session, raw_token: str | None) -> None:
    """Logout: revoke the presented refresh token (unknown/invalid tokens are ignored)."""
    if not raw_token or len(raw_token) > 128:
        return
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == sha256_hex(raw_token), RefreshToken.revoked_at.is_(None))
        .values(revoked_at=clock.now_utc())
        .execution_options(synchronize_session=False)
    )
    db.flush()


# ---- signup / login ----------------------------------------------------------------------------


def signup(db: Session, data: SignupRequest) -> User:
    """Create a customer account. 409 ``AUTH_EMAIL_TAKEN``."""
    if get_user_by_email(db, data.email) is not None:
        raise ConflictError("AUTH_EMAIL_TAKEN", "An account with this email already exists. Please log in.")
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        marketing_opt_in=data.marketing_opt_in,
    )
    db.add(user)
    try:
        with db.begin_nested():
            db.flush()
    except IntegrityError as exc:  # concurrent signup with the same email
        raise ConflictError(
            "AUTH_EMAIL_TAKEN", "An account with this email already exists. Please log in."
        ) from exc
    mark_logged_in(user)
    db.flush()
    return user


def authenticate(db: Session, email: str, password: str) -> User:
    """Email + password. 401 ``AUTH_INVALID_CREDENTIALS`` (no enumeration), 403 when blocked."""
    check_rate_limit(f"auth.login:email:{email_key(email)}", *LOGIN_EMAIL_LIMIT)
    user = get_user_by_email(db, email)
    if user is None or not user.password_hash:
        verify_password(password, _dummy_password_hash())  # equalise timing
        raise UnauthorizedError("AUTH_INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE)
    if not verify_password(password, user.password_hash):
        raise UnauthorizedError("AUTH_INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE)
    if not user.is_active:
        raise _account_disabled()
    if password_needs_rehash(user.password_hash):
        user.password_hash = hash_password(password)
    mark_logged_in(user)
    db.flush()
    return user


# ---- OTP ---------------------------------------------------------------------------------------


def otp_dev_echo_enabled() -> bool:
    settings = get_settings()
    return settings.OTP_DEV_ECHO and not settings.is_production


def request_otp(db: Session, email: str, client: ClientInfo) -> str | None:
    """Issue a login OTP for ``email`` (account may not exist yet) and email it.

    Returns the plain code (callers echo it only when ``otp_dev_echo_enabled()``), or ``None`` when
    no code was sent (blocked account) — indistinguishable to the client.
    """
    check_rate_limit(f"auth.otp_request:email:{email_key(email)}", *OTP_REQUEST_EMAIL_LIMIT)
    now = clock.now_utc()
    latest = db.scalar(
        select(OtpCode)
        .where(OtpCode.email == email, OtpCode.purpose == OtpPurpose.LOGIN)
        .order_by(OtpCode.created_at.desc(), OtpCode.id.desc())
        .limit(1)
    )
    if latest is not None and latest.consumed_at is None and latest.created_at > now - OTP_RESEND_AFTER:
        remaining = int((latest.created_at + OTP_RESEND_AFTER - now).total_seconds()) + 1
        raise RateLimitedError(remaining, "Please wait a moment before requesting another code.")

    db.execute(
        update(OtpCode)
        .where(
            OtpCode.email == email,
            OtpCode.purpose == OtpPurpose.LOGIN,
            OtpCode.consumed_at.is_(None),
        )
        .values(consumed_at=now)
        .execution_options(synchronize_session=False)
    )
    user = get_user_by_email(db, email)
    if user is not None and not user.is_active:
        db.flush()
        return None

    code = f"{secrets.randbelow(10**OTP_LENGTH):0{OTP_LENGTH}d}"
    db.add(
        OtpCode(
            email=email,
            purpose=OtpPurpose.LOGIN,
            code_hash=_otp_hash(email, code),
            attempts=0,
            max_attempts=OTP_MAX_ATTEMPTS,
            expires_at=now + OTP_TTL,
            ip_hash=ip_hash(client.ip),
        )
    )
    db.flush()
    try:
        notifications_service.notify(
            db,
            NotificationKind.OTP_LOGIN,
            user=user,
            email=email,
            context={"code": code, "expires_in_minutes": int(OTP_TTL.total_seconds() // 60)},
        )
    except NotImplementedError:
        logger.debug("notifications.notify not implemented yet; OTP email skipped")
    return code


def verify_otp(db: Session, email: str, code: str) -> tuple[User, bool]:
    """Verify the latest code for ``email``; create the account when new. Returns ``(user, is_new)``.

    400 ``AUTH_OTP_INVALID`` / ``AUTH_OTP_EXPIRED``; 429 ``AUTH_OTP_TOO_MANY_ATTEMPTS``;
    403 ``AUTH_ACCOUNT_DISABLED``. Attempt counters are persisted via ``CommitBeforeRaiseError``.
    """
    check_rate_limit(f"auth.otp_verify:email:{email_key(email)}", *OTP_VERIFY_EMAIL_LIMIT)
    now = clock.now_utc()
    otp = db.scalar(
        select(OtpCode)
        .where(OtpCode.email == email, OtpCode.purpose == OtpPurpose.LOGIN)
        .order_by(OtpCode.created_at.desc(), OtpCode.id.desc())
        .limit(1)
        .with_for_update()
    )
    if otp is None or otp.consumed_at is not None or otp.expires_at <= now:
        raise BadRequestError("AUTH_OTP_EXPIRED", "This code has expired. Please request a new one.")
    if otp.attempts >= otp.max_attempts:
        raise _too_many_attempts()
    if not secrets.compare_digest(otp.code_hash, _otp_hash(email, code)):
        otp.attempts += 1
        if otp.attempts >= otp.max_attempts:
            otp.consumed_at = now
            db.flush()
            raise CommitBeforeRaiseError(_too_many_attempts())
        db.flush()
        raise CommitBeforeRaiseError(
            BadRequestError(
                "AUTH_OTP_INVALID",
                "That code is incorrect.",
                details={"attempts_remaining": otp.max_attempts - otp.attempts},
            )
        )
    otp.consumed_at = now

    user = get_user_by_email(db, email)
    is_new = user is None
    if user is None:
        user = User(email=email, password_hash=None, email_verified_at=now)
        db.add(user)
        try:
            with db.begin_nested():
                db.flush()
        except IntegrityError:  # concurrent verify created it
            user = get_user_by_email(db, email)
            assert user is not None
            is_new = False
    if not user.is_active:
        db.flush()
        raise CommitBeforeRaiseError(_account_disabled())
    if user.email_verified_at is None:
        user.email_verified_at = now
    mark_logged_in(user)
    db.flush()
    return user, is_new


def _too_many_attempts() -> AppError:
    return AppError(
        "AUTH_OTP_TOO_MANY_ATTEMPTS",
        "Too many incorrect attempts. Please request a new code.",
        status_code=429,
    )


# ---- cross-domain side effects (tolerant while other agents' services are stubs) --------------


def merge_guest_cart(db: Session, guest_token: str | None, user: User) -> bool:
    """``services.cart.merge_guest_cart`` (Commerce); ``False`` when there is nothing to merge."""
    if not guest_token:
        return False
    try:
        return cart_service.merge_guest_cart(db, guest_token, user)
    except NotImplementedError:
        logger.debug("cart.merge_guest_cart not implemented yet; guest cart not merged")
        return False


def send_welcome(db: Session, user: User, background_tasks: BackgroundTasks | None) -> None:
    try:
        notifications_service.notify(
            db, NotificationKind.WELCOME, user=user, background_tasks=background_tasks
        )
    except NotImplementedError:
        logger.debug("notifications.notify not implemented yet; welcome email skipped")
