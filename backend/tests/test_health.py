from tests.conftest import ORIGIN, short_lead


def test_health_reports_config_and_outbox(client_factory) -> None:
    client = client_factory(sheets=None)
    assert client.get("/api/health").json() == {
        "status": "ok",
        "sheets_configured": False,
        "outbox_pending": 0,
    }
    client.post("/api/leads", json=short_lead())
    assert client.get("/api/health").json()["outbox_pending"] == 1


def test_health_sheets_configured(client) -> None:
    body = client.get("/api/health").json()
    assert body["sheets_configured"] is True


def test_cors_preflight_allows_configured_origin(client) -> None:
    res = client.options(
        "/api/leads",
        headers={
            "Origin": ORIGIN,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert res.status_code == 200
    assert res.headers["access-control-allow-origin"] == ORIGIN
    assert "POST" in res.headers["access-control-allow-methods"]


def test_cors_rejects_unknown_origin(client) -> None:
    res = client.options(
        "/api/leads",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert res.status_code == 400
    assert "access-control-allow-origin" not in res.headers
    res = client.get("/api/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in res.headers


def test_cors_headers_on_simple_request(client) -> None:
    res = client.get("/api/health", headers={"Origin": "https://lamp.example"})
    assert res.headers["access-control-allow-origin"] == "https://lamp.example"


def test_body_too_large_returns_413(client, fake_sheets) -> None:
    res = client.post(
        "/api/leads",
        content=b'{"name": "' + b"a" * 20_000 + b'"}',
        headers={"Content-Type": "application/json", "Origin": ORIGIN},
    )
    assert res.status_code == 413
    assert res.json() == {"error": "payload_too_large"}
    assert res.headers["access-control-allow-origin"] == ORIGIN
    assert fake_sheets.calls == []


def test_chunked_body_too_large_returns_413(client) -> None:
    def chunks():
        for _ in range(20):
            yield b"x" * 1024

    res = client.post("/api/newsletter", content=chunks(), headers={"Content-Type": "application/json"})
    assert res.status_code == 413


def test_bad_credentials_do_not_crash_and_queue(client_factory) -> None:
    client = client_factory(sheets=None, google_service_account_b64="bm90LWpzb24=", sheet_id="abc")
    assert client.get("/api/health").json()["sheets_configured"] is True
    res = client.post("/api/leads", json=short_lead())
    assert res.status_code == 202
    assert client.get("/api/health").json()["outbox_pending"] == 1


def test_separate_spreadsheets_per_tab(settings_factory) -> None:
    s = settings_factory(google_service_account_b64="eA==", leads_sheet_id="L", newsletter_sheet_id="N")
    assert s.sheets_configured is True
    assert s.spreadsheet_ids == {"Leads": "L", "Newsletter": "N"}


def test_shared_spreadsheet_fallback_and_partial_config(settings_factory) -> None:
    shared = settings_factory(google_service_account_b64="eA==", sheet_id="S", newsletter_sheet_id="N")
    assert shared.spreadsheet_ids == {"Leads": "S", "Newsletter": "N"}
    partial = settings_factory(google_service_account_b64="eA==", leads_sheet_id="L")
    assert partial.sheets_configured is False
