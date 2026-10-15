"""Quiz API + deterministic mapping (PLAN §1.10): product/kelvin rules, stock fallback, routine."""

from __future__ import annotations

from collections.abc import Callable, Sequence
from typing import Any

import httpx
import pytest
import time_machine
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.cookies import CART_COOKIE
from app.core.security import sign_cart_token
from app.models import Inventory, ProductVariant, QuizResult, User
from app.models.enums import StockStatus
from app.schemas.quiz import QuizAnswers
from app.services import inventory as inventory_service
from app.services import quiz as quiz_service
from tests.factories import make_cart, make_category, make_product, make_variant

SUBMIT = "/api/v1/quiz/submit"

VARIANT_SPECS: dict[str, list[tuple[int, str, bool]]] = {
    "dawnlit-desk": [
        (4000, "solo", False),
        (4000, "duo", False),
        (5500, "solo", True),
        (5500, "duo", False),
        (6500, "solo", False),
        (6500, "duo", False),
    ],
    "dawnlit-panel": [(5500, "solo", True), (5500, "floor_stand", False), (6500, "solo", False)],
    "dawnlit-go": [(5500, "solo", True), (5500, "travel_case", False)],
}

Lineup = dict[str, dict[tuple[int, str], ProductVariant]]


def assert_error(response: httpx.Response, status: int, code: str) -> dict[str, Any]:
    assert response.status_code == status, response.text
    body: dict[str, Any] = response.json()
    assert body["error"]["code"] == code
    return body


def stub_stock_status_for_variants(db: Session, variant_ids: Sequence[int]) -> dict[int, StockStatus]:
    """Stand-in for Commerce's ``inventory.stock_status_for_variants`` (PLAN §3.1 rule 5)."""
    out = dict.fromkeys(variant_ids, StockStatus.OUT_OF_STOCK)
    for row in db.scalars(select(Inventory).where(Inventory.variant_id.in_(list(variant_ids)))).all():
        out[row.variant_id] = inventory_service.stock_status(
            row.on_hand - row.reserved, row.low_stock_threshold
        )
    return out


@pytest.fixture(autouse=True)
def _stock_status_stub(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(inventory_service, "stock_status_for_variants", stub_stock_status_for_variants)


@pytest.fixture
def lineup(db: Session) -> Lineup:
    out: Lineup = {}
    for index, (slug, specs) in enumerate(VARIANT_SPECS.items(), start=1):
        bundle = make_product(db, slug=slug, variants=0, category=make_category(db), sort_order=index)
        out[slug] = {
            (kelvin, code): make_variant(db, bundle.product, kelvin=kelvin, bundle=code, is_default=default)
            for kelvin, code, default in specs
        }
    return out


def set_stock(db: Session, variants: Sequence[ProductVariant], on_hand: int) -> None:
    for variant in variants:
        assert variant.inventory is not None
        variant.inventory.on_hand = on_hand
        variant.inventory.reserved = 0
    db.flush()


def answers(**overrides: str) -> dict[str, str]:
    base = {
        "wake_time": "regular",
        "work_style": "desk_office",
        "screen_time": "medium",
        "goal": "morning_energy",
        "setting": "desk",
    }
    base.update(overrides)
    return base


def model(**overrides: str) -> QuizAnswers:
    return QuizAnswers.model_validate(answers(**overrides))


# ---- pure mapping ----------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("overrides", "expected"),
    [
        ({}, "dawnlit-desk"),
        ({"setting": "room"}, "dawnlit-panel"),
        ({"setting": "travel"}, "dawnlit-go"),
        ({"goal": "travel_routine"}, "dawnlit-go"),
        ({"work_style": "on_the_move", "setting": "room"}, "dawnlit-go"),
        ({"work_style": "desk_home"}, "dawnlit-desk"),
    ],
)
def test_choose_product_slug(overrides: dict[str, str], expected: str) -> None:
    assert quiz_service.choose_product_slug(model(**overrides)) == expected


