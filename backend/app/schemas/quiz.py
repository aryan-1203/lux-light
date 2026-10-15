"""API schemas for the `quiz` area (docs/openapi.yaml `x-py-module: app.schemas.quiz`)."""

from __future__ import annotations

from datetime import datetime
from typing import Final

from pydantic import Field

from app.models.enums import QuizGoal, QuizScreenTime, QuizSetting, QuizWakeTime, QuizWorkStyle
from app.schemas.catalog import ProductCard, ProductVariant
from app.schemas.common import ApiModel

TIME_PATTERN: Final = r"^[0-2][0-9]:[0-5][0-9]$"


class QuizAnswers(ApiModel):
    wake_time: QuizWakeTime
    work_style: QuizWorkStyle
    screen_time: QuizScreenTime
    goal: QuizGoal
    setting: QuizSetting


class QuizSubmitRequest(ApiModel):
    answers: QuizAnswers


class RoutineStep(ApiModel):
    order: int
    time: str = Field(pattern=TIME_PATTERN, description="Local time HH:MM.")
    title_key: str = Field(
        description="i18n key in namespace `quiz`, e.g. quiz:routine.steps.lightSession.title"
    )
    body_key: str
    duration_minutes: int | None


class RoutinePlan(ApiModel):
    session_minutes: int
    window_start: str = Field(pattern=TIME_PATTERN)
    window_end: str = Field(pattern=TIME_PATTERN)
    distance_cm: int
    steps: list[RoutineStep]


class QuizRecommendation(ApiModel):
    product: ProductCard
    variant: ProductVariant
    reason_keys: list[str] = Field(description="i18n keys explaining the match (namespace `quiz`).")


class QuizResult(ApiModel):
    id: int = Field(ge=1)
    answers: QuizAnswers
    recommendation: QuizRecommendation
    routine: RoutinePlan
    created_at: datetime
