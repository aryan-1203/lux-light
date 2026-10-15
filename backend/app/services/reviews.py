"""Reviews service. Owner: Backend Core.

Phase 2 stub: ``recompute_product_rating`` (frozen, used by Admin moderation) raises
``NotImplementedError``.
"""

from __future__ import annotations

from sqlalchemy.orm import Session


def recompute_product_rating(db: Session, product_id: int) -> None:
    """Lock the product row and recompute rating_count/sum/dist from approved reviews."""
    raise NotImplementedError
