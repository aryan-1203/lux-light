"""Application errors and the global exception handlers (ErrorResponse shape, PLAN §1.2 / §6.2).

Every non-2xx body is ``{"error": {"code": str, "message": str, "details": dict | null}}``.
"""

from __future__ import annotations

import logging
from collections.abc import Sequence
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse, Response

from app.models.enums import OrderStatus

logger = logging.getLogger("app.errors")


class AppError(Exception):
    """Base class for expected, client-facing errors."""

    status_code: int = 400
    code: str = "BAD_REQUEST"
    default_message: str | None = None

    def __init__(
        self,
        code: str | None = None,
        message: str | None = None,
        *,
        status_code: int | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code
        self.message = message or self.default_message or _humanize(self.code)
        self.details = details
        self.headers: dict[str, str] = {}
        #: Raw ``Set-Cookie`` header values appended to the error response (e.g. clearing a bad session).
        self.set_cookies: list[str] = []
        super().__init__(self.message)

    def __repr__(self) -> str:
        return f"{type(self).__name__}(code={self.code!r}, status_code={self.status_code})"


def _humanize(code: str) -> str:
    return code.replace("_", " ").capitalize() + "."


class BadRequestError(AppError):
    status_code = 400
    code = "BAD_REQUEST"


class UnauthorizedError(AppError):
    status_code = 401
    code = "UNAUTHENTICATED"
    default_message = "Authentication required."


class ForbiddenError(AppError):
    status_code = 403
    code = "FORBIDDEN"
    default_message = "You do not have permission to perform this action."


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"
    default_message = "Resource not found."


class ConflictError(AppError):
    status_code = 409
    code = "CONFLICT"


class PayloadTooLargeError(AppError):
    status_code = 413
    code = "PAYLOAD_TOO_LARGE"


class UnprocessableError(AppError):
    status_code = 422
    code = "UNPROCESSABLE"


class RateLimitedError(AppError):
    status_code = 429
    code = "RATE_LIMITED"

    def __init__(self, retry_after: int, message: str | None = None) -> None:
        super().__init__(
            "RATE_LIMITED",
            message or "Too many requests. Please try again shortly.",
            details={"retry_after": retry_after},
        )
        self.retry_after = max(1, int(retry_after))
        self.headers["Retry-After"] = str(self.retry_after)


class BadGatewayError(AppError):
    status_code = 502
    code = "BAD_GATEWAY"
    default_message = "An upstream provider failed. Please try again."


class InsufficientStock(ConflictError):
    """409 INSUFFICIENT_STOCK | OUT_OF_STOCK with ``details.variant_ids`` (never counts)."""

    def __init__(self, variant_ids: Sequence[int], *, code: str = "INSUFFICIENT_STOCK") -> None:
        self.variant_ids = sorted(set(variant_ids))
        message = (
            "Some items are out of stock."
            if code == "OUT_OF_STOCK"
            else "Not enough stock for the requested quantity."
        )
        super().__init__(code, message, details={"variant_ids": self.variant_ids})


class PromoError(UnprocessableError):
    """422 PROMO_*; ``PROMO_ALREADY_APPLIED`` uses 409."""

    def __init__(
        self,
        code: str | None = None,
        message: str | None = None,
        *,
        status_code: int | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        if status_code is None and code == "PROMO_ALREADY_APPLIED":
            status_code = 409
        super().__init__(code, message, status_code=status_code, details=details)


class InvalidStatusTransition(ConflictError):
    def __init__(self, from_status: OrderStatus, to_status: OrderStatus) -> None:
        super().__init__(
            "INVALID_STATUS_TRANSITION",
            f"Cannot change order status from {from_status.value} to {to_status.value}.",
            details={"from": from_status.value, "to": to_status.value},
        )
        self.from_status = from_status
        self.to_status = to_status


# ----------------------------------------------------------------------------------------------
# Response helpers + handlers
# ----------------------------------------------------------------------------------------------


def error_body(code: str, message: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
    return {"error": {"code": code, "message": message, "details": details}}


def error_response(
    status_code: int,
    code: str,
    message: str,
    details: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(error_body(code, message, details)),
        headers=headers,
    )


_HTTP_CODE_MAP: dict[int, str] = {
    400: "BAD_REQUEST",
    401: "UNAUTHENTICATED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    415: "UNSUPPORTED_MEDIA_TYPE",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
}


async def app_error_handler(request: Request, exc: Exception) -> Response:
    assert isinstance(exc, AppError)
    if exc.status_code >= 500:
        logger.warning("app error %s (%s)", exc.code, exc.status_code)
    response = error_response(exc.status_code, exc.code, exc.message, exc.details, exc.headers or None)
    for cookie in exc.set_cookies:
        response.headers.append("set-cookie", cookie)
    return response


async def validation_error_handler(request: Request, exc: Exception) -> Response:
    assert isinstance(exc, RequestValidationError)
    fields = [
        {
            "loc": list(err.get("loc", ())),
            "msg": str(err.get("msg", "")),
            "type": str(err.get("type", "")),
        }
        for err in exc.errors()
    ]
    return error_response(422, "VALIDATION_ERROR", "Request validation failed.", {"fields": fields})


async def http_exception_handler(request: Request, exc: Exception) -> Response:
    assert isinstance(exc, StarletteHTTPException)
    code = _HTTP_CODE_MAP.get(exc.status_code, "HTTP_ERROR")
    if isinstance(exc.detail, str) and exc.detail and exc.detail != _phrase(exc.status_code):
        message = exc.detail
    elif exc.status_code == 404:
        message = "Not found."
    elif exc.status_code == 405:
        message = "Method not allowed."
    else:
        message = _phrase(exc.status_code) or "Request failed."
    headers = dict(exc.headers) if exc.headers else None
    return error_response(exc.status_code, code, message, None, headers)


async def unhandled_exception_handler(request: Request, exc: Exception) -> Response:
    # Fallback only: RequestContextMiddleware normally converts unhandled errors first.
    logger.error("unhandled error: %s", type(exc).__name__)
    return internal_error_response(None)


def internal_error_response(request_id: str | None) -> JSONResponse:
    message = "An unexpected error occurred."
    if request_id:
        message += f" (request id {request_id})"
    headers = {"X-Request-ID": request_id} if request_id else None
    return error_response(500, "INTERNAL_ERROR", message, None, headers)


def _phrase(status_code: int) -> str:
    try:
        return HTTPStatus(status_code).phrase
    except ValueError:
        return ""


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
