import time

from app.services.outbox import Outbox
from app.services.rows import LEADS_HEADER, NEWSLETTER_HEADER, row_values
from tests.conftest import full_lead
from tests.fakes import api_error


def test_outbox_replay_writes_identical_row(client, fake_sheets) -> None:
    fake_sheets.fail_with = api_error(500, "backend error")
    res = client.post("/api/leads", json=full_lead(), headers={"User-Agent": "UA/2"})
    assert res.status_code == 202
    lead_id = res.json()["lead_id"]
    outbox = client.app.state.outbox
    [item] = outbox.due_sync()
    payload = item.payload
    assert payload["lead_id"] == lead_id

    fake_sheets.fail_with = None
    delivered = client.portal.call(client.app.state.delivery.drain_once)
    assert delivered == 1
    assert fake_sheets.data_rows("Leads") == [row_values(payload, LEADS_HEADER)]
    assert fake_sheets.data_rows("Leads")[0][1] == lead_id
    assert outbox.pending_count_sync() == 0


def test_outbox_replay_applies_dedupe(client, fake_sheets) -> None:
    first = client.post("/api/leads", json=full_lead()).json()
    fake_sheets.fail_with = api_error(429)
    assert client.post("/api/leads", json=full_lead(city="Delhi")).status_code == 202
    fake_sheets.fail_with = None
    client.portal.call(client.app.state.delivery.drain_once)
    rows = fake_sheets.data_rows("Leads")
    assert len(rows) == 1
    assert rows[0][1] == first["lead_id"]
    assert rows[0][LEADS_HEADER.index("city")] == "Delhi"


def test_outbox_replay_failure_backs_off(client, fake_sheets) -> None:
    fake_sheets.fail_with = api_error(503)
    client.post("/api/leads", json=full_lead())
    outbox = client.app.state.outbox
    before = time.time()
    assert client.portal.call(client.app.state.delivery.drain_once) == 0
    assert outbox.pending_count_sync() == 1
    assert outbox.due_sync() == []  # scheduled in the future
    [item] = outbox.due_sync(now=before + 10_000)
    assert item.attempts == 1


def test_newsletter_replay(client, fake_sheets) -> None:
    fake_sheets.fail_with = api_error(502)
    res = client.post("/api/newsletter", json={"email": "a@b.com", "source": "footer"})
    assert res.status_code == 202 and res.json() == {"ok": True, "queued": True}
    fake_sheets.fail_with = None
    client.portal.call(client.app.state.delivery.drain_once)
    assert fake_sheets.tabs["Newsletter"][0] == NEWSLETTER_HEADER
    assert fake_sheets.data_rows("Newsletter")[0][1:3] == ["a@b.com", "footer"]


def test_drain_skips_when_unconfigured(client_factory) -> None:
    client = client_factory(sheets=None)
    client.post("/api/newsletter", json={"email": "a@b.com"})
    assert client.portal.call(client.app.state.delivery.drain_once) == 0
    assert client.app.state.outbox.pending_count_sync() == 1


def test_outbox_creates_parent_dirs(tmp_path) -> None:
    box = Outbox(str(tmp_path / "deep" / "er" / "outbox.sqlite3"))
    item_id = box.enqueue_sync("lead", {"lead_id": "LX-AAAAAA"})
    assert item_id == 1
    assert box.pending_count_sync() == 1
    box.mark_failed_sync(item_id, 3, time.time() + 60, "boom")
    assert box.due_sync() == []
    box.delete_sync(item_id)
    assert box.pending_count_sync() == 0


def test_worker_drains_on_startup(client_factory, fake_sheets, settings_factory) -> None:
    # Pre-populate an outbox, then start an app with the worker enabled.
    path = settings_factory().outbox_path
    Outbox(path).enqueue_sync("newsletter", {"timestamp_ist": "2026-10-18 10:00:00", "email": "w@x.com"})
    client = client_factory(outbox_worker_enabled=True)
    deadline = time.time() + 5
    while client.app.state.outbox.pending_count_sync() and time.time() < deadline:
        time.sleep(0.05)
    assert fake_sheets.data_rows("Newsletter")[0][1] == "w@x.com"
