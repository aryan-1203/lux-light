"""Fixed-window rate limiting with a Redis backend (``REDIS_URL``) or an in-memory fallback."""

from __future__ import annotations

import logging
import threading
import time
from typing import Protocol

from fastapi import Request

from app.core.config import get_settings
from app.core.errors import RateLimitedError

logger = logging.getLogger("app.rate_limit")


class RateLimitBackend(Protocol):
    def hit(self, key: str, window_seconds: int) -> tuple[int, int]:
        """Count a hit in the current window → ``(count, seconds_until_reset)``."""
        ...

    def reset(self) -> None: ...


class InMemoryBackend:
    """Process-local fixed windows. Suitable for dev/tests and single-process deployments."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._windows: dict[str, tuple[int, int]] = {}  # key -> (window_start, count)
        self._ops = 0

    def hit(self, key: str, window_seconds: int) -> tuple[int, int]:
        now = int(time.time())
        window_start = now - (now % window_seconds)
        bucket = f"{key}:{window_seconds}"
        with self._lock:
            start, count = self._windows.get(bucket, (window_start, 0))
            if start != window_start:
                start, count = window_start, 0
            count += 1
            self._windows[bucket] = (start, count)
            self._ops += 1
            if self._ops % 1000 == 0:
                self._evict(now)
        return count, max(1, start + window_seconds - now)

    def _evict(self, now: int) -> None:
        stale = [k for k, (start, _) in self._windows.items() if start + int(k.rsplit(":", 1)[1]) <= now]
        for k in stale:
            del self._windows[k]

    def reset(self) -> None:
        with self._lock:
            self._windows.clear()


class RedisBackend:
    def __init__(self, url: str) -> None:
        import redis

        self._client = redis.Redis.from_url(url, socket_timeout=0.5, socket_connect_timeout=0.5)

    def hit(self, key: str, window_seconds: int) -> tuple[int, int]:
        now = int(time.time())
        window_start = now - (now % window_seconds)
        redis_key = f"dl:rl:{key}:{window_seconds}:{window_start}"
        pipe = self._client.pipeline()
        pipe.incr(redis_key)
        pipe.expire(redis_key, window_seconds + 1)
        count, _ = pipe.execute()
        return int(count), max(1, window_start + window_seconds - now)

    def reset(self) -> None:  # pragma: no cover - only used against a dedicated test Redis
        for key in self._client.scan_iter("dl:rl:*"):
            self._client.delete(key)


_backend: RateLimitBackend | None = None
_backend_lock = threading.Lock()
_fallback = InMemoryBackend()


def get_backend() -> RateLimitBackend:
    global _backend
    if _backend is None:
        with _backend_lock:
            if _backend is None:
                url = get_settings().REDIS_URL
                _backend = RedisBackend(url) if url else InMemoryBackend()
    return _backend


def set_backend(backend: RateLimitBackend | None) -> None:
    """Replace the backend (tests). ``None`` re-resolves from settings on next use."""
    global _backend
    _backend = backend


def reset_rate_limits() -> None:
    get_backend().reset()
    _fallback.reset()


def check_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    """Count a hit for ``key``; raise ``RateLimitedError`` (429 + Retry-After) when over ``limit``."""
    if not get_settings().RATE_LIMIT_ENABLED:
        return
    try:
        count, retry_after = get_backend().hit(key, window_seconds)
    except Exception as exc:  # Redis outage must not take the API down: degrade to in-memory
        logger.warning("rate limit backend error (%s); using in-memory fallback", type(exc).__name__)
        count, retry_after = _fallback.hit(key, window_seconds)
    if count > limit:
        raise RateLimitedError(retry_after)


class RateLimit:
    """FastAPI dependency keyed by client IP: ``Depends(RateLimit("auth.login", 10, 300))``."""

    def __init__(self, scope: str, limit: int, window_seconds: int) -> None:
        self.scope = scope
        self.limit = limit
        self.window_seconds = window_seconds

    def __call__(self, request: Request) -> None:
        from app.api.deps import get_client_ip  # local import: deps imports core modules

        check_rate_limit(f"{self.scope}:ip:{get_client_ip(request)}", self.limit, self.window_seconds)
