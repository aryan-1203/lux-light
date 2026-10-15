"""Content API: FAQs and the contact form (honeypot, rate limit, notifications)."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

import httpx
import pytest
import time_machine
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import ip_hash
from app.models import ContactMessage, Faq, User
from app.models.enums import ContactMessageStatus, ContactTopic, FaqCategory, NotificationKind
from app.services import notifications as notifications_service

CONTACT = "/api/v1/content/contact"


def assert_error(response: httpx.Response, status: int, code: str) -> dict[str, Any]:
    assert response.status_code == status, response.text
    body: dict[str, Any] = response.json()
    assert body["error"]["code"] == code
    return body


def contact_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "name": "Rohan Mehta",
        "email": "Rohan.Mehta@Example.com",
        "phone": "+919876543210",
        "topic": "order",
        "order_number": "dl-261015-abc123",
        "message": "Hi, could you tell me when my order will ship? Thanks!",
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def notify_calls(monkeypatch: pytest.MonkeyPatch) -> list[dict[str, Any]]:
    calls: list[dict[str, Any]] = []

    def fake_notify(db: Session, kind: NotificationKind, **kwargs: Any) -> list[Any]:
        calls.append({"kind": kind, **kwargs})
        return []

    monkeypatch.setattr(notifications_service, "notify", fake_notify)
    return calls


def add_faq(db: Session, category: FaqCategory, sort_order: int, *, active: bool = True) -> Faq:
    faq = Faq(
        question=f"{category.value} question {sort_order}?",
        answer_md="Answer.",
        category=category,
        sort_order=sort_order,
        is_active=active,
    )
    db.add(faq)
    db.flush()
    return faq


# ---- listFaqs --------------------------------------------------------------------------------


def test_list_faqs_ordered_by_category_then_sort(client: TestClient, db: Session) -> None:
    safety = add_faq(db, FaqCategory.SAFETY, 1)
    usage_2 = add_faq(db, FaqCategory.USAGE, 2)
    usage_1 = add_faq(db, FaqCategory.USAGE, 1)
    product = add_faq(db, FaqCategory.PRODUCT, 5)
    add_faq(db, FaqCategory.USAGE, 0, active=False)
    response = client.get("/api/v1/content/faqs")
    assert response.status_code == 200
    items = response.json()["items"]
    assert [f["id"] for f in items] == [product.id, usage_1.id, usage_2.id, safety.id]
    assert items[0] == {
        "id": product.id,
        "question": product.question,
        "answer_md": "Answer.",
        "category": "product",
        "sort_order": 5,
    }


def test_list_faqs_category_filter(client: TestClient, db: Session) -> None:
    add_faq(db, FaqCategory.USAGE, 1)
    shipping = add_faq(db, FaqCategory.SHIPPING, 1)
    items = client.get("/api/v1/content/faqs", params={"category": "shipping"}).json()["items"]
    assert [f["id"] for f in items] == [shipping.id]


def test_list_faqs_invalid_category(client: TestClient) -> None:
    assert_error(client.get("/api/v1/content/faqs", params={"category": "medical"}), 422, "VALIDATION_ERROR")


# ---- submitContactMessage --------------------------------------------------------------------


def test_submit_contact_message_stored_and_acknowledged(
    client: TestClient, db: Session, notify_calls: list[dict[str, Any]]
) -> None:
    response = client.post(CONTACT, json=contact_payload())
    assert response.status_code == 202, response.text
    body = response.json()
    assert set(body) == {"id", "message"}
    message = db.scalar(select(ContactMessage).where(ContactMessage.id == body["id"]))
    assert message is not None
    assert message.email == "rohan.mehta@example.com"
    assert message.status is ContactMessageStatus.NEW
    assert message.topic is ContactTopic.ORDER
    assert message.order_number == "DL-261015-ABC123"
    assert message.user_id is None
    assert message.ip_hash == ip_hash("testclient")
    [call] = notify_calls
    assert call["kind"] is NotificationKind.CONTACT_RECEIVED
    assert call["email"] == "rohan.mehta@example.com"
    assert call["context"]["contact_message_id"] == message.id


def test_submit_contact_message_links_logged_in_user(
    login_as: Callable[[User], TestClient], make_user: Callable[..., User], db: Session
) -> None:
    user = make_user()
    response = login_as(user).post(CONTACT, json=contact_payload(phone=None, order_number=None))
    assert response.status_code == 202
    message = db.scalar(select(ContactMessage).where(ContactMessage.id == response.json()["id"]))
    assert message is not None
    assert message.user_id == user.id
    assert message.phone is None


def test_submit_contact_message_honeypot_is_spam(
    client: TestClient, db: Session, notify_calls: list[dict[str, Any]]
) -> None:
    response = client.post(CONTACT, json=contact_payload(website="http://spam.example"))
    assert response.status_code == 202
    message = db.scalar(select(ContactMessage).where(ContactMessage.id == response.json()["id"]))
    assert message is not None
    assert message.status is ContactMessageStatus.SPAM
    assert notify_calls == []


def test_submit_contact_message_sanitises_text(client: TestClient, db: Session) -> None:
    payload = contact_payload(
        name="<b>Rohan</b>", message="<script>x()</script>Hello there, <i>where</i> is it?"
    )
    response = client.post(CONTACT, json=payload)
    assert response.status_code == 202
    message = db.scalar(select(ContactMessage).where(ContactMessage.id == response.json()["id"]))
    assert message is not None
    assert message.name == "Rohan"
    assert message.message == "Hello there, where is it?"


def test_submit_contact_message_tolerates_unimplemented_notifications(client: TestClient) -> None:
    assert client.post(CONTACT, json=contact_payload()).status_code == 202


@pytest.mark.parametrize(
    "overrides",
    [
        {"email": "nope"},
        {"phone": "12345"},
        {"topic": "complaint"},
        {"message": "short"},
        {"message": "x" * 4001},
        {"name": ""},
        {"order_number": "X" * 21},
        {"website": "x" * 201},
        {"extra": True},
    ],
)
def test_submit_contact_message_validation(client: TestClient, overrides: dict[str, Any]) -> None:
    assert_error(client.post(CONTACT, json=contact_payload(**overrides)), 422, "VALIDATION_ERROR")


def test_submit_contact_message_requires_csrf(anon_client: TestClient) -> None:
    assert_error(anon_client.post(CONTACT, json=contact_payload()), 403, "CSRF_FAILED")


def test_submit_contact_message_rate_limited(client: TestClient, frozen_time: time_machine.Traveller) -> None:
    for _ in range(5):
        assert client.post(CONTACT, json=contact_payload()).status_code == 202
    response = client.post(CONTACT, json=contact_payload())
    assert_error(response, 429, "RATE_LIMITED")
    assert int(response.headers["Retry-After"]) > 0
