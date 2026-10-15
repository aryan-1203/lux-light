"""WhatsApp adapter (PLAN §4.1). Owner: Payments & Integrations.

Phase 2 stub: ``get_whatsapp_adapter`` raises ``NotImplementedError`` until Phase 3
(generic HTTP provider when ``WHATSAPP_PROVIDER_URL`` is set, else mock).
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Protocol

__all__ = ["WhatsAppAdapter", "get_whatsapp_adapter"]


class WhatsAppAdapter(Protocol):
    name: str

    def send_template(self, *, to_e164: str, template: str, params: Sequence[str]) -> str | None:
        """Send a template message; returns the provider message id (if any)."""
        ...


def get_whatsapp_adapter() -> WhatsAppAdapter:
    raise NotImplementedError
