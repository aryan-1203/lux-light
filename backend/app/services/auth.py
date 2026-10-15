"""Auth service (PLAN §1.3). Owner: Backend Core.

Phase 2 stub: ``revoke_all_refresh_tokens`` (frozen, used by Admin) raises ``NotImplementedError``.
"""

from __future__ import annotations

from sqlalchemy.orm import Session


def revoke_all_refresh_tokens(db: Session, user_id: int) -> int:
    """Revoke every active refresh token of the user (admin block, password change); returns count."""
    raise NotImplementedError
