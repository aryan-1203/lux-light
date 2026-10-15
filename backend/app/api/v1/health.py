"""Health probe (getHealth): database ping, optional Redis ping, active gateway/shipping modes."""

from __future__ import annotations

import logging

from fastapi import APIRouter
from sqlalchemy import text

from app import __version__
from app.api.deps import DbSession
from app.core import clock
from app.core.config import get_settings
from app.models.enums import GatewayMode, HealthStatus, ShippingProvider
from app.schemas.common import HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


def _ping_redis(url: str) -> bool:
    try:
        import redis

        client = redis.Redis.from_url(url, socket_timeout=0.5, socket_connect_timeout=0.5)
        try:
            return bool(client.ping())
        finally:
            client.close()
    except Exception as exc:
        logger.warning("redis health check failed: %s", type(exc).__name__)
        return False


@router.get("/health", operation_id="getHealth", response_model=HealthResponse)
def get_health(db: DbSession) -> HealthResponse:
    settings = get_settings()
    try:
        database = db.execute(text("SELECT 1")).scalar_one() == 1
    except Exception as exc:
        logger.warning("database health check failed: %s", type(exc).__name__)
        db.rollback()
        database = False
    redis_ok = _ping_redis(settings.REDIS_URL) if settings.REDIS_URL else None
    healthy = database and redis_ok is not False
    return HealthResponse(
        status=HealthStatus.OK if healthy else HealthStatus.DEGRADED,
        version=__version__,
        database=database,
        redis=redis_ok,
        payment_gateway=GatewayMode(settings.payment_gateway_mode),
        shipping_provider=ShippingProvider(settings.shipping_provider_mode),
        time=clock.now_utc(),
    )
