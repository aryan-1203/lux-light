"""Shared FastAPI dependencies (PLAN §4.1): DB session, auth, RBAC, guest cart cookie, client IP."""

from __future__ import annotations

from collections.abc import Callable, Iterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session
from starlette.responses import Response

from app.core import cookies
from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token, verify_cart_token
from app.db.session import get_session_factory
from app.models import User
from app.models.enums import UserRole

__all__ = [
    "AdminUser",
    "CurrentUser",
    "DbSession",
    "OptionalUser",
    "StaffUser",
    "clear_cart_cookie",
    "get_cart_token",
    "get_client_ip",
    "get_current_user",
    "get_db",
    "get_optional_user",
    "require_role",
    "set_cart_cookie",
]

_USER_STATE_KEY = "dl_current_user"


def get_db() -> Iterator[Session]:
    """Request-scoped session: rolled back on exception, always closed. Handlers ``commit()``."""
    db = get_session_factory()()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _cookie_clearing_headers(*, all_auth: bool) -> list[str]:
    scratch = Response()
    if all_auth:
        cookies.clear_auth_cookies(scratch)
    else:
        cookies.clear_access_cookie(scratch)
    return [value.decode("latin-1") for key, value in scratch.raw_headers if key == b"set-cookie"]


def _unauthenticated(
    code: str = "UNAUTHENTICATED", message: str = "Authentication required."
) -> UnauthorizedError:
    return UnauthorizedError(code, message)


def _resolve_user(request: Request, db: Session, token: str) -> User:
    cached = getattr(request.state, _USER_STATE_KEY, None)
    if isinstance(cached, User):
        return cached
    try:
        claims = decode_access_token(token)
    except UnauthorizedError as exc:
        if exc.code == "UNAUTHENTICATED":
            exc.set_cookies.extend(_cookie_clearing_headers(all_auth=False))
        raise
    user = db.get(User, claims.user_id)
    if user is None:
        unknown = _unauthenticated("UNAUTHENTICATED", "Invalid session.")
        unknown.set_cookies.extend(_cookie_clearing_headers(all_auth=False))
        raise unknown
    if not user.is_active:
        forbidden = ForbiddenError("AUTH_ACCOUNT_DISABLED", "This account has been disabled.")
        forbidden.set_cookies.extend(_cookie_clearing_headers(all_auth=True))
        raise forbidden
    setattr(request.state, _USER_STATE_KEY, user)
    return user


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Authenticated user from the ``dl_access`` cookie (row loaded, blocked users rejected).

    401 ``UNAUTHENTICATED`` (no/invalid token), 401 ``AUTH_TOKEN_EXPIRED``, 403 ``AUTH_ACCOUNT_DISABLED``.
    """
    token = request.cookies.get(cookies.ACCESS_COOKIE)
    if not token:
        raise _unauthenticated()
    return _resolve_user(request, db, token)


def get_optional_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    """Like ``get_current_user`` but ``None`` without a token. An expired/invalid token still raises
    401 so the client refreshes instead of silently acting as a guest (PLAN §1.3)."""
    token = request.cookies.get(cookies.ACCESS_COOKIE)
    if not token:
        return None
    return _resolve_user(request, db, token)


def require_role(*roles: UserRole) -> Callable[..., User]:
    """Dependency factory: 403 ``FORBIDDEN`` unless the current user's role is in ``roles``."""
    allowed = frozenset(roles)

    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise ForbiddenError("FORBIDDEN")
        return user

    dependency.__name__ = "require_role_" + "_".join(sorted(r.value for r in allowed))
    return dependency


def get_cart_token(request: Request) -> str | None:
    """Verified raw guest-cart token from ``dl_cart`` (None when absent or tampered)."""
    signed = request.cookies.get(cookies.CART_COOKIE)
    if not signed:
        return None
    return verify_cart_token(signed)


def set_cart_cookie(response: Response, token: str) -> None:
    """Sign ``token`` and set the ``dl_cart`` cookie (60 days, httpOnly)."""
    from app.core.security import sign_cart_token

    cookies.set_cart_cookie(response, sign_cart_token(token))


def clear_cart_cookie(response: Response) -> None:
    cookies.clear_cart_cookie(response)


def get_client_ip(request: Request) -> str:
    """Client IP as seen by the ASGI server (run uvicorn with ``--proxy-headers`` behind nginx)."""
    client = request.client
    return client.host if client and client.host else "unknown"


DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
StaffUser = Annotated[User, Depends(require_role(UserRole.STAFF, UserRole.ADMIN))]
AdminUser = Annotated[User, Depends(require_role(UserRole.ADMIN))]
