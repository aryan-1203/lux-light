from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel

from app.core.errors import (
    AppError,
    BadGatewayError,
    BadRequestError,
    ConflictError,
    ForbiddenError,
    InsufficientStock,
    InvalidStatusTransition,
    NotFoundError,
    PayloadTooLargeError,
    PromoError,
    RateLimitedError,
    UnauthorizedError,
    UnprocessableError,
    register_exception_handlers,
)
from app.core.middleware import RequestContextMiddleware
from app.models.enums import OrderStatus


class Body(BaseModel):
    quantity: int
    email: str


def _build_app() -> FastAPI:
    app = FastAPI()
    app.add_middleware(RequestContextMiddleware)
    register_exception_handlers(app)

    @app.get("/raise/{kind}")
    def raise_kind(kind: str) -> dict[str, str]:
        errors: dict[str, Exception] = {
            "bad": BadRequestError("PAYMENT_SIGNATURE_INVALID", "Bad signature."),
            "unauth": UnauthorizedError(),
            "forbidden": ForbiddenError(),
            "notfound": NotFoundError("PRODUCT_NOT_FOUND"),
            "conflict": ConflictError("SKU_TAKEN", "SKU in use."),
            "toolarge": PayloadTooLargeError("IMAGE_TOO_LARGE"),
            "unprocessable": UnprocessableError("COD_LIMIT_EXCEEDED", details={"max": 1000000}),
            "ratelimited": RateLimitedError(17),
            "gateway": BadGatewayError("PAYMENT_GATEWAY_ERROR"),
            "stock": InsufficientStock([5, 3, 5]),
            "oos": InsufficientStock([9], code="OUT_OF_STOCK"),
            "promo": PromoError("PROMO_EXPIRED"),
            "promo_applied": PromoError("PROMO_ALREADY_APPLIED"),
            "transition": InvalidStatusTransition(OrderStatus.DELIVERED, OrderStatus.PAID),
            "custom": AppError("TEAPOT", "Short and stout.", status_code=418),
            "boom": RuntimeError("secret detail priya@example.com"),
        }
        raise errors[kind]

    @app.post("/validate")
    def validate(body: Body) -> dict[str, int]:
        return {"quantity": body.quantity}

    @app.get("/cookie-error")
    def cookie_error() -> None:
        exc = UnauthorizedError()
        exc.set_cookies.extend(["a=; Max-Age=0; Path=/", "b=; Max-Age=0; Path=/"])
        raise exc

    return app


@pytest.fixture
def err_client() -> Iterator[TestClient]:
    with TestClient(_build_app(), raise_server_exceptions=False) as c:
        yield c


@pytest.mark.parametrize(
    ("kind", "status", "code"),
    [
        ("bad", 400, "PAYMENT_SIGNATURE_INVALID"),
        ("unauth", 401, "UNAUTHENTICATED"),
        ("forbidden", 403, "FORBIDDEN"),
        ("notfound", 404, "PRODUCT_NOT_FOUND"),
        ("conflict", 409, "SKU_TAKEN"),
        ("toolarge", 413, "IMAGE_TOO_LARGE"),
        ("unprocessable", 422, "COD_LIMIT_EXCEEDED"),
        ("ratelimited", 429, "RATE_LIMITED"),
        ("gateway", 502, "PAYMENT_GATEWAY_ERROR"),
        ("stock", 409, "INSUFFICIENT_STOCK"),
        ("oos", 409, "OUT_OF_STOCK"),
        ("promo", 422, "PROMO_EXPIRED"),
        ("promo_applied", 409, "PROMO_ALREADY_APPLIED"),
        ("transition", 409, "INVALID_STATUS_TRANSITION"),
        ("custom", 418, "TEAPOT"),
    ],
)
def test_app_errors_render_error_response(err_client: TestClient, kind: str, status: int, code: str) -> None:
    response = err_client.get(f"/raise/{kind}")
    assert response.status_code == status
    body = response.json()
    assert set(body) == {"error"}
    assert set(body["error"]) == {"code", "message", "details"}
    assert body["error"]["code"] == code
    assert isinstance(body["error"]["message"], str)
    assert body["error"]["message"]


def test_error_details(err_client: TestClient) -> None:
    assert err_client.get("/raise/stock").json()["error"]["details"] == {"variant_ids": [3, 5]}
    assert err_client.get("/raise/transition").json()["error"]["details"] == {
        "from": "delivered",
        "to": "paid",
    }
    assert err_client.get("/raise/unprocessable").json()["error"]["details"] == {"max": 1000000}
    assert err_client.get("/raise/notfound").json()["error"]["details"] is None


def test_rate_limited_sets_retry_after(err_client: TestClient) -> None:
    response = err_client.get("/raise/ratelimited")
    assert response.headers["retry-after"] == "17"
    assert response.json()["error"]["details"] == {"retry_after": 17}


def test_validation_error_shape(err_client: TestClient) -> None:
    response = err_client.post("/validate", json={"quantity": "lots"})
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    fields = error["details"]["fields"]
    locs = {tuple(f["loc"]) for f in fields}
    assert ("body", "quantity") in locs
    assert ("body", "email") in locs
    assert all(set(f) == {"loc", "msg", "type"} for f in fields)


def test_unhandled_error_is_500_with_request_id_and_no_leak(err_client: TestClient) -> None:
    response = err_client.get("/raise/boom", headers={"X-Request-ID": "req-12345678"})
    assert response.status_code == 500
    error = response.json()["error"]
    assert error["code"] == "INTERNAL_ERROR"
    assert "req-12345678" in error["message"]
    assert "secret" not in response.text
    assert "priya" not in response.text
    assert response.headers["x-request-id"] == "req-12345678"


def test_error_can_clear_cookies(err_client: TestClient) -> None:
    response = err_client.get("/cookie-error")
    cookies = response.headers.get_list("set-cookie")
    assert len(cookies) == 2


def test_unknown_route_and_method_on_real_app(client: TestClient) -> None:
    missing = client.get("/api/v1/definitely-missing")
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "NOT_FOUND"
    wrong_method = client.delete("/api/v1/health")
    assert wrong_method.status_code == 405
    assert wrong_method.json()["error"]["code"] == "METHOD_NOT_ALLOWED"


def test_app_error_defaults() -> None:
    err = AppError()
    assert err.code == "BAD_REQUEST"
    assert err.status_code == 400
    assert err.message == "Bad request."
    assert "BAD_REQUEST" in repr(err)
    assert RateLimitedError(0).retry_after == 1
