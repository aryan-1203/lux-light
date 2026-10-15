"""SEO routes: /sitemap.xml and /robots.txt at the site root."""

from __future__ import annotations

from datetime import timedelta
from xml.etree import ElementTree

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core import clock
from app.core.config import Settings
from app.models import BlogPost
from app.models.enums import BlogStatus
from tests.factories import make_category, make_product

NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def add_post(db: Session, slug: str, *, status: BlogStatus, days_ago: int) -> BlogPost:
    post = BlogPost(
        slug=slug,
        title=slug,
        body_md="Body.",
        status=status,
        published_at=clock.now_utc() - timedelta(days=days_ago),
    )
    db.add(post)
    db.flush()
    return post


def sitemap_locs(client: TestClient) -> list[str]:
    response = client.get("/sitemap.xml")
    assert response.status_code == 200, response.text
    assert response.headers["content-type"].startswith("application/xml")
    root = ElementTree.fromstring(response.content)  # noqa: S314 - parsing our own trusted output
    return [el.text or "" for el in root.findall("sm:url/sm:loc", NS)]


def test_get_sitemap_lists_public_pages(client: TestClient, db: Session, settings: Settings) -> None:
    object.__setattr__(settings, "PUBLIC_SITE_URL", "https://www.dawnlit.in/")
    lamps = make_category(db, slug="desk-lamps")
    make_category(db, slug="retired", is_active=False)
    make_product(db, slug="dawnlit-desk", category=lamps)
    make_product(db, slug="inactive-lamp", is_active=False)
    archived = make_product(db, slug="archived-lamp")
    archived.product.archived_at = clock.now_utc()
    add_post(db, "what-is-lux", status=BlogStatus.PUBLISHED, days_ago=3)
    add_post(db, "draft-post", status=BlogStatus.DRAFT, days_ago=3)
    add_post(db, "future-post", status=BlogStatus.PUBLISHED, days_ago=-2)
    db.flush()

    locs = sitemap_locs(client)
    base = "https://www.dawnlit.in"
    for path in (
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
        "/shop/desk-lamps",
        "/products/dawnlit-desk",
        "/blog/what-is-lux",
    ):
        assert base + path in locs
    for hidden in ("retired", "inactive-lamp", "archived-lamp", "draft-post", "future-post"):
        assert not any(hidden in loc for loc in locs)
    assert all(loc.startswith(base + "/") for loc in locs)
    assert not any(part in loc for loc in locs for part in ("/admin", "/account", "/checkout", "/cart"))
    assert len(locs) == len(set(locs))


def test_get_sitemap_lastmod_for_dynamic_entries(client: TestClient, db: Session) -> None:
    make_product(db, slug="dawnlit-go")
    root = ElementTree.fromstring(client.get("/sitemap.xml").content)  # noqa: S314 - own output
    entries = {
        (url.findtext("sm:loc", namespaces=NS) or ""): url.findtext("sm:lastmod", namespaces=NS)
        for url in root.findall("sm:url", NS)
    }
    product_entry = next(v for k, v in entries.items() if k.endswith("/products/dawnlit-go"))
    assert product_entry is not None
    assert len(product_entry) == 10  # YYYY-MM-DD
    assert entries[next(k for k in entries if k.endswith("/faq"))] is None


def test_get_sitemap_needs_no_csrf_or_auth(anon_client: TestClient) -> None:
    assert anon_client.get("/sitemap.xml").status_code == 200


def test_get_robots_txt(anon_client: TestClient, settings: Settings) -> None:
    object.__setattr__(settings, "PUBLIC_SITE_URL", "https://www.dawnlit.in")
    response = anon_client.get("/robots.txt")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    lines = response.text.splitlines()
    assert lines[0] == "User-agent: *"
    for path in ("/admin", "/account", "/checkout", "/cart", "/order/", "/api/"):
        assert f"Disallow: {path}" in lines
    assert "Sitemap: https://www.dawnlit.in/sitemap.xml" in lines
    assert "Disallow: /" not in lines
