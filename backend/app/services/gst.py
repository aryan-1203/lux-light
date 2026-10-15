"""GST computation (PLAN §1.8, §4.1). Owner: Backend Commerce.

Phase 2 stub: ``TaxLine`` / ``OrderTax`` are final; the functions raise ``NotImplementedError``.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass


@dataclass(frozen=True)
class TaxLine:
    gross_paise: int
    rate_percent: int
    taxable_value_paise: int
    cgst_paise: int
    sgst_paise: int
    igst_paise: int

    @property
    def tax_paise(self) -> int:
        return self.cgst_paise + self.sgst_paise + self.igst_paise


@dataclass(frozen=True)
class OrderTax:
    items: tuple[TaxLine, ...]
    shipping: TaxLine | None
    cod_fee: TaxLine | None
    taxable_value_paise: int
    cgst_paise: int
    sgst_paise: int
    igst_paise: int
    tax_paise: int
    intra_state: bool
    place_of_supply_state_code: str


def is_intra_state(place_of_supply_state_code: str) -> bool:
    raise NotImplementedError


def split_gst(gross_paise: int, rate_percent: int, *, intra_state: bool) -> TaxLine:
    raise NotImplementedError


def compute_order_tax(
    item_lines: Sequence[tuple[int, int]],
    *,
    shipping_paise: int,
    cod_fee_paise: int,
    place_of_supply_state_code: str,
) -> OrderTax:
    """``item_lines`` = ``(gross_paise, rate_percent)`` per line."""
    raise NotImplementedError
