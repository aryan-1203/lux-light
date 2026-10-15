"""Promotion tables (DB_SCHEMA §5.4–5.6): promo_codes, restrictions, promo_redemptions."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Table,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import TABLE_KWARGS, Base, created_at_column, pk_column, table_args, updated_at_column
from app.db.types import FALSE_DEFAULT, TRUE_DEFAULT, UTCDateTime, enum_type, int_default, str_default
from app.models.enums import DiscountType, RedemptionStatus

if TYPE_CHECKING:
    from app.models.catalog import Category, Product

promo_code_products = Table(
    "promo_code_products",
    Base.metadata,
    Column("promo_id", BigInteger, ForeignKey("promo_codes.id", ondelete="CASCADE"), primary_key=True),
    Column("product_id", BigInteger, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Index("ix_promo_code_products_product_id", "product_id"),
    **TABLE_KWARGS,
)

promo_code_categories = Table(
    "promo_code_categories",
    Base.metadata,
    Column("promo_id", BigInteger, ForeignKey("promo_codes.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", BigInteger, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
    Index("ix_promo_code_categories_category_id", "category_id"),
    **TABLE_KWARGS,
)


class PromoCode(Base):
    __tablename__ = "promo_codes"
    __table_args__ = table_args(
        UniqueConstraint("code"),
        CheckConstraint("times_redeemed >= 0", name="times_redeemed_nonneg"),
        CheckConstraint("percent_off BETWEEN 1 AND 100", name="percent_off_range"),
        CheckConstraint("amount_off_paise >= 0", name="amount_off_paise_nonneg"),
        CheckConstraint("max_discount_paise >= 0", name="max_discount_paise_nonneg"),
        CheckConstraint("min_order_paise >= 0", name="min_order_paise_nonneg"),
        Index("ix_promo_codes_is_active_ends_at", "is_active", "ends_at"),
    )

    id: Mapped[int] = pk_column()
    code: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    discount_type: Mapped[DiscountType] = mapped_column(enum_type(DiscountType, 16), nullable=False)
    percent_off: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    amount_off_paise: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    max_discount_paise: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    min_order_paise: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=int_default(0)
    )
    usage_limit_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    usage_limit_per_user: Mapped[int | None] = mapped_column(Integer, nullable=True)
    times_redeemed: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=int_default(0)
    )
    starts_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    first_order_only: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=FALSE_DEFAULT
    )
    stackable: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=FALSE_DEFAULT
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=TRUE_DEFAULT
    )
    created_by_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    products: Mapped[list[Product]] = relationship(secondary=promo_code_products, order_by="Product.id")
    categories: Mapped[list[Category]] = relationship(secondary=promo_code_categories, order_by="Category.id")


class PromoRedemption(Base):
    __tablename__ = "promo_redemptions"
    __table_args__ = table_args(
        UniqueConstraint("promo_id", "order_id"),
        CheckConstraint("discount_paise >= 0", name="discount_paise_nonneg"),
        Index("ix_promo_redemptions_promo_id_user_id_status", "promo_id", "user_id", "status"),
        Index("ix_promo_redemptions_promo_id_email_status", "promo_id", "email", "status"),
    )

    id: Mapped[int] = pk_column()
    promo_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("promo_codes.id", ondelete="RESTRICT"), nullable=False
    )
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    discount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    status: Mapped[RedemptionStatus] = mapped_column(
        enum_type(RedemptionStatus, 16),
        nullable=False,
        default=RedemptionStatus.RESERVED,
        server_default=str_default(RedemptionStatus.RESERVED.value),
    )
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    promo: Mapped[PromoCode] = relationship()
