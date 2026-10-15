"""Expire stale stock reservations / unpaid online orders (every 60 s, DB_SCHEMA §9)."""

from __future__ import annotations

from app.db.session import get_session_factory
from app.services import orders as orders_service


def run() -> int:
    return orders_service.expire_stale_orders(get_session_factory())
