import pytest

from app.logging_utils import mask_email, mask_phone
from app.schemas import normalise_phone
from app.services.rows import LEAD_ID_ALPHABET, new_lead_id, safe_cell


@pytest.mark.parametrize(
    "raw",
    [
        "+91 98765 43210",
        "919876543210",
        "09876543210",
        "9876543210",
        "+91-98765-43210",
        "(+91) 98765 43210",
        "0091 98765 43210",
        "  98765 43210  ",
        "+919876543210",
    ],
)
def test_phone_normalises_to_ten_digits(raw: str) -> None:
    assert normalise_phone(raw) == "9876543210"


@pytest.mark.parametrize("raw", ["6000000000", "7012345678", "8123456789"])
def test_phone_accepts_6_to_9_prefixes(raw: str) -> None:
    assert normalise_phone(raw) == raw


@pytest.mark.parametrize(
    "raw",
    [
        "",
        "5876543210",  # must start with 6-9
        "1234567890",
        "987654321",  # 9 digits
        "98765432101",  # 11 digits without leading 0
        "+1 415 555 0100",
        "+44 9876543210",
        "91987654321",  # 11 digits starting 91
        "abc9876543210",
        "98765 4321O",  # letter O
        "98+76543210",  # plus in the middle
        "+91 05876543210",
    ],
)
def test_phone_rejects_invalid(raw: str) -> None:
    with pytest.raises(ValueError):
        normalise_phone(raw)


def test_lead_id_format() -> None:
    ids = {new_lead_id() for _ in range(200)}
    assert len(ids) > 190
    for lead_id in ids:
        assert lead_id.startswith("LX-") and len(lead_id) == 9
        assert set(lead_id[3:]) <= set(LEAD_ID_ALPHABET)
    assert not set("0O1I") & set(LEAD_ID_ALPHABET)


def test_safe_cell_prefixes_formulas() -> None:
    assert safe_cell("=SUM(A1)") == "'=SUM(A1)"
    assert safe_cell("+cmd") == "'+cmd"
    assert safe_cell("-1") == "'-1"
    assert safe_cell("@x") == "'@x"
    assert safe_cell("Pune") == "Pune"


def test_masking() -> None:
    assert mask_phone("+919876543210") == "+91******3210"
    assert mask_email("asha@gmail.com") == "a***@gmail.com"
    assert mask_email("") == ""


def test_col_letter() -> None:
    from app.services.sheets_store import col_letter

    assert [col_letter(i) for i in (0, 2, 19, 20, 25, 26)] == ["A", "C", "T", "U", "Z", "AA"]


def test_gspread_client_parses_appended_row_number() -> None:
    from app.services.sheets_client import GspreadSheetsClient

    class FakeWorksheet:
        def append_row(self, values, **kwargs):
            assert kwargs["value_input_option"] == "RAW"
            return {"updates": {"updatedRange": "Leads!A42:U42"}}

    client = GspreadSheetsClient.__new__(GspreadSheetsClient)
    client._worksheets = {"Leads": FakeWorksheet()}
    assert client.append_row("Leads", ["x"]) == 42


def test_is_transient() -> None:
    import requests

    from app.services.sheets_client import is_transient
    from tests.fakes import api_error

    assert is_transient(api_error(429))
    assert is_transient(api_error(503))
    assert is_transient(requests.Timeout())
    assert not is_transient(api_error(403))
    assert not is_transient(ValueError())