@pytest.mark.parametrize(
    ("overrides", "slug", "expected"),
    [
        ({}, "dawnlit-desk", 5500),
        ({"goal": "daytime_focus"}, "dawnlit-desk", 6500),
        ({"work_style": "shift_work"}, "dawnlit-desk", 6500),
        ({"screen_time": "high", "goal": "consistent_routine"}, "dawnlit-desk", 4000),
        ({"screen_time": "high", "goal": "consistent_routine"}, "dawnlit-panel", 5500),
        ({"goal": "daytime_focus"}, "dawnlit-panel", 6500),
        ({"goal": "daytime_focus"}, "dawnlit-go", 5500),
        ({"screen_time": "high", "goal": "morning_energy"}, "dawnlit-desk", 5500),
    ],
)
def test_choose_kelvin(overrides: dict[str, str], slug: str, expected: int) -> None:
    assert quiz_service.choose_kelvin(model(**overrides), slug) == expected


def test_build_routine_regular_morning_energy() -> None:
    plan = quiz_service.build_routine(model(), "dawnlit-desk")
    assert plan.model_dump() == {
        "session_minutes": 15,
        "window_start": "07:15",
        "window_end": "08:15",
        "distance_cm": 35,
        "steps": [
            {
                "order": 1,
                "time": "07:00",
                "title_key": "quiz:routine.steps.wake.title",
                "body_key": "quiz:routine.steps.wake.body",
                "duration_minutes": None,
            },
            {
                "order": 2,
                "time": "07:15",
                "title_key": "quiz:routine.steps.lightSession.title",
                "body_key": "quiz:routine.steps.lightSession.body",
                "duration_minutes": 15,
            },
            {
                "order": 3,
                "time": "13:00",
                "title_key": "quiz:routine.steps.daylightBreak.title",
                "body_key": "quiz:routine.steps.daylightBreak.body",
                "duration_minutes": None,
            },
            {
                "order": 4,
                "time": "21:30",
                "title_key": "quiz:routine.steps.screensDown.title",
                "body_key": "quiz:routine.steps.screensDown.body",
                "duration_minutes": None,
            },
        ],
    }


@pytest.mark.parametrize(
    ("overrides", "slug", "window", "session", "distance", "times"),
    [
        (
            {"wake_time": "early", "screen_time": "low"},
            "dawnlit-desk",
            ("05:45", "06:45"),
            15,
            35,
            ["05:30", "05:45", "21:30"],
        ),
        (
            {"wake_time": "late", "goal": "daytime_focus"},
            "dawnlit-panel",
            ("08:45", "11:30"),
            20,
            50,
            ["08:30", "08:45", "13:00", "22:30"],
        ),
        (
            {"wake_time": "late", "work_style": "shift_work"},
            "dawnlit-desk",
            ("07:15", "08:15"),
            15,
            35,
            ["07:00", "07:15", "13:00", "22:30"],
        ),
        (
            {"goal": "travel_routine"},
            "dawnlit-go",
            ("07:15", "08:15"),
            10,
            25,
            ["07:00", "07:15", "13:00", "21:30"],
        ),
        (
            {"goal": "consistent_routine"},
            "dawnlit-desk",
            ("07:15", "08:15"),
            15,
            35,
            ["07:00", "07:15", "13:00", "21:30"],
        ),
    ],
)
def test_build_routine_variants(
    overrides: dict[str, str],
    slug: str,
    window: tuple[str, str],
    session: int,
    distance: int,
    times: list[str],
) -> None:
    plan = quiz_service.build_routine(model(**overrides), slug)
    assert (plan.window_start, plan.window_end) == window
    assert plan.session_minutes == session
    assert plan.distance_cm == distance
    assert [s.time for s in plan.steps] == times
    assert [s.order for s in plan.steps] == list(range(1, len(times) + 1))


