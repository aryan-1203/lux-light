from __future__ import annotations

from datetime import timedelta

import pytest
import time_machine
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.core import rate_limit
from app.core.config import Settings
from app.core.errors import RateLimitedError, register_exception_handlers
from app.core.rate_limit import InMemoryBackend, RateLimit, RedisBackend, check_rate_limit


def test_in_memory_limit_and_retry_after(frozen_time: time_machine.Traveller) -> None:
    for _ in range(3):
        check_rate_limit("auth.login:email:x", 3, 300)
    with pytest.raises(RateLimitedError) as info:
        check_rate_limit("auth.login:email:x", 3, 300)
    assert 1 <= info.value.retry_after <= 300
    assert info.value.headers["Retry-After"] == str(info.value.retry_after)
    # Other keys are independent.
    check_rate_limit("auth.login:email:y", 3, 300)


def test_window_resets(frozen_time: time_machine.Traveller) -> None:
    for _ in range(2):
        check_rate_limit("k", 2, 60)
    with pytest.raises(RateLimitedError):
        check_rate_limit("k", 2, 60)
    frozen_time.shift(timedelta(seconds=61))
    check_rate_limit("k", 2, 60)


def test_disabled_rate_limit(settings: Settings) -> None:
    settings.RATE_LIMIT_ENABLED = False
    for _ in range(10):
        check_rate_limit("k2", 1, 60)


def test_reset_clears_state() -> None:
    check_rate_limit("k3", 1, 60)
    rate_limit.reset_rate_limits()
    check_rate_limit("k3", 1, 60)


def test_redis_failure_falls_back_to_memory() -> None:
    rate_limit.set_backend(RedisBackend("redis://127.0.0.1:1/0"))
    check_rate_limit("k4", 1, 60)
    with pytest.raises(RateLimitedError):
        check_rate_limit("k4", 1, 60)


def test_in_memory_eviction() -> None:
    backend = InMemoryBackend()
    with time_machine.travel(1_000_000, tick=False) as t:
        for i in range(999):
            backend.hit(f"key{i}", 10)
        t.shift(30)
        backend.hit("trigger", 10)  # 1000th op evicts expired windows
    assert len(backend._windows) == 1


def test_rate_limit_dependency_returns_429() -> None:
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/limited", dependencies=[Depends(RateLimit("test.scope", 2, 60))])
    def limited() -> dict[str, bool]:
        return {"ok": True}

    with TestClient(app) as c:
        assert c.get("/limited").status_code == 200
        assert c.get("/limited").status_code == 200
        response = c.get("/limited")
    assert response.status_code == 429
    assert response.json()["error"]["code"] == "RATE_LIMITED"
    assert int(response.headers["retry-after"]) >= 1
