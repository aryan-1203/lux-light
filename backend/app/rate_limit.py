"""Per-IP rate limiting (slowapi, in-memory: correct for the single-worker deployment)."""

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded

from app.config import Settings


def client_ip(request: Request) -> str:
    # uvicorn runs with --proxy-headers, so request.client is the real client behind Render's proxy.
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=client_ip)

_limits = {"leads": "5/minute", "newsletter": "10/minute"}


def configure_limits(settings: Settings) -> None:
    _limits["leads"] = settings.rate_limit_leads
    _limits["newsletter"] = settings.rate_limit_newsletter


def leads_limit() -> str:
    return _limits["leads"]


def newsletter_limit() -> str:
    return _limits["newsletter"]


async def rate_limited_handler(request: Request, exc: Exception) -> JSONResponse:
    headers = {}
    if isinstance(exc, RateLimitExceeded) and exc.limit is not None:
        headers["Retry-After"] = str(exc.limit.limit.get_expiry())
    return JSONResponse({"error": "rate_limited"}, status_code=429, headers=headers)
