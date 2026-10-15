"""Operational tables (DB_SCHEMA §8.6–8.8): notifications_log, audit_log, webhook_events."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, BigInteger, ForeignKey, Index, SmallInteger, String, UniqueConstraint
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import Mapped, mapped_column

from app.core import clock
from app.db.base import Base, created_at_column, pk_column, table_args, updated_at_column
from app.db.types import NOW_DEFAULT, UTCDateTime, enum_type, int_default, str_default
from app.models.enums import (
    NotificationChannel,
    NotificationKind,
    NotificationStatus,
    WebhookEventStatus,
    WebhookSource,
)


class NotificationLog(Base):
    __tablename__ = "notifications_log"
    __table_args__ = table_args(
        UniqueConstraint("dedupe_key"),
        Index("ix_notifications_log_status_created_at", "status", "created_at"),
        Index("ix_notifications_log_order_id", "order_id"),
        Index("ix_notifications_log_user_id", "user_id"),
    )

    id: Mapped[int] = pk_column()
    kind: Mapped[NotificationKind] = mapped_column(enum_type(NotificationKind, 40), nullable=False)
    channel: Mapped[NotificationChannel] = mapped_column(enum_type(NotificationChannel, 16), nullable=False)
    status: Mapped[NotificationStatus] = mapped_column(
        enum_type(NotificationStatus, 16),
        nullable=False,
        default=NotificationStatus.QUEUED,
        server_default=str_default(NotificationStatus.QUEUED.value),
    )
    recipient: Mapped[str] = mapped_column(String(254), nullable=False)
    order_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True
    )
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    template: Mapped[str] = mapped_column(String(64), nullable=False)
    context: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    dedupe_key: Mapped[str | None] = mapped_column(String(128), nullable=True)
    provider: Mapped[str | None] = mapped_column(String(32), nullable=True)
    provider_message_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    attempts: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=0, server_default=int_default(0)
    )
    error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()


class AuditLog(Base):
    __tablename__ = "audit_log"
    __table_args__ = table_args(
        Index("ix_audit_log_entity_type_entity_id_created_at", "entity_type", "entity_id", "created_at"),
        Index("ix_audit_log_actor_user_id_created_at", "actor_user_id", "created_at"),
        Index("ix_audit_log_action_created_at", "action", "created_at"),
        Index("ix_audit_log_created_at", "created_at"),
    )

    id: Mapped[int] = pk_column()
    actor_user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    actor_email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(40), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False)
    diff: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    ip_hash: Mapped[str | None] = mapped_column(CHAR(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = created_at_column()


class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    __table_args__ = table_args(
        UniqueConstraint("source", "event_id"),
        Index("ix_webhook_events_status_received_at", "status", "received_at"),
    )

    id: Mapped[int] = pk_column()
    source: Mapped[WebhookSource] = mapped_column(enum_type(WebhookSource, 24), nullable=False)
    event_id: Mapped[str] = mapped_column(String(128), nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[WebhookEventStatus] = mapped_column(
        enum_type(WebhookEventStatus, 16),
        nullable=False,
        default=WebhookEventStatus.RECEIVED,
        server_default=str_default(WebhookEventStatus.RECEIVED.value),
    )
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    attempts: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=1, server_default=int_default(1)
    )
    received_at: Mapped[datetime] = mapped_column(
        UTCDateTime(), nullable=False, default=clock.now_utc, server_default=NOW_DEFAULT
    )
    processed_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
