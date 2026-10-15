"""Custom column types and column helpers shared by all models."""

from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import Dialect, Enum, text
from sqlalchemy.dialects import mysql
from sqlalchemy.types import TypeDecorator


class UTCDateTime(TypeDecorator[datetime]):
    """``DATETIME(6)`` storing naive UTC; Python side is always tz-aware UTC.

    Naive datetimes are rejected on bind — they are always a bug in this codebase.
    """

    impl = mysql.DATETIME(fsp=6)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
            raise ValueError("naive datetime bound to a UTCDateTime column; use aware UTC datetimes")
        return value.astimezone(UTC).replace(tzinfo=None)

    def process_result_value(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        return value.replace(tzinfo=UTC)


def enum_type[E: StrEnum](enum_cls: type[E], length: int) -> Enum:
    """VARCHAR(length) storing the enum *value*; no native ENUM and no DB CHECK (DB_SCHEMA §0)."""
    return Enum(
        enum_cls,
        native_enum=False,
        length=length,
        values_callable=lambda e: [m.value for m in e],
        validate_strings=True,
        create_constraint=False,
    )


# Server-side defaults (raw SQL inserts get the same values as the ORM defaults).
NOW_DEFAULT = text("CURRENT_TIMESTAMP(6)")
NOW_ON_UPDATE_DEFAULT = text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)")
JSON_ARRAY_DEFAULT = text("(JSON_ARRAY())")
TRUE_DEFAULT = text("1")
FALSE_DEFAULT = text("0")


def int_default(value: int) -> Any:
    return text(str(int(value)))


def str_default(value: str) -> Any:
    escaped = value.replace("'", "''")
    return text(f"'{escaped}'")
