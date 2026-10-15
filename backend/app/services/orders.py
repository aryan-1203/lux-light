"""Order service (PLAN §1.6–1.7, §4.1). Owner: Backend Commerce.

Phase 2 stub: ``ALLOWED_TRANSITIONS`` (the §1.7 state machine) and ``PAYMENT_WINDOW_EXPIRED`` are
implemented by Foundation; every function raises ``NotImplementedError`` until Phase 3.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from datetime import datetime
from types import MappingProxyType
from typing import Final

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.models import Order, OrderStatusHistory, Payment, User
from app.models.enums import ActorType, OrderStatus
from app.schemas.orders import OrderDetail, OrderTracking

_S = OrderStatus

#: Single source of truth for allowed order status transitions (PLAN §1.7). Actor rules and
#: preconditions are enforced by ``transition_status``.
ALLOWED_TRANSITIONS: Final[Mapping[OrderStatus, frozenset[OrderStatus]]] = MappingProxyType(
    {
        _S.PENDING: frozenset({_S.PAID, _S.PACKED, _S.CANCELLED}),
        _S.PAID: frozenset({_S.PACKED, _S.CANCELLED}),
        _S.PACKED: frozenset({_S.SHIPPED, _S.CANCELLED}),
        _S.SHIPPED: frozenset({_S.OUT_FOR_DELIVERY, _S.DELIVERED, _S.RETURNED}),
        _S.OUT_FOR_DELIVERY: frozenset({_S.DELIVERED, _S.RETURNED}),
        _S.DELIVERED: frozenset({_S.RETURNED, _S.REFUNDED}),
        _S.RETURNED: frozenset({_S.REFUNDED}),
        _S.CANCELLED: frozenset({_S.PAID}),  # system revive after late capture only
        _S.REFUNDED: frozenset(),
    }
)

PAYMENT_WINDOW_EXPIRED: Final = "payment_window_expired"


def get_order_for_update(db: Session, order_id: int) -> Order:
    """``SELECT … FOR UPDATE``; 404 ``ORDER_NOT_FOUND``."""
    raise NotImplementedError


def get_order_by_number_for_update(db: Session, order_number: str) -> Order:
    raise NotImplementedError


def transition_status(
    db: Session,
    order: Order,
    new_status: OrderStatus,
    *,
    note: str | None,
    actor_user_id: int | None,
    actor_type: ActorType = ActorType.SYSTEM,
    notify_customer: bool = True,
    background_tasks: BackgroundTasks | None = None,
) -> OrderStatusHistory:
    """Enforce the §1.7 table incl. actor rules, set ``*_at`` columns, write history, run side effects."""
    raise NotImplementedError


def mark_paid(db: Session, order: Order, payment: Payment, background_tasks: BackgroundTasks | None) -> Order:
    """Idempotent; late-capture handling per PLAN §1.6."""
    raise NotImplementedError


def cancel_order(
    db: Session,
    order: Order,
    *,
    reason: str,
    actor_type: ActorType,
    actor_user_id: int | None,
    background_tasks: BackgroundTasks | None = None,
) -> Order:
    raise NotImplementedError


def handle_full_refund(
    db: Session,
    order: Order,
    *,
    actor_type: ActorType,
    actor_user_id: int | None,
    background_tasks: BackgroundTasks | None = None,
) -> None:
    raise NotImplementedError


def clear_cart_after_order(db: Session, order: Order) -> None:
    raise NotImplementedError


def expire_stale_orders(session_factory: Callable[[], Session], *, now: datetime | None = None) -> int:
    """Expiry job body (DB_SCHEMA §9); returns the number of orders cancelled/reconciled."""
    raise NotImplementedError


def verify_order_access(db: Session, order_number: str, *, user: User | None, token: str | None) -> Order:
    raise NotImplementedError


def build_order_detail(db: Session, order: Order) -> OrderDetail:
    raise NotImplementedError


def build_order_tracking(db: Session, order: Order) -> OrderTracking:
    raise NotImplementedError
