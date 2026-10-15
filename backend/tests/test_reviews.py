"""Reviews API: public listings, submission (verified purchase, sanitisation), rating aggregates."""

from __future__ import annotations

from collections.abc import Callable
from datetime import timedelta
from typing import Any

import httpx
import pytest
import time_machine
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import clock
from app.models import Product, Review, User
from app.models.enums import OrderStatus, ReviewSource, ReviewStatus
from app.services import reviews as reviews_service
from tests.factories import ProductBundle, make_order, make_product


def assert_error(response: httpx.Response, status: int, code: str) -> dict[str, Any]:
    assert response.status_code == status, response.text
    body: dict[str, Any] = response.json()
    assert body["error"]["code"] == code
    return body


def add_review(
    db: Session,
    product: Product,
    *,
    rating: int,
    status: ReviewStatus = ReviewStatus.APPROVED,
    verified: bool = False,
    age_days: int = 0,
    user: User | None = None,
) -> Review:
    review = Review(
        product_id=product.id,
        user_id=user.id if user else None,
        author_name="Neha K.",
        rating=rating,
        title=f"{rating} stars",
        body="Helps me feel more awake during early calls.",
        status=status,
        verified_purchase=verified,
        source=ReviewSource.DEMO_SEED,
        created_at=clock.now_utc() - timedelta(days=age_days),
    )
    db.add(review)
    db.flush()
    return review


def review_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "rating": 5,
        "title": "Easy to fit into my routine",
        "body": "I use it every morning while I check email. It helps me feel more awake.",
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def lamp(db: Session) -> ProductBundle:
    return make_product(db, slug="dawnlit-desk", name="Dawnlit Desk")


@pytest.fixture
def customer(make_user: Callable[..., User]) -> User:
    return make_user(full_name="Priya Sharma")


# ---- listProductReviews ----------------------------------------------------------------------


def test_list_product_reviews_approved_only_newest_first(
    client: TestClient, db: Session, lamp: ProductBundle
) -> None:
    old = add_review(db, lamp.product, rating=4, age_days=5)
    new = add_review(db, lamp.product, rating=5, age_days=1)
    add_review(db, lamp.product, rating=1, status=ReviewStatus.PENDING)
    add_review(db, lamp.product, rating=2, status=ReviewStatus.REJECTED)
    add_review(db, make_product(db).product, rating=5)

    response = client.get("/api/v1/products/dawnlit-desk/reviews")
    assert response.status_code == 200, response.text
    body = response.json()
    assert [r["id"] for r in body["items"]] == [new.id, old.id]
    assert (body["page"], body["page_size"], body["total"]) == (1, 20, 2)
    item = body["items"][0]
    assert item["product"] == {"id": lamp.product.id, "slug": "dawnlit-desk", "name": "Dawnlit Desk"}
    assert set(item) == {
        "id",
        "product",
        "rating",
        "title",
        "body",
        "author_name",
        "verified_purchase",
        "created_at",
    }


def test_list_product_reviews_sort_filter_and_pagination(
    client: TestClient, db: Session, lamp: ProductBundle
) -> None:
    three = add_review(db, lamp.product, rating=3, age_days=3)
    five = add_review(db, lamp.product, rating=5, age_days=2)
    four = add_review(db, lamp.product, rating=4, age_days=1)
    url = "/api/v1/products/dawnlit-desk/reviews"

    def ids(**params: Any) -> list[int]:
        response = client.get(url, params=params)
        assert response.status_code == 200, response.text
        return [r["id"] for r in response.json()["items"]]

    assert ids(sort="highest") == [five.id, four.id, three.id]
    assert ids(sort="lowest") == [three.id, four.id, five.id]
    assert ids(sort="newest") == [four.id, five.id, three.id]
    assert ids(rating=5) == [five.id]
    assert ids(page=2, page_size=2) == [three.id]
    assert client.get(url, params={"page": 2, "page_size": 2}).json()["total"] == 3


def test_list_product_reviews_errors(client: TestClient, db: Session, lamp: ProductBundle) -> None:
    assert_error(client.get("/api/v1/products/unknown-lamp/reviews"), 404, "PRODUCT_NOT_FOUND")
    lamp.product.is_active = False
    db.flush()
    assert_error(client.get("/api/v1/products/dawnlit-desk/reviews"), 404, "PRODUCT_NOT_FOUND")
    for params in ({"rating": 6}, {"rating": 0}, {"sort": "best"}, {"page_size": 0}):
        assert_error(
            client.get("/api/v1/products/dawnlit-desk/reviews", params=params), 422, "VALIDATION_ERROR"
        )


