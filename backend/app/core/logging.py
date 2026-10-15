"""Logging setup with request ids and PII scrubbing (PLAN §6.6).

Never log bodies, cookies, Authorization headers, OTPs, passwords, tokens, signatures, card/VPA data,
full emails or phone numbers. The ``PIIScrubFilter`` is a safety net applied to every record:
emails/phones in messages are masked and sensitive keys in mapping args/extras are redacted.
"""

from __future__ import annotations

import contextvars
import json
import logging
import re
import sys
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any, Final, TextIO

request_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar("request_id", default=None)

REDACTED: Final = "[REDACTED]"
SENSITIVE_KEY_RE: Final = re.compile(
    r"password|token|otp|code|secret|signature|authorization|cookie|vpa|card|contact", re.IGNORECASE
)
# Keys that match the pattern above but are safe, non-secret identifiers.
_SAFE_KEYS: Final = frozenset({"error_code", "status_code", "hsn_code", "state_code", "code_name"})

EMAIL_RE: Final = re.compile(
    r"(?<![\w.+-])([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})"
)
# Indian / international phone numbers: optional +CC then 10 digits (allowing spaces/dashes).
PHONE_RE: Final = re.compile(r"(?<![\w])(\+\d{1,3}[\s-]?)?(\d[\s-]?){6}(\d{4})(?!\d)")
BEARER_RE: Final = re.compile(r"(?i)\b(bearer)\s+[A-Za-z0-9._~+/=-]+")
JWT_RE: Final = re.compile(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b")


def mask_email(email: str) -> str:
    """``priya@example.com`` → ``p***@example.com``."""
    local, sep, domain = email.partition("@")
    if not sep:
        return "***"
    return f"{local[:1]}***@{domain}"


def mask_phone(phone: str) -> str:
    """``+919800000001`` → ``+91******0001``."""
    digits = re.sub(r"[^\d+]", "", phone)
    if digits.startswith("+") and len(digits) > 7:
        cc_len = len(digits) - 1 - 10 if len(digits) - 1 > 10 else 2
        cc = digits[: 1 + cc_len]
        rest = digits[1 + cc_len :]
        return cc + "*" * max(0, len(rest) - 4) + rest[-4:]
    if len(digits) <= 4:
        return "*" * len(digits)
    return "*" * (len(digits) - 4) + digits[-4:]


def scrub_text(text: str) -> str:
    text = JWT_RE.sub(REDACTED, text)
    text = BEARER_RE.sub(r"\1 " + REDACTED, text)
    text = EMAIL_RE.sub(lambda m: f"{m.group(1)}***@{m.group(2)}", text)
    return PHONE_RE.sub(lambda m: mask_phone(m.group(0)), text)


def is_sensitive_key(key: str) -> bool:
    return key.lower() not in _SAFE_KEYS and bool(SENSITIVE_KEY_RE.search(key))


def scrub(value: Any, *, _depth: int = 0) -> Any:
    """Recursively redact sensitive keys and mask emails/phones in strings.

    Also used to scrub gateway/webhook payloads before storing them in the DB.
    """
    if _depth > 12:
        return REDACTED
    if isinstance(value, Mapping):
        return {
            k: (REDACTED if isinstance(k, str) and is_sensitive_key(k) else scrub(v, _depth=_depth + 1))
            for k, v in value.items()
        }
    if isinstance(value, list | tuple):
        return type(value)(scrub(v, _depth=_depth + 1) for v in value)
    if isinstance(value, str):
        return scrub_text(value)
    return value


_STD_ATTRS: Final = frozenset(
    vars(logging.LogRecord("x", logging.INFO, "x", 0, "x", None, None)).keys()
    | {"message", "asctime", "request_id"}
)


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get() or "-"
        return True


class PIIScrubFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = scrub_text(record.msg)
        if record.args:
            if isinstance(record.args, Mapping):
                record.args = scrub(dict(record.args))
            else:
                record.args = tuple(scrub(a) for a in record.args)
        for key in list(vars(record)):
            if key in _STD_ATTRS:
                continue
            raw = getattr(record, key)
            setattr(record, key, REDACTED if is_sensitive_key(key) else scrub(raw))
        return True


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
            "request_id": getattr(record, "request_id", "-"),
        }
        for key, value in vars(record).items():
            if key not in _STD_ATTRS:
                payload[key] = value
        if record.exc_info:
            payload["exc"] = scrub_text(self.formatException(record.exc_info))
        return json.dumps(payload, default=str)


class TextFormatter(logging.Formatter):
    def __init__(self) -> None:
        super().__init__("%(asctime)s %(levelname)s [%(request_id)s] %(name)s: %(message)s")

    def formatException(self, ei: Any) -> str:  # noqa: N802 - stdlib override
        return scrub_text(super().formatException(ei))


class AppLogHandler(logging.StreamHandler[TextIO]):
    """Marker subclass so ``configure_logging`` can replace its own handler idempotently."""


def configure_logging(level: str = "INFO", *, json_logs: bool = False) -> None:
    """Install a single scrubbed stream handler on the root logger (idempotent)."""
    root = logging.getLogger()
    for existing in list(root.handlers):
        if isinstance(existing, AppLogHandler):
            root.removeHandler(existing)
    handler = AppLogHandler(sys.stderr)
    handler.addFilter(RequestIdFilter())
    handler.addFilter(PIIScrubFilter())
    handler.setFormatter(JsonFormatter() if json_logs else TextFormatter())
    root.addHandler(handler)
    root.setLevel(level.upper())
    # uvicorn's own access log includes query strings; our RequestContextMiddleware logs instead.
    logging.getLogger("uvicorn.access").disabled = True
    for name in ("uvicorn", "uvicorn.error"):
        lg = logging.getLogger(name)
        lg.handlers.clear()
        lg.propagate = True
