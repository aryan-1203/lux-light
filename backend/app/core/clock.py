"""Time helpers. All datetimes in Python are timezone-aware UTC; IST only for business dates."""

from __future__ import annotations

from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")


def now_utc() -> datetime:
    """Current time, tz-aware UTC (tests freeze it with time-machine)."""
    return datetime.now(UTC)


def ensure_utc(dt: datetime) -> datetime:
    """Return ``dt`` as aware UTC. Naive values are rejected (they are always a bug here)."""
    if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
        raise ValueError("naive datetime; use timezone-aware UTC datetimes")
    return dt.astimezone(UTC)


def to_ist(dt: datetime) -> datetime:
    return ensure_utc(dt).astimezone(IST)


def ist_today() -> date:
    return to_ist(now_utc()).date()


def financial_year(dt: datetime) -> str:
    """Indian financial year (Apr–Mar, IST) e.g. ``"2026-27"``."""
    local = to_ist(dt)
    start = local.year if local.month >= 4 else local.year - 1
    return f"{start}-{(start + 1) % 100:02d}"
