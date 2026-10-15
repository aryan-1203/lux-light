"""CSRF double-submit middleware (pure ASGI, PLAN §1.2 step 4).

Unsafe methods under ``/api/v1/`` must send ``X-CSRF-Token`` equal to the ``dl_csrf`` cookie.
Webhook paths are exempt (they authenticate with signatures / shared tokens instead).
"""

from __future__ import annotations

import hmac
from http.cookies import SimpleCookie
from typing import Final

from starlette.types import ASGIApp, Receive, Scope, Send

from app.core.cookies import CSRF_COOKIE
from app.core.errors import error_response

UNSAFE_METHODS: Final = frozenset({"POST", "PUT", "PATCH", "DELETE"})
PROTECTED_PREFIX: Final = "/api/v1/"
EXEMPT_PREFIXES: Final = ("/api/v1/payments/webhook/", "/api/v1/shipping/webhook/")
_HEADER_NAME: Final = b"x-csrf-token"


def is_csrf_protected(method: str, path: str) -> bool:
    if method.upper() not in UNSAFE_METHODS or not path.startswith(PROTECTED_PREFIX):
        return False
    return not any(path.startswith(prefix) for prefix in EXEMPT_PREFIXES)


def _cookie_value(raw_cookie_header: str, name: str) -> str | None:
    jar: SimpleCookie = SimpleCookie()
    try:
        jar.load(raw_cookie_header)
    except Exception:  # malformed cookie header → treat as missing
        return None
    morsel = jar.get(name)
    return morsel.value if morsel is not None else None


class CSRFMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or not is_csrf_protected(scope["method"], scope["path"]):
            await self.app(scope, receive, send)
            return
        header_token: str | None = None
        cookie_header = ""
        for key, value in scope.get("headers", []):
            if key == _HEADER_NAME:
                header_token = value.decode("latin-1")
            elif key == b"cookie":
                cookie_header = (cookie_header + "; " if cookie_header else "") + value.decode("latin-1")
        cookie_token = _cookie_value(cookie_header, CSRF_COOKIE) if cookie_header else None
        if (
            not header_token
            or not cookie_token
            or not hmac.compare_digest(header_token.encode("utf-8"), cookie_token.encode("utf-8"))
        ):
            response = error_response(403, "CSRF_FAILED", "Missing or invalid CSRF token.")
            await response(scope, receive, send)
            return
        await self.app(scope, receive, send)
