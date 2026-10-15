"""API schemas for the `orders` area (docs/openapi.yaml `x-py-module: app.schemas.orders`).

Phase 2 stub created by Backend Foundation; the owning agent (Backend Commerce) defines the classes.
``OrderDetail`` / ``OrderTracking`` exist as placeholders only because frozen service signatures
(``services.orders.build_order_detail`` / ``build_order_tracking``) reference them.
"""

from __future__ import annotations

from app.schemas.common import ApiModel


class OrderDetail(ApiModel):
    """Placeholder — owner replaces with the contract `OrderDetail` schema."""


class OrderTracking(ApiModel):
    """Placeholder — owner replaces with the contract `OrderTracking` schema."""
