"""Declarative base with the project-wide constraint naming convention (DB_SCHEMA §0)."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, MetaData
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core import clock
from app.db.types import NOW_DEFAULT, NOW_ON_UPDATE_DEFAULT, UTCDateTime

NAMING_CONVENTION: dict[str, str] = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

TABLE_KWARGS: dict[str, Any] = {
    "mysql_engine": "InnoDB",
    "mysql_charset": "utf8mb4",
    "mysql_collate": "utf8mb4_0900_ai_ci",
}


class Base(DeclarativeBase):
    """Every subclass sets ``__table_args__ = table_args(...)`` (adds the InnoDB/utf8mb4 options)."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)

    def __repr__(self) -> str:
        ident = getattr(self, "id", None)
        return f"<{type(self).__name__} id={ident!r}>"


def pk_column() -> Mapped[int]:
    return mapped_column(BigInteger, primary_key=True, autoincrement=True)


def created_at_column() -> Mapped[datetime]:
    return mapped_column(UTCDateTime(), nullable=False, default=clock.now_utc, server_default=NOW_DEFAULT)


def updated_at_column() -> Mapped[datetime]:
    return mapped_column(
        UTCDateTime(),
        nullable=False,
        default=clock.now_utc,
        onupdate=clock.now_utc,
        server_default=NOW_ON_UPDATE_DEFAULT,
    )


def table_args(*items: Any) -> tuple[Any, ...]:
    """``__table_args__`` helper: constraints/indexes followed by the MySQL table options."""
    return (*items, dict(TABLE_KWARGS))