def test_build_routine_shift_work_wake_text() -> None:
    plan = quiz_service.build_routine(model(work_style="shift_work"), "dawnlit-desk")
    assert plan.steps[0].body_key == "quiz:routine.steps.wake.bodyShiftWork"
    assert plan.steps[0].title_key == "quiz:routine.steps.wake.title"


def test_reason_keys() -> None:
    assert quiz_service.reason_keys("dawnlit-panel", 6500, model(goal="daytime_focus").goal) == [
        "quiz:reasons.panel",
        "quiz:reasons.k6500",
        "quiz:reasons.goal_daytime_focus",
    ]


# ---- submitQuiz ------------------------------------------------------------------------------


def test_submit_quiz_recommends_and_persists(client: TestClient, db: Session, lineup: Lineup) -> None:
    response = client.post(SUBMIT, json={"answers": answers(goal="daytime_focus")})
    assert response.status_code == 201, response.text
    body = response.json()
    expected = lineup["dawnlit-desk"][(6500, "solo")]
    rec = body["recommendation"]
    assert rec["product"]["slug"] == "dawnlit-desk"
    assert rec["variant"]["id"] == expected.id
    assert rec["variant"]["stock_status"] == "in_stock"
    assert rec["reason_keys"] == [
        "quiz:reasons.desk",
        "quiz:reasons.k6500",
        "quiz:reasons.goal_daytime_focus",
    ]
    assert body["answers"] == answers(goal="daytime_focus")
    assert body["routine"]["session_minutes"] == 20
    assert body["routine"]["window_end"] == "10:00"

    row = db.scalar(select(QuizResult).where(QuizResult.id == body["id"]))
    assert row is not None
    assert row.user_id is None
    assert row.cart_id is None
    assert row.recommended_variant_id == expected.id
    assert row.recommended_product_id == expected.product_id
    assert row.answers == answers(goal="daytime_focus")
    assert row.routine == body["routine"]


@pytest.mark.parametrize(
    ("overrides", "slug", "key"),
    [
        ({"setting": "room"}, "dawnlit-panel", (5500, "solo")),
        ({"setting": "room", "goal": "daytime_focus"}, "dawnlit-panel", (6500, "solo")),
        ({"screen_time": "high", "goal": "consistent_routine"}, "dawnlit-desk", (4000, "solo")),
        ({"setting": "travel", "goal": "daytime_focus"}, "dawnlit-go", (5500, "solo")),
    ],
)
def test_submit_quiz_mapping_end_to_end(
    client: TestClient, lineup: Lineup, overrides: dict[str, str], slug: str, key: tuple[int, str]
) -> None:
    response = client.post(SUBMIT, json={"answers": answers(**overrides)})
    assert response.status_code == 201, response.text
    assert response.json()["recommendation"]["variant"]["id"] == lineup[slug][key].id


def test_submit_quiz_falls_back_to_default_variant(client: TestClient, db: Session, lineup: Lineup) -> None:
    set_stock(db, [lineup["dawnlit-desk"][(6500, "solo")]], 0)
    response = client.post(SUBMIT, json={"answers": answers(goal="daytime_focus")})
    assert response.json()["recommendation"]["variant"]["id"] == lineup["dawnlit-desk"][(5500, "solo")].id


def test_submit_quiz_falls_back_to_any_in_stock_variant(
    client: TestClient, db: Session, lineup: Lineup
) -> None:
    desk = lineup["dawnlit-desk"]
    set_stock(db, [v for k, v in desk.items() if k != (4000, "duo")], 0)
    response = client.post(SUBMIT, json={"answers": answers(goal="daytime_focus")})
    assert response.json()["recommendation"]["variant"]["id"] == desk[(4000, "duo")].id


