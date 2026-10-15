"""Pure-ASGI middlewares: request context/access log/500 conversion and security headers."""

from __future__ import annotations

import logging
import re
import time
import uuid
from typing import Final

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.errors import internal_error_response
from app.core.logging import request_id_var

access_logger = logging.getLogger("app.access")
error_logger = logging.getLogger("app.errors")

REQUEST_ID_HEADER: Final = "X-Request-ID"
_VALID_REQUEST_ID: Final = re.compile(r"^[A-Za-z0-9._-]{8,64}$")

SECURITY_HEADERS: Final[dict[str, str]] = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(self)",
    "Cross-Origin-Opener-Policy": "same-origin",
}


class RequestContextMiddleware:
    """Accept/generate ``X-Request-ID``, expose it via contextvar + response header, log access lines
    (method, route template, status, duration — never query strings or bodies), and convert any
    unhandled exception into a 500 ``INTERNAL_ERROR`` ErrorResponse carrying the request id."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        incoming = None
        for key, value in scope.get("headers", []):
            if key == b"x-request-id":
                incoming = value.decode("latin-1")
                break
        request_id = incoming if incoming and _VALID_REQUEST_ID.fullmatch(incoming) else uuid.uuid4().hex
        token = request_id_var.set(request_id)
        started = time.perf_counter()
        status_holder: dict[str, int] = {}

        async def send_wrapper(message: Message) -> None:
            if message["type"] == "http.response.start":
                status_holder["status"] = int(message["status"])
                headers = MutableHeaders(scope=message)
                headers[REQUEST_ID_HEADER] = request_id
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception:
            error_logger.exception("unhandled exception")
            if "status" not in status_holder:
                response = internal_error_response(request_id)
                await response(scope, receive, send_wrapper)
            status_holder.setdefault("status", 500)
        finally:
            elapsed_ms = (time.perf_counter() - started) * 1000
            path_template = _strip_ids(scope.get("path", ""))
            access_logger.info(
                "%s %s %s %.1fms",
                scope.get("method", "-"),
                path_template,
                status_holder.get("status", 0),
                elapsed_ms,
            )
            request_id_var.reset(token)


_ID_SEGMENT = re.compile(r"/(\d+|DL-[0-9A-Z]+-[0-9A-Z]+)(?=/|$)")


def _strip_ids(path: str) -> str:
    return _ID_SEGMENT.sub("/{id}", path)


class SecurityHeadersMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                for name, value in SECURITY_HEADERS.items():
                    if name not in headers:
                        headers[name] = value
            await send(message)

        await self.app(scope, receive, send_wrapper)
