"""Payment gateway adapter (PLAN §4.1, §1.6). Owner: Payments & Integrations.

Phase 2 stub: the value types and the ``PaymentGateway`` protocol are final; ``get_payment_gateway``
and ``sign_mock_payment`` raise ``NotImplementedError`` until Phase 3.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Literal, Protocol

from app.models.enums import GatewayMode

__all__ = [
    "GatewayOrder",
    "GatewayPayment",
    "GatewayRefund",
    "PaymentGateway",
    "get_payment_gateway",
    "sign_mock_payment",
]


@dataclass(frozen=True)
class GatewayOrder:
    id: str
    amount_paise: int
    currency: str
    receipt: str
    status: str


@dataclass(frozen=True)
class GatewayPayment:
    id: str
    order_id: str
    status: str
    amount_paise: int
    method: str | None
    error_code: str | None
    error_description: str | None


@dataclass(frozen=True)
class GatewayRefund:
    id: str
    payment_id: str
    amount_paise: int
    status: Literal["pending", "processed", "failed"]


class PaymentGateway(Protocol):
    mode: GatewayMode
    key_id: str

    def create_order(
        self, *, amount_paise: int, currency: str, receipt: str, notes: Mapping[str, str]
    ) -> GatewayOrder: ...

    def verify_signature(
        self, *, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str
    ) -> bool: ...

    def verify_webhook(self, *, raw_body: bytes, signature: str) -> bool: ...

    def fetch_payment(self, payment_id: str) -> GatewayPayment: ...

    def capture(self, payment_id: str, amount_paise: int) -> GatewayPayment: ...

    def fetch_order_payments(self, razorpay_order_id: str) -> list[GatewayPayment]: ...

    def refund(self, *, payment_id: str, amount_paise: int, notes: Mapping[str, str]) -> GatewayRefund: ...


def get_payment_gateway() -> PaymentGateway:
    """Resolve the gateway: ``PAYMENT_PROVIDER=mock`` → Mock; ``razorpay`` + keys → Razorpay;
    ``razorpay`` without keys → Mock (non-production) with a startup warning."""
    raise NotImplementedError


def sign_mock_payment(razorpay_order_id: str, razorpay_payment_id: str) -> str:
    """Mock only: ``HMAC_SHA256(order_id + "|" + payment_id, MOCK_PAYMENT_SECRET)``."""
    raise NotImplementedError
