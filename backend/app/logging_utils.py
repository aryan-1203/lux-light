"""Structured one-line logging plus helpers that keep PII out of logs."""

import json
import logging
from typing import Any


def configure_logging(level: int = logging.INFO) -> None:
    root = logging.getLogger()
    if not root.handlers:
        logging.basicConfig(level=level, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    logging.getLogger("app").setLevel(level)
    logging.getLogger("httpx").setLevel(logging.WARNING)


def log_event(logger: logging.Logger, level: int, event: str, **fields: Any) -> None:
    """Log `{"event": ..., **fields}` as a single JSON line."""
    logger.log(level, "%s", json.dumps({"event": event, **fields}, default=str, ensure_ascii=False))


def mask_phone(phone: str) -> str:
    """'+919876543210' -> '+91******3210'."""
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) < 4:
        return "***"
    local = digits[-10:]
    return "+91" + "*" * (len(local) - 4) + local[-4:]


def mask_email(email: str) -> str:
    """'asha@gmail.com' -> 'a***@gmail.com'."""
    if not email:
        return ""
    local, sep, domain = email.partition("@")
    if not sep:
        return "***"
    return f"{local[:1]}***@{domain}"
