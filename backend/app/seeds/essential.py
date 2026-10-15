"""Essential seeds (DB_SCHEMA §10.1): staff users, catalog + images + stock, supplier + purchase
batches with landed costs, promo codes, FAQs and blog posts.

Idempotent: rows are keyed by natural keys (email, slug, sku, reference, code, question) and only
created when missing — existing rows (possibly edited by admins) are left untouched.
"""

from __future__ import annotations

import logging
import math
import re
from dataclasses import dataclass, field
from datetime import timedelta
from pathlib import Path

from PIL import Image
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import clock
from app.core.config import DEV_SEED_PASSWORD, get_settings
from app.core.images import RENDITION_WIDTHS, Rendition, StoredImage, media_url, save_renditions
from app.core.money import allocate_pro_rata, round_half_up_div
from app.core.security import hash_password
from app.models import (
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
    StockMovement,
    Supplier,
    User,
)
from app.models.enums import BlogStatus, DiscountType, PurchaseBatchStatus, StockMovementReason, UserRole
from app.seeds import data
from app.seeds.render import render_cover, render_lamp

logger = logging.getLogger("app.seeds")

CONTENT_DIR = Path(__file__).parent / "content"
LOW_STOCK_THRESHOLD = 10


@dataclass
class SeedReport:
    created: dict[str, int] = field(default_factory=dict)

    def add(self, key: str, n: int = 1) -> None:
        self.created[key] = self.created.get(key, 0) + n

    def summary(self) -> str:
        if not self.created:
            return "nothing to create (already seeded)"
        return ", ".join(f"{k}={v}" for k, v in sorted(self.created.items()))


class SeedError(RuntimeError):
    pass


# ---- users -------------------------------------------------------------------------------------


def _ensure_user(
    db: Session, report: SeedReport, *, email: str, role: UserRole, password: str, name: str
) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user is not None:
        return user
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=name,
        role=role,
        is_active=True,
        email_verified_at=clock.now_utc(),
    )
    db.add(user)
    db.flush()
    report.add(f"users.{role.value}")
    return user


def seed_staff(db: Session, report: SeedReport) -> None:
    settings = get_settings()
    if settings.is_production and DEV_SEED_PASSWORD in (
        settings.SEED_ADMIN_PASSWORD,
        settings.SEED_STAFF_PASSWORD,
    ):
        raise SeedError("Set SEED_ADMIN_PASSWORD and SEED_STAFF_PASSWORD before seeding production.")
    _ensure_user(
        db,
        report,
        email="admin@dawnlit.in",
        role=UserRole.ADMIN,
        password=settings.SEED_ADMIN_PASSWORD,
        name="Dawnlit Admin",
    )
    _ensure_user(
        db,
        report,
        email="staff@dawnlit.in",
        role=UserRole.STAFF,
        password=settings.SEED_STAFF_PASSWORD,
        name="Dawnlit Staff",
    )


# ---- catalog -----------------------------------------------------------------------------------


def seed_categories(db: Session, report: SeedReport) -> dict[str, Category]:
    out: dict[str, Category] = {}
    for spec in data.CATEGORIES:
        category = db.scalar(select(Category).where(Category.slug == spec["slug"]))
        if category is None:
            category = Category(
                slug=spec["slug"],
                name=spec["name"],
                description=spec["description"],
                sort_order=spec["sort_order"],
                is_active=True,
            )
            db.add(category)
            db.flush()
            report.add("categories")
        out[category.slug] = category
    return out


def _variant_name(kelvin: int, bundle_label: str) -> str:
    return f"{data.KELVIN_LABELS[kelvin]} {kelvin}K · {bundle_label}"


