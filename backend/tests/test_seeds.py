from __future__ import annotations

import re
from pathlib import Path

import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings
from app.core.money import round_half_up_div
from app.core.security import verify_password
from app.models import (
    Address,
    BlogPost,
    Category,
    Faq,
    Inventory,
    Product,
    ProductImage,
    ProductVariant,
    PromoCode,
    PurchaseBatch,
    PurchaseBatchItem,
    Review,
    StockMovement,
    Supplier,
    User,
)
from app.models.enums import DiscountType, ReviewSource, StockMovementReason, StockStatus, UserRole
from app.seeds import __main__ as seeds_cli
from app.seeds import data, run_seeds
from app.seeds.data import DISCLAIMER
from app.services.inventory import stock_status

COUNTED = [
    User,
    Category,
    Product,
    ProductVariant,
    Inventory,
    ProductImage,
    Supplier,
    PurchaseBatch,
    PurchaseBatchItem,
    StockMovement,
    PromoCode,
    Faq,
    BlogPost,
    Review,
    Address,
]

BANNED = re.compile(
    r"\bcure[sd]?\b|\btreat(s|ment|ing)?\b|\bprevent(s|ion)?\b|diagnos|therap(y|eutic)|\bheal(s|ing)\b|\bSAD\b"
    r"|seasonal affective|depression|insomnia|disorder|clinically proven|medical-grade",
    re.IGNORECASE,
)


def _counts(db: Session) -> dict[str, int]:
    return {m.__name__: db.scalar(select(func.count()).select_from(m)) or 0 for m in COUNTED}


@pytest.fixture
def seeded(session_factory: sessionmaker[Session], db: Session) -> Session:
    run_seeds(session_factory, essential_data=True, demo_data=True)
    return db


def test_seeds_are_idempotent(session_factory: sessionmaker[Session], db: Session) -> None:
    first = run_seeds(session_factory, essential_data=True, demo_data=True)
    after_first = _counts(db)
    second = run_seeds(session_factory, essential_data=True, demo_data=True)
    assert _counts(db) == after_first
    assert second.created == {}
    assert first.created["products"] == 3
    assert after_first["ProductVariant"] == 12
    assert after_first["Inventory"] == 12
    assert after_first["Review"] == 12
    assert after_first["BlogPost"] == 4
    assert after_first["PromoCode"] == 2
    assert 10 <= after_first["Faq"] <= 11


def test_users_and_passwords(seeded: Session, settings: Settings) -> None:
    admin = seeded.scalar(select(User).where(User.email == "admin@dawnlit.in"))
    staff = seeded.scalar(select(User).where(User.email == "staff@dawnlit.in"))
    priya = seeded.scalar(select(User).where(User.email == "priya.demo@example.com"))
    assert admin is not None
    assert admin.role is UserRole.ADMIN
    assert staff is not None
    assert staff.role is UserRole.STAFF
    assert priya is not None
    assert priya.role is UserRole.CUSTOMER
    assert verify_password(settings.SEED_ADMIN_PASSWORD, admin.password_hash or "")
    assert verify_password(settings.SEED_DEMO_PASSWORD, priya.password_hash or "")
    addresses = {a.pincode: a for a in seeded.scalars(select(Address))}
    assert addresses["400050"].state_code == "27"
    assert addresses["400050"].state == "Maharashtra"
    assert addresses["560034"].state_code == "29"


def test_catalog_matches_db_schema(seeded: Session) -> None:
    products = {p.slug: p for p in seeded.scalars(select(Product))}
    assert set(products) == {"dawnlit-desk", "dawnlit-panel", "dawnlit-go"}
    for product in products.values():
        assert product.is_active
        assert product.hsn_code == "9405"
        assert product.gst_rate_percent == 18
        assert DISCLAIMER in product.description_md
        assert 4 <= len(product.highlights) <= 6
        assert product.specs
        defaults = [v for v in product.variants if v.is_default]
        assert len(defaults) == 1
        assert product.images
        for image in product.images:
            assert image.url.startswith(f"/media/products/{product.id}/")
            assert [r["width"] for r in image.renditions] == [480, 960, 1600]
    assert products["dawnlit-desk"].is_featured
    assert not products["dawnlit-go"].is_featured
    variants = {v.sku: v for v in seeded.scalars(select(ProductVariant))}
    assert variants["DL-DESK-5500-SOLO"].price_paise == 499900
    assert variants["DL-DESK-4000-DUO"].compare_at_price_paise == 999800
    assert variants["DL-PANEL-6500-STAND"].price_paise == 949900
    assert variants["DL-GO-5500-CASE"].bundle == "travel_case"
    assert variants["DL-DESK-5500-SOLO"].name == "Daylight 5500K · Solo"


