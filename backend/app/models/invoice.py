"""Invoice tables (DB_SCHEMA §7.5–7.6): invoices, invoice_sequences."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import clock
from app.db.base import Base, created_at_column, pk_column, table_args
from app.db.types import NOW_ON_UPDATE_DEFAULT, UTCDateTime, int_default

if TYPE_CHECKING:
    from app.models.order import Order

_INVOICE_MONEY = ("taxable_value_paise", "cgst_paise", "sgst_paise", "igst_paise", "total_paise")


class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = table_args(
        UniqueConstraint("order_id"),
        UniqueConstraint("invoice_number"),
        UniqueConstraint("financial_year", "sequence_no"),
        *[CheckConstraint(f"{c} >= 0", name=f"{c}_nonneg") for c in _INVOICE_MONEY],
    )

    id: Mapped[int] = pk_column()
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False
    )
    invoice_number: Mapped[str] = mapped_column(String(24), nullable=False)
    financial_year: Mapped[str] = mapped_column(String(7), nullable=False)
    sequence_no: Mapped[int] = mapped_column(Integer, nullable=False)
    issued_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    seller_gstin: Mapped[str] = mapped_column(String(15), nullable=False)
    seller_state_code: Mapped[str] = mapped_column(CHAR(2), nullable=False)
    place_of_supply_state_code: Mapped[str] = mapped_column(CHAR(2), nullable=False)
    buyer_gstin: Mapped[str | None] = mapped_column(String(15), nullable=True)
    taxable_value_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    cgst_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    sgst_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    igst_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    total_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    pdf_generated_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = created_at_column()

    order: Mapped[Order] = relationship(back_populates="invoice")


class InvoiceSequence(Base):
    __tablename__ = "invoice_sequences"
    __table_args__ = table_args()

    financial_year: Mapped[str] = mapped_column(String(7), primary_key=True)
    next_value: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default=int_default(1))
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime(),
        nullable=False,
        default=clock.now_utc,
        onupdate=clock.now_utc,
        server_default=NOW_ON_UPDATE_DEFAULT,
    )