def seed_products(db: Session, report: SeedReport, categories: dict[str, Category]) -> None:
    for spec in data.PRODUCTS:
        product = db.scalar(select(Product).where(Product.slug == spec.slug))
        if product is None:
            product = Product(
                category_id=categories[spec.category_slug].id,
                slug=spec.slug,
                name=spec.name,
                tagline=spec.tagline,
                description_md=spec.description_md,
                highlights=list(spec.highlights),
                specs=[dict(s) for s in spec.specs],
                badges=list(spec.badges),
                hsn_code="9405",
                gst_rate_percent=18,
                is_active=True,
                is_featured=spec.is_featured,
                sort_order=spec.sort_order,
                warranty_months=12,
                return_window_days=30,
                seo_title=spec.seo_title,
                seo_description=spec.seo_description,
            )
            db.add(product)
            db.flush()
            report.add("products")
        for index, vs in enumerate(spec.variants):
            variant = db.scalar(select(ProductVariant).where(ProductVariant.sku == vs.sku))
            if variant is not None:
                continue
            length, breadth, height = vs.dims_mm
            variant = ProductVariant(
                product_id=product.id,
                sku=vs.sku,
                name=_variant_name(vs.kelvin, vs.bundle_label),
                colour_temperature_k=vs.kelvin,
                colour_temperature_label=data.KELVIN_LABELS[vs.kelvin],
                bundle=vs.bundle,
                bundle_label=vs.bundle_label,
                price_paise=vs.price_paise,
                compare_at_price_paise=vs.compare_at_price_paise,
                weight_grams=vs.weight_grams,
                length_mm=length,
                breadth_mm=breadth,
                height_mm=height,
                is_default=vs.is_default,
                is_active=True,
                sort_order=index + 1,
            )
            variant.inventory = Inventory(on_hand=0, reserved=0, low_stock_threshold=LOW_STOCK_THRESHOLD)
            db.add(variant)
            db.flush()
            report.add("product_variants")
        seed_product_images(db, report, product, spec)


def seed_product_images(db: Session, report: SeedReport, product: Product, spec: data.ProductSeed) -> None:
    """One lit render per colour temperature (linked to that temperature's solo/default variant) plus a
    diffuser close-up. Files are re-rendered when missing on disk (e.g. a fresh STORAGE_DIR)."""
    media_dir = get_settings().media_dir
    kelvins = sorted({v.kelvin for v in spec.variants}, key=lambda k: (k != _default_kelvin(spec), k))
    shots: list[tuple[str, int, bool, int | None, str]] = []
    for kelvin in kelvins:
        sku = next(v.sku for v in spec.variants if v.kelvin == kelvin and v.bundle == "solo")
        variant_id = db.scalar(select(ProductVariant.id).where(ProductVariant.sku == sku))
        tone = data.KELVIN_LABELS[kelvin].lower()
        alt = f"{_short_name(spec)} glowing in {tone} {kelvin}K light on a dark background"
        shots.append((f"seed-{spec.slug}-{kelvin}k", kelvin, False, variant_id, alt))
    shots.append(
        (
            f"seed-{spec.slug}-detail",
            _default_kelvin(spec),
            True,
            None,
            f"Close-up of the {_short_name(spec)} UV-free diffuser panel",
        )
    )
    subdir = f"products/{product.id}"
    for sort_order, (stem, kelvin, detail, variant_id, alt) in enumerate(shots):
        storage_path = f"{subdir}/{stem}-orig.webp"
        image = db.scalar(
            select(ProductImage).where(
                ProductImage.product_id == product.id, ProductImage.storage_path == storage_path
            )
        )
        files_present = (media_dir / storage_path).is_file() and all(
            (media_dir / subdir / f"{stem}-{w}.webp").is_file() for w in RENDITION_WIDTHS
        )
        if image is not None and files_present:
            continue
        if files_present:
            stored = _existing_renditions(subdir, stem, storage_path)
        else:
            stored = save_renditions(
                render_lamp(spec.kind, kelvin, detail=detail), subdir=subdir, stem=stem, original_ext="webp"
            )
        if image is None:
            db.add(
                ProductImage(
                    product_id=product.id,
                    variant_id=variant_id,
                    storage_path=stored.storage_path,
                    url=stored.url,
                    alt=alt[:200],
                    width=stored.width,
                    height=stored.height,
                    renditions=stored.renditions_json(),
                    sort_order=sort_order,
                )
            )
            db.flush()
            report.add("product_images")


