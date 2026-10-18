import re

from app.services.rows import NEWSLETTER_HEADER

TAB = "Newsletter"


def test_newsletter_writes_row(client, fake_sheets) -> None:
    res = client.post(
        "/api/newsletter",
        json={"email": " Reader@Example.COM ", "source": "footer", "page": "/blog/winter"},
        headers={"User-Agent": "UA/3"},
    )
    assert res.status_code == 200
    assert res.json() == {"ok": True}
    assert fake_sheets.tabs[TAB][0] == NEWSLETTER_HEADER
    [row] = fake_sheets.data_rows(TAB)
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", row[0])
    assert row[1:] == ["reader@example.com", "footer", "/blog/winter", "UA/3"]


def test_newsletter_dedupes_by_email(client, fake_sheets) -> None:
    for email in ["reader@example.com", "READER@example.com", "reader@EXAMPLE.com"]:
        res = client.post("/api/newsletter", json={"email": email})
        assert res.status_code == 200 and res.json() == {"ok": True}
    assert len(fake_sheets.data_rows(TAB)) == 1


def test_newsletter_validation(client) -> None:
    res = client.post("/api/newsletter", json={"email": "nope"})
    assert res.status_code == 422
    assert res.json()["detail"][0]["loc"] == ["body", "email"]
    res = client.post("/api/newsletter", json={"email": "a@b.com", "source": "s" * 41})
    assert res.status_code == 422
    assert res.json()["detail"][0]["loc"] == ["body", "source"]


def test_newsletter_honeypot(client, fake_sheets) -> None:
    res = client.post("/api/newsletter", json={"email": "bot@x.com", "company": "spam"})
    assert res.status_code == 200 and res.json() == {"ok": True}
    assert fake_sheets.calls == []
    assert client.app.state.outbox.pending_count_sync() == 0
