"""Inventory service (DB_SCHEMA §9, PLAN §4.1). Owner: Backend Commerce.

Phase 2 stub: ``stock_status`` is implemented by Foundation (pure); everything else raises
``NotImplementedError`` until Phase 3. Lock order: orders → promo_codes → inventory (variant_id ASC).
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import timedelta
from typing import Literal

from sqlalchemy.orm import Session

from app.models import Order, StockMovement, StockReservation
from app.models.enums import StockMovementReason, StockStatus


def stock_status(available: int, low_stock_threshold: int) -> StockStatus:
    """Public stock indicator: ``available <= 0`` → out_of_stock; ``<= threshold`` → low_stock."""
    if available <= 0:
        return StockStatus.OUT_OF_STOCK
    if available <= low_stock_threshold:
        return StockStatus.LOW_STOCK
    return StockStatus.IN_STOCK


def stock_status_for_variants(db: Session, variant_ids: Sequence[int]) -> dict[int, StockStatus]:
    raise NotImplementedError


def reserve_for_order(db: Session, order: Order, *, ttl: timedelta | None = None) -> list[StockReservation]:
    raise NotImplementedError


def commit_reservation(db: Session, order: Order) -> None:
    """Commit active (or late, still-available) reservations; raises ``InsufficientStock`` (late pay)."""
    raise NotImplementedError


def release_reservation(
    db: Session, order: Order, *, reason: Literal["released", "expired"] = "released"
) -> None:
    raise NotImplementedError


def restock_order(
    db: Session, order: Order, *, reason: StockMovementReason, actor_user_id: int | None
) -> list[StockMovement]:
    """Return committed stock to on_hand; idempotent per order."""
    raise NotImplementedError


def apply_movement(
    db: Session,
    variant_id: int,
    delta: int,
    reason: StockMovementReason,
    *,
    reference_type: str | None = None,
    reference_id: int | None = None,
    note: str | None = None,
    actor_user_id: int | None = None,
) -> StockMovement:
    """Single locked on_hand change; 409 ``STOCK_NEGATIVE`` when ``on_hand + delta < reserved``."""
    raise NotImplementedError


def adjust_stock(
    db: Session,
    variant_id: int,
    delta: int,
    reason: StockMovementReason,
    *,
    note: str | None,
    actor_user_id: int,
) -> StockMovement:
    """Admin manual adjustment; 422 ``ADJUSTMENT_REASON_INVALID`` for system reasons."""
    raise NotImplementedError