def _existing_renditions(subdir: str, stem: str, storage_path: str) -> StoredImage:
    """Describe already-rendered files (deterministic names) without re-rendering them."""
    media_dir = get_settings().media_dir
    renditions = []
    for width in RENDITION_WIDTHS:
        rel = f"{subdir}/{stem}-{width}.webp"
        with Image.open(media_dir / rel) as img:
            renditions.append(Rendition(width=img.width, height=img.height, url=media_url(rel)))
    largest = renditions[-1]
    return StoredImage(
        storage_path=storage_path,
        url=largest.url,
        width=largest.width,
        height=largest.height,
        renditions=tuple(renditions),
    )


def _default_kelvin(spec: data.ProductSeed) -> int:
    return next(v.kelvin for v in spec.variants if v.is_default)


def _short_name(spec: data.ProductSeed) -> str:
    return spec.name.split(" — ")[0]


# ---- purchasing + stock --------------------------------------------------------------------------


def seed_supplier_and_batches(db: Session, report: SeedReport, admin: User | None) -> None:
    supplier = db.scalar(select(Supplier).where(Supplier.name == data.SUPPLIER["name"]))
    if supplier is None:
        supplier = Supplier(**data.SUPPLIER, is_active=True)
        db.add(supplier)
        db.flush()
        report.add("suppliers")
    now = clock.now_utc()
    for spec in data.BATCHES:
        if db.scalar(select(PurchaseBatch.id).where(PurchaseBatch.reference == spec.reference)) is not None:
            continue
        received_at = now - timedelta(days=spec.received_days_ago)
        batch = PurchaseBatch(
            supplier_id=supplier.id,
            reference=spec.reference,
            status=PurchaseBatchStatus.RECEIVED,
            ordered_on=clock.to_ist(received_at - timedelta(days=21)).date(),
            received_at=received_at,
            shipping_paise=spec.shipping_paise,
            duty_paise=spec.duty_paise,
            other_charges_paise=spec.other_charges_paise,
            gst_paise=spec.gst_paise,
            gst_claimable=True,
            notes="Seeded demo purchase batch.",
            created_by_id=admin.id if admin else None,
            created_at=received_at - timedelta(days=21),
        )
        db.add(batch)
        db.flush()
        variants = {
            v.sku: v
            for v in db.scalars(
                select(ProductVariant).where(ProductVariant.sku.in_([sku for sku, _, _ in spec.lines]))
            )
        }
        goods = [qty * unit for _, qty, unit in spec.lines]
        charges = {
            "shipping": allocate_pro_rata(spec.shipping_paise, goods),
            "duty": allocate_pro_rata(spec.duty_paise, goods),
            "other": allocate_pro_rata(spec.other_charges_paise, goods),
            # gst_claimable=True → import GST is input tax credit, excluded from landed cost.
            "gst": [0] * len(goods),
        }
        for i, (sku, qty, unit) in enumerate(spec.lines):
            allocated = sum(charges[k][i] for k in charges)
            db.add(
                PurchaseBatchItem(
                    batch_id=batch.id,
                    variant_id=variants[sku].id,
                    quantity=qty,
                    unit_cost_paise=unit,
                    allocated_shipping_paise=charges["shipping"][i],
                    allocated_duty_paise=charges["duty"][i],
                    allocated_other_paise=charges["other"][i],
                    allocated_gst_paise=charges["gst"][i],
                    landed_unit_cost_paise=round_half_up_div(goods[i] + allocated, qty),
                )
            )
        db.flush()
        for sku, qty, _ in sorted(spec.lines, key=lambda line: variants[line[0]].id):
            variant = variants[sku]
            inventory = db.get(Inventory, variant.id, with_for_update=True)
            if inventory is None:
                raise SeedError(f"inventory row missing for {sku}")
            inventory.on_hand += qty
            db.add(
                StockMovement(
                    variant_id=variant.id,
                    delta=qty,
                    on_hand_after=inventory.on_hand,
                    reason=StockMovementReason.PURCHASE_RECEIPT,
                    reference_type="purchase_batch",
                    reference_id=batch.id,
                    note=f"Received {spec.reference}",
                    actor_user_id=admin.id if admin else None,
                    created_at=received_at,
                )
            )
        db.flush()
        report.add("purchase_batches")


