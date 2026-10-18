from tests.conftest import short_lead


def test_leads_rate_limit_returns_json_429(client_factory) -> None:
    client = client_factory(rate_limit_leads="2/minute")
    for _ in range(2):
        assert client.post("/api/leads", json=short_lead()).status_code == 200
    res = client.post("/api/leads", json=short_lead())
    assert res.status_code == 429
    assert res.json() == {"error": "rate_limited"}
    assert "retry-after" in res.headers


def test_newsletter_has_separate_limit(client_factory) -> None:
    client = client_factory(rate_limit_leads="1/minute", rate_limit_newsletter="3/minute")
    assert client.post("/api/leads", json=short_lead()).status_code == 200
    assert client.post("/api/leads", json=short_lead()).status_code == 429
    for i in range(3):
        assert client.post("/api/newsletter", json={"email": f"u{i}@x.com"}).status_code == 200
    res = client.post("/api/newsletter", json={"email": "u9@x.com"})
    assert res.status_code == 429
    assert res.json() == {"error": "rate_limited"}


def test_honeypot_submissions_are_rate_limited_too(client_factory) -> None:
    client = client_factory(rate_limit_leads="1/minute")
    assert client.post("/api/leads", json={"company": "x"}).status_code == 200
    assert client.post("/api/leads", json={"company": "x"}).status_code == 429
