import re

import pytest

from app.services.rows import LEADS_HEADER
from tests.conftest import full_lead, short_lead

TAB = "Leads"


def _row(fake, n: int = 0) -> dict[str, str]:
    return dict(zip(LEADS_HEADER, fake.data_rows(TAB)[n], strict=True))


def _locs(res) -> set[str]:
    return {e["loc"][-1] for e in res.json()["detail"]}


def test_short_form_writes_row(client, fake_sheets) -> None:
    res = client.post("/api/leads", json=short_lead(), headers={"User-Agent": "UA-Test/1.0"})
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True and body["updated"] is False
    assert re.fullmatch(r"LX-[A-HJ-NP-Z2-9]{6}", body["lead_id"])

    assert fake_sheets.tabs[TAB][0] == LEADS_HEADER
    row = _row(fake_sheets)
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", row["timestamp_ist"])
    assert row["lead_id"] == body["lead_id"]
    assert row["name"] == "Asha Rao"
    assert row["phone"] == "+919876543210"
    assert row["email"] == ""
    assert row["interests"] == "Mood, Sleep routine"
    assert row["whatsapp_opt_in"] == "No"
    assert row["consent"] == "Yes"
    assert row["status"] == "New"
    assert row["user_agent"] == "UA-Test/1.0"


def test_full_form_writes_all_fields(client, fake_sheets) -> None:
    res = client.post("/api/leads", json=full_lead())
    assert res.status_code == 200
    row = _row(fake_sheets)
    assert row["email"] == "asha.rao@gmail.com"
    assert row["state"] == "Karnataka"
    assert row["use_location"] == "Both"
    assert row["quantity"] == "2-5"
    assert row["budget"] == "10-15k"
    assert row["source"] == "Instagram"
    assert row["whatsapp_opt_in"] == "Yes"
    assert row["utm_source"] == "ig"
    assert row["landing_page"] == "/early-access"
    assert row["referrer"] == "https://instagram.com/"


def test_full_form_requires_extra_fields(client, fake_sheets) -> None:
    res = client.post("/api/leads", json=short_lead(form="full", email=""))
    assert res.status_code == 422
    assert _locs(res) == {"email", "state", "use_location", "quantity", "budget", "heard_from"}
    assert all(e["loc"][0] == "body" for e in res.json()["detail"])
    assert fake_sheets.calls == []


def test_short_form_accepts_empty_optional_fields(client) -> None:
    res = client.post("/api/leads", json=short_lead(email="", state=None, utm_source=None, quantity=""))
    assert res.status_code == 200


def test_short_form_validates_optional_email_when_given(client) -> None:
    res = client.post("/api/leads", json=short_lead(email="not-an-email"))
    assert res.status_code == 422
    assert _locs(res) == {"email"}


@pytest.mark.parametrize("consent", [False, "true", 1, None])
def test_consent_must_be_literally_true(client, fake_sheets, consent) -> None:
    res = client.post("/api/leads", json=short_lead(consent=consent))
    assert res.status_code == 422
    assert _locs(res) == {"consent"}
    assert fake_sheets.calls == []


def test_consent_missing(client) -> None:
    data = short_lead()
    del data["consent"]
    res = client.post("/api/leads", json=data)
    assert res.status_code == 422 and _locs(res) == {"consent"}


@pytest.mark.parametrize("interests", [[], ["mood", "mood"], ["telepathy"], "mood"])
def test_interests_validation(client, interests) -> None:
    res = client.post("/api/leads", json=short_lead(interests=interests))
    assert res.status_code == 422
    assert "interests" in {e["loc"][1] for e in res.json()["detail"]}


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("name", "A"),
        ("name", "x" * 81),
        ("city", "P"),
        ("phone", "12345"),
        ("form", "long"),
        ("utm_source", "u" * 301),
    ],
)
def test_field_constraints(client, field, value) -> None:
    res = client.post("/api/leads", json=short_lead(**{field: value}))
    assert res.status_code == 422
    assert _locs(res) == {field}


def test_name_is_trimmed(client, fake_sheets) -> None:
    client.post("/api/leads", json=short_lead(name="   Asha   "))
    assert _row(fake_sheets)["name"] == "Asha"


def test_invalid_json_is_422(client) -> None:
    res = client.post("/api/leads", content=b"{nope", headers={"Content-Type": "application/json"})
    assert res.status_code == 422
    assert res.json()["detail"][0]["type"] == "json_invalid"


def test_honeypot_returns_fake_success_and_writes_nothing(client_factory, fake_sheets) -> None:
    client = client_factory()
    res = client.post("/api/leads", json={"company": "Acme Bots", "name": "x"})
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True and body["updated"] is False
    assert re.fullmatch(r"LX-[A-HJ-NP-Z2-9]{6}", body["lead_id"])
    assert fake_sheets.calls == []
    assert client.get("/api/health").json()["outbox_pending"] == 0


def test_formula_injection_is_neutralised(client, fake_sheets) -> None:
    client.post("/api/leads", json=short_lead(name='=HYPERLINK("x")', city="@Pune", utm_source="+x"))
    row = _row(fake_sheets)
    assert row["name"] == '\'=HYPERLINK("x")'
    assert row["city"] == "'@Pune"
    assert row["utm_source"] == "'+x"
    assert row["phone"] == "+919876543210"


# -- dedupe -------------------------------------------------------------------------------------


