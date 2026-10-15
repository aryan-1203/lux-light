"""Cart pricing (PLAN §1.8 "Pricing order of operations", §4.1). Owner: Backend Commerce.

Phase 2 stub: the result dataclasses are final; ``price_cart`` raises ``NotImplementedError``.
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models import Cart, User
from app.models.enums import CartLineWarningCode, DiscountType, PaymentMethod, StockStatus


@dataclass(frozen=True)
class PricedLine:
    cart_item_id: int | None
    variant_id: int
    product_id: int
    quantity: int
    unit_price_paise: int
    compare_at_price_paise: int | None
    line_subtotal_paise: int
    line_discount_paise: int
    line_total_paise: int
    gst_rate_percent: int
    hsn_code: str
    stock_status: StockStatus
    warnings: tuple[tuple[CartLineWarningCode, str], ...]


@dataclass(frozen=True)
class PromoOutcome:
    promo_id: int
    code: str
    title: str
    discount_type: DiscountType
    discount_paise: int
    applicable: bool
    error_code: str | None
    message: str | None


@dataclass(frozen=True)
class CartTotals:
    """Field names mirror the ``CartTotals`` API schema plus extras."""

    subtotal_paise: int
    discount_paise: int
    shipping_paise: int
    cod_fee_paise: int
    total_paise: int
    tax_included_paise: int
    savings_paise: int
    free_shipping_threshold_paise: int
    amount_to_free_shipping_paise: int
    lines: tuple[PricedLine, ...]
    promos: tuple[PromoOutcome, ...]
    cod_available: bool


def price_cart(
    db: Session,
    cart: Cart,
    *,
    payment_method: PaymentMethod | None = None,
    user: User | None = None,
    email: str | None = None,
) -> CartTotals:
    raise NotImplementedError
