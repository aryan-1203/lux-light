"""Content service: FAQs and the contact form. Owner: Backend Core.

Contact submissions are stored in ``contact_messages``; a filled honeypot (``website``) is accepted
like any other submission but stored as ``spam`` and triggers no notification.
"""

from __future__ import annotations

import logging
from typing import Final

from fastapi import BackgroundTasks
from sqlalchemy import case, select
from sqlalchemy.orm import Session

from app.core.security import ip_hash
from app.models import ContactMessage, Faq, User
from app.models.enums import ContactMessageStatus, FaqCategory, NotificationKind
from app.schemas import content as schemas
from app.services import notifications as notifications_service

logger = logging.getLogger("app.content")

CONTACT_ACCEPTED_MESSAGE: Final = "Thanks for reaching out — we'll reply within 1–2 business days."
_CATEGORY_ORDER: Final = {category.value: index for index, category in enumerate(FaqCategory)}


def list_faqs(db: Session, category: FaqCategory | None) -> list[schemas.Faq]:
    """Active FAQs ordered by category (enum order) then sort_order."""
    stmt = select(Faq).where(Faq.is_active.is_(True))
    if category is not None:
        stmt = stmt.where(Faq.category == category)
    stmt = stmt.order_by(
        case(_CATEGORY_ORDER, value=Faq.category, else_=len(_CATEGORY_ORDER)), Faq.sort_order, Faq.id
    )
    return [schemas.Faq.model_validate(faq) for faq in db.scalars(stmt).all()]


def submit_contact_message(
    db: Session,
    data: schemas.ContactMessageCreate,
    *,
    user: User | None,
    client_ip: str,
    background_tasks: BackgroundTasks | None,
) -> ContactMessage:
    is_spam = bool(data.website and data.website.strip())
    message = ContactMessage(
        name=data.name,
        email=str(data.email),
        phone=data.phone,
        topic=data.topic,
        order_number=(data.order_number or "").upper() or None,
        message=data.message,
        status=ContactMessageStatus.SPAM if is_spam else ContactMessageStatus.NEW,
        user_id=user.id if user is not None else None,
        ip_hash=ip_hash(client_ip),
    )
    db.add(message)
    db.flush()
    if not is_spam:
        try:
            notifications_service.notify(
                db,
                NotificationKind.CONTACT_RECEIVED,
                user=user,
                email=message.email,
                context={"contact_message_id": message.id, "topic": message.topic.value},
                background_tasks=background_tasks,
            )
        except NotImplementedError:
            logger.debug("notifications.notify not implemented yet; contact acknowledgement skipped")
    return message
