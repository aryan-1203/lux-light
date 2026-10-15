"""Promo redemption service (DB_SCHEMA §5.7, PLAN §4.1). Owner: Backend Commerce.

Phase 2 stub: every function raises ``NotImplementedError`` until Phase 3.
"""

from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy.orm import Session

from app.models import Order, PromoRedemption


def reserve_redemptions(db: Session, order: Order, promo_ids: Sequence[int]) -> list[PromoRedemption]:
    """Lock promo rows (id ASC), re-evaluate rules, insert reserved redemptions; raises ``PromoError``."""
    raise NotImplementedError


def redeem_for_order(db: Session, order: Order) -> None:
    """reserved → redeemed."""
    raise NotImplementedError


def release_redemptions(db: Session, order: Order) -> None:
    """→ released, ``times_redeemed − 1``."""
    raise NotImplementedError


def restore_redemptions(db: Session, order: Order) -> None:
    """Late revive: released → redeemed without re-validation."""
    raise NotImplementedError
