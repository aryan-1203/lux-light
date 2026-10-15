"""Catalog tables (DB_SCHEMA §3): categories, products, product_variants, product_images."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.mysql import MEDIUMTEXT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, created_at_column, pk_column, table_args, updated_at_column
from app.db.types import (
    FALSE_DEFAULT,
    JSON_ARRAY_DEFAULT,
    TRUE_DEFAULT,
    UTCDateTime,
    int_default,
    str_default,
)

if TYPE_CHECKING:
    from app.models.inventory import Inventory

GST_RATES: tuple[int, ...] = (0, 5, 12, 18, 28, 40)
EMPTY_RATING_DIST: dict[str, int] = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
RATING_DIST_DEFAULT = text("(JSON_OBJECT('1', 0, '2', 0, '3', 0, '4', 0, '5', 0))")


def _empty_rating_dist() -> dict[str, int]:
    return dict(EMPTY_RATING_DIST)


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = table_args(
        UniqueConstraint("slug"),
        Index("ix_categories_is_active_sort_order", "is_active", "sort_order"),
    )

    id: Mapped[int] = pk_column()
    slug: Mapped[str] = mapped_column(String(80), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=int_default(0))
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=TRUE_DEFAULT
    )
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    products: Mapped[list[Product]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "products"
    __table_args__ = table_args(
        UniqueConstraint("slug"),
        CheckConstraint("gst_rate_percent IN (0, 5, 12, 18, 28, 40)", name="gst_rate_valid"),
        Index("ix_products_category_id_is_active_sort_order", "category_id", "is_active", "sort_order"),
        Index("ix_products_is_active_sort_order", "is_active", "sort_order"),
        Index("ix_products_is_active_created_at", "is_active", "created_at"),
    )

    id: Mapped[int] = pk_column()
    category_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False
    )
    slug: Mapped[str] = mapped_column(String(120), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    tagline: Mapped[str] = mapped_column(
        String(255), nullable=False, default="", server_default=str_default("")
    )
    description_md: Mapped[str] = mapped_column(MEDIUMTEXT, nullable=False)
    highlights: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list, server_default=JSON_ARRAY_DEFAULT
    )
    specs: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, nullable=False, default=list, server_default=JSON_ARRAY_DEFAULT
    )
    badges: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list, server_default=JSON_ARRAY_DEFAULT
    )
    hsn_code: Mapped[str] = mapped_column(
        String(8), nullable=False, default="9405", server_default=str_default("9405")
    )
    gst_rate_percent: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=18, server_default=int_default(18)
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=FALSE_DEFAULT
    )
    is_featured: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=FALSE_DEFAULT
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=int_default(0))
    warranty_months: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=12, server_default=int_default(12)
    )
    return_window_days: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=30, server_default=int_default(30)
    )
    seo_title: Mapped[str | None] = mapped_column(String(70), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(160), nullable=True)
    rating_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=int_default(0)
    )
    rating_sum: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=int_default(0))
    rating_dist: Mapped[dict[str, int]] = mapped_column(
        JSON, nullable=False, default=_empty_rating_dist, server_default=RATING_DIST_DEFAULT
    )
    archived_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    category: Mapped[Category] = relationship(back_populates="products")
    variants: Mapped[list[ProductVariant]] = relationship(
        back_populates="product", order_by="(ProductVariant.sort_order, ProductVariant.id)"
    )
    images: Mapped[list[ProductImage]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="(ProductImage.sort_order, ProductImage.id)",
    )

    @property
    def rating_average(self) -> float | None:
        """Average of approved reviews rounded to 1 dp (None without reviews)."""
        if self.rating_count <= 0:
            return None
        return round(self.rating_sum / self.rating_count + 1e-9, 1)


class ProductVariant(Base):
    __tablename__ = "product_variants"
    __table_args__ = table_args(
        UniqueConstraint("sku"),
        UniqueConstraint("product_id", "colour_temperature_k", "bundle"),
        CheckConstraint("price_paise > 0", name="price_paise_positive"),
        CheckConstraint("compare_at_price_paise >= 0", name="compare_at_price_paise_nonneg"),
        Index(
            "ix_product_variants_product_id_is_active_price_paise", "product_id", "is_active", "price_paise"
        ),
    )

    id: Mapped[int] = pk_column()
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False
    )
    sku: Mapped[str] = mapped_column(String(40), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    colour_temperature_k: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    colour_temperature_label: Mapped[str] = mapped_column(String(40), nullable=False)
    bundle: Mapped[str] = mapped_column(
        String(32), nullable=False, default="solo", server_default=str_default("solo")
    )
    bundle_label: Mapped[str] = mapped_column(String(80), nullable=False)
    price_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    compare_at_price_paise: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    weight_grams: Mapped[int] = mapped_column(Integer, nullable=False)
    length_mm: Mapped[int] = mapped_column(Integer, nullable=False)
    breadth_mm: Mapped[int] = mapped_column(Integer, nullable=False)
    height_mm: Mapped[int] = mapped_column(Integer, nullable=False)
    is_default: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=FALSE_DEFAULT
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=TRUE_DEFAULT
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=int_default(0))
    archived_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    product: Mapped[Product] = relationship(back_populates="variants")
    inventory: Mapped[Inventory | None] = relationship(
        back_populates="variant", uselist=False, cascade="all, delete-orphan", passive_deletes=True
    )


class ProductImage(Base):
    __tablename__ = "product_images"
    __table_args__ = table_args(Index("ix_product_images_product_id_sort_order", "product_id", "sort_order"))

    id: Mapped[int] = pk_column()
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    variant_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True
    )
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    alt: Mapped[str] = mapped_column(String(200), nullable=False)
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    renditions: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=int_default(0))
    created_at: Mapped[datetime] = created_at_column()

    product: Mapped[Product] = relationship(back_populates="images")