def test_image_files_exist(seeded: Session, settings: Settings) -> None:
    for image in seeded.scalars(select(ProductImage)):
        for rendition in image.renditions:
            path: Path = settings.media_dir / rendition["url"].removeprefix("/media/")
            assert path.is_file(), path
    for post in seeded.scalars(select(BlogPost)):
        assert post.cover_image_url
        assert (settings.media_dir / post.cover_image_url.removeprefix("/media/")).is_file()


def test_stock_and_landed_costs(seeded: Session) -> None:
    on_hand = {
        sku: (inv.on_hand, inv.reserved, inv.low_stock_threshold)
        for sku, inv in seeded.execute(select(ProductVariant.sku, Inventory).join(Inventory))
    }
    expected = {sku: qty for batch in data.BATCHES for sku, qty, _ in batch.lines}
    expected["DL-PANEL-6500-STAND"] = 0
    assert {sku: v[0] for sku, v in on_hand.items()} == expected
    assert all(v[1] == 0 and v[2] == 10 for v in on_hand.values())
    assert stock_status(6, 10) is StockStatus.LOW_STOCK  # DESK-4000-DUO
    assert stock_status(0, 10) is StockStatus.OUT_OF_STOCK  # PANEL-6500-STAND
    # Ledger invariant: Σ movements == on_hand for every variant.
    sums: dict[int, int] = dict(
        seeded.execute(
            select(StockMovement.variant_id, func.sum(StockMovement.delta)).group_by(StockMovement.variant_id)
        ).all()
    )
    for inv in seeded.scalars(select(Inventory)):
        assert int(sums.get(inv.variant_id, 0)) == inv.on_hand
    assert {m.reason for m in seeded.scalars(select(StockMovement))} == {StockMovementReason.PURCHASE_RECEIPT}
    for batch in seeded.scalars(select(PurchaseBatch)):
        spec = next(b for b in data.BATCHES if b.reference == batch.reference)
        assert sum(i.allocated_shipping_paise for i in batch.items) == spec.shipping_paise
        assert sum(i.allocated_duty_paise for i in batch.items) == spec.duty_paise
        assert sum(i.allocated_other_paise for i in batch.items) == spec.other_charges_paise
        assert all(i.allocated_gst_paise == 0 for i in batch.items)  # gst_claimable
        for item in batch.items:
            allocated = item.allocated_shipping_paise + item.allocated_duty_paise + item.allocated_other_paise
            expected_landed = round_half_up_div(
                item.quantity * item.unit_cost_paise + allocated, item.quantity
            )
            assert item.landed_unit_cost_paise == expected_landed
            assert item.landed_unit_cost_paise > item.unit_cost_paise


def test_promo_codes(seeded: Session) -> None:
    promos = {p.code: p for p in seeded.scalars(select(PromoCode))}
    welcome, sunrise = promos["WELCOME10"], promos["SUNRISE500"]
    assert welcome.discount_type is DiscountType.PERCENTAGE
    assert (welcome.percent_off, welcome.max_discount_paise, welcome.min_order_paise) == (10, 50000, 199900)
    assert (welcome.usage_limit_total, welcome.usage_limit_per_user) == (None, 1)
    assert welcome.first_order_only
    assert welcome.stackable
    assert welcome.ends_at is None
    assert sunrise.discount_type is DiscountType.FLAT
    assert (sunrise.amount_off_paise, sunrise.min_order_paise) == (50000, 499900)
    assert (sunrise.usage_limit_total, sunrise.usage_limit_per_user) == (1000, 1)
    assert not sunrise.first_order_only
    assert not sunrise.stackable
    assert sunrise.ends_at is not None
    assert sunrise.ends_at.isoformat() == "2027-03-31T18:29:59+00:00"
    for promo in promos.values():
        assert promo.starts_at is not None
        assert promo.is_active
        assert promo.times_redeemed == 0
        assert not promo.products
        assert not promo.categories