# ---- promos, FAQs, blog --------------------------------------------------------------------------


def seed_promos(db: Session, report: SeedReport, admin: User | None) -> None:
    starts_at = clock.now_utc() - timedelta(days=1)
    for spec in data.PROMOS:
        if db.scalar(select(PromoCode.id).where(PromoCode.code == spec["code"])) is not None:
            continue
        db.add(
            PromoCode(
                code=spec["code"],
                title=spec["title"],
                description=spec["description"],
                discount_type=DiscountType(spec["discount_type"]),
                percent_off=spec["percent_off"],
                amount_off_paise=spec["amount_off_paise"],
                max_discount_paise=spec["max_discount_paise"],
                min_order_paise=spec["min_order_paise"],
                usage_limit_total=spec["usage_limit_total"],
                usage_limit_per_user=spec["usage_limit_per_user"],
                times_redeemed=0,
                starts_at=starts_at,
                ends_at=spec["ends_at"],
                first_order_only=spec["first_order_only"],
                stackable=spec["stackable"],
                is_active=True,
                created_by_id=admin.id if admin else None,
            )
        )
        db.flush()
        report.add("promo_codes")


def seed_faqs(db: Session, report: SeedReport) -> None:
    for index, (category, question, answer) in enumerate(data.FAQS):
        if db.scalar(select(Faq.id).where(Faq.question == question)) is not None:
            continue
        db.add(
            Faq(question=question, answer_md=answer, category=category, sort_order=index + 1, is_active=True)
        )
        db.flush()
        report.add("faqs")


def reading_time_minutes(markdown_text: str) -> int:
    words = len(re.findall(r"\w+", markdown_text))
    return max(1, math.ceil(words / 200))


def seed_blog(db: Session, report: SeedReport, admin: User | None) -> None:
    now = clock.now_utc()
    media_dir = get_settings().media_dir
    for index, spec in enumerate(data.BLOG_POSTS):
        stem = f"seed-{spec.slug}-cover"
        cover_file = media_dir / "blog" / f"{stem}-1600.webp"
        cover_url = f"/media/blog/{stem}-1600.webp"
        if not cover_file.is_file():
            save_renditions(render_cover(index + 1), subdir="blog", stem=stem, original_ext="webp")
        if db.scalar(select(BlogPost.id).where(BlogPost.slug == spec.slug)) is not None:
            continue
        body = (CONTENT_DIR / f"{spec.slug}.md").read_text(encoding="utf-8")
        db.add(
            BlogPost(
                slug=spec.slug,
                title=spec.title,
                excerpt=spec.excerpt,
                body_md=body,
                cover_image_url=cover_url,
                cover_image_alt=spec.cover_alt,
                author_name="Dawnlit Team",
                tags=list(spec.tags),
                status=BlogStatus.PUBLISHED,
                published_at=now - timedelta(days=spec.published_days_ago),
                reading_time_minutes=reading_time_minutes(body),
                seo_title=spec.title[:70],
                seo_description=spec.seo_description[:160],
                og_image_url=cover_url,
                created_by_id=admin.id if admin else None,
            )
        )
        db.flush()
        report.add("blog_posts")


def run(db: Session, report: SeedReport) -> None:
    seed_staff(db, report)
    admin = db.scalar(select(User).where(User.email == "admin@dawnlit.in"))
    categories = seed_categories(db, report)
    seed_products(db, report, categories)
    seed_supplier_and_batches(db, report, admin)
    seed_promos(db, report, admin)
    seed_faqs(db, report)
    seed_blog(db, report, admin)
