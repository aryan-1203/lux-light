"""Catalog service. Owner: Backend Core.

Phase 2 stub: ``build_product_cards`` (frozen, used by quiz/related) raises ``NotImplementedError``.
"""

from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy.orm import Session

from app.models import Product
from app.schemas.catalog import ProductCard


def build_product_cards(db: Session, products: Sequence[Product]) -> list[ProductCard]:
    raise NotImplementedError
