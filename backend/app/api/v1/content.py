"""Routes for the `content` tag (docs/openapi.yaml): FAQs and the contact form."""

from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, Request

from app.api.deps import DbSession, OptionalUser, get_client_ip
from app.api.v1.auth import error_responses
from app.core.rate_limit import RateLimit
from app.models.enums import FaqCategory
from app.schemas.content import ContactMessageAccepted, ContactMessageCreate, FaqListResponse
from app.services import content as content_service

router = APIRouter(tags=["content"])


@router.get(
    "/content/faqs",
    operation_id="listFaqs",
    response_model=FaqListResponse,
    responses=error_responses(422),
)
def list_faqs(db: DbSession, category: FaqCategory | None = None) -> FaqListResponse:
    return FaqListResponse(items=content_service.list_faqs(db, category))


@router.post(
    "/content/contact",
    operation_id="submitContactMessage",
    status_code=202,
    response_model=ContactMessageAccepted,
    responses=error_responses(403, 422, 429),
    dependencies=[Depends(RateLimit("content.contact", 5, 3600))],
)
def submit_contact_message(
    payload: ContactMessageCreate,
    request: Request,
    user: OptionalUser,
    db: DbSession,
    background_tasks: BackgroundTasks,
) -> ContactMessageAccepted:
    message = content_service.submit_contact_message(
        db, payload, user=user, client_ip=get_client_ip(request), background_tasks=background_tasks
    )
    db.commit()
    return ContactMessageAccepted(id=message.id, message=content_service.CONTACT_ACCEPTED_MESSAGE)
