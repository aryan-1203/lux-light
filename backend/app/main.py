"""FastAPI application factory (PLAN §1.2).

Middleware order (outermost first): RequestContext → CORS → SecurityHeaders → CSRF → GZip.
Every v1 router is included with ``prefix="/api/v1"``; ``seo.router`` at the root; ``/media`` static.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware

from app.api import seo
from app.api.v1 import (
    auth,
    blog,
    cart,
    catalog,
    checkout,
    content,
    health,
    invoices,
    orders,
    payments,
    promos,
    quiz,
    reviews,
    shipping,
    users,
)
from app.api.v1.admin import audit as admin_audit
from app.api.v1.admin import blog as admin_blog
from app.api.v1.admin import catalog as admin_catalog
from app.api.v1.admin import content as admin_content
from app.api.v1.admin import customers as admin_customers
from app.api.v1.admin import dashboard as admin_dashboard
from app.api.v1.admin import exports as admin_exports
from app.api.v1.admin import inventory as admin_inventory
from app.api.v1.admin import orders as admin_orders
from app.api.v1.admin import promos as admin_promos
from app.api.v1.admin import purchasing as admin_purchasing
from app.api.v1.admin import reviews as admin_reviews
from app.core.config import get_settings
from app.core.csrf import CSRFMiddleware
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import RequestContextMiddleware, SecurityHeadersMiddleware
from app.core.openapi import build_openapi, generate_unique_id
from app.db.session import engine

logger = logging.getLogger("app")

API_PREFIX = "/api/v1"

V1_ROUTER_MODULES = (
    health,
    auth,
    users,
    catalog,
    reviews,
    blog,
    content,
    quiz,
    cart,
    promos,
    checkout,
    orders,
    payments,
    shipping,
    invoices,
    admin_dashboard,
    admin_orders,
    admin_catalog,
    admin_inventory,
    admin_purchasing,
    admin_promos,
    admin_customers,
    admin_reviews,
    admin_blog,
    admin_content,
    admin_audit,
    admin_exports,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    if settings.PAYMENT_PROVIDER == "razorpay" and settings.payment_gateway_mode == "mock":
        logger.warning("PAYMENT_PROVIDER=razorpay but Razorpay keys are empty: using the mock gateway")
    logger.info(
        "startup env=%s gateway=%s shipping=%s",
        settings.ENV.value,
        settings.payment_gateway_mode,
        settings.shipping_provider_mode,
    )
    yield
    engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.LOG_LEVEL, json_logs=settings.log_json)

    docs = settings.docs_enabled
    app = FastAPI(
        title="Dawnlit API",
        version="1.0.0",
        openapi_url="/api/v1/openapi.json" if docs else None,
        docs_url="/api/docs" if docs else None,
        redoc_url=None,
        separate_input_output_schemas=False,
        generate_unique_id_function=generate_unique_id,
        lifespan=lifespan,
    )

    # Added innermost → outermost (Starlette wraps the last-added middleware around the others).
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    app.add_middleware(CSRFMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "X-CSRF-Token", "Idempotency-Key", "X-Request-ID"],
        expose_headers=["Retry-After", "X-Request-ID", "Content-Disposition"],
        max_age=600,
    )
    app.add_middleware(RequestContextMiddleware)

    register_exception_handlers(app)

    for module in V1_ROUTER_MODULES:
        app.include_router(module.router, prefix=API_PREFIX)
    app.include_router(seo.router)

    media_dir = settings.media_dir
    media_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/media", StaticFiles(directory=media_dir, check_dir=False), name="media")

    def custom_openapi() -> dict[str, Any]:
        return build_openapi(app)

    app.openapi = custom_openapi  # type: ignore[method-assign]  # FastAPI's documented override hook
    return app


app = create_app()
