from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

import app.models as models
from app.models import (
    Base,
    Cart,
    CartItem,
    Inventory,
    Order,
    Product,
    ProductVariant,
    Review,
    StockMovement,
    User,
)
from app.models.enums import OrderStatus, ReviewStatus, StockMovementReason, UserRole
from tests import factories

EXPECTED_TABLES = {
    "users",
    "refresh_tokens",
    "otp_codes",
    "addresses",
    "categories",
    "products",
    "product_variants",
    "product_images",
    "inventory",
    "stock_reservations",
    "stock_movements",
    "suppliers",
    "purchase_batches",
    "purchase_batch_items",
    "carts",
    "cart_items",
    "cart_promos",
    "promo_codes",
    "promo_code_products",
    "promo_code_categories",
    "promo_redemptions",
    "orders",
    "order_addresses",
    "order_items",
    "order_status_history",
    "payments",
    "refunds",
    "shipments",
    "shipment_events",
    "invoices",
    "invoice_sequences",
    "reviews",
    "blog_posts",
    "faqs",
    "contact_messages",
    "quiz_results",
    "notifications_log",
    "audit_log",
    "webhook_events",
}


def test_metadata_has_every_db_schema_table() -> None:
    assert set(Base.metadata.tables) == EXPECTED_TABLES
    assert len(EXPECTED_TABLES) == 39
    for name in models.__all__:
        assert getattr(models, name) is not None


def _violates(db: Session, fn: Callable[[], None]) -> None:
    """Assert that ``fn`` + flush violates a DB constraint (rolled back to a savepoint)."""

    def attempt() -> None:
        fn()
        db.flush()

    nested = db.begin_nested()
    with pytest.raises(DBAPIError):
        attempt()
    nested.rollback()


def test_user_roundtrip_and_enum_storage(db: Session) -> None:
    user = factories.make_user(db, email="Mixed.Case@Example.com", role=UserRole.STAFF)
    raw = db.execute(text("SELECT role, is_active FROM users WHERE id = :id"), {"id": user.id}).one()
    assert raw.role == "staff"
    assert raw.is_active == 1
    db.expire_all()
    loaded = db.get(User, user.id)
    assert loaded is not None
    assert loaded.email == "mixed.case@example.com"
    assert loaded.role is UserRole.STAFF
    assert loaded.created_at.tzinfo is UTC
    assert loaded.is_staff


def test_email_unique_case_insensitive(db: Session) -> None:
    factories.make_user(db, email="dup@example.com")
    _violates(db, lambda: db.add(User(email="DUP@example.com", role=UserRole.CUSTOMER)))


def test_utc_datetime_type(db: Session) -> None:
    user = factories.make_user(db)
    aware = datetime(2026, 5, 1, 12, 0, 0, 123456, tzinfo=UTC)
    user.last_login_at = aware
    db.flush()
    raw = db.execute(text("SELECT last_login_at FROM users WHERE id = :id"), {"id": user.id}).scalar_one()
    assert raw == datetime(2026, 5, 1, 12, 0, 0, 123456)  # noqa: DTZ001 - naive UTC in the DB
    db.expire_all()
    assert db.get(User, user.id).last_login_at == aware
    user = db.get(User, user.id)
    user.last_login_at = datetime(2026, 5, 1)  # noqa: DTZ001 - deliberately naive
    with pytest.raises(Exception, match="naive datetime"):
        db.flush()
    db.rollback()


