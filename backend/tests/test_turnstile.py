import json
from urllib.parse import parse_qs

import httpx

from app.services.turnstile import SITEVERIFY_URL
from tests.conftest import short_lead

TEST_SECRET = "1x0000000000000000000000000000000AA"


def _transport(success: bool, seen: list | None = None) -> httpx.MockTransport:
    def handler(request: httpx.Request) -> httpx.Response:
        if seen is not None:
            seen.append(request)
        body = {"success": success, "error-codes": [] if success else ["invalid-input-response"]}
        return httpx.Response(200, content=json.dumps(body))

    return httpx.MockTransport(handler)


def test_turnstile_pass(client_factory, fake_sheets) -> None:
    seen: list[httpx.Request] = []
    client = client_factory(turnstile_secret=TEST_SECRET, turnstile_transport=_transport(True, seen))
    res = client.post("/api/leads", json=short_lead(turnstile_token="tok-123"))
    assert res.status_code == 200
    assert len(seen) == 1
    assert str(seen[0].url) == SITEVERIFY_URL
    form = parse_qs(seen[0].content.decode())
    assert form["secret"] == [TEST_SECRET]
    assert form["response"] == ["tok-123"]
    assert form["remoteip"] == ["testclient"]
    assert len(fake_sheets.data_rows("Leads")) == 1


def test_turnstile_fail(client_factory, fake_sheets) -> None:
    client = client_factory(turnstile_secret=TEST_SECRET, turnstile_transport=_transport(False))
    res = client.post("/api/leads", json=short_lead(turnstile_token="bad"))
    assert res.status_code == 400
    assert res.json() == {"error": "verification_failed"}
    assert fake_sheets.calls == []


def test_turnstile_missing_token(client_factory) -> None:
    seen: list[httpx.Request] = []
    client = client_factory(turnstile_secret=TEST_SECRET, turnstile_transport=_transport(True, seen))
    res = client.post("/api/leads", json=short_lead())
    assert res.status_code == 400
    assert res.json() == {"error": "verification_failed"}
    assert seen == []


def test_turnstile_network_error_fails_closed(client_factory) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("down")

    client = client_factory(turnstile_secret=TEST_SECRET, turnstile_transport=httpx.MockTransport(handler))
    res = client.post("/api/leads", json=short_lead(turnstile_token="tok"))
    assert res.status_code == 400


def test_missing_secret_in_production_rejects(client_factory, fake_sheets) -> None:
    client = client_factory(app_env="production", turnstile_secret="")
    res = client.post("/api/leads", json=short_lead(turnstile_token="tok"))
    assert res.status_code == 400
    assert res.json() == {"error": "verification_failed"}
    assert fake_sheets.calls == []


def test_missing_secret_in_development_allows(client_factory) -> None:
    client = client_factory(app_env="development", turnstile_secret="")
    assert client.post("/api/leads", json=short_lead()).status_code == 200


def test_validation_runs_before_turnstile(client_factory) -> None:
    seen: list[httpx.Request] = []
    client = client_factory(turnstile_secret=TEST_SECRET, turnstile_transport=_transport(True, seen))
    res = client.post("/api/leads", json=short_lead(phone="123", turnstile_token="tok"))
    assert res.status_code == 422
    assert seen == []  # token not consumed by an invalid submission
