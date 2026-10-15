"""Shipping adapter (PLAN §4.1). Owner: Payments & Integrations.

Phase 2 stub: value types and the ``ShippingAdapter`` protocol are final; ``get_shipping_adapter``
raises ``NotImplementedError`` until Phase 3. Mock rules: see PLAN §4.1 ("Mock shipping rules").
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Protocol

from app.models.enums import ShipmentStatus, ShippingProvider

__all__ = [
    "BookedShipment",
    "Serviceability",
    "ShipTo",
    "ShipmentRequest",
    "ShippingAdapter",
    "TrackingEvent",
    "TrackingResult",
    "get_shipping_adapter",
]


@dataclass(frozen=True)
class Serviceability:
    pincode: str
    serviceable: bool
    cod_available: bool
    city: str | None
    state: str | None
    state_code: str | None
    eta_min_days: int | None
    eta_max_days: int | None
    courier_name: str | None


@dataclass(frozen=True)
class ShipTo:
    full_name: str
    phone: str
    line1: str
    line2: str | None
    city: str
    state: str
    pincode: str


@dataclass(frozen=True)
class ShipmentRequest:
    order_number: str
    ship_to: ShipTo
    weight_grams: int
    length_cm: int
    breadth_cm: int
    height_cm: int
    cod_amount_paise: int
    declared_value_paise: int
    items: tuple[tuple[str, str, int, int], ...]  # (sku, name, qty, unit_price_paise)
    courier_name: str | None


@dataclass(frozen=True)
class BookedShipment:
    provider: ShippingProvider
    provider_order_id: str | None
    provider_shipment_id: str | None
    awb: str
    courier_name: str
    tracking_url: str | None
    label_url: str | None
    eta_date: date | None


@dataclass(frozen=True)
class TrackingEvent:
    status: ShipmentStatus
    raw_status: str | None
    description: str | None
    location: str | None
    occurred_at: datetime


@dataclass(frozen=True)
class TrackingResult:
    awb: str
    status: ShipmentStatus
    events: tuple[TrackingEvent, ...]
    delivered_at: datetime | None


class ShippingAdapter(Protocol):
    provider: ShippingProvider

    def check_pincode(self, pincode: str, *, weight_grams: int = 1000) -> Serviceability: ...

    def create_shipment(self, request: ShipmentRequest) -> BookedShipment:
        """Raises ``BadGatewayError`` (SHIPPING_PROVIDER_ERROR) on courier failure."""
        ...

    def track(self, awb: str) -> TrackingResult: ...

    def parse_webhook(self, payload: Mapping[str, Any]) -> TrackingResult: ...


def get_shipping_adapter() -> ShippingAdapter:
    """Shiprocket when ``SHIPROCKET_EMAIL``/``SHIPROCKET_PASSWORD`` are set, else the mock adapter."""
    raise NotImplementedError
