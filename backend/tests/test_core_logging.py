from __future__ import annotations

import io
import json
import logging

import pytest
from fastapi.testclient import TestClient

from app.core import logging as app_logging
from app.core.logging import (
    REDACTED,
    AppLogHandler,
    JsonFormatter,
    PIIScrubFilter,
    RequestIdFilter,
    configure_logging,
    mask_email,
    mask_phone,
    request_id_var,
    scrub,
    scrub_text,
)


def test_mask_email_and_phone() -> None:
    assert mask_email("priya@example.com") == "p***@example.com"
    assert mask_email("not-an-email") == "***"
    assert mask_phone("+919800000001") == "+91******0001"
    assert mask_phone("9800000001") == "******0001"
    assert mask_phone("123") == "***"


def test_scrub_text_masks_pii_and_tokens() -> None:
    text = (
        "user priya.demo@example.com phone +919800000001 alt 98000 00002 "
        "auth Bearer abc.def.ghi jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl order DL-261015-ABC234"
    )
    out = scrub_text(text)
    assert "priya.demo@example.com" not in out
    assert "p***@example.com" in out
    assert "9800000001" not in out
    assert "0001" in out
    assert "abc.def.ghi" not in out
    assert "eyJhbGciOiJIUzI1NiJ9" not in out
    assert "DL-261015-ABC234" in out  # order numbers are not PII


def test_scrub_mapping_redacts_sensitive_keys() -> None:
    payload = {
        "password": "hunter2",
        "otp": "123456",
        "refresh_token": "abc",
        "razorpay_signature": "sig",
        "card": {"last4": "4242"},
        "vpa": "priya@upi",
        "contact": "+919800000001",
        "Authorization": "Bearer x",
        "error_code": "BAD_REQUEST_ERROR",
        "status": "captured",
        "email": "priya@example.com",
        "nested": [{"secret_key": "s"}, "arjun@example.com"],
    }
    out = scrub(payload)
    for key in (
        "password",
        "otp",
        "refresh_token",
        "razorpay_signature",
        "card",
        "vpa",
        "contact",
        "Authorization",
    ):
        assert out[key] == REDACTED, key
    assert out["error_code"] == "BAD_REQUEST_ERROR"
    assert out["status"] == "captured"
    assert out["email"] == "p***@example.com"
    assert out["nested"][0]["secret_key"] == REDACTED
    assert out["nested"][1] == "a***@example.com"


def _record(msg: str, args: object = None, **extra: object) -> logging.LogRecord:
    record = logging.LogRecord("t", logging.INFO, __file__, 1, msg, args, None)
    for k, v in extra.items():
        setattr(record, k, v)
    return record


def test_pii_filter_scrubs_message_args_and_extras() -> None:
    record = _record(
        "login for %s from %s", ("priya@example.com", "+919800000001"), token="abc", ctx={"otp": "1"}
    )
    assert PIIScrubFilter().filter(record)
    message = record.getMessage()
    assert "priya@example.com" not in message
    assert "+919800000001" not in message
    assert record.token == REDACTED
    assert record.ctx == {"otp": REDACTED}


def test_pii_filter_mapping_args() -> None:
    record = _record("%(email)s", None)
    record.args = {"email": "priya@example.com"}
    PIIScrubFilter().filter(record)
    assert record.getMessage() == "p***@example.com"


def test_json_formatter_includes_request_id() -> None:
    token = request_id_var.set("req-abc")
    try:
        record = _record("hello %s", ("arjun@example.com",), order_id=7)
        RequestIdFilter().filter(record)
        PIIScrubFilter().filter(record)
        try:
            raise ValueError("boom priya@example.com")
        except ValueError:
            import sys

            record.exc_info = sys.exc_info()
        payload = json.loads(JsonFormatter().format(record))
    finally:
        request_id_var.reset(token)
    assert payload["request_id"] == "req-abc"
    assert payload["msg"] == "hello a***@example.com"
    assert payload["order_id"] == 7
    assert "priya@example.com" not in payload["exc"]


def test_configure_logging_is_idempotent_and_scrubs() -> None:
    root = logging.getLogger()
    before = [h for h in root.handlers if not isinstance(h, AppLogHandler)]
    try:
        configure_logging("INFO", json_logs=False)
        configure_logging("INFO", json_logs=True)
        handlers = [h for h in root.handlers if isinstance(h, AppLogHandler)]
        assert len(handlers) == 1
        stream = io.StringIO()
        handlers[0].setStream(stream)
        logging.getLogger("app.test").warning("contact %s", "priya@example.com")
        line = json.loads(stream.getvalue().strip())
        assert line["msg"] == "contact p***@example.com"
    finally:
        for h in [h for h in root.handlers if isinstance(h, AppLogHandler)]:
            root.removeHandler(h)
        assert [h for h in root.handlers if not isinstance(h, AppLogHandler)] == before
        app_logging.configure_logging("WARNING")


def test_access_log_has_no_query_string(client: TestClient, caplog: pytest.LogCaptureFixture) -> None:
    with caplog.at_level(logging.INFO, logger="app.access"):
        client.get("/api/v1/health?email=priya@example.com&token=secret")
    lines = [r.getMessage() for r in caplog.records if r.name == "app.access"]
    assert lines
    assert all("priya" not in line and "secret" not in line and "?" not in line for line in lines)
    assert any(line.startswith("GET /api/v1/health 200") for line in lines)
