"""Shared pytest fixtures (PLAN §5 "Testing conventions").

* The schema is (re)created in ``luxlight_test`` once per session with ``alembic upgrade head``.
* Every test runs inside a connection-level transaction; sessions use
  ``join_transaction_mode="create_savepoint"`` so handler ``commit()`` only releases a savepoint and
  everything is rolled back at the end of the test.
* ``get_db`` and ``get_session_factory`` are overridden to use that connection.
"""

from __future__ import annotations

import os
import tempfile
from collections.abc import Callable, Iterator
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

# --- environment must be prepared before any app module creates the engine / settings ------------
from app.core.config import Settings, get_settings

_TEST_DB_URL = os.environ.get("TEST_DATABASE_URL") or Settings().TEST_DATABASE_URL
if not _TEST_DB_URL.rsplit("/", 1)[-1].split("?")[0].endswith("_test"):
    raise RuntimeError(f"Refusing to run tests against a non-test database: {_TEST_DB_URL!r}")
_TEST_STORAGE = tempfile.mkdtemp(prefix="dawnlit-test-storage-")
os.environ.update(
    {
        "ENV": "test",
        "DATABASE_URL": _TEST_DB_URL,
        "TEST_DATABASE_URL": _TEST_DB_URL,
        "STORAGE_DIR": _TEST_STORAGE,
        "REDIS_URL": "",
        "PAYMENT_PROVIDER": "mock",
        "RAZORPAY_KEY_ID": "",
        "RAZORPAY_KEY_SECRET": "",
        "RAZORPAY_WEBHOOK_SECRET": "",
        "SHIPROCKET_EMAIL": "",
        "SHIPROCKET_PASSWORD": "",
        "SMTP_HOST": "",
        "WHATSAPP_PROVIDER_URL": "",
        "OTP_DEV_ECHO": "true",
        "RATE_LIMIT_ENABLED": "true",
        "LOG_LEVEL": "WARNING",
        "LOG_JSON": "false",
    }
)
get_settings.cache_clear()

import pytest  # noqa: E402
import time_machine  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import Connection, inspect, text  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402

from alembic import command  # noqa: E402
from app.api.deps import get_db  # noqa: E402
from app.core import rate_limit  # noqa: E402
from app.core.cookies import ACCESS_COOKIE, CSRF_COOKIE, CSRF_HEADER  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.db.session import engine, override_session_factory  # noqa: E402
from app.models import User  # noqa: E402
from tests import factories  # noqa: E402

BACKEND_DIR = Path(__file__).resolve().parents[1]
TEST_CSRF_TOKEN = "test-csrf-token-0123456789abcdef"
FROZEN_NOW = datetime(2026, 10, 15, 4, 30, tzinfo=UTC)  # 10:00 IST


def alembic_config(connection: Connection | None = None) -> Config:
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    cfg.attributes["skip_logging_config"] = True
    if connection is not None:
        cfg.attributes["connection"] = connection
    return cfg


def drop_all_tables(connection: Connection) -> None:
    names = inspect(connection).get_table_names()
    connection.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
    try:
        for name in names:
            connection.execute(text(f"DROP TABLE IF EXISTS `{name}`"))
    finally:
        connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))


@pytest.fixture(scope="session", autouse=True)
def _schema() -> Iterator[None]:
    """Fresh schema at head for the whole session."""
    with engine.begin() as conn:
        drop_all_tables(conn)
    with engine.begin() as conn:
        command.upgrade(alembic_config(conn), "head")
    return


@pytest.fixture(autouse=True)
def _reset_rate_limits() -> Iterator[None]:
    rate_limit.set_backend(rate_limit.InMemoryBackend())
    yield
    rate_limit.set_backend(None)


@pytest.fixture
def settings() -> Iterator[Settings]:
    """The live (cached) settings object; attribute changes are reverted after the test."""
    current = get_settings()
    snapshot = current.model_dump()
    yield current
    for key, value in snapshot.items():
        object.__setattr__(current, key, value)


@pytest.fixture
def connection() -> Iterator[Connection]:
    conn = engine.connect()
    trans = conn.begin()
    try:
        yield conn
    finally:
        if trans.is_active:
            trans.rollback()
        conn.close()


@pytest.fixture
def session_factory(connection: Connection) -> Iterator[sessionmaker[Session]]:
    factory = sessionmaker(
        bind=connection,
        join_transaction_mode="create_savepoint",
        autoflush=False,
        expire_on_commit=False,
    )
    override_session_factory(factory)
    try:
        yield factory
    finally:
        override_session_factory(None)


@pytest.fixture
def db(session_factory: sessionmaker[Session]) -> Iterator[Session]:
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def app(session_factory: sessionmaker[Session]) -> Iterator[FastAPI]:
    from app.main import app as fastapi_app

    def _get_db() -> Iterator[Session]:
        session = session_factory()
        try:
            yield session
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    fastapi_app.dependency_overrides[get_db] = _get_db
    try:
        yield fastapi_app
    finally:
        fastapi_app.dependency_overrides.pop(get_db, None)


def make_client(app: FastAPI, *, csrf: bool = True) -> TestClient:
    client = TestClient(app, base_url="http://testserver")
    if csrf:
        client.cookies.set(CSRF_COOKIE, TEST_CSRF_TOKEN)
        client.headers[CSRF_HEADER] = TEST_CSRF_TOKEN
    return client


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    """TestClient with the CSRF cookie + header pre-set (lifespan is not run)."""
    with make_client(app) as c:
        yield c


@pytest.fixture
def anon_client(app: FastAPI) -> Iterator[TestClient]:
    """TestClient without CSRF credentials."""
    with make_client(app, csrf=False) as c:
        yield c


@pytest.fixture
def login_as(client: TestClient, db: Session) -> Callable[[User], TestClient]:
    """``login_as(user)`` → sets a valid ``dl_access`` cookie for ``user`` on ``client``."""

    def _login(user: User) -> TestClient:
        db.flush()
        client.cookies.set(ACCESS_COOKIE, create_access_token(user.id, user.role))
        return client

    return _login


@pytest.fixture
def frozen_time() -> Iterator[time_machine.Traveller]:
    """Freeze time at 2026-10-15 04:30 UTC (10:00 IST); use ``.move_to()`` / ``.shift()``."""
    with time_machine.travel(FROZEN_NOW, tick=False) as traveller:
        yield traveller


# --- factory fixtures (bound to the test session) --------------------------------------------------


@pytest.fixture
def make_user(db: Session) -> Callable[..., User]:
    def _make(**kwargs: Any) -> User:
        return factories.make_user(db, **kwargs)

    return _make


@pytest.fixture
def make_product(db: Session) -> Callable[..., Any]:
    def _make(**kwargs: Any) -> Any:
        return factories.make_product(db, **kwargs)

    return _make


@pytest.fixture
def make_order(db: Session) -> Callable[..., Any]:
    def _make(**kwargs: Any) -> Any:
        return factories.make_order(db, **kwargs)

    return _make


@pytest.fixture
def make_promo(db: Session) -> Callable[..., Any]:
    def _make(**kwargs: Any) -> Any:
        return factories.make_promo(db, **kwargs)

    return _make
