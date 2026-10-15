"""Quiz service — deterministic recommendation + routine (PLAN §1.10). Owner: Backend Core.

i18n keys emitted (namespace ``quiz``, owned by Frontend Experience):
* steps: ``quiz:routine.steps.<id>.title`` / ``.body`` for ids ``wake``, ``lightSession``,
  ``daylightBreak``, ``screensDown``; shift workers get ``quiz:routine.steps.wake.bodyShiftWork``
  ("within an hour of waking") as the wake body.
* reasons: ``quiz:reasons.<desk|panel|go>``, ``quiz:reasons.k<kelvin>``, ``quiz:reasons.goal_<goal>``.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Final

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.models import Cart, Product, ProductVariant, QuizResult, User
from app.models.enums import QuizGoal, QuizScreenTime, QuizSetting, QuizWakeTime, QuizWorkStyle, StockStatus
from app.schemas import quiz as schemas
from app.services import catalog as catalog_service

DESK: Final = "dawnlit-desk"
PANEL: Final = "dawnlit-panel"
GO: Final = "dawnlit-go"
PRODUCT_ORDER: Final = (DESK, PANEL, GO)
PRODUCT_KEYS: Final = {DESK: "desk", PANEL: "panel", GO: "go"}
DISTANCE_CM: Final = {DESK: 35, PANEL: 50, GO: 25}
DEFAULT_DISTANCE_CM: Final = 35
SOLO: Final = "solo"

WAKE_ANCHORS: Final = {
    QuizWakeTime.EARLY: 5 * 60 + 30,
    QuizWakeTime.REGULAR: 7 * 60,
    QuizWakeTime.LATE: 8 * 60 + 30,
}
SHIFT_WORK_ANCHOR: Final = 7 * 60
SESSION_MINUTES: Final = {
    QuizGoal.MORNING_ENERGY: 15,
    QuizGoal.DAYTIME_FOCUS: 20,
    QuizGoal.CONSISTENT_ROUTINE: 15,
    QuizGoal.TRAVEL_ROUTINE: 10,
}
DAYLIGHT_BREAK_AT: Final = 13 * 60
SCREENS_DOWN_AT: Final = 21 * 60 + 30
SCREENS_DOWN_LATE_AT: Final = 22 * 60 + 30


def _hhmm(minutes: int) -> str:
    minutes %= 24 * 60
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def _step_keys(step_id: str) -> tuple[str, str]:
    return f"quiz:routine.steps.{step_id}.title", f"quiz:routine.steps.{step_id}.body"


# ---- pure mapping --------------------------------------------------------------------------------


def choose_product_slug(answers: schemas.QuizAnswers) -> str:
    if (
        answers.setting is QuizSetting.TRAVEL
        or answers.goal is QuizGoal.TRAVEL_ROUTINE
        or answers.work_style is QuizWorkStyle.ON_THE_MOVE
    ):
        return GO
    if answers.setting is QuizSetting.ROOM:
        return PANEL
    return DESK


def choose_kelvin(answers: schemas.QuizAnswers, product_slug: str) -> int:
    if answers.goal is QuizGoal.DAYTIME_FOCUS or answers.work_style is QuizWorkStyle.SHIFT_WORK:
        kelvin = 6500
    elif answers.screen_time is QuizScreenTime.HIGH and answers.goal is QuizGoal.CONSISTENT_ROUTINE:
        kelvin = 4000
    else:
        kelvin = 5500
    if product_slug == GO or (product_slug == PANEL and kelvin == 4000):
        return 5500
    return kelvin


def build_routine(answers: schemas.QuizAnswers, product_slug: str) -> schemas.RoutinePlan:
    shift_work = answers.work_style is QuizWorkStyle.SHIFT_WORK
    anchor = SHIFT_WORK_ANCHOR if shift_work else WAKE_ANCHORS[answers.wake_time]
    session = SESSION_MINUTES[answers.goal]
    window_start = anchor + 15
    window_end = anchor + (180 if answers.goal is QuizGoal.DAYTIME_FOCUS else 75)

    wake_title, wake_body = _step_keys("wake")
    if shift_work:
        wake_body = "quiz:routine.steps.wake.bodyShiftWork"
    planned: list[tuple[int, str, str, int | None]] = [
        (anchor, wake_title, wake_body, None),
        (window_start, *_step_keys("lightSession"), session),
    ]
    if answers.screen_time is not QuizScreenTime.LOW:
        planned.append((DAYLIGHT_BREAK_AT, *_step_keys("daylightBreak"), None))
    late = answers.wake_time is QuizWakeTime.LATE
    planned.append((SCREENS_DOWN_LATE_AT if late else SCREENS_DOWN_AT, *_step_keys("screensDown"), None))

    return schemas.RoutinePlan(
        session_minutes=session,
        window_start=_hhmm(window_start),
        window_end=_hhmm(window_end),
        distance_cm=DISTANCE_CM.get(product_slug, DEFAULT_DISTANCE_CM),
        steps=[
            schemas.RoutineStep(
                order=index, time=_hhmm(at), title_key=title, body_key=body, duration_minutes=duration
            )
            for index, (at, title, body, duration) in enumerate(planned, start=1)
        ],
    )


def reason_keys(product_slug: str, kelvin: int, goal: QuizGoal) -> list[str]:
    key = PRODUCT_KEYS.get(product_slug, product_slug)
    return [f"quiz:reasons.{key}", f"quiz:reasons.k{kelvin}", f"quiz:reasons.goal_{goal.value}"]


# ---- variant selection with stock fallback -------------------------------------------------------


@dataclass(frozen=True)
class Pick:
    product: Product
    variant: ProductVariant
    status: StockStatus


def select_variant(db: Session, product_slug: str, kelvin: int) -> Pick:
    """Chosen variant (kelvin + solo) → product default → any in-stock variant of the product →
    the same for the next products in order desk → panel → go. When nothing is in stock the
    first candidate's default variant is returned anyway (shown as out of stock)."""
    order = [product_slug, *(s for s in PRODUCT_ORDER if s != product_slug)]
    products = {
        p.slug: p
        for p in db.scalars(
            select(Product).where(Product.slug.in_(order), catalog_service.product_is_visible())
        ).all()
    }
    candidates = [products[s] for s in order if s in products]
    if not candidates:
        raise NotFoundError("PRODUCT_NOT_FOUND", "No products are available right now.")
    variants = catalog_service.active_variants(db, [p.id for p in candidates])
    statuses = catalog_service.stock_statuses(db, [v for vs in variants.values() for v in vs])

    def status_of(v: ProductVariant) -> StockStatus:
        return statuses.get(v.id, StockStatus.OUT_OF_STOCK)

    def in_stock(vs: Sequence[ProductVariant]) -> ProductVariant | None:
        return next((v for v in vs if status_of(v) is not StockStatus.OUT_OF_STOCK), None)

    for index, product in enumerate(candidates):
        product_variants = variants[product.id]
        preferred: list[ProductVariant] = []
        if index == 0 and product.slug == product_slug:
            preferred = [v for v in product_variants if v.colour_temperature_k == kelvin and v.bundle == SOLO]
        preferred.append(catalog_service.default_variant(product_variants))
        chosen = in_stock(preferred) or in_stock(product_variants)
        if chosen is not None:
            return Pick(product, chosen, status_of(chosen))
    first = candidates[0]
    fallback = catalog_service.default_variant(variants[first.id])
    return Pick(first, fallback, status_of(fallback))


