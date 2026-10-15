"""Database seeds: ``python -m app.seeds [--essential|--demo|--all] [--purge-demo]`` (DB_SCHEMA §10)."""

from __future__ import annotations

from collections.abc import Callable

from sqlalchemy.orm import Session

from app.seeds import demo, essential
from app.seeds.essential import SeedError, SeedReport

__all__ = ["SeedError", "SeedReport", "run_seeds"]


def run_seeds(
    session_factory: Callable[[], Session],
    *,
    essential_data: bool = True,
    demo_data: bool = False,
    purge_demo: bool = False,
) -> SeedReport:
    """Run the requested seed groups in one transaction (committed at the end)."""
    report = SeedReport()
    db = session_factory()
    try:
        if purge_demo:
            demo.purge(db, report)
        if essential_data:
            essential.run(db, report)
        if demo_data:
            demo.run(db, report)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
    return report
