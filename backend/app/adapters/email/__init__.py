"""Email adapter (PLAN §4.1). Owner: Payments & Integrations.

Phase 2 stub: ``get_email_adapter`` raises ``NotImplementedError`` until Phase 3
(SMTP when ``SMTP_HOST`` is set, else console/file outbox under ``STORAGE_DIR/outbox``).
"""

from __future__ import annotations

from typing import Protocol

__all__ = ["EmailAdapter", "get_email_adapter"]


class EmailAdapter(Protocol):
    name: str

    def send(self, *, to: str, subject: str, html: str, text: str) -> str | None:
        """Send one message; returns the provider message id (if any)."""
        ...


def get_email_adapter() -> EmailAdapter:
    raise NotImplementedError
