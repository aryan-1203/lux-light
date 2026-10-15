"""Inventory tables (DB_SCHEMA §4.1–4.3): inventory, stock_reservations, stock_movements."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import clock
from app.db.base import Base, created_at_column, pk_column, table_args
from app.db.types import NOW_ON_UPDATE_DEFAULT, UTCDateTime, enum_type, int_default, str_default
from app.models.enums import ReservationStatus, StockMovementReason

if TYPE_CHECKING:
    from app.models.catalog import ProductVariant


class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = table_args(
        CheckConstraint("on_hand >= 0", name="on_hand_nonneg"),
        CheckConstraint("reserved >= 0", name="reserved_nonneg"),
        CheckConstraint("reserved <= on_hand", name="reserved_le_on_hand"),
    )

    variant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        primary_key=True,
        autoincrement=False,
    )
    on_hand: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=int_default(0))
    reserved: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=int_default(0))
    low_stock_threshold: Mapped[int] = mapped_column(
        Integer, nullable=False, default=10, server_default=int_default(10)
    )
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime(),
        nullable=False,
        default=clock.now_utc,
        onupdate=clock.now_utc,
        server_default=NOW_ON_UPDATE_DEFAULT,
    )

    variant: Mapped[ProductVariant] = relationship(back_populates="inventory")

    @property
    def available(self) -> int:
        return self.on_hand - self.reserved


class StockReservation(Base):
    __tablename__ = "stock_reservations"
    __table_args__ = table_args(
        UniqueConstraint("order_id", "variant_id"),
        CheckConstraint("quantity > 0", name="quantity_positive"),
        Index("ix_stock_reservations_status_expires_at", "status", "expires_at"),
        Index("ix_stock_reservations_variant_id_status", "variant_id", "status"),
    )

    id: Mapped[int] = pk_column()
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    variant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("product_variants.id", ondelete="RESTRICT"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[ReservationStatus] = mapped_column(
        enum_type(ReservationStatus, 16),
        nullable=False,
        default=ReservationStatus.ACTIVE,
        server_default=str_default(ReservationStatus.ACTIVE.value),
    )
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = created_at_column()


class StockMovement(Base):
    __tablename__ = "stock_movements"
    __table_args__ = table_args(
        CheckConstraint("delta <> 0", name="delta_nonzero"),
        Index("ix_stock_movements_variant_id_created_at", "variant_id", "created_at"),
        Index("ix_stock_movements_reason_created_at", "reason", "created_at"),
        Index("ix_stock_movements_reference_type_reference_id", "reference_type", "reference_id"),
    )

    id: Mapped[int] = pk_column()
    variant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("product_variants.id", ondelete="RESTRICT"), nullable=False
    )
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    on_hand_after: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[StockMovementReason] = mapped_column(enum_type(StockMovementReason, 32), nullable=False)
    reference_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    reference_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    actor_user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = created_at_column()
