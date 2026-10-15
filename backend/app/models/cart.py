"""Cart tables (DB_SCHEMA §5.1–5.3): carts, cart_items, cart_promos."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import clock
from app.db.base import Base, created_at_column, pk_column, table_args, updated_at_column
from app.db.types import FALSE_DEFAULT, NOW_DEFAULT, UTCDateTime, int_default

if TYPE_CHECKING:
    from app.models.catalog import ProductVariant
    from app.models.promo import PromoCode
    from app.models.user import User


class Cart(Base):
    __tablename__ = "carts"
    __table_args__ = table_args(
        UniqueConstraint("token"),
        UniqueConstraint("user_id"),
        Index("ix_carts_last_activity_at", "last_activity_at"),
    )

    id: Mapped[int] = pk_column()
    token: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    marketing_opt_in: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=FALSE_DEFAULT
    )
    last_activity_at: Mapped[datetime] = mapped_column(
        UTCDateTime(), nullable=False, default=clock.now_utc, server_default=NOW_DEFAULT
    )
    abandoned_email_sent_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    user: Mapped[User | None] = relationship(back_populates="cart")
    items: Mapped[list[CartItem]] = relationship(
        back_populates="cart", cascade="all, delete-orphan", passive_deletes=True, order_by="CartItem.id"
    )
    promos: Mapped[list[CartPromo]] = relationship(
        back_populates="cart",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="(CartPromo.applied_at, CartPromo.id)",
    )


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = table_args(
        UniqueConstraint("cart_id", "variant_id"),
        CheckConstraint("quantity BETWEEN 1 AND 5", name="quantity_range"),
        CheckConstraint("added_price_paise >= 0", name="added_price_paise_nonneg"),
    )

    id: Mapped[int] = pk_column()
    cart_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False
    )
    variant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=1, server_default=int_default(1)
    )
    added_price_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    cart: Mapped[Cart] = relationship(back_populates="items")
    variant: Mapped[ProductVariant] = relationship()


class CartPromo(Base):
    __tablename__ = "cart_promos"
    __table_args__ = table_args(UniqueConstraint("cart_id", "promo_id"))

    id: Mapped[int] = pk_column()
    cart_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False
    )
    promo_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("promo_codes.id", ondelete="CASCADE"), nullable=False
    )
    applied_at: Mapped[datetime] = mapped_column(
        UTCDateTime(), nullable=False, default=clock.now_utc, server_default=NOW_DEFAULT
    )

    cart: Mapped[Cart] = relationship(back_populates="promos")
    promo: Mapped[PromoCode] = relationship()