# ---- listReviews -----------------------------------------------------------------------------


def test_list_reviews_wall_filters(client: TestClient, db: Session, lamp: ProductBundle) -> None:
    five = add_review(db, lamp.product, rating=5, verified=True, age_days=2)
    four = add_review(db, lamp.product, rating=4, age_days=1)
    add_review(db, lamp.product, rating=3)
    add_review(db, lamp.product, rating=5, status=ReviewStatus.PENDING)
    hidden = make_product(db, is_active=False)
    add_review(db, hidden.product, rating=5)

    def ids(**params: Any) -> list[int]:
        response = client.get("/api/v1/reviews", params=params)
        assert response.status_code == 200, response.text
        return [r["id"] for r in response.json()["items"]]

    assert ids() == [four.id, five.id]  # default min_rating=4, newest first
    assert ids(verified_only=True) == [five.id]
    assert len(ids(min_rating=1)) == 3
    assert ids(min_rating=5) == [five.id]


@pytest.mark.parametrize("params", [{"min_rating": 0}, {"min_rating": 6}, {"verified_only": "perhaps"}])
def test_list_reviews_validation(client: TestClient, params: dict[str, Any]) -> None:
    assert_error(client.get("/api/v1/reviews", params=params), 422, "VALIDATION_ERROR")


# ---- createReview ----------------------------------------------------------------------------


def test_create_review_pending_unverified(
    login_as: Callable[[User], TestClient], db: Session, lamp: ProductBundle, customer: User
) -> None:
    response = login_as(customer).post("/api/v1/products/dawnlit-desk/reviews", json=review_payload())
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["status"] == "pending"
    assert body["verified_purchase"] is False
    assert body["product"]["slug"] == "dawnlit-desk"
    review = db.scalar(select(Review).where(Review.id == body["id"]))
    assert review is not None
    assert review.author_name == "Priya S."
    assert review.user_id == customer.id
    assert review.source is ReviewSource.CUSTOMER
    # Pending reviews are not public and do not change the aggregate.
    assert login_as(customer).get("/api/v1/products/dawnlit-desk/reviews").json()["total"] == 0
    db.refresh(lamp.product)
    assert lamp.product.rating_count == 0


@pytest.mark.parametrize(
    ("status", "expected"),
    [
        (OrderStatus.DELIVERED, True),
        (OrderStatus.SHIPPED, False),
        (OrderStatus.PAID, False),
        (OrderStatus.CANCELLED, False),
    ],
)
def test_create_review_verified_purchase(
    login_as: Callable[[User], TestClient],
    db: Session,
    lamp: ProductBundle,
    customer: User,
    status: OrderStatus,
    expected: bool,
) -> None:
    make_order(db, user=customer, items=[(lamp.variant, 1)], status=status)
    response = login_as(customer).post("/api/v1/products/dawnlit-desk/reviews", json=review_payload())
    assert response.status_code == 201
    assert response.json()["verified_purchase"] is expected


def test_create_review_other_users_or_products_orders_do_not_verify(
    login_as: Callable[[User], TestClient],
    db: Session,
    lamp: ProductBundle,
    customer: User,
    make_user: Callable[..., User],
) -> None:
    make_order(db, user=make_user(), items=[(lamp.variant, 1)], status=OrderStatus.DELIVERED)
    make_order(db, user=customer, items=[(make_product(db).variant, 1)], status=OrderStatus.DELIVERED)
    response = login_as(customer).post("/api/v1/products/dawnlit-desk/reviews", json=review_payload())
    assert response.json()["verified_purchase"] is False


def test_create_review_sanitises_text(
    login_as: Callable[[User], TestClient], lamp: ProductBundle, customer: User
) -> None:
    payload = review_payload(
        title="<b>Great</b>   lamp\x07",
        body="<script>alert(1)</script>Bright &amp; warm <i>light</i>.\r\n\r\n\r\n\r\nWorks a < b well.",
    )
    response = login_as(customer).post("/api/v1/products/dawnlit-desk/reviews", json=payload)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["title"] == "Great lamp"
    assert body["body"] == "Bright & warm light.\n\nWorks a < b well."


def test_create_review_too_short_after_sanitising(
    login_as: Callable[[User], TestClient], lamp: ProductBundle, customer: User
) -> None:
    payload = review_payload(body="<p>          </p><script>long long long text</script>ok")
    response = login_as(customer).post("/api/v1/products/dawnlit-desk/reviews", json=payload)
    assert_error(response, 422, "VALIDATION_ERROR")