def test_server_defaults_apply_to_raw_inserts(db: Session) -> None:
    category = factories.make_category(db)
    db.execute(
        text(
            "INSERT INTO products (category_id, slug, name, description_md) "
            "VALUES (:c, 'raw-prod', 'Raw', 'x')"
        ),
        {"c": category.id},
    )
    row = db.execute(
        text(
            "SELECT tagline, highlights, rating_dist, hsn_code, gst_rate_percent, is_active, created_at "
            "FROM products WHERE slug = 'raw-prod'"
        )
    ).one()
    assert row.tagline == ""
    assert row.hsn_code == "9405"
    assert row.gst_rate_percent == 18
    assert row.is_active == 0
    assert row.created_at is not None
    product = db.scalar(select(Product).where(Product.slug == "raw-prod"))
    assert product is not None
    assert product.highlights == []
    assert product.rating_dist == {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    assert product.rating_average is None


def test_product_graph_and_relationships(db: Session) -> None:
    bundle = factories.make_product(db, variants=3)
    db.expire_all()
    product = db.get(Product, bundle.product.id)
    assert product is not None
    assert [v.id for v in product.variants] == sorted(v.id for v in bundle.variants)
    assert product.category.id == bundle.category.id
    inventory = product.variants[0].inventory
    assert inventory is not None
    assert inventory.available == 50
    product.rating_count, product.rating_sum = 3, 13
    assert product.rating_average == 4.3


def test_inventory_checks(db: Session) -> None:
    variant = factories.make_product(db).variant
    inv = db.get(Inventory, variant.id)
    assert inv is not None

    def over_reserve() -> None:
        inv.reserved = inv.on_hand + 1

    _violates(db, over_reserve)
    db.refresh(inv)

    def negative() -> None:
        inv.on_hand = -1

    _violates(db, negative)


def test_variant_uniques_and_price_check(db: Session) -> None:
    bundle = factories.make_product(db)
    v = bundle.variant
    _violates(db, lambda: factories.make_variant(db, bundle.product, sku=v.sku))
    _violates(
        db, lambda: factories.make_variant(db, bundle.product, kelvin=v.colour_temperature_k, bundle=v.bundle)
    )
    _violates(db, lambda: factories.make_variant(db, bundle.product, price_paise=0))


def test_cart_quantity_check_and_cascade(db: Session) -> None:
    variant = factories.make_product(db).variant
    cart = factories.make_cart(db, items=[(variant, 2)])
    _violates(
        db,
        lambda: db.add(
            CartItem(
                cart_id=cart.id,
                variant_id=factories.make_product(db).variant.id,
                quantity=6,
                added_price_paise=1,
            )
        ),
    )
    db.execute(text("DELETE FROM carts WHERE id = :id"), {"id": cart.id})
    remaining = db.execute(
        text("SELECT COUNT(*) FROM cart_items WHERE cart_id = :id"), {"id": cart.id}
    ).scalar()
    assert remaining == 0
    assert db.scalar(select(Cart).where(Cart.id == cart.id).execution_options(populate_existing=True)) is None


def test_order_total_math_check(db: Session) -> None:
    order = factories.make_order(db)
    assert order.total_paise == order.subtotal_paise + order.shipping_paise
    assert len(order.items) == 1
    assert order.shipping_address is not None
    assert order.billing_address is not None
    assert order.status is OrderStatus.PENDING

    def break_math() -> None:
        order.total_paise += 1

    _violates(db, break_math)


def test_order_gst_snapshot_inter_state(db: Session) -> None:
    variant = factories.make_product(db, price_paise=749900).variant
    order = factories.make_order(db, items=[(variant, 1)], state_code="29")
    assert order.igst_paise == 749900 - 635508
    assert order.cgst_paise == order.sgst_paise == 0
    assert order.tax_paise == order.igst_paise


def test_order_number_unique(db: Session) -> None:
    order = factories.make_order(db)
    _violates(db, lambda: factories.make_order(db, order_number=order.order_number))


def test_review_rating_check_and_unique(db: Session) -> None:
    product = factories.make_product(db).product
    user = factories.make_user(db)
    db.add(
        Review(
            product_id=product.id,
            user_id=user.id,
            author_name="A",
            rating=5,
            title="t",
            body="b",
            status=ReviewStatus.APPROVED,
        )
    )
    db.flush()
    _violates(
        db,
        lambda: db.add(
            Review(product_id=product.id, user_id=user.id, author_name="A", rating=4, title="t2", body="b")
        ),
    )
    _violates(
        db, lambda: db.add(Review(product_id=product.id, author_name="B", rating=6, title="t", body="b"))
    )
    # NULL user rows are not constrained by UNIQUE(product_id, user_id)
    db.add_all(
        [Review(product_id=product.id, author_name=f"G{i}", rating=4, title="t", body="b") for i in range(2)]
    )
    db.flush()


def test_stock_movement_delta_nonzero(db: Session) -> None:
    variant = factories.make_product(db).variant
    _violates(
        db,
        lambda: db.add(
            StockMovement(
                variant_id=variant.id, delta=0, on_hand_after=50, reason=StockMovementReason.CORRECTION
            )
        ),
    )


def test_restrict_fk_blocks_deleting_ordered_variant_product(db: Session) -> None:
    variant = factories.make_product(db).variant
    factories.make_order(db, items=[(variant, 1)])
    product_id = variant.product_id
    with pytest.raises(DBAPIError), db.begin_nested():
        db.execute(text("DELETE FROM products WHERE id = :id"), {"id": product_id})
    assert db.get(ProductVariant, variant.id) is not None


def test_orders_survive_user_deletion(db: Session) -> None:
    user = factories.make_user(db)
    order = factories.make_order(db, user=user)
    db.execute(text("DELETE FROM users WHERE id = :id"), {"id": user.id})
    db.expire_all()
    reloaded = db.get(Order, order.id)
    assert reloaded is not None
    assert reloaded.user_id is None


def test_table_options(db: Session) -> None:
    rows = db.execute(
        text(
            "SELECT TABLE_NAME, ENGINE, TABLE_COLLATION FROM information_schema.TABLES "
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME <> 'alembic_version'"
        )
    ).all()
    assert {r.TABLE_NAME for r in rows} == EXPECTED_TABLES
    assert {r.ENGINE for r in rows} == {"InnoDB"}
    assert {r.TABLE_COLLATION for r in rows} == {"utf8mb4_0900_ai_ci"}


def test_session_time_zone_is_utc(db: Session) -> None:
    assert db.execute(text("SELECT @@session.time_zone")).scalar() == "+00:00"
