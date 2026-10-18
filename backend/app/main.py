import asyncio
import contextlib
import logging
from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.config import Settings, get_settings
from app.logging_utils import configure_logging, log_event
from app.middleware import BodySizeLimitMiddleware
from app.rate_limit import configure_limits, limiter, rate_limited_handler
from app.routers import health, leads, newsletter
from app.services.delivery import Delivery
from app.services.outbox import Outbox
from app.services.sheets_client import GspreadSheetsClient, SheetsClient
from app.services.sheets_store import SheetsStore
from app.services.turnstile import TurnstileVerifier

logger = logging.getLogger("app")


def _default_sheets_factory(settings: Settings) -> Callable[[], SheetsClient] | None:
    if not settings.sheets_configured:
        return None
    return lambda: GspreadSheetsClient(
        settings.google_service_account_b64,
        timeout=settings.sheets_timeout_seconds,
        sheet_ids=settings.spreadsheet_ids,
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings: Settings = app.state.settings
    log_event(
        logger,
        logging.INFO,
        "startup",
        env=settings.app_env,
        sheets_configured=app.state.store.configured,
        turnstile_enabled=bool(app.state.turnstile.secret),
    )
    if settings.is_production and not app.state.turnstile.secret:
        log_event(
            logger, logging.ERROR, "turnstile_secret_missing", detail="lead submissions will be rejected"
        )
    task = asyncio.create_task(app.state.delivery.run_worker()) if settings.outbox_worker_enabled else None
    try:
        yield
    finally:
        if task:
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task


def create_app(
    settings: Settings | None = None,
    *,
    sheets_client_factory: Callable[[], SheetsClient] | None = None,
    turnstile_transport: httpx.AsyncBaseTransport | None = None,
) -> FastAPI:
    settings = settings or get_settings()
    configure_logging()
    configure_limits(settings)

    app = FastAPI(
        title="Lamp early-access API",
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None,
        lifespan=lifespan,
    )
    store = SheetsStore(
        sheets_client_factory or _default_sheets_factory(settings),
        leads_tab=settings.leads_tab,
        newsletter_tab=settings.newsletter_tab,
        index_ttl=settings.sheets_index_ttl_seconds,
        retries=settings.sheets_request_retries,
        backoff_base=settings.sheets_backoff_base_seconds,
    )
    outbox = Outbox(settings.outbox_path)
    app.state.settings = settings
    app.state.store = store
    app.state.outbox = outbox
    app.state.delivery = Delivery(
        store,
        outbox,
        retry_seconds=settings.outbox_retry_seconds,
        backoff_cap=settings.outbox_backoff_cap_seconds,
    )
    app.state.turnstile = TurnstileVerifier(
        settings.turnstile_secret, production=settings.is_production, transport=turnstile_transport
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limited_handler)

    # Middleware added last runs first: CORS wraps the body limit so 413s still carry CORS headers.
    app.add_middleware(BodySizeLimitMiddleware, max_bytes=settings.max_body_bytes)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
        max_age=600,
    )
    app.include_router(health.router)
    app.include_router(leads.router)
    app.include_router(newsletter.router)
    return app


app = create_app()
