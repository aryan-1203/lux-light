from __future__ import annotations

from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import Settings


def test_get_health_ok(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "status",
        "version",
        "database",
        "redis",
        "payment_gateway",
        "shipping_provider",
        "time",
    }
    assert body["status"] == "ok"
    assert body["database"] is True
    assert body["redis"] is None
    assert body["payment_gateway"] == "mock"
    assert body["shipping_provider"] == "mock"
    assert datetime.fromisoformat(body["time"]).tzinfo is not None


def test_health_headers(client: TestClient) -> None:
    response = client.get("/api/v1/health", headers={"X-Request-ID": "abc-12345678"})
    assert response.headers["x-request-id"] == "abc-12345678"
    generated = client.get("/api/v1/health", headers={"X-Request-ID": "bad id with spaces"})
    assert generated.headers["x-request-id"] != "bad id with spaces"
    assert len(generated.headers["x-request-id"]) == 32
    for header, value in {
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
        "x-frame-options": "DENY",
    }.items():
        assert response.headers[header] == value
    assert "permissions-policy" in response.headers


def test_health_degraded_when_database_fails(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    def boom(self: Session, *args: object, **kwargs: object) -> None:
        raise RuntimeError("db down")

    monkeypatch.setattr(Session, "execute", boom)
    body = client.get("/api/v1/health").json()
    assert body["status"] == "degraded"
    assert body["database"] is False


def test_health_reports_unreachable_redis(client: TestClient, settings: Settings) -> None:
    settings.REDIS_URL = "redis://127.0.0.1:1/0"
    body = client.get("/api/v1/health").json()
    assert body["redis"] is False
    assert body["status"] == "degraded"


def test_cors_allows_only_configured_origins(client: TestClient) -> None:
    allowed = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "X-CSRF-Token",
        },
    )
    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert allowed.headers["access-control-allow-credentials"] == "true"
    denied = client.get("/api/v1/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in denied.headers


def test_media_mount_serves_files(client: TestClient, settings: Settings) -> None:
    target = settings.media_dir / "probe.txt"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("hello")
    response = client.get("/media/probe.txt")
    assert response.status_code == 200
    assert response.text == "hello"
    assert client.get("/media/missing.txt").status_code == 404


def test_gzip_for_large_responses(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json", headers={"Accept-Encoding": "gzip"})
    assert response.status_code == 200
    assert response.headers.get("content-encoding") == "gzip"
