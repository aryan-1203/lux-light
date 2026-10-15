"""API schemas for the `catalog` area (docs/openapi.yaml `x-py-module: app.schemas.catalog`).

Phase 2 stub created by Backend Foundation; the owning agent (Backend Core) defines the classes.
``ProductCard`` exists as a placeholder only because the frozen signature
``services.catalog.build_product_cards`` references it — replace its body with the contract fields.
"""

from __future__ import annotations

from app.schemas.common import ApiModel


class ProductCard(ApiModel):
    """Placeholder — owner replaces with the contract `ProductCard` schema."""
