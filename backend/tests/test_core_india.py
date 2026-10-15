from __future__ import annotations

import pytest

from app.core.india import STATE_NAMES, is_valid_gstin, is_valid_pincode, normalize_in_phone, state_name
from app.models.enums import IndianStateCode


def test_every_state_code_has_a_name() -> None:
    assert set(STATE_NAMES) == set(IndianStateCode)
    assert state_name("27") == "Maharashtra"
    assert state_name(IndianStateCode.KARNATAKA) == "Karnataka"
    with pytest.raises(ValueError):
        state_name("25")


@pytest.mark.parametrize(
    ("pincode", "ok"),
    [("400050", True), ("560034", True), ("012345", False), ("40005", False), ("40005a", False)],
)
def test_pincode(pincode: str, ok: bool) -> None:
    assert is_valid_pincode(pincode) is ok


def test_gstin() -> None:
    assert is_valid_gstin("27AAAAA0000A1Z5")
    assert not is_valid_gstin("27AAAAA0000A1Y5")


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("+91 98000 00001", "+919800000001"),
        ("9800000001", "+919800000001"),
        ("09800000001", "+919800000001"),
        ("919800000001", "+919800000001"),
        ("0091-9800000001", "+919800000001"),
        ("12345", None),
        ("5800000001", None),
    ],
)
def test_normalize_phone(raw: str, expected: str | None) -> None:
    assert normalize_in_phone(raw) == expected
