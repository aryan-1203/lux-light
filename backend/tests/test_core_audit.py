from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum

from sqlalchemy.orm import Session
from starlette.requests import Request

from app.core.security import ip_hash
from app.models.enums import OrderStatus, UserRole
from app.services.audit import REDACTED, diff_fields, log_admin_action
from tests import factories


def test_diff_fields_reports_changes_and_redacts_secrets() -> None:
    before = {"status": OrderStatus.PAID, "price_paise": 100, "password_hash": "a", "api_key": "k", "same": 1}
    after = {
        "status": OrderStatus.PACKED,
        "price_paise": 120,
        "password_hash": "b",
        "api_key": "k2",
        "same": 1,
        "added": datetime(2026, 1, 1, tzinfo=UTC),
    }
    diff = diff_fields(before, after)
    assert diff["status"] == ["paid", "packed"]
    assert diff["price_paise"] == [100, 120]
    assert diff["password_hash"] == [REDACTED, REDACTED]
    assert diff["api_key"] == [REDACTED, REDACTED]
    assert diff["added"] == [None, "2026-01-01T00:00:00+00:00"]
    assert "same" not in diff


def test_diff_fields_keeps_promo_codes_visible() -> None:
    assert diff_fields({"code": "OLD"}, {"code": "NEW"}) == {"code": ["OLD", "NEW"]}


def _request() -> Request:
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/v1/admin/orders/1/status",
        "headers": [(b"user-agent", b"pytest-agent/1.0 " + b"x" * 400)],
        "client": ("198.51.100.4", 1234),
        "query_string": b"",
    }
    return Request(scope)


def test_log_admin_action_writes_row(db: Session) -> None:
    admin = factories.make_user(db, role=UserRole.ADMIN, email="boss@dawnlit.in")

    class Color(Enum):
        RED = "red"

    entry = log_admin_action(
        db,
        admin,
        "order.status_update",
        "order",
        17,
        {"status": ["paid", "packed"], "token": "abc", "color": Color.RED, "tags": ("a", "b")},
        request=_request(),
    )
    assert entry.id is not None
    assert entry.actor_user_id == admin.id
    assert entry.actor_email == "boss@dawnlit.in"
    assert entry.entity_type == "order"
    assert entry.entity_id == "17"
    assert entry.diff == {"status": ["paid", "packed"], "token": REDACTED, "color": "red", "tags": ["a", "b"]}
    assert entry.ip_hash == ip_hash("198.51.100.4")
    assert entry.user_agent is not None
    assert len(entry.user_agent) == 255
    assert entry.created_at.tzinfo is not None


def test_log_admin_action_system_actor(db: Session) -> None:
    entry = log_admin_action(db, None, "payment.duplicate_refunded", "payment", "pay_mock_1")
    assert entry.actor_user_id is None
    assert entry.actor_email is None
    assert entry.diff is None
    assert entry.ip_hash is None
