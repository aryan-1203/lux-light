"""Shipping tables (DB_SCHEMA §7.3–7.4): shipments, shipment_events."""

from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Date, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, created_at_column, pk_column, table_args, updated_at_column
from app.db.types import UTCDateTime, enum_type, str_default
from app.models.enums import ShipmentStatus, ShippingProvider

if TYPE_CHECKING:
    from app.models.order import Order

#: Shipment statuses after which the sync job stops polling the courier.
TERMINAL_SHIPMENT_STATUSES: frozenset[ShipmentStatus] = frozenset(
    {ShipmentStatus.DELIVERED, ShipmentStatus.RTO_DELIVERED, ShipmentStatus.CANCELLED}
)


class Shipment(Base):
    __tablename__ = "shipments"
    __table_args__ = table_args(
        UniqueConstraint("awb"),
        Index("ix_shipments_order_id", "order_id"),
        Index("ix_shipments_status_updated_at", "status", "updated_at"),
    )

    id: Mapped[int] = pk_column()
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    provider: Mapped[ShippingProvider] = mapped_column(enum_type(ShippingProvider, 16), nullable=False)
    provider_order_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    provider_shipment_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    awb: Mapped[str | None] = mapped_column(String(40), nullable=True)
    courier_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    status: Mapped[ShipmentStatus] = mapped_column(
        enum_type(ShipmentStatus, 24),
        nullable=False,
        default=ShipmentStatus.CREATED,
        server_default=str_default(ShipmentStatus.CREATED.value),
    )
    tracking_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    label_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    weight_grams: Mapped[int] = mapped_column(Integer, nullable=False)
    length_cm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    breadth_cm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height_cm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    eta_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    shipped_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    order: Mapped[Order] = relationship(back_populates="shipments")
    events: Mapped[list[ShipmentEvent]] = relationship(
        back_populates="shipment",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="(ShipmentEvent.occurred_at, ShipmentEvent.id)",
    )


class ShipmentEvent(Base):
    __tablename__ = "shipment_events"
    __table_args__ = table_args(
        UniqueConstraint("shipment_id", "occurred_at", "status"),
        Index("ix_shipment_events_shipment_id_occurred_at", "shipment_id", "occurred_at"),
    )

    id: Mapped[int] = pk_column()
    shipment_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[ShipmentStatus] = mapped_column(enum_type(ShipmentStatus, 24), nullable=False)
    raw_status: Mapped[str | None] = mapped_column(String(80), nullable=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    created_at: Mapped[datetime] = created_at_column()

    shipment: Mapped[Shipment] = relationship(back_populates="events")
