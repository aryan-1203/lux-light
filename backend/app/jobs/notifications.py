"""Dispatch queued/failed notifications from the outbox (every 30 s, PLAN §1.9)."""

from __future__ import annotations

from app.db.session import get_session_factory
from app.services import notifications as notifications_service


def run() -> int:
    return notifications_service.dispatch_pending(get_session_factory())
