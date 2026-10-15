"""Notifications outbox (PLAN §1.9, §4.1). Owner: Payments & Integrations.

Phase 2 stub: every function raises ``NotImplementedError`` until Phase 3.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from typing import Any

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.models import NotificationLog, Order, User
from app.models.enums import NotificationKind


def notify(
    db: Session,
    kind: NotificationKind,
    *,
    order: Order | None = None,
    user: User | None = None,
    email: str | None = None,
    context: Mapping[str, Any] | None = None,
    background_tasks: BackgroundTasks | None = None,
) -> list[NotificationLog]:
    """Insert queued ``notifications_log`` rows (deduped) and schedule ``dispatch`` when possible.

    Email always (recipient = email or order.email or user.email); WhatsApp for ``order_*`` kinds when
    ``order.whatsapp_opt_in``; dedupe_key ``"<kind>:<channel>:<order_id|user_id|email-hash>[:<refund_id>]"``.
    """
    raise NotImplementedError


def dispatch(log_id: int) -> None:
    """Send one queued notification (opens its own session)."""
    raise NotImplementedError


def dispatch_pending(session_factory: Callable[[], Session], *, limit: int = 50) -> int:
    raise NotImplementedError