@pytest.mark.parametrize(
    "overrides",
    [
        {"rating": 0},
        {"rating": 6},
        {"title": "ab"},
        {"body": "too short"},
        {"body": "x" * 2001},
        {"status": "approved"},
    ],
)
def test_create_review_validation(
    login_as: Callable[[User], TestClient], lamp: ProductBundle, customer: User, overrides: dict[str, Any]
) -> None:
    response = login_as(customer).post(
        "/api/v1/products/dawnlit-desk/reviews", json=review_payload(**overrides)
    )
    assert_error(response, 422, "VALIDATION_ERROR")


def test_create_review_duplicate(
    login_as: Callable[[User], TestClient], lamp: ProductBundle, customer: User
) -> None:
    authed = login_as(customer)
    assert authed.post("/api/v1/products/dawnlit-desk/reviews", json=review_payload()).status_code == 201
    second = authed.post("/api/v1/products/dawnlit-desk/reviews", json=review_payload(rating=1))
    assert_error(second, 409, "REVIEW_ALREADY_EXISTS")


def test_create_review_product_not_found(
    login_as: Callable[[User], TestClient], db: Session, customer: User
) -> None:
    make_product(db, slug="inactive-lamp", is_active=False)
    authed = login_as(customer)
    for slug in ("unknown-lamp", "inactive-lamp"):
        response = authed.post(f"/api/v1/products/{slug}/reviews", json=review_payload())
        assert_error(response, 404, "PRODUCT_NOT_FOUND")


def test_create_review_auth_and_csrf(
    client: TestClient, anon_client: TestClient, lamp: ProductBundle
) -> None:
    assert_error(
        client.post("/api/v1/products/dawnlit-desk/reviews", json=review_payload()), 401, "UNAUTHENTICATED"
    )
    assert_error(
        anon_client.post("/api/v1/products/dawnlit-desk/reviews", json=review_payload()), 403, "CSRF_FAILED"
    )


def test_create_review_rate_limited_per_user(
    frozen_time: time_machine.Traveller,
    login_as: Callable[[User], TestClient],
    db: Session,
    customer: User,
) -> None:
    authed = login_as(customer)
    products = [make_product(db, slug=f"rl-lamp-{i}") for i in range(6)]
    for bundle in products[:5]:
        response = authed.post(f"/api/v1/products/{bundle.product.slug}/reviews", json=review_payload())
        assert response.status_code == 201
    response = authed.post(f"/api/v1/products/{products[5].product.slug}/reviews", json=review_payload())
    assert_error(response, 429, "RATE_LIMITED")
    assert int(response.headers["Retry-After"]) > 0


# ---- recompute_product_rating / helpers ------------------------------------------------------


def test_recompute_product_rating_counts_approved_only(db: Session, lamp: ProductBundle) -> None:
    for rating in (5, 5, 4, 3):
        add_review(db, lamp.product, rating=rating)
    add_review(db, lamp.product, rating=1, status=ReviewStatus.PENDING)
    add_review(db, lamp.product, rating=1, status=ReviewStatus.REJECTED)
    reviews_service.recompute_product_rating(db, lamp.product.id)
    db.refresh(lamp.product)
    assert lamp.product.rating_count == 4
    assert lamp.product.rating_sum == 17
    assert lamp.product.rating_dist == {"1": 0, "2": 0, "3": 1, "4": 1, "5": 2}
    assert lamp.product.rating_average == 4.3


def test_recompute_product_rating_resets_and_ignores_unknown(db: Session, lamp: ProductBundle) -> None:
    lamp.product.rating_count, lamp.product.rating_sum = 9, 40
    db.flush()
    reviews_service.recompute_product_rating(db, lamp.product.id)
    db.refresh(lamp.product)
    assert (lamp.product.rating_count, lamp.product.rating_sum) == (0, 0)
    reviews_service.recompute_product_rating(db, 987654321)  # no-op


@pytest.mark.parametrize(
    ("full_name", "expected"),
    [
        ("Priya Sharma", "Priya S."),
        ("Arjun  K  Rao", "Arjun R."),
        ("Neha", "Neha"),
        (None, "Dawnlit customer"),
        ("  ", "Dawnlit customer"),
    ],
)
def test_display_name(full_name: str | None, expected: str) -> None:
    assert reviews_service.display_name(full_name) == expected
