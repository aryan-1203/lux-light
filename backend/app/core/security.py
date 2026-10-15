"""Password hashing (argon2id), JWT access tokens, opaque tokens, HMAC helpers, cart-token signing."""

from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.core import clock
from app.core.config import get_settings
from app.core.errors import UnauthorizedError
from app.models.enums import UserRole

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TYPE = "access"  # noqa: S105 - JWT "typ" claim, not a secret

_hasher = PasswordHasher()


@dataclass(frozen=True)
class AccessClaims:
    user_id: int
    role: UserRole
    jti: str
    issued_at: datetime
    expires_at: datetime


# ---- passwords --------------------------------------------------------------------------------


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def password_needs_rehash(password_hash: str) -> bool:
    try:
        return _hasher.check_needs_rehash(password_hash)
    except InvalidHashError:
        return True


# ---- JWT access tokens ------------------------------------------------------------------------


def create_access_token(user_id: int, role: UserRole) -> str:
    settings = get_settings()
    now = clock.now_utc()
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "role": UserRole(role).value,
        "typ": ACCESS_TOKEN_TYPE,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.ACCESS_TOKEN_TTL_MINUTES)).timestamp()),
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> AccessClaims:
    """Decode + verify an access JWT.

    Raises ``UnauthorizedError`` with code ``AUTH_TOKEN_EXPIRED`` (expired) or ``UNAUTHENTICATED``.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "exp", "iat", "typ", "role", "jti"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise UnauthorizedError("AUTH_TOKEN_EXPIRED", "Session expired. Please refresh.") from exc
    except jwt.InvalidTokenError as exc:
        raise UnauthorizedError("UNAUTHENTICATED", "Invalid session.") from exc
    try:
        if payload["typ"] != ACCESS_TOKEN_TYPE:
            raise ValueError("wrong token type")
        return AccessClaims(
            user_id=int(payload["sub"]),
            role=UserRole(payload["role"]),
            jti=str(payload["jti"]),
            issued_at=datetime.fromtimestamp(int(payload["iat"]), tz=UTC),
            expires_at=datetime.fromtimestamp(int(payload["exp"]), tz=UTC),
        )
    except (ValueError, TypeError, KeyError) as exc:
        raise UnauthorizedError("UNAUTHENTICATED", "Invalid session.") from exc


# ---- opaque tokens + hashing ------------------------------------------------------------------


def new_opaque_token(nbytes: int = 32) -> str:
    """URL-safe random token (refresh tokens, order access tokens, guest cart tokens, CSRF)."""
    return secrets.token_urlsafe(nbytes)


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def hmac_hex(key: str, message: str) -> str:
    return hmac.new(key.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()


def constant_time_equals(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))


def ip_hash(ip: str) -> str:
    """Keyed hash of a client IP (never store raw IPs)."""
    return hmac_hex(get_settings().SECRET_KEY, ip)


# ---- guest cart cookie ------------------------------------------------------------------------

_CART_SIG_LEN = 32


def sign_cart_token(token: str) -> str:
    """``token + "." + HMAC_SHA256(SECRET_KEY, token)[:32]`` (PLAN §1.3)."""
    return f"{token}.{hmac_hex(get_settings().SECRET_KEY, token)[:_CART_SIG_LEN]}"


def verify_cart_token(signed: str) -> str | None:
    """Return the raw cart token when the signature is valid, else ``None``."""
    token, sep, signature = signed.rpartition(".")
    if not sep or not token or len(signature) != _CART_SIG_LEN or len(token) > 64:
        return None
    expected = hmac_hex(get_settings().SECRET_KEY, token)[:_CART_SIG_LEN]
    if not constant_time_equals(signature, expected):
        return None
    return token