def test_submit_quiz_falls_back_to_next_product(client: TestClient, db: Session, lineup: Lineup) -> None:
    set_stock(db, list(lineup["dawnlit-desk"].values()), 0)
    body = client.post(SUBMIT, json={"answers": answers()}).json()
    assert body["recommendation"]["product"]["slug"] == "dawnlit-panel"
    assert body["recommendation"]["variant"]["id"] == lineup["dawnlit-panel"][(5500, "solo")].id
    assert body["routine"]["distance_cm"] == 50
    assert body["recommendation"]["reason_keys"][0] == "quiz:reasons.panel"


def test_submit_quiz_low_stock_counts_as_available(client: TestClient, db: Session, lineup: Lineup) -> None:
    variant = lineup["dawnlit-desk"][(6500, "solo")]
    set_stock(db, [variant], 3)
    body = client.post(SUBMIT, json={"answers": answers(goal="daytime_focus")}).json()
    assert body["recommendation"]["variant"]["id"] == variant.id
    assert body["recommendation"]["variant"]["stock_status"] == "low_stock"


def test_submit_quiz_everything_out_of_stock(client: TestClient, db: Session, lineup: Lineup) -> None:
    set_stock(db, [v for vs in lineup.values() for v in vs.values()], 0)
    body = client.post(SUBMIT, json={"answers": answers(setting="travel")}).json()
    assert body["recommendation"]["variant"]["id"] == lineup["dawnlit-go"][(5500, "solo")].id
    assert body["recommendation"]["variant"]["stock_status"] == "out_of_stock"
    assert body["recommendation"]["product"]["stock_status"] == "out_of_stock"


def test_submit_quiz_links_user_and_cart(
    login_as: Callable[[User], TestClient], make_user: Callable[..., User], db: Session, lineup: Lineup
) -> None:
    user = make_user()
    cart = make_cart(db, user=user)
    response = login_as(user).post(SUBMIT, json={"answers": answers()})
    assert response.status_code == 201
    row = db.scalar(select(QuizResult).where(QuizResult.id == response.json()["id"]))
    assert row is not None
    assert row.user_id == user.id
    assert row.cart_id == cart.id


def test_submit_quiz_links_guest_cart(client: TestClient, db: Session, lineup: Lineup) -> None:
    cart = make_cart(db)
    assert cart.token
    client.cookies.set(CART_COOKIE, sign_cart_token(cart.token))
    response = client.post(SUBMIT, json={"answers": answers()})
    row = db.scalar(select(QuizResult).where(QuizResult.id == response.json()["id"]))
    assert row is not None
    assert row.cart_id == cart.id
    client.cookies.set(CART_COOKIE, "forged.0123456789abcdef0123456789abcdef")
    forged = client.post(SUBMIT, json={"answers": answers()})
    forged_row = db.scalar(select(QuizResult).where(QuizResult.id == forged.json()["id"]))
    assert forged_row is not None
    assert forged_row.cart_id is None


def test_submit_quiz_without_products(client: TestClient) -> None:
    assert_error(client.post(SUBMIT, json={"answers": answers()}), 404, "PRODUCT_NOT_FOUND")


@pytest.mark.parametrize(
    "payload",
    [
        {"answers": answers(goal="cure")},
        {"answers": {k: v for k, v in answers().items() if k != "setting"}},
        {},
        {"answers": answers(), "extra": 1},
    ],
)
def test_submit_quiz_validation(client: TestClient, payload: dict[str, Any]) -> None:
    assert_error(client.post(SUBMIT, json=payload), 422, "VALIDATION_ERROR")


def test_submit_quiz_requires_csrf(anon_client: TestClient) -> None:
    assert_error(anon_client.post(SUBMIT, json={"answers": answers()}), 403, "CSRF_FAILED")


def test_submit_quiz_rate_limited(
    client: TestClient, lineup: Lineup, frozen_time: time_machine.Traveller
) -> None:
    for _ in range(20):
        assert client.post(SUBMIT, json={"answers": answers()}).status_code == 201
    response = client.post(SUBMIT, json={"answers": answers()})
    assert_error(response, 429, "RATE_LIMITED")
    assert int(response.headers["Retry-After"]) > 0
