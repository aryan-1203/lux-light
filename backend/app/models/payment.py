"""Payment tables (DB_SCHEMA §7.1–7.2): payments, refunds."""

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
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, created_at_column, pk_column, table_args, updated_at_column
from app.db.types import FALSE_DEFAULT, UTCDateTime, enum_type, int_default, str_default
from app.models.enums import PaymentProvider, PaymentStatus, RefundMethod, RefundStatus

if TYPE_CHECKING:
    from app.models.order import Order


class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = table_args(
        UniqueConstraint("razorpay_order_id"),
        UniqueConstraint("razorpay_payment_id"),
        CheckConstraint("amount_paise >= 0", name="amount_paise_nonneg"),
        CheckConstraint("amount_refunded_paise >= 0", name="amount_refunded_paise_nonneg"),
        Index("ix_payments_order_id_created_at", "order_id", "created_at"),
        Index("ix_payments_status_created_at", "status", "created_at"),
    )

    id: Mapped[int] = pk_column()
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False
    )
    provider: Mapped[PaymentProvider] = mapped_column(enum_type(PaymentProvider, 16), nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        enum_type(PaymentStatus, 24),
        nullable=False,
        default=PaymentStatus.CREATED,
        server_default=str_default(PaymentStatus.CREATED.value),
    )
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    amount_refunded_paise: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default=int_default(0)
    )
    currency: Mapped[str] = mapped_column(
        CHAR(3), nullable=False, default="INR", server_default=str_default("INR")
    )
    method_detail: Mapped[str | None] = mapped_column(String(32), nullable=True)
    razorpay_order_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    razorpay_signature: Mapped[str | None] = mapped_column(String(128), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=int_default(0))
    captured_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    failed_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    gateway_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    order: Mapped[Order] = relationship(back_populates="payments")


class Refund(Base):
    __tablename__ = "refunds"
    __table_args__ = table_args(
        UniqueConstraint("provider_refund_id"),
        CheckConstraint("amount_paise > 0", name="amount_paise_positive"),
        Index("ix_refunds_order_id", "order_id"),
        Index("ix_refunds_status_created_at", "status", "created_at"),
        Index("ix_refunds_processed_at", "processed_at"),
    )

    id: Mapped[int] = pk_column()
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False
    )
    payment_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("payments.id", ondelete="RESTRICT"), nullable=True
    )
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[RefundStatus] = mapped_column(
        enum_type(RefundStatus, 16),
        nullable=False,
        default=RefundStatus.PENDING,
        server_default=str_default(RefundStatus.PENDING.value),
    )
    method: Mapped[RefundMethod] = mapped_column(enum_type(RefundMethod, 16), nullable=False)
    provider_refund_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    restock: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=FALSE_DEFAULT
    )
    failure_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_by_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    processed_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    order: Mapped[Order] = relationship(back_populates="refunds")
    payment: Mapped[Payment | None] = relationship()
