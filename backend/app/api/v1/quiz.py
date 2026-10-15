"""Routes for the `quiz` tag (docs/openapi.yaml): submit answers → recommendation + routine."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, OptionalUser
from app.api.v1.auth import CartCookie, error_responses
from app.core.rate_limit import RateLimit
from app.core.security import verify_cart_token
from app.schemas.quiz import QuizResult, QuizSubmitRequest
from app.services import quiz as quiz_service

router = APIRouter(tags=["quiz"])


@router.post(
    "/quiz/submit",
    operation_id="submitQuiz",
    status_code=201,
    response_model=QuizResult,
    responses=error_responses(403, 422, 429),
    dependencies=[Depends(RateLimit("quiz.submit", 20, 60))],
)
def submit_quiz(
    payload: QuizSubmitRequest, user: OptionalUser, db: DbSession, dl_cart: CartCookie = None
) -> QuizResult:
    guest_token = verify_cart_token(dl_cart) if dl_cart else None
    result = quiz_service.submit_quiz(db, payload.answers, user=user, guest_token=guest_token)
    db.commit()
    return result
