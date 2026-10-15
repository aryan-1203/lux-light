"""Catalog service: categories, product listing/detail, related products, product cards.
Owner: Backend Core.

A product is publicly visible when it is active, not archived and has at least one active,
non-archived variant. Public stock indicators come from ``services.inventory.stock_status_for_variants``
(Backend Commerce); exact quantities are never exposed.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any, Final

from sqlalchemy import ColumnElement, Select, and_, case, exists, func, or_, select
from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.core.pagination import PageParams, paginate
from app.models import Category, Product, ProductImage, ProductVariant
from app.models.enums import ProductSort, StockStatus
from app.schemas import catalog as schemas
from app.services import inventory as inventory_service

SEO_DESCRIPTION_MAX: Final = 160


# ---- visibility predicates -----------------------------------------------------------------------


def variant_is_active() -> ColumnElement[bool]:
    return and_(ProductVariant.is_active.is_(True), ProductVariant.archived_at.is_(None))


def product_is_visible() -> ColumnElement[bool]:
    has_variant = exists().where(ProductVariant.product_id == Product.id, variant_is_active())
    return and_(Product.is_active.is_(True), Product.archived_at.is_(None), has_variant)


def get_visible_product_by_slug(db: Session, slug: str) -> Product:
    """404 ``PRODUCT_NOT_FOUND`` for unknown, inactive or archived products."""
    product = db.scalar(select(Product).where(Product.slug == slug, product_is_visible()))
    if product is None:
        raise NotFoundError("PRODUCT_NOT_FOUND", "Product not found.")
    return product


def active_variants(db: Session, product_ids: Sequence[int]) -> dict[int, list[ProductVariant]]:
    if not product_ids:
        return {}
    rows = db.scalars(
        select(ProductVariant)
        .where(ProductVariant.product_id.in_(product_ids), variant_is_active())
        .order_by(ProductVariant.product_id, ProductVariant.sort_order, ProductVariant.id)
    ).all()
    grouped: dict[int, list[ProductVariant]] = {pid: [] for pid in product_ids}
    for variant in rows:
        grouped[variant.product_id].append(variant)
    return grouped


def default_variant(variants: Sequence[ProductVariant]) -> ProductVariant:
    """The flagged default among ``variants`` (active), else the first by sort order."""
    for variant in variants:
        if variant.is_default:
            return variant
    return variants[0]


def stock_statuses(db: Session, variants: Sequence[ProductVariant]) -> dict[int, StockStatus]:
    ids = sorted({v.id for v in variants})
    if not ids:
        return {}
    return inventory_service.stock_status_for_variants(db, ids)


# ---- builders ------------------------------------------------------------------------------------


def build_image(image: ProductImage) -> schemas.ProductImage:
    return schemas.ProductImage(
        id=image.id,
        url=image.url,
        alt=image.alt,
        width=image.width,
        height=image.height,
        renditions=[
            schemas.ImageRendition(width=int(r["width"]), url=str(r["url"])) for r in image.renditions or []
        ],
        sort_order=image.sort_order,
        variant_id=image.variant_id,
    )


def build_rating(product: Product) -> schemas.RatingSummary:
    dist: dict[str, Any] = product.rating_dist or {}
    return schemas.RatingSummary(
        average=product.rating_average or 0.0,
        count=product.rating_count,
        distribution=schemas.RatingDistribution(
            star_1=int(dist.get("1", 0)),
            star_2=int(dist.get("2", 0)),
            star_3=int(dist.get("3", 0)),
            star_4=int(dist.get("4", 0)),
            star_5=int(dist.get("5", 0)),
        ),
    )


def build_variant(variant: ProductVariant, status: StockStatus) -> schemas.ProductVariant:
    return schemas.ProductVariant(
        id=variant.id,
        sku=variant.sku,
        name=variant.name,
        colour_temperature_k=variant.colour_temperature_k,
        colour_temperature_label=variant.colour_temperature_label,
        bundle=variant.bundle,
        bundle_label=variant.bundle_label,
        price_paise=variant.price_paise,
        compare_at_price_paise=variant.compare_at_price_paise,
        stock_status=status,
        is_default=variant.is_default,
    )


def build_category_ref(category: Category) -> schemas.CategoryRef:
    return schemas.CategoryRef(id=category.id, slug=category.slug, name=category.name)


def build_product_ref(product: Product) -> schemas.ProductRef:
    return schemas.ProductRef(id=product.id, slug=product.slug, name=product.name)


def aggregate_stock_status(statuses: Sequence[StockStatus]) -> StockStatus:
    """Card status: in_stock if any variant is in stock; low_stock if every in-stock variant is low."""
    if StockStatus.IN_STOCK in statuses:
        return StockStatus.IN_STOCK
    if StockStatus.LOW_STOCK in statuses:
        return StockStatus.LOW_STOCK
    return StockStatus.OUT_OF_STOCK


def build_product_cards(db: Session, products: Sequence[Product]) -> list[schemas.ProductCard]:
    """Cards in the given order. Products without an active variant are skipped."""
    if not products:
        return []
    ids = [p.id for p in products]
    variants_by_product = active_variants(db, ids)
    statuses = stock_statuses(db, [v for vs in variants_by_product.values() for v in vs])
    categories = {
        c.id: c
        for c in db.scalars(select(Category).where(Category.id.in_({p.category_id for p in products}))).all()
    }
    primary_images: dict[int, ProductImage] = {}
    for row in db.scalars(
        select(ProductImage)
        .where(ProductImage.product_id.in_(ids))
        .order_by(ProductImage.product_id, ProductImage.sort_order, ProductImage.id)
    ).all():
        primary_images.setdefault(row.product_id, row)

    cards: list[schemas.ProductCard] = []
    for product in products:
        variants = variants_by_product.get(product.id) or []
        if not variants:
            continue
        cheapest = min(variants, key=lambda v: (v.price_paise, v.sort_order, v.id))
        image = primary_images.get(product.id)
        cards.append(
            schemas.ProductCard(
                id=product.id,
                slug=product.slug,
                name=product.name,
                tagline=product.tagline,
                category=build_category_ref(categories[product.category_id]),
                price_from_paise=cheapest.price_paise,
                compare_at_price_from_paise=cheapest.compare_at_price_paise,
                primary_image=build_image(image) if image is not None else None,
                rating=build_rating(product),
                stock_status=aggregate_stock_status(
                    [statuses.get(v.id, StockStatus.OUT_OF_STOCK) for v in variants]
                ),
                badges=list(product.badges or []),
                default_variant_id=default_variant(variants).id,
            )
        )
    return cards


# ---- categories ----------------------------------------------------------------------------------


def list_categories(db: Session) -> list[schemas.Category]:
    counts = (
        select(Product.category_id, func.count(Product.id).label("n"))
        .where(product_is_visible())
        .group_by(Product.category_id)
        .subquery()
    )
    rows = db.execute(
        select(Category, func.coalesce(counts.c.n, 0))
        .outerjoin(counts, counts.c.category_id == Category.id)
        .where(Category.is_active.is_(True))
        .order_by(Category.sort_order, Category.id)
    ).all()
    return [
        schemas.Category(
            id=category.id,
            slug=category.slug,
            name=category.name,
            description=category.description,
            image_url=category.image_url,
            sort_order=category.sort_order,
            product_count=int(count),
        )
        for category, count in rows
    ]


def get_active_category(db: Session, slug: str) -> Category:
    category = db.scalar(select(Category).where(Category.slug == slug, Category.is_active.is_(True)))
    if category is None:
        raise NotFoundError("CATEGORY_NOT_FOUND", "Category not found.")
    return category


# ---- product listing -----------------------------------------------------------------------------


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _min_price() -> Any:
    return (
        select(func.min(ProductVariant.price_paise))
        .where(ProductVariant.product_id == Product.id, variant_is_active())
        .correlate(Product)
        .scalar_subquery()
    )


def _ordered(stmt: Select[Product], sort: ProductSort) -> Select[Product]:
    if sort is ProductSort.PRICE_ASC:
        return stmt.order_by(_min_price().asc(), Product.sort_order, Product.id)
    if sort is ProductSort.PRICE_DESC:
        return stmt.order_by(_min_price().desc(), Product.sort_order, Product.id)
    if sort is ProductSort.NEWEST:
        return stmt.order_by(Product.created_at.desc(), Product.id.desc())
    if sort is ProductSort.RATING:
        average = case(
            (Product.rating_count > 0, Product.rating_sum * 1.0 / Product.rating_count), else_=None
        )
        return stmt.order_by(
            average.is_(None), average.desc(), Product.rating_count.desc(), Product.sort_order, Product.id
        )
    return stmt.order_by(Product.is_featured.desc(), Product.sort_order, Product.id)


def list_products(
    db: Session,
    *,
    category_slug: str | None,
    sort: ProductSort,
    q: str | None,
    params: PageParams,
) -> schemas.ProductListPage:
    """404 ``CATEGORY_NOT_FOUND`` for an unknown/inactive category slug."""
    stmt = select(Product).where(product_is_visible())
    if category_slug:
        stmt = stmt.where(Product.category_id == get_active_category(db, category_slug).id)
    term = (q or "").strip()
    if term:
        pattern = f"%{_escape_like(term)}%"
        stmt = stmt.where(
            or_(
                Product.name.ilike(pattern, escape="\\"),
                Product.tagline.ilike(pattern, escape="\\"),
            )
        )
    products, total = paginate(db, _ordered(stmt, sort), params)
    return schemas.ProductListPage(
        items=build_product_cards(db, products),
        page=params.page,
        page_size=params.page_size,
        total=total,
    )


# ---- product detail ------------------------------------------------------------------------------


def _truncate(text: str, limit: int) -> str:
    text = " ".join(text.split())
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def get_product_detail(db: Session, slug: str) -> schemas.ProductDetail:
    product = get_visible_product_by_slug(db, slug)
    variants = active_variants(db, [product.id])[product.id]
    statuses = stock_statuses(db, variants)
    images = list(
        db.scalars(
            select(ProductImage)
            .where(ProductImage.product_id == product.id)
            .order_by(ProductImage.sort_order, ProductImage.id)
        ).all()
    )
    category = db.get(Category, product.category_id)
    assert category is not None

    kelvins: dict[int, str] = {}
    bundles: dict[str, str] = {}
    for variant in variants:
        kelvins.setdefault(variant.colour_temperature_k, variant.colour_temperature_label)
        bundles.setdefault(variant.bundle, variant.bundle_label)

    return schemas.ProductDetail(
        id=product.id,
        slug=product.slug,
        name=product.name,
        tagline=product.tagline,
        description_md=product.description_md,
        highlights=[str(h) for h in product.highlights or []],
        specs=[
            schemas.ProductSpec(label=str(s.get("label", "")), value=str(s.get("value", "")))
            for s in product.specs or []
        ],
        badges=[str(b) for b in product.badges or []],
        category=build_category_ref(category),
        images=[build_image(i) for i in images],
        variants=[build_variant(v, statuses.get(v.id, StockStatus.OUT_OF_STOCK)) for v in variants],
        options=schemas.ProductOptions(
            colour_temperatures=[
                schemas.ColourTemperatureOption(kelvin=k, label=kelvins[k]) for k in sorted(kelvins)
            ],
            bundles=[schemas.BundleOption(code=code, label=label) for code, label in bundles.items()],
        ),
        default_variant_id=default_variant(variants).id,
        rating=build_rating(product),
        warranty_months=product.warranty_months,
        return_window_days=product.return_window_days,
        seo=schemas.SeoMeta(
            title=product.seo_title or product.name,
            description=_truncate(
                product.seo_description or product.tagline or product.name, SEO_DESCRIPTION_MAX
            ),
            og_image_url=images[0].url if images else None,
        ),
    )


def list_related_products(db: Session, slug: str, *, limit: int) -> list[schemas.ProductCard]:
    """Other visible products: same category first, then by featured order."""
    product = get_visible_product_by_slug(db, slug)
    same_category = case((Product.category_id == product.category_id, 0), else_=1)
    related = db.scalars(
        select(Product)
        .where(product_is_visible(), Product.id != product.id)
        .order_by(same_category, Product.is_featured.desc(), Product.sort_order, Product.id)
        .limit(limit)
    ).all()
    return build_product_cards(db, related)
