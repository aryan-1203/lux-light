"""Shipping service (PLAN §4.1). Owner: Payments & Integrations.

Phase 2 stub: every function raises ``NotImplementedError`` until Phase 3.
"""

from __future__ import annotations

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.adapters.shipping import Serviceability, TrackingResult
from app.models import Order, Shipment, ShipmentEvent
from app.schemas.admin_orders import ShipmentCreate
from app.schemas.shipping import PincodeServiceability


def check_pincode(pincode: str) -> PincodeServiceability:
    """Public serviceability (10-minute cache)."""
    raise NotImplementedError


def assert_serviceable(pincode: str, *, cod: bool) -> Serviceability:
    """422 ``PINCODE_NOT_SERVICEABLE`` / ``COD_NOT_AVAILABLE``."""
    raise NotImplementedError


def create_shipment(
    db: Session,
    order: Order,
    data: ShipmentCreate | None,
    *,
    actor_user_id: int | None,
    background_tasks: BackgroundTasks | None = None,
) -> Shipment:
    """Book a shipment (moves the order to ``packed`` if needed)."""
    raise NotImplementedError


def sync_shipment(
    db: Session, shipment: Shipment, *, background_tasks: BackgroundTasks | None = None
) -> Shipment:
    raise NotImplementedError


def apply_tracking(
    db: Session,
    shipment: Shipment,
    result: TrackingResult,
    *,
    background_tasks: BackgroundTasks | None = None,
) -> list[ShipmentEvent]:
    """Courier → order: picked_up/in_transit ⇒ shipped; out_for_delivery ⇒ out_for_delivery;
    delivered ⇒ delivered; rto_delivered ⇒ returned; others ⇒ no order change."""
    raise NotImplementedError
