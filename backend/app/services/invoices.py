"""GST invoices (DB_SCHEMA §7.5–7.6, PLAN §4.1). Owner: Payments & Integrations.

Phase 2 stub: every function raises ``NotImplementedError`` until Phase 3.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.models import Invoice, Order


def generate_invoice(db: Session, order: Order) -> Invoice:
    """Idempotent; allocates the FY sequence under ``FOR UPDATE``."""
    raise NotImplementedError


def render_invoice_pdf(db: Session, invoice: Invoice) -> Path:
    raise NotImplementedError


def get_invoice_pdf(db: Session, order: Order) -> tuple[Invoice, Path]:
    """409 ``INVOICE_NOT_READY`` when the order has no invoice yet."""
    raise NotImplementedError


def schedule_pdf_render(invoice_id: int, background_tasks: BackgroundTasks | None) -> None:
    raise NotImplementedError
