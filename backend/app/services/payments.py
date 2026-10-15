"""Payments service (PLAN §1.4–1.7, §4.1). Owner: Payments & Integrations.

Phase 2 stub: every function raises ``NotImplementedError`` until Phase 3.
"""

from __future__ import annotations

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.models import Order, Payment, Refund
from app.schemas.checkout import RazorpayCheckoutPayload


def create_gateway_payment(db: Session, order: Order) -> RazorpayCheckoutPayload:
    """Payments row ``created`` + gateway order; 502 ``PAYMENT_GATEWAY_ERROR``."""
    raise NotImplementedError


def create_cod_payment(db: Session, order: Order) -> Payment:
    raise NotImplementedError


def checkout_payload_for(db: Session, order: Order) -> RazorpayCheckoutPayload:
    """Payload for retrying the same gateway order."""
    raise NotImplementedError


def capture_cod_payment(db: Session, order: Order) -> Payment:
    raise NotImplementedError


def reconcile_gateway_order(
    db: Session, order: Order, *, background_tasks: BackgroundTasks | None = None
) -> bool:
    """Fetch gateway payments for the order; ``mark_paid`` when one was captured. True if paid."""
    raise NotImplementedError


def create_refund(
    db: Session,
    order: Order,
    *,
    amount_paise: int | None,
    reason: str,
    restock: bool,
    actor_user_id: int | None,
    background_tasks: BackgroundTasks | None = None,
) -> Refund:
    raise NotImplementedError
