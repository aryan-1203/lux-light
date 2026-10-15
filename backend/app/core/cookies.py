"""Cookie names, TTLs and set/clear helpers (PLAN §1.3).

All cookies: ``SameSite=Lax``, ``Secure`` iff ``ENV=production``, optional ``COOKIE_DOMAIN``.
"""

from __future__ import annotations

from typing import Final

from starlette.responses import Response

from app.core.config import get_settings
from app.core.security import new_opaque_token

ACCESS_COOKIE: Final = "dl_access"
REFRESH_COOKIE: Final = "dl_refresh"
CSRF_COOKIE: Final = "dl_csrf"
CART_COOKIE: Final = "dl_cart"
CSRF_HEADER: Final = "X-CSRF-Token"

REFRESH_COOKIE_PATH: Final = "/api/v1/auth"
CSRF_TTL_SECONDS: Final = 7 * 24 * 3600
CART_TTL_SECONDS: Final = 60 * 24 * 3600


def _set(
    response: Response,
    key: str,
    value: str,
    *,
    max_age: int,
    httponly: bool,
    path: str = "/",
) -> None:
    settings = get_settings()
    response.set_cookie(
        key,
        value,
        max_age=max_age,
        path=path,
        domain=settings.cookie_domain,
        secure=settings.cookie_secure,
        httponly=httponly,
        samesite="lax",
    )


def _clear(response: Response, key: str, *, httponly: bool, path: str = "/") -> None:
    settings = get_settings()
    response.delete_cookie(
        key,
        path=path,
        domain=settings.cookie_domain,
        secure=settings.cookie_secure,
        httponly=httponly,
        samesite="lax",
    )


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    settings = get_settings()
    _set(
        response,
        ACCESS_COOKIE,
        access_token,
        max_age=settings.ACCESS_TOKEN_TTL_MINUTES * 60,
        httponly=True,
    )
    _set(
        response,
        REFRESH_COOKIE,
        refresh_token,
        max_age=settings.REFRESH_TOKEN_TTL_DAYS * 24 * 3600,
        httponly=True,
        path=REFRESH_COOKIE_PATH,
    )


def clear_access_cookie(response: Response) -> None:
    _clear(response, ACCESS_COOKIE, httponly=True)


def clear_auth_cookies(response: Response) -> None:
    _clear(response, ACCESS_COOKIE, httponly=True)
    _clear(response, REFRESH_COOKIE, httponly=True, path=REFRESH_COOKIE_PATH)


def set_csrf_cookie(response: Response) -> str:
    """Issue a fresh readable (non-httpOnly) CSRF cookie and return its value."""
    token = new_opaque_token(32)
    _set(response, CSRF_COOKIE, token, max_age=CSRF_TTL_SECONDS, httponly=False)
    return token


def set_cart_cookie(response: Response, signed_token: str) -> None:
    """Set ``dl_cart`` to an already-signed value (``core.security.sign_cart_token``)."""
    _set(response, CART_COOKIE, signed_token, max_age=CART_TTL_SECONDS, httponly=True)


def clear_cart_cookie(response: Response) -> None:
    _clear(response, CART_COOKIE, httponly=True)
