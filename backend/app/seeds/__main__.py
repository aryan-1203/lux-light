"""CLI: ``python -m app.seeds [--essential|--demo|--all] [--purge-demo]``.

Default is ``--all`` outside production. In production only ``--essential`` (and ``--purge-demo``)
are allowed.
"""

from __future__ import annotations

import argparse
import logging
import sys

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.session import get_session_factory
from app.seeds import SeedError, run_seeds

logger = logging.getLogger("app.seeds")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.seeds", description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--essential", action="store_true", help="staff users, catalog, stock, promos, content"
    )
    group.add_argument("--demo", action="store_true", help="demo customers, demo orders, reviews")
    group.add_argument("--all", action="store_true", help="essential + demo (default outside production)")
    parser.add_argument("--purge-demo", action="store_true", help="remove demo customers/orders/reviews")
    args = parser.parse_args(argv)

    settings = get_settings()
    configure_logging(settings.LOG_LEVEL, json_logs=settings.log_json)

    if args.essential:
        essential_data, demo_data = True, False
    elif args.demo:
        essential_data, demo_data = False, True
    elif args.all:
        essential_data, demo_data = True, True
    elif args.purge_demo:
        essential_data, demo_data = False, False
    else:
        essential_data, demo_data = True, not settings.is_production

    if settings.is_production and demo_data:
        logger.error("demo seeds are refused in production; use --essential")
        return 2
    try:
        report = run_seeds(
            get_session_factory(),
            essential_data=essential_data,
            demo_data=demo_data,
            purge_demo=args.purge_demo,
        )
    except SeedError as exc:
        logger.error("seeding failed: %s", exc)
        return 1
    logger.info("seeds complete: %s", report.summary())
    return 0


if __name__ == "__main__":
    sys.exit(main())
