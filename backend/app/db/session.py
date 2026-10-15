"""Engine + session factory.

Always obtain sessions outside a request via ``get_session_factory()()`` (tests override it).
Services ``flush()``; route handlers / job runners / webhook handlers ``commit()``.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def build_engine(url: str, **kwargs: Any) -> Engine:
    """MySQL engine: utf8mb4, UTC session time zone, pre-ping, recycle."""
    connect_args: dict[str, Any] = {}
    if url.startswith("mysql"):
        connect_args = {"charset": "utf8mb4", "init_command": "SET time_zone = '+00:00'"}
    options: dict[str, Any] = {
        "pool_pre_ping": True,
        "pool_recycle": 1800,
        "connect_args": connect_args,
    }
    options.update(kwargs)
    return create_engine(url, **options)


engine: Engine = build_engine(get_settings().DATABASE_URL)

SessionLocal: sessionmaker[Session] = sessionmaker(
    bind=engine, autoflush=False, expire_on_commit=False, class_=Session
)

_override: sessionmaker[Session] | None = None


def get_session_factory() -> sessionmaker[Session]:
    """Factory used by ``get_db``, background tasks and jobs (tests install an override)."""
    return _override if _override is not None else SessionLocal


def override_session_factory(factory: sessionmaker[Session] | None) -> None:
    """Install (or clear with ``None``) a session factory override — tests only."""
    global _override
    _override = factory