def test_reviews_and_ratings(seeded: Session) -> None:
    reviews = list(seeded.scalars(select(Review)))
    assert sorted(r.rating for r in reviews) == sorted([5, 5, 5, 5, 4, 4, 4, 4, 5, 4, 3, 5])
    by_source = {s: [r for r in reviews if r.source is s] for s in ReviewSource}
    assert len(by_source[ReviewSource.CUSTOMER]) == 2
    assert all(r.verified_purchase and r.user_id for r in by_source[ReviewSource.CUSTOMER])
    assert len(by_source[ReviewSource.DEMO_SEED]) == 10
    assert all(not r.verified_purchase and r.user_id is None for r in by_source[ReviewSource.DEMO_SEED])
    products = {p.slug: p for p in seeded.scalars(select(Product))}
    assert (products["dawnlit-desk"].rating_count, products["dawnlit-desk"].rating_sum) == (6, 28)
    assert (products["dawnlit-panel"].rating_count, products["dawnlit-panel"].rating_sum) == (3, 13)
    assert (products["dawnlit-go"].rating_count, products["dawnlit-go"].rating_sum) == (3, 12)
    assert products["dawnlit-desk"].rating_dist == {"1": 0, "2": 0, "3": 0, "4": 2, "5": 4}


def test_blog_and_faq_content(seeded: Session) -> None:
    posts = {p.slug: p for p in seeded.scalars(select(BlogPost))}
    assert set(posts) == {
        "morning-light-routine-for-desk-workers",
        "what-is-lux",
        "ten-minutes-of-bright-light-busy-mornings",
        "building-a-consistent-daily-rhythm",
    }
    for post in posts.values():
        assert post.status.value == "published"
        assert post.author_name == "Dawnlit Team"
        assert post.published_at is not None
        assert DISCLAIMER in post.body_md
        assert 2 <= len(re.findall(r"^\[\^\w+\]:", post.body_md, flags=re.MULTILINE)) <= 4
        assert post.reading_time_minutes >= 2
        assert len(post.excerpt) <= 400
    faqs = list(seeded.scalars(select(Faq)))
    safety = [f for f in faqs if "medical device" in f.question.lower()]
    assert safety
    assert DISCLAIMER in safety[0].answer_md


def test_seed_copy_is_compliance_safe(seeded: Session) -> None:
    texts: list[str] = []
    for product in seeded.scalars(select(Product)):
        texts += [
            product.name,
            product.tagline,
            product.description_md,
            product.seo_description or "",
            *product.highlights,
            *[s["value"] for s in product.specs],
        ]
        texts += [img.alt for img in product.images]
    texts += [f"{f.question} {f.answer_md}" for f in seeded.scalars(select(Faq))]
    texts += [f"{p.title} {p.excerpt} {p.body_md}" for p in seeded.scalars(select(BlogPost))]
    texts += [f"{r.title} {r.body}" for r in seeded.scalars(select(Review))]
    texts += [str(c.description) for c in seeded.scalars(select(Category))]
    offenders = [(m.group(0), t[:80]) for t in texts for m in [BANNED.search(t.replace(DISCLAIMER, ""))] if m]
    assert offenders == []


def test_purge_demo_removes_demo_data(session_factory: sessionmaker[Session], seeded: Session) -> None:
    report = run_seeds(session_factory, essential_data=False, demo_data=False, purge_demo=True)
    assert report.created["purged.users"] == 2
    assert seeded.scalar(select(func.count()).select_from(Review)) == 0
    assert seeded.scalar(select(User).where(User.email.like("%.demo@example.com"))) is None
    desk = seeded.scalar(
        select(Product).where(Product.slug == "dawnlit-desk").execution_options(populate_existing=True)
    )
    assert desk is not None
    assert desk.rating_count == 0


def test_cli_runs_and_refuses_demo_in_production(
    session_factory: sessionmaker[Session], settings: Settings, monkeypatch: pytest.MonkeyPatch
) -> None:
    assert seeds_cli.main(["--essential"]) == 0
    monkeypatch.setattr(type(settings), "is_production", property(lambda self: True))
    assert seeds_cli.main(["--demo"]) == 2
    assert seeds_cli.main([]) == 1  # production + dev default passwords → SeedError
