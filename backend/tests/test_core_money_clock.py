from __future__ import annotations

from datetime import UTC, datetime, timedelta, timezone

import pytest
import time_machine

from app.core import clock
from app.core.money import allocate_pro_rata, round_half_up_div, taxable_value


@pytest.mark.parametrize(
    ("num", "den", "expected"),
    [(7, 2, 4), (5, 2, 3), (4, 2, 2), (1, 3, 0), (2, 3, 1), (-7, 2, -4), (-1, 3, 0), (7, -2, -4), (0, 5, 0)],
)
def test_round_half_up_div(num: int, den: int, expected: int) -> None:
    assert round_half_up_div(num, den) == expected


def test_round_half_up_div_zero_denominator() -> None:
    with pytest.raises(ZeroDivisionError):
        round_half_up_div(1, 0)


@pytest.mark.parametrize(
    ("gross", "rate", "taxable"),
    [
        (499900, 18, 423644),
        (449910, 18, 381280),
        (749900, 18, 635508),
        (399900, 18, 338898),
        (4900, 18, 4153),
    ],
)
def test_taxable_value_matches_plan_worked_examples(gross: int, rate: int, taxable: int) -> None:
    assert taxable_value(gross, rate) == taxable


def test_taxable_value_zero_rate_and_negative_rate() -> None:
    assert taxable_value(1000, 0) == 1000
    with pytest.raises(ValueError):
        taxable_value(1000, -1)


def test_allocate_pro_rata_sums_exactly() -> None:
    shares = allocate_pro_rata(
        4200000, [4600000, 1350000, 13915000, 6750000, 6900000, 4725000, 6724000, 3528000]
    )
    assert sum(shares) == 4200000
    assert all(s >= 0 for s in shares)


def test_allocate_pro_rata_ties_go_to_lower_index() -> None:
    assert allocate_pro_rata(1, [1, 1, 1]) == [1, 0, 0]
    assert allocate_pro_rata(2, [1, 1, 1]) == [1, 1, 0]
    assert allocate_pro_rata(10, [1, 2]) == [3, 7]


def test_allocate_pro_rata_edge_cases() -> None:
    assert allocate_pro_rata(5, [0, 0]) == [3, 2]
    assert allocate_pro_rata(0, []) == []
    assert allocate_pro_rata(-10, [1, 1]) == [-5, -5]
    with pytest.raises(ValueError):
        allocate_pro_rata(5, [])
    with pytest.raises(ValueError):
        allocate_pro_rata(5, [1, -1])


def test_now_utc_is_aware() -> None:
    now = clock.now_utc()
    assert now.tzinfo is not None
    assert now.utcoffset() == timedelta(0)


def test_to_ist_offset_and_naive_rejected() -> None:
    ist = clock.to_ist(datetime(2026, 1, 1, 0, 0, tzinfo=UTC))
    assert ist.utcoffset() == timedelta(hours=5, minutes=30)
    assert (ist.hour, ist.minute) == (5, 30)
    with pytest.raises(ValueError):
        clock.to_ist(datetime(2026, 1, 1))  # noqa: DTZ001 - deliberately naive


def test_ensure_utc_converts_other_zones() -> None:
    dt = datetime(2026, 1, 1, 10, 0, tzinfo=timezone(timedelta(hours=2)))
    assert clock.ensure_utc(dt) == datetime(2026, 1, 1, 8, 0, tzinfo=UTC)


@pytest.mark.parametrize(
    ("moment", "fy"),
    [
        (datetime(2026, 3, 31, 18, 29, 59, tzinfo=UTC), "2025-26"),
        (datetime(2026, 3, 31, 18, 30, 0, tzinfo=UTC), "2026-27"),
        (datetime(2026, 10, 15, 0, 0, tzinfo=UTC), "2026-27"),
        (datetime(2099, 12, 31, 0, 0, tzinfo=UTC), "2099-00"),
    ],
)
def test_financial_year_boundaries(moment: datetime, fy: str) -> None:
    assert clock.financial_year(moment) == fy


def test_ist_today_uses_ist_calendar(frozen_time: time_machine.Traveller) -> None:
    frozen_time.move_to(datetime(2026, 10, 15, 19, 0, tzinfo=UTC))  # 00:30 IST next day
    assert clock.ist_today().isoformat() == "2026-10-16"
    assert clock.now_utc() == datetime(2026, 10, 15, 19, 0, tzinfo=UTC)
