"""Order tables (DB_SCHEMA §6): orders, order_addresses, order_items, order_status_history."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import clock
from app.db.base import Base, created_at_column, pk_column, table_args, updated_at_column
from app.db.types import FALSE_DEFAULT, NOW_DEFAULT, UTCDateTime, enum_type, int_default, str_default
from app.models.enums import ActorType, AddressKind, OrderStatus, PaymentMethod, PaymentStatus

if TYPE_CHECKING:
    from app.models.invoice import Invoice
    from app.models.payment import Payment, Refund
    from app.models.shipping import Shipment

_ORDER_MONEY_COLUMNS = (
    "subtotal_paise",
    "discount_paise",
    "shipping_paise",
    "cod_fee_paise",
    "total_paise",
    "refunded_paise",
    "taxable_value_paise",
    "cgst_paise",
    "sgst_paise",
    "igst_paise",
    "tax_paise",
)
_ITEM_MONEY_COLUMNS = (
    "unit_price_paise",
    "compare_at_price_paise",
    "line_subtotal_paise",
    "discount_paise",
    "line_total_paise",
    "taxable_value_paise",
    "cgst_paise",
    "sgst_paise",
    "igst_paise",
)


def _nonneg_checks(columns: tuple[str, ...]) -> list[CheckConstraint]:
    return [CheckConstraint(f"{c} >= 0", name=f"{c}_nonneg") for c in columns]


def _money(default: int | None = None) -> Mapped[int]:
    if default is None:
        return mapped_column(BigInteger, nullable=False)
    return mapped_column(BigInteger, nullable=False, default=default, server_default=int_default(default))


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = table_args(
        UniqueConstraint("order_number"),
        UniqueConstraint("idempotency_key"),
        *_nonneg_checks(_ORDER_MONEY_COLUMNS),
        CheckConstraint(
            "total_paise = subtotal_paise - discount_paise + shipping_paise + cod_fee_paise",
            name="total_math",
        ),
        Index("ix_orders_user_id_placed_at", "user_id", "placed_at"),
        Index("ix_orders_status_placed_at", "status", "placed_at"),
        Index("ix_orders_payment_method_placed_at", "payment_method", "placed_at"),
        Index("ix_orders_payment_status_placed_at", "payment_status", "placed_at"),
        Index("ix_orders_placed_at", "placed_at"),
        Index("ix_orders_email", "email"),
        Index("ix_orders_phone", "phone"),
        Index("ix_orders_cart_id_status", "cart_id", "status"),
    )

    id: Mapped[int] = pk_column()
    order_number: Mapped[str] = mapped_column(String(20), nullable=False)
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    cart_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("carts.id", ondelete="SET NULL"), nullable=True
    )
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    phone: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        enum_type(OrderStatus, 24),
        nullable=False,
        default=OrderStatus.PENDING,
        server_default=str_default(OrderStatus.PENDING.value),
    )
    payment_method: Mapped[PaymentMethod] = mapped_column(enum_type(PaymentMethod, 16), nullable=False)
    payment_status: Mapped[PaymentStatus] = mapped_column(
        enum_type(PaymentStatus, 24),
        nullable=False,
        default=PaymentStatus.CREATED,
        server_default=str_default(PaymentStatus.CREATED.value),
    )
    currency: Mapped[str] = mapped_column(
        CHAR(3), nullable=False, default="INR", server_default=str_default("INR")
    )
    subtotal_paise: Mapped[int] = _money()
    discount_paise: Mapped[int] = _money(0)
    shipping_paise: Mapped[int] = _money(0)
    cod_fee_paise: Mapped[int] = _money(0)
    total_paise: Mapped[int] = _money()
    refunded_paise: Mapped[int] = _money(0)
    taxable_value_paise: Mapped[int] = _money()
    cgst_paise: Mapped[int] = _money(0)
    sgst_paise: Mapped[int] = _money(0)
    igst_paise: Mapped[int] = _money(0)
    tax_paise: Mapped[int] = _money()
    place_of_supply_state_code: Mapped[str] = mapped_column(CHAR(2), nullable=False)
    buyer_gstin: Mapped[str | None] = mapped_column(String(15), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    whatsapp_opt_in: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=FALSE_DEFAULT
    )
    access_token_hash: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    idempotency_key: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reservation_expires_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    placed_at: Mapped[datetime] = mapped_column(
        UTCDateTime(), nullable=False, default=clock.now_utc, server_default=NOW_DEFAULT
    )
    paid_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    packed_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    shipped_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    returned_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    refunded_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    cancel_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    items: Mapped[list[OrderItem]] = relationship(
        back_populates="order", cascade="all, delete-orphan", passive_deletes=True, order_by="OrderItem.id"
    )
    addresses: Mapped[list[OrderAddress]] = relationship(
        back_populates="order", cascade="all, delete-orphan", passive_deletes=True, order_by="OrderAddress.id"
    )
    status_history: Mapped[list[OrderStatusHistory]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="(OrderStatusHistory.created_at, OrderStatusHistory.id)",
    )
    payments: Mapped[list[Payment]] = relationship(back_populates="order", order_by="Payment.id")
    refunds: Mapped[list[Refund]] = relationship(back_populates="order", order_by="Refund.id")
    shipments: Mapped[list[Shipment]] = relationship(
        back_populates="order", passive_deletes=True, order_by="Shipment.id"
    )
    invoice: Mapped[Invoice | None] = relationship(back_populates="order", uselist=False)

    def address(self, kind: AddressKind) -> OrderAddress | None:
        return next((a for a in self.addresses if a.kind == kind), None)

    @property
    def shipping_address(self) -> OrderAddress | None:
        return self.address(AddressKind.SHIPPING)

    @property
    def billing_address(self) -> OrderAddress | None:
        return self.address(AddressKind.BILLING)


class OrderAddress(Base):
    __tablename__ = "order_addresses"
    __table_args__ = table_args(
        UniqueConstraint("order_id", "kind"),
        Index("ix_order_addresses_pincode", "pincode"),
    )

    id: Mapped[int] = pk_column()
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[AddressKind] = mapped_column(enum_type(AddressKind, 16), nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(16), nullable=False)
    line1: Mapped[str] = mapped_column(String(200), nullable=False)
    line2: Mapped[str | None] = mapped_column(String(200), nullable=True)
    landmark: Mapped[str | None] = mapped_column(String(120), nullable=True)
    city: Mapped[str] = mapped_column(String(80), nullable=False)
    state: Mapped[str] = mapped_column(String(60), nullable=False)
    state_code: Mapped[str] = mapped_column(CHAR(2), nullable=False)
    pincode: Mapped[str] = mapped_column(CHAR(6), nullable=False)
    country: Mapped[str] = mapped_column(
        CHAR(2), nullable=False, default="IN", server_default=str_default("IN")
    )

    order: Mapped[Order] = relationship(back_populates="addresses")


class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = table_args(
        CheckConstraint("quantity > 0", name="quantity_positive"),
        *_nonneg_checks(_ITEM_MONEY_COLUMNS),
        Index("ix_order_items_order_id", "order_id"),
        Index("ix_order_items_variant_id", "variant_id"),
        Index("ix_order_items_product_id", "product_id"),
    )

    id: Mapped[int] = pk_column()
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    variant_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True
    )
    product_slug: Mapped[str] = mapped_column(String(120), nullable=False)
    product_name: Mapped[str] = mapped_column(String(160), nullable=False)
    variant_name: Mapped[str] = mapped_column(String(160), nullable=False)
    sku: Mapped[str] = mapped_column(String(40), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    hsn_code: Mapped[str] = mapped_column(String(8), nullable=False)
    gst_rate_percent: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_paise: Mapped[int] = _money()
    compare_at_price_paise: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    line_subtotal_paise: Mapped[int] = _money()
    discount_paise: Mapped[int] = _money(0)
    line_total_paise: Mapped[int] = _money()
    taxable_value_paise: Mapped[int] = _money()
    cgst_paise: Mapped[int] = _money(0)
    sgst_paise: Mapped[int] = _money(0)
    igst_paise: Mapped[int] = _money(0)

    order: Mapped[Order] = relationship(back_populates="items")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    __table_args__ = table_args(
        Index("ix_order_status_history_order_id_created_at", "order_id", "created_at")
    )

    id: Mapped[int] = pk_column()
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    from_status: Mapped[OrderStatus | None] = mapped_column(enum_type(OrderStatus, 24), nullable=True)
    to_status: Mapped[OrderStatus] = mapped_column(enum_type(OrderStatus, 24), nullable=False)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    actor_type: Mapped[ActorType] = mapped_column(enum_type(ActorType, 16), nullable=False)
    actor_user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = created_at_column()

    order: Mapped[Order] = relationship(back_populates="status_history")
