"""Integer-paise money helpers. Never use floats or Python's banker's ``round`` for money."""

from __future__ import annotations

from collections.abc import Sequence


def round_half_up_div(numerator: int, denominator: int) -> int:
    """Integer division rounding half away from zero (``7/2 → 4``, ``-7/2 → -4``)."""
    if denominator == 0:
        raise ZeroDivisionError("denominator must be non-zero")
    if denominator < 0:
        numerator, denominator = -numerator, -denominator
    if numerator < 0:
        return -((-numerator * 2 + denominator) // (2 * denominator))
    return (numerator * 2 + denominator) // (2 * denominator)


def allocate_pro_rata(amount: int, weights: Sequence[int]) -> list[int]:
    """Split ``amount`` proportionally to ``weights`` with the largest-remainder method.

    The result always sums to ``amount``. Ties on the remainder go to the lower index
    (callers pass lines ordered by id). All-zero weights split evenly.
    """
    n = len(weights)
    if n == 0:
        if amount != 0:
            raise ValueError("cannot allocate a non-zero amount over zero weights")
        return []
    if any(w < 0 for w in weights):
        raise ValueError("weights must be non-negative")
    if amount < 0:
        return [-x for x in allocate_pro_rata(-amount, weights)]
    effective = list(weights) if sum(weights) > 0 else [1] * n
    total = sum(effective)
    shares = [amount * w // total for w in effective]
    remainders = [amount * w % total for w in effective]
    leftover = amount - sum(shares)
    order = sorted(range(n), key=lambda i: (-remainders[i], i))
    for i in order[:leftover]:
        shares[i] += 1
    return shares


def taxable_value(gross_paise: int, rate_percent: int) -> int:
    """Taxable value of a GST-inclusive amount: ``round_half_up(gross × 100 / (100 + rate))``."""
    if rate_percent < 0:
        raise ValueError("rate_percent must be >= 0")
    return round_half_up_div(gross_paise * 100, 100 + rate_percent)
