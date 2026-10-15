"""Demo orders (DB_SCHEMA §10.2 "Orders"). Owner: Backend Commerce.

Phase 2 stub: no-op returning 0. The owner builds the six demo orders on top of the real checkout /
payment services and makes both functions idempotent.
"""

from __future__ import annotations

from sqlalchemy.orm import Session


def run(db: Session) -> int:
    """Create the demo orders (idempotent); returns the number of orders created."""
    return 0


def purge(db: Session) -> int:
    """Remove demo orders before launch (``--purge-demo``); returns the number of orders removed."""
    return 0
