"""OpenAPI metadata mirroring docs/openapi.yaml (title, servers, tags, security schemes) and the
post-processing that keeps FastAPI's generated document aligned with the contract:

* operation ids are used verbatim (``generate_unique_id``), so ``Body_<operationId>`` names match;
* FastAPI's default ``HTTPValidationError`` 422 responses are replaced by ``ErrorResponse``
  (our handler returns the ErrorResponse shape for validation errors too).
"""

from __future__ import annotations

from typing import Any, Final

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.routing import APIRoute

from app.schemas.common import ErrorBody, ErrorResponse

TITLE: Final = "Dawnlit API"
VERSION: Final = "1.0.0"
SUMMARY: Final = "D2C storefront + admin API for Dawnlit 10,000 lux light therapy lamps (India)."
DESCRIPTION: Final = (
    "Contract (source of truth: docs/openapi.yaml) for the Dawnlit storefront + admin API.\n\n"
    "Money is integer paise (`*_paise`, GST-inclusive). Errors (all non-2xx) are "
    '`{"error": {"code", "message", "details"}}`. Unsafe methods under /api/v1 require '
    "`X-CSRF-Token` equal to the `dl_csrf` cookie (webhooks exempt)."
)
LICENSE: Final = {"name": "Proprietary", "identifier": "LicenseRef-Proprietary"}
SERVERS: Final = [
    {"url": "http://localhost:8000", "description": "Local backend"},
    {
        "url": "http://localhost:5173",
        "description": "Vite dev server (proxies /api, /media, /sitemap.xml, /robots.txt)",
    },
]

TAGS: Final[list[dict[str, str]]] = [
    {"name": "health", "description": "Health probe — app/api/v1/health.py"},
    {"name": "seo", "description": "sitemap.xml / robots.txt (root, outside /api/v1) — app/api/seo.py"},
    {"name": "auth", "description": "Sessions, CSRF, OTP — app/api/v1/auth.py"},
    {"name": "users", "description": "Profile and address book — app/api/v1/users.py"},
    {"name": "catalog", "description": "Categories and products — app/api/v1/catalog.py"},
    {"name": "reviews", "description": "Product reviews — app/api/v1/reviews.py"},
    {"name": "blog", "description": "Blog — app/api/v1/blog.py"},
    {"name": "content", "description": "FAQs and contact form — app/api/v1/content.py"},
    {"name": "quiz", "description": "Routine quiz — app/api/v1/quiz.py"},
    {"name": "cart", "description": "Cart — app/api/v1/cart.py"},
    {"name": "promos", "description": "Promo validation — app/api/v1/promos.py"},
    {"name": "checkout", "description": "Order creation — app/api/v1/checkout.py"},
    {"name": "orders", "description": "Customer orders + public tracking — app/api/v1/orders.py"},
    {"name": "payments", "description": "Razorpay/mock payments and webhook — app/api/v1/payments.py"},
    {
        "name": "shipping",
        "description": "Pincode serviceability and courier webhook — app/api/v1/shipping.py",
    },
    {"name": "invoices", "description": "GST invoice PDFs — app/api/v1/invoices.py"},
    {"name": "admin-dashboard", "description": "app/api/v1/admin/dashboard.py"},
    {
        "name": "admin-orders",
        "description": "Orders, shipments, refunds, invoices — app/api/v1/admin/orders.py",
    },
    {
        "name": "admin-catalog",
        "description": "Products, variants, images, categories, media — app/api/v1/admin/catalog.py",
    },
    {
        "name": "admin-inventory",
        "description": "Inventory and stock movements — app/api/v1/admin/inventory.py",
    },
    {
        "name": "admin-purchasing",
        "description": "Suppliers, purchase batches, margins — app/api/v1/admin/purchasing.py",
    },
    {"name": "admin-promos", "description": "Promo codes — app/api/v1/admin/promos.py"},
    {"name": "admin-customers", "description": "Customers — app/api/v1/admin/customers.py"},
    {"name": "admin-reviews", "description": "Review moderation — app/api/v1/admin/reviews.py"},
    {"name": "admin-blog", "description": "Blog CMS — app/api/v1/admin/blog.py"},
    {"name": "admin-content", "description": "Contact messages — app/api/v1/admin/content.py"},
    {"name": "admin-audit", "description": "Audit log — app/api/v1/admin/audit.py"},
    {"name": "admin-exports", "description": "CSV exports — app/api/v1/admin/exports.py"},
]

SECURITY_SCHEMES: Final[dict[str, dict[str, str]]] = {
    "cookieAuth": {
        "type": "apiKey",
        "in": "cookie",
        "name": "dl_access",
        "description": "httpOnly JWT access cookie.",
    },
    "csrfHeader": {
        "type": "apiKey",
        "in": "header",
        "name": "X-CSRF-Token",
        "description": "Must equal the dl_csrf cookie.",
    },
    "refreshCookie": {
        "type": "apiKey",
        "in": "cookie",
        "name": "dl_refresh",
        "description": "httpOnly refresh cookie.",
    },
    "razorpaySignature": {
        "type": "apiKey",
        "in": "header",
        "name": "X-Razorpay-Signature",
        "description": "HMAC-SHA256 of the raw body with RAZORPAY_WEBHOOK_SECRET.",
    },
    "shippingWebhookToken": {
        "type": "apiKey",
        "in": "header",
        "name": "X-Webhook-Token",
        "description": "Shared secret SHIPPING_WEBHOOK_TOKEN.",
    },
}

_ERROR_REF: Final = {"$ref": "#/components/schemas/ErrorResponse"}


def generate_unique_id(route: APIRoute) -> str:
    """Use the contract operationId verbatim (no FastAPI path/method suffixes)."""
    return route.operation_id or route.name


def _replace_validation_responses(schema: dict[str, Any]) -> None:
    for path_item in schema.get("paths", {}).values():
        for operation in path_item.values():
            if not isinstance(operation, dict):
                continue
            response = operation.get("responses", {}).get("422")
            if not isinstance(response, dict):
                continue
            media = response.get("content", {}).get("application/json", {})
            ref = media.get("schema", {}).get("$ref", "")
            if ref.endswith("/HTTPValidationError"):
                response["description"] = "Validation or business-rule failure (VALIDATION_ERROR, ...)."
                media["schema"] = dict(_ERROR_REF)


def build_openapi(app: FastAPI) -> dict[str, Any]:
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=TITLE,
        version=VERSION,
        summary=SUMMARY,
        description=DESCRIPTION,
        routes=app.routes,
        tags=TAGS,
        servers=SERVERS,
        license_info=LICENSE,
        separate_input_output_schemas=False,
    )
    _replace_validation_responses(schema)
    components = schema.setdefault("components", {})
    schemas = components.setdefault("schemas", {})
    schemas.pop("HTTPValidationError", None)
    schemas.pop("ValidationError", None)
    for model in (ErrorBody, ErrorResponse):
        model_schema = model.model_json_schema(ref_template="#/components/schemas/{model}")
        model_schema.pop("$defs", None)
        schemas.setdefault(model.__name__, model_schema)
    components["securitySchemes"] = dict(SECURITY_SCHEMES)
    if not schemas:
        components.pop("schemas")
    app.openapi_schema = schema
    return schema
