"""Purchasing tables (DB_SCHEMA §4.4–4.6): suppliers, purchase_batches, purchase_batch_items."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, created_at_column, pk_column, table_args, updated_at_column
from app.db.types import TRUE_DEFAULT, UTCDateTime, enum_type, int_default, str_default
from app.models.enums import PurchaseBatchStatus


class Supplier(Base):
    __tablename__ = "suppliers"
    __table_args__ = table_args(UniqueConstraint("name"))

    id: Mapped[int] = pk_column()
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    contact_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    country: Mapped[str] = mapped_column(
        CHAR(2), nullable=False, default="CN", server_default=str_default("CN")
    )
    city: Mapped[str | None] = mapped_column(String(80), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=TRUE_DEFAULT
    )
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    batches: Mapped[list[PurchaseBatch]] = relationship(back_populates="supplier")


class PurchaseBatch(Base):
    __tablename__ = "purchase_batches"
    __table_args__ = table_args(
        UniqueConstraint("reference"),
        CheckConstraint("shipping_paise >= 0", name="shipping_paise_nonneg"),
        CheckConstraint("duty_paise >= 0", name="duty_paise_nonneg"),
        CheckConstraint("other_charges_paise >= 0", name="other_charges_paise_nonneg"),
        CheckConstraint("gst_paise >= 0", name="gst_paise_nonneg"),
        Index("ix_purchase_batches_supplier_id_created_at", "supplier_id", "created_at"),
        Index("ix_purchase_batches_status_created_at", "status", "created_at"),
    )

    id: Mapped[int] = pk_column()
    supplier_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False
    )
    reference: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[PurchaseBatchStatus] = mapped_column(
        enum_type(PurchaseBatchStatus, 16),
        nullable=False,
        default=PurchaseBatchStatus.DRAFT,
        server_default=str_default(PurchaseBatchStatus.DRAFT.value),
    )
    ordered_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    received_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    shipping_paise: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=int_default(0)
    )
    duty_paise: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=int_default(0)
    )
    other_charges_paise: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=int_default(0)
    )
    gst_paise: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=int_default(0)
    )
    gst_claimable: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=TRUE_DEFAULT
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    supplier: Mapped[Supplier] = relationship(back_populates="batches")
    items: Mapped[list[PurchaseBatchItem]] = relationship(
        back_populates="batch",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="PurchaseBatchItem.id",
    )


class PurchaseBatchItem(Base):
    __tablename__ = "purchase_batch_items"
    __table_args__ = table_args(
        UniqueConstraint("batch_id", "variant_id"),
        CheckConstraint("quantity > 0", name="quantity_positive"),
        CheckConstraint("unit_cost_paise >= 0", name="unit_cost_paise_nonneg"),
        CheckConstraint("allocated_shipping_paise >= 0", name="allocated_shipping_paise_nonneg"),
        CheckConstraint("allocated_duty_paise >= 0", name="allocated_duty_paise_nonneg"),
        CheckConstraint("allocated_other_paise >= 0", name="allocated_other_paise_nonneg"),
        CheckConstraint("allocated_gst_paise >= 0", name="allocated_gst_paise_nonneg"),
        CheckConstraint("landed_unit_cost_paise >= 0", name="landed_unit_cost_paise_nonneg"),
        Index("ix_purchase_batch_items_variant_id", "variant_id"),
    )

    id: Mapped[int] = pk_column()
    batch_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("purchase_batches.id", ondelete="CASCADE"), nullable=False
    )
    variant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("product_variants.id", ondelete="RESTRICT"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_cost_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    allocated_shipping_paise: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=int_default(0)
    )
    allocated_duty_paise: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=int_default(0)
    )
    allocated_other_paise: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=int_default(0)
    )
    allocated_gst_paise: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=int_default(0)
    )
    landed_unit_cost_paise: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=int_default(0)
    )

    batch: Mapped[PurchaseBatch] = relationship(back_populates="items")
