"""API schemas for the `content` area (docs/openapi.yaml `x-py-module: app.schemas.content`)."""

from __future__ import annotations

from typing import Annotated

from pydantic import EmailStr, Field, field_validator

from app.models.enums import ContactTopic, FaqCategory
from app.schemas.common import ApiModel
from app.schemas.reviews import sanitize_plain_text
from app.schemas.users import PHONE_DESCRIPTION, PHONE_PATTERN


class Faq(ApiModel):
    id: int = Field(ge=1)
    question: str
    answer_md: str
    category: FaqCategory
    sort_order: int


class FaqListResponse(ApiModel):
    items: list[Faq]


class ContactMessageCreate(ApiModel):
    name: str = Field(min_length=1, max_length=120)
    email: Annotated[EmailStr, Field(max_length=254)]
    phone: Annotated[str, Field(pattern=PHONE_PATTERN)] | None = Field(
        default=None, description=PHONE_DESCRIPTION
    )
    topic: ContactTopic
    order_number: Annotated[str, Field(max_length=20)] | None = None
    message: str = Field(min_length=10, max_length=4000)
    website: Annotated[str, Field(max_length=200)] | None = Field(
        default=None,
        description="Honeypot. Must be empty; non-empty submissions are accepted (202) but stored as spam.",
    )

    @field_validator("email", mode="before")
    @classmethod
    def _normalise_email(cls, value: object) -> object:
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("name", "order_number", mode="before")
    @classmethod
    def _clean_line(cls, value: object) -> object:
        return sanitize_plain_text(value, multiline=False) if isinstance(value, str) else value

    @field_validator("message", mode="before")
    @classmethod
    def _clean_message(cls, value: object) -> object:
        return sanitize_plain_text(value, multiline=True) if isinstance(value, str) else value


class ContactMessageAccepted(ApiModel):
    id: int = Field(ge=1)
    message: str