def test_dedupe_by_phone_updates_row_and_keeps_id(client, fake_sheets) -> None:
    first = client.post("/api/leads", json=full_lead()).json()
    original = _row(fake_sheets)
    fake_sheets.tabs[TAB][1][LEADS_HEADER.index("status")] = "Contacted"  # edited by a human

    res = client.post(
        "/api/leads",
        json=short_lead(phone="09876543210", name="Asha R", city="Mysuru", interests=["focus"]),
    )
    assert res.status_code == 200
    assert res.json() == {"ok": True, "lead_id": first["lead_id"], "updated": True}
    assert len(fake_sheets.data_rows(TAB)) == 1
    row = _row(fake_sheets)
    assert row["lead_id"] == first["lead_id"]
    assert row["timestamp_ist"] == original["timestamp_ist"]
    assert row["status"] == "Contacted"
    assert row["name"] == "Asha R"
    assert row["city"] == "Mysuru"
    assert row["interests"] == "Focus"
    # empty values in the new submission don't wipe existing data
    assert row["email"] == "asha.rao@gmail.com"
    assert row["state"] == "Karnataka"
    assert row["utm_campaign"] == "launch"


def test_dedupe_by_email_case_insensitive(client, fake_sheets) -> None:
    first = client.post("/api/leads", json=full_lead()).json()
    res = client.post("/api/leads", json=full_lead(phone="7000000000", email="ASHA.RAO@gmail.COM")).json()
    assert res == {"ok": True, "lead_id": first["lead_id"], "updated": True}
    assert len(fake_sheets.data_rows(TAB)) == 1
    assert _row(fake_sheets)["phone"] == "+917000000000"


def test_different_people_get_separate_rows(client, fake_sheets) -> None:
    client.post("/api/leads", json=short_lead())
    client.post("/api/leads", json=short_lead(phone="8000000000"))
    assert len(fake_sheets.data_rows(TAB)) == 2


def test_dedupe_survives_rows_moved_in_sheet(client, fake_sheets) -> None:
    first = client.post("/api/leads", json=short_lead()).json()
    # Someone inserts a row above ours in the sheet: the cached row number is now stale.
    fake_sheets.tabs[TAB].insert(1, ["2026-01-01 00:00:00", "LX-HUMAN2", "Walk-in"] + [""] * 18)
    res = client.post("/api/leads", json=short_lead(city="Chennai")).json()
    assert res == {"ok": True, "lead_id": first["lead_id"], "updated": True}
    rows = fake_sheets.data_rows(TAB)
    assert len(rows) == 2
    assert rows[0][2] == "Walk-in"
    assert rows[1][LEADS_HEADER.index("city")] == "Chennai"


def test_dedupe_matches_existing_human_formatted_phone(client, fake_sheets) -> None:
    fake_sheets.tabs[TAB] = [
        list(LEADS_HEADER),
        ["2026-01-01 10:00:00", "LX-ABCDEF", "Old", "", "98765 43210"],
    ]
    res = client.post("/api/leads", json=short_lead()).json()
    assert res["lead_id"] == "LX-ABCDEF" and res["updated"] is True


# -- retries & outbox ---------------------------------------------------------------------------


def test_transient_errors_are_retried_then_succeed(client, fake_sheets) -> None:
    from tests.fakes import api_error

    fake_sheets.fail_with = api_error(503)
    fake_sheets.fail_times = 2
    res = client.post("/api/leads", json=short_lead())
    assert res.status_code == 200
    assert len(fake_sheets.data_rows(TAB)) == 1


def test_persistent_429_goes_to_outbox(client, fake_sheets) -> None:
    from tests.fakes import api_error

    fake_sheets.fail_with = api_error(429, "Quota exceeded")
    res = client.post("/api/leads", json=short_lead())
    assert res.status_code == 202
    body = res.json()
    assert body["ok"] is True and body["queued"] is True
    assert re.fullmatch(r"LX-[A-HJ-NP-Z2-9]{6}", body["lead_id"])
    assert fake_sheets.calls == ["get_all_values"] * 4  # 1 try + 3 retries
    assert client.get("/api/health").json()["outbox_pending"] == 1


def test_non_transient_error_is_not_retried(client, fake_sheets) -> None:
    from tests.fakes import api_error

    fake_sheets.fail_with = api_error(403, "The caller does not have permission")
    res = client.post("/api/leads", json=short_lead())
    assert res.status_code == 202
    assert fake_sheets.calls == ["get_all_values"]


def test_network_error_goes_to_outbox(client, fake_sheets) -> None:
    import requests

    fake_sheets.fail_with = requests.ConnectionError("boom")
    res = client.post("/api/leads", json=short_lead())
    assert res.status_code == 202
    assert len(fake_sheets.calls) == 4


def test_unconfigured_sheets_go_straight_to_outbox(client_factory) -> None:
    client = client_factory(sheets=None)
    res = client.post("/api/leads", json=short_lead())
    assert res.status_code == 202
    assert res.json()["queued"] is True
    items = client.app.state.outbox.due_sync()
    assert len(items) == 1 and items[0].kind == "lead"
    assert items[0].payload["lead_id"] == res.json()["lead_id"]
    assert items[0].payload["phone"] == "+919876543210"


def test_backoff_delays_grow_exponentially(client_factory, fake_sheets) -> None:
    from tests.fakes import api_error

    client = client_factory(sheets_backoff_base_seconds=0.5)
    delays: list[float] = []

    async def fake_sleep(seconds: float) -> None:
        delays.append(seconds)

    client.app.state.store._sleep = fake_sleep
    fake_sheets.fail_with = api_error(429)
    assert client.post("/api/leads", json=short_lead()).status_code == 202
    assert len(delays) == 3
    for got, expected in zip(delays, [0.5, 1.0, 2.0], strict=True):
        assert expected * 0.8 <= got <= expected * 1.2