# ---- submission ----------------------------------------------------------------------------------


def _linked_cart_id(db: Session, user: User | None, guest_token: str | None) -> int | None:
    if user is not None:
        return db.scalar(select(Cart.id).where(Cart.user_id == user.id))
    if guest_token:
        return db.scalar(select(Cart.id).where(Cart.token == guest_token))
    return None


def submit_quiz(
    db: Session, answers: schemas.QuizAnswers, *, user: User | None, guest_token: str | None
) -> schemas.QuizResult:
    target_slug = choose_product_slug(answers)
    pick = select_variant(db, target_slug, choose_kelvin(answers, target_slug))
    routine = build_routine(answers, pick.product.slug)
    card = catalog_service.build_product_cards(db, [pick.product])[0]
    result = QuizResult(
        user_id=user.id if user is not None else None,
        cart_id=_linked_cart_id(db, user, guest_token),
        answers=answers.model_dump(mode="json"),
        recommended_product_id=pick.product.id,
        recommended_variant_id=pick.variant.id,
        routine=routine.model_dump(mode="json"),
    )
    db.add(result)
    db.flush()
    return schemas.QuizResult(
        id=result.id,
        answers=answers,
        recommendation=schemas.QuizRecommendation(
            product=card,
            variant=catalog_service.build_variant(pick.variant, pick.status),
            reason_keys=reason_keys(pick.product.slug, pick.variant.colour_temperature_k, answers.goal),
        ),
        routine=routine,
        created_at=result.created_at,
    )
