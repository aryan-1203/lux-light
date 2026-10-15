"""Catalog API: categories, product listing (filters/sort/pagination), detail, related, cards."""

from __future__ import annotations

from collections.abc import Callable, Sequence
from datetime import timedelta
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import clock
from app.models import Inventory, Product, ProductImage, ProductVariant
from app.models.enums import StockStatus
from app.services import catalog as catalog_service
from app.services import inventory as inventory_service
from tests.factories import ProductBundle, make_category, make_product, make_variant


def assert_error(response: httpx.Response, status: int, code: str) -> dict[str, Any]:
    assert response.status_code == status, response.text
    body: dict[str, Any] = response.json()
    assert body["error"]["code"] == code
    return body


def add_image(
    db: Session, product: Product, *, sort_order: int = 0, variant_id: int | None = None
) -> ProductImage:
    url = f"/media/products/{product.id}/img-{sort_order}-1600.webp"
    image = ProductImage(
        product_id=product.id,
        variant_id=variant_id,
        storage_path=f"products/{product.id}/img-{sort_order}.png",
        url=url,
        alt=f"{product.name} photo {sort_order}",
        width=1600,
        height=1200,
        renditions=[{"width": 480, "url": url.replace("1600", "480")}, {"width": 1600, "url": url}],
        sort_order=sort_order,
    )
    db.add(image)
    db.flush()
    return image


def stub_stock_status_for_variants(db: Session, variant_ids: Sequence[int]) -> dict[int, StockStatus]:
    """Stand-in for Commerce's ``inventory.stock_status_for_variants`` (PLAN §3.1 rule 5)."""
    out = dict.fromkeys(variant_ids, StockStatus.OUT_OF_STOCK)
    for row in db.scalars(select(Inventory).where(Inventory.variant_id.in_(list(variant_ids)))).all():
        out[row.variant_id] = inventory_service.stock_status(
            row.on_hand - row.reserved, row.low_stock_threshold
        )
    return out


