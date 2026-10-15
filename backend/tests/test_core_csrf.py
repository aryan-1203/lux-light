from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from starlette.responses import Response

from app.core.cookies import CSRF_COOKIE, CSRF_HEADER, set_csrf_cookie
from app.core.csrf import is_csrf_protected


@pytest.mark.parametrize(
    ("method", "path", "protected"),
    [
        ("POST", "/api/v1/cart/items", True),
        ("PUT", "/api/v1/users/me", True),
        ("PATCH", "/api/v1/admin/orders/1", True),
        ("DELETE", "/api/v1/cart/items/1", True),
        ("GET", "/api/v1/cart", False),
        ("HEAD", "/api/v1/cart", False),
        ("OPTIONS", "/api/v1/cart", False),
        ("POST", "/api/v1/payments/webhook/razorpay", False),
        ("POST", "/api/v1/shipping/webhook/shiprocket", False),
        ("POST", "/api/v1/payments/verify", True),
        ("POST", "/sitemap.xml", False),
        ("POST", "/api/v2/anything", False),
    ],
)
def test_is_csrf_protected(method: str, path: str, protected: bool) -> None:
    assert is_csrf_protected(method, path) is protected


def test_unsafe_request_without_token_is_rejected(anon_client: TestClient) -> None:
    response = anon_client.post("/api/v1/auth/login", json={})
    assert response.status_code == 403
    assert response.json() == {
        "error": {"code": "CSRF_FAILED", "message": "Missing or invalid CSRF token.", "details": None}
    }
    assert response.headers["x-request-id"]
    assert response.headers["x-content-type-options"] == "nosniff"


def test_cookie_without_header_or_mismatch_is_rejected(anon_client: TestClient) -> None:
    anon_client.cookies.set(CSRF_COOKIE, "abc")
    assert anon_client.post("/api/v1/auth/login").status_code == 403
    assert anon_client.post("/api/v1/auth/login", headers={CSRF_HEADER: "abd"}).status_code == 403


def test_header_without_cookie_is_rejected(anon_client: TestClient) -> None:
    assert anon_client.post("/api/v1/auth/login", headers={CSRF_HEADER: "abc"}).status_code == 403


def test_matching_token_passes_csrf(client: TestClient) -> None:
    # Passes CSRF; the health route only allows GET → 405 from routing, not 403.
    response = client.post("/api/v1/health")
    assert response.status_code == 405
    assert response.json()["error"]["code"] == "METHOD_NOT_ALLOWED"


def test_webhooks_are_exempt(anon_client: TestClient) -> None:
    for path in ("/api/v1/payments/webhook/razorpay", "/api/v1/shipping/webhook/mock"):
        response = anon_client.post(path, content=b"{}")
        assert response.status_code != 403


def test_safe_methods_are_not_checked(anon_client: TestClient) -> None:
    assert anon_client.get("/api/v1/health").status_code == 200


def test_set_csrf_cookie_attributes() -> None:
    response = Response()
    token = set_csrf_cookie(response)
    header = response.headers["set-cookie"]
    assert header.startswith(f"{CSRF_COOKIE}={token};")
    assert "HttpOnly" not in header
    assert "SameSite=lax" in header
    assert "Max-Age=604800" in header
    assert "Path=/" in header
    assert "Secure" not in header  # ENV != production
