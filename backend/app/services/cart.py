"""Cart service (PLAN §1.3, §4.1). Owner: Backend Commerce.

Phase 2 stub: every function raises ``NotImplementedError`` until Phase 3.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Cart, User


def get_cart(db: Session, *, user: User | None, guest_token: str | None) -> Cart | None:
    raise NotImplementedError


def merge_guest_cart(db: Session, guest_token: str | None, user: User) -> bool:
    """Merge the guest cart into the user's cart; ``True`` if anything merged."""
    raise NotImplementedError
