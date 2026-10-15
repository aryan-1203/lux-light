"""SEO routes at the site root: ``/sitemap.xml`` (getSitemap) and ``/robots.txt`` (getRobotsTxt).

Absolute URLs use ``PUBLIC_SITE_URL``. The sitemap lists the public storefront paths of PLAN §2.2
plus every visible product, active category and published blog post.
"""

from __future__ import annotations

from datetime import datetime
from typing import Final
from xml.sax.saxutils import escape

from fastapi import APIRouter
from sqlalchemy import select
from starlette.responses import PlainTextResponse, Response

from app.api.deps import DbSession
from app.core.config import get_settings
from app.models import Category, Product
from app.services import blog as blog_service
from app.services import catalog as catalog_service

router = APIRouter(tags=["seo"])

STATIC_PATHS: Final = (
    "/",
    "/shop",
    "/science",
    "/quiz",
    "/blog",
    "/faq",
    "/contact",
    "/policies/privacy",
    "/policies/terms",
    "/policies/refund",
    "/policies/shipping",
)
ROBOTS_DISALLOW: Final = ("/admin", "/account", "/checkout", "/cart", "/order/", "/api/")


class XMLResponse(Response):
    media_type = "application/xml"


def _base_url() -> str:
    return get_settings().PUBLIC_SITE_URL.rstrip("/")


def _url_entry(loc: str, lastmod: datetime | None = None) -> str:
    parts = [f"<loc>{escape(loc)}</loc>"]
    if lastmod is not None:
        parts.append(f"<lastmod>{lastmod.date().isoformat()}</lastmod>")
    return "<url>" + "".join(parts) + "</url>"


@router.get("/sitemap.xml", operation_id="getSitemap", response_class=XMLResponse)
def get_sitemap(db: DbSession) -> XMLResponse:
    base = _base_url()
    entries = [_url_entry(base + path) for path in STATIC_PATHS]
    for category in db.scalars(
        select(Category).where(Category.is_active.is_(True)).order_by(Category.sort_order, Category.id)
    ).all():
        entries.append(_url_entry(f"{base}/shop/{category.slug}", category.updated_at))
    for product in db.scalars(
        select(Product).where(catalog_service.product_is_visible()).order_by(Product.sort_order, Product.id)
    ).all():
        entries.append(_url_entry(f"{base}/products/{product.slug}", product.updated_at))
    for post in blog_service.list_public_posts_for_sitemap(db):
        entries.append(_url_entry(f"{base}/blog/{post.slug}", post.updated_at))
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</urlset>\n"
    )
    return XMLResponse(content=body)


@router.get("/robots.txt", operation_id="getRobotsTxt", response_class=PlainTextResponse)
def get_robots_txt() -> PlainTextResponse:
    lines = [
        "User-agent: *",
        *(f"Disallow: {path}" for path in ROBOTS_DISALLOW),
        "",
        f"Sitemap: {_base_url()}/sitemap.xml",
    ]
    return PlainTextResponse("\n".join(lines) + "\n")