@pytest.fixture(autouse=True)
def _stock_status_stub(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(inventory_service, "stock_status_for_variants", stub_stock_status_for_variants)


def slugs(response: httpx.Response) -> list[str]:
    assert response.status_code == 200, response.text
    return [item["slug"] for item in response.json()["items"]]


# ---- categories ------------------------------------------------------------------------------


def test_list_categories_active_with_counts(client: TestClient, db: Session) -> None:
    desk = make_category(db, slug="desk-lamps", name="Desk lamps", sort_order=1)
    panels = make_category(db, slug="panels", name="Light panels", sort_order=2)
    make_category(db, slug="hidden", name="Hidden", sort_order=0, is_active=False)
    make_product(db, category=desk)
    make_product(db, category=desk)
    make_product(db, category=desk, is_active=False)
    archived = make_product(db, category=desk)
    archived.product.archived_at = clock.now_utc()
    no_variants = make_product(db, category=panels)
    no_variants.variant.is_active = False
    db.flush()

    response = client.get("/api/v1/categories")
    assert response.status_code == 200
    items = response.json()["items"]
    assert [c["slug"] for c in items] == ["desk-lamps", "panels"]
    assert items[0] == {
        "id": desk.id,
        "slug": "desk-lamps",
        "name": "Desk lamps",
        "description": None,
        "image_url": None,
        "sort_order": 1,
        "product_count": 2,
    }
    assert items[1]["product_count"] == 0


# ---- listProducts ----------------------------------------------------------------------------


@pytest.fixture
def catalog(db: Session) -> dict[str, ProductBundle]:
    desk_cat = make_category(db, slug="desk-lamps", sort_order=1)
    panel_cat = make_category(db, slug="panels", sort_order=2)
    now = clock.now_utc()
    desk = make_product(
        db,
        slug="dawnlit-desk",
        name="Dawnlit Desk",
        category=desk_cat,
        price_paise=499900,
        is_featured=True,
        sort_order=1,
        badges=["Bestseller"],
    )
    panel = make_product(
        db,
        slug="dawnlit-panel",
        name="Dawnlit Panel",
        category=panel_cat,
        price_paise=799900,
        is_featured=True,
        sort_order=2,
    )
    go = make_product(
        db,
        slug="dawnlit-go",
        name="Dawnlit Go",
        category=desk_cat,
        price_paise=349900,
        sort_order=3,
    )
    go.product.tagline = "Bright mornings that fit in your bag."
    desk.product.created_at = now - timedelta(days=3)
    panel.product.created_at = now - timedelta(days=1)
    go.product.created_at = now - timedelta(days=2)
    desk.product.rating_count, desk.product.rating_sum = 4, 18  # 4.5
    panel.product.rating_count, panel.product.rating_sum = 2, 10  # 5.0
    db.flush()
    return {"desk": desk, "panel": panel, "go": go}


def test_list_products_default_featured_order(client: TestClient, catalog: dict[str, ProductBundle]) -> None:
    response = client.get("/api/v1/products")
    assert slugs(response) == ["dawnlit-desk", "dawnlit-panel", "dawnlit-go"]
    body = response.json()
    assert (body["page"], body["page_size"], body["total"]) == (1, 20, 3)


@pytest.mark.parametrize(
    ("sort", "expected"),
    [
        ("featured", ["dawnlit-desk", "dawnlit-panel", "dawnlit-go"]),
        ("price_asc", ["dawnlit-go", "dawnlit-desk", "dawnlit-panel"]),
        ("price_desc", ["dawnlit-panel", "dawnlit-desk", "dawnlit-go"]),
        ("newest", ["dawnlit-panel", "dawnlit-go", "dawnlit-desk"]),
        ("rating", ["dawnlit-panel", "dawnlit-desk", "dawnlit-go"]),
    ],
)
def test_list_products_sorts(
    client: TestClient, catalog: dict[str, ProductBundle], sort: str, expected: list[str]
) -> None:
    assert slugs(client.get("/api/v1/products", params={"sort": sort})) == expected


def test_list_products_price_sort_uses_cheapest_active_variant(
    client: TestClient, db: Session, catalog: dict[str, ProductBundle]
) -> None:
    cheap = make_variant(db, catalog["panel"].product, price_paise=100000, kelvin=6500)
    assert slugs(client.get("/api/v1/products", params={"sort": "price_asc"}))[0] == "dawnlit-panel"
    cheap.is_active = False
    db.flush()
    assert slugs(client.get("/api/v1/products", params={"sort": "price_asc"}))[0] == "dawnlit-go"


def test_list_products_category_filter(client: TestClient, catalog: dict[str, ProductBundle]) -> None:
    assert slugs(client.get("/api/v1/products", params={"category": "desk-lamps"})) == [
        "dawnlit-desk",
        "dawnlit-go",
    ]


def test_list_products_unknown_or_inactive_category(client: TestClient, db: Session) -> None:
    make_category(db, slug="retired", is_active=False)
    assert_error(client.get("/api/v1/products", params={"category": "nope"}), 404, "CATEGORY_NOT_FOUND")
    assert_error(client.get("/api/v1/products", params={"category": "retired"}), 404, "CATEGORY_NOT_FOUND")


def test_list_products_search(client: TestClient, catalog: dict[str, ProductBundle]) -> None:
    assert slugs(client.get("/api/v1/products", params={"q": "PANEL"})) == ["dawnlit-panel"]
    assert slugs(client.get("/api/v1/products", params={"q": "fit in your bag"})) == ["dawnlit-go"]
    assert slugs(client.get("/api/v1/products", params={"q": "%"})) == []
    assert slugs(client.get("/api/v1/products", params={"q": "_"})) == []


def test_list_products_pagination(client: TestClient, catalog: dict[str, ProductBundle]) -> None:
    response = client.get("/api/v1/products", params={"page": 2, "page_size": 2})
    assert slugs(response) == ["dawnlit-go"]
    body = response.json()
    assert (body["page"], body["page_size"], body["total"]) == (2, 2, 3)


def test_list_products_hides_unpublished(
    client: TestClient, db: Session, catalog: dict[str, ProductBundle]
) -> None:
    make_product(db, slug="inactive-lamp", is_active=False)
    archived = make_product(db, slug="archived-lamp")
    archived.product.archived_at = clock.now_utc()
    variantless = make_product(db, slug="variantless-lamp")
    variantless.variant.archived_at = clock.now_utc()
    db.flush()
    assert set(slugs(client.get("/api/v1/products"))) == {"dawnlit-desk", "dawnlit-panel", "dawnlit-go"}


@pytest.mark.parametrize(
    "params", [{"sort": "cheapest"}, {"page": 0}, {"page_size": 101}, {"q": "x" * 81}, {"page": "one"}]
)
def test_list_products_validation(client: TestClient, params: dict[str, Any]) -> None:
    assert_error(client.get("/api/v1/products", params=params), 422, "VALIDATION_ERROR")


def test_product_card_fields(client: TestClient, db: Session) -> None:
    bundle = make_product(db, slug="card-lamp", price_paise=499900, badges=["New"])
    variant = bundle.variant
    variant.compare_at_price_paise = 599900
    pricier = make_variant(db, bundle.product, price_paise=899900, kelvin=6500, compare_at_price_paise=999800)
    second_image = add_image(db, bundle.product, sort_order=2)
    first_image = add_image(db, bundle.product, sort_order=1)
    bundle.product.rating_count, bundle.product.rating_sum = 3, 13
    bundle.product.rating_dist = {"1": 0, "2": 0, "3": 0, "4": 2, "5": 1}
    db.flush()

    [card] = client.get("/api/v1/products").json()["items"]
    assert card["price_from_paise"] == 499900
    assert card["compare_at_price_from_paise"] == 599900
    assert card["default_variant_id"] == variant.id
    assert card["badges"] == ["New"]
    assert card["category"] == {
        "id": bundle.category.id,
        "slug": bundle.category.slug,
        "name": bundle.category.name,
    }
    assert card["primary_image"]["id"] == first_image.id
    assert card["primary_image"]["renditions"][0] == {
        "width": 480,
        "url": first_image.url.replace("1600", "480"),
    }
    assert card["rating"] == {
        "average": 4.3,
        "count": 3,
        "distribution": {"star_1": 0, "star_2": 0, "star_3": 0, "star_4": 2, "star_5": 1},
    }
    assert card["stock_status"] == "in_stock"
    assert second_image.id != first_image.id
    assert pricier.id != variant.id


@pytest.mark.parametrize(
    ("stocks", "expected"),
    [
        ([(50, 0), (0, 0)], "in_stock"),
        ([(5, 0), (0, 0)], "low_stock"),
        ([(3, 3), (0, 0)], "out_of_stock"),
        ([(15, 6), (12, 0)], "in_stock"),
    ],
)
def test_product_card_stock_status_aggregate(
    db: Session, stocks: list[tuple[int, int]], expected: str
) -> None:
    bundle = make_product(db, variants=0)
    for on_hand, reserved in stocks:
        make_variant(db, bundle.product, on_hand=on_hand, reserved=reserved, kelvin=4000 + on_hand)
    [card] = catalog_service.build_product_cards(db, [bundle.product])
    assert card.stock_status.value == expected


def test_build_product_cards_skips_products_without_active_variants(db: Session) -> None:
    visible = make_product(db)
    hidden = make_product(db)
    hidden.variant.is_active = False
    db.flush()
    cards = catalog_service.build_product_cards(db, [hidden.product, visible.product])
    assert [c.id for c in cards] == [visible.product.id]
    assert catalog_service.build_product_cards(db, []) == []


def test_aggregate_stock_status() -> None:
    agg = catalog_service.aggregate_stock_status
    assert agg([StockStatus.OUT_OF_STOCK, StockStatus.IN_STOCK]) is StockStatus.IN_STOCK
    assert agg([StockStatus.LOW_STOCK, StockStatus.OUT_OF_STOCK]) is StockStatus.LOW_STOCK
    assert agg([]) is StockStatus.OUT_OF_STOCK


# ---- getProduct ------------------------------------------------------------------------------


def test_get_product_detail(client: TestClient, db: Session) -> None:
    bundle = make_product(db, slug="dawnlit-desk", name="Dawnlit Desk", variants=0, warranty_months=12)
    product = bundle.product
    product.highlights = ["10,000 lux at 30–40 cm", "UV-free diffused LED"]
    product.specs = [{"label": "Brightness", "value": "10,000 lux"}]
    product.seo_description = None
    v6500 = make_variant(db, product, kelvin=6500, bundle="solo", price_paise=499900)
    v4000 = make_variant(db, product, kelvin=4000, bundle="duo", price_paise=899900, on_hand=6)
    v5500 = make_variant(
        db, product, kelvin=5500, bundle="solo", price_paise=499900, is_default=True, on_hand=0
    )
    v4000.colour_temperature_label = "Warm-neutral"
    v4000.bundle_label = "Duo pack"
    v6500.sort_order, v4000.sort_order, v5500.sort_order = 3, 1, 2
    inactive = make_variant(db, product, kelvin=3000, bundle="solo", is_active=False)
    image = add_image(db, product)
    db.flush()

    response = client.get("/api/v1/products/dawnlit-desk")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["slug"] == "dawnlit-desk"
    assert [v["id"] for v in body["variants"]] == [v4000.id, v5500.id, v6500.id]
    assert inactive.id not in [v["id"] for v in body["variants"]]
    statuses = {v["id"]: v["stock_status"] for v in body["variants"]}
    assert statuses == {v4000.id: "low_stock", v5500.id: "out_of_stock", v6500.id: "in_stock"}
    assert body["default_variant_id"] == v5500.id
    assert body["options"]["colour_temperatures"][0] == {"kelvin": 4000, "label": "Warm-neutral"}
    assert [o["kelvin"] for o in body["options"]["colour_temperatures"]] == [4000, 5500, 6500]
    assert [b["code"] for b in body["options"]["bundles"]] == ["duo", "solo"]
    assert body["specs"] == [{"label": "Brightness", "value": "10,000 lux"}]
    assert body["highlights"][0] == "10,000 lux at 30–40 cm"
    assert body["images"][0]["id"] == image.id
    assert body["seo"] == {"title": "Dawnlit Desk", "description": "A test lamp.", "og_image_url": image.url}
    assert body["rating"]["average"] == 0
    assert body["rating"]["count"] == 0
    assert body["warranty_months"] == 12
    assert body["return_window_days"] == 30
    assert "Not a medical device" in body["description_md"]


def test_get_product_default_falls_back_to_first_active(client: TestClient, db: Session) -> None:
    bundle = make_product(db, slug="fallback-lamp", variants=2)
    bundle.variants[0].is_active = False  # the flagged default is inactive
    db.flush()
    body = client.get("/api/v1/products/fallback-lamp").json()
    assert body["default_variant_id"] == bundle.variants[1].id


def test_get_product_not_found(client: TestClient, db: Session) -> None:
    make_product(db, slug="inactive-lamp", is_active=False)
    archived = make_product(db, slug="archived-lamp")
    archived.product.archived_at = clock.now_utc()
    db.flush()
    for slug in ("missing-lamp", "inactive-lamp", "archived-lamp"):
        assert_error(client.get(f"/api/v1/products/{slug}"), 404, "PRODUCT_NOT_FOUND")


@pytest.mark.parametrize("slug", ["Bad_Slug", "trailing-", "a" * 161])
def test_get_product_invalid_slug(client: TestClient, slug: str) -> None:
    assert_error(client.get(f"/api/v1/products/{slug}"), 422, "VALIDATION_ERROR")


# ---- listRelatedProducts ---------------------------------------------------------------------


def test_list_related_products_same_category_first(
    client: TestClient, catalog: dict[str, ProductBundle]
) -> None:
    response = client.get("/api/v1/products/dawnlit-desk/related")
    assert slugs(response) == ["dawnlit-go", "dawnlit-panel"]
    assert slugs(client.get("/api/v1/products/dawnlit-desk/related", params={"limit": 1})) == ["dawnlit-go"]
    assert slugs(client.get("/api/v1/products/dawnlit-panel/related")) == ["dawnlit-desk", "dawnlit-go"]


def test_list_related_products_errors(client: TestClient, catalog: dict[str, ProductBundle]) -> None:
    assert_error(client.get("/api/v1/products/unknown-lamp/related"), 404, "PRODUCT_NOT_FOUND")
    for limit in (0, 9):
        response = client.get("/api/v1/products/dawnlit-desk/related", params={"limit": limit})
        assert_error(response, 422, "VALIDATION_ERROR")


def test_variant_builder_matches_contract(db: Session, make_product: Callable[..., ProductBundle]) -> None:
    bundle = make_product()
    variant: ProductVariant = bundle.variant
    built = catalog_service.build_variant(variant, StockStatus.LOW_STOCK)
    assert built.model_dump()["stock_status"] == "low_stock"
    assert built.sku == variant.sku
