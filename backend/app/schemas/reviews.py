"""API schemas for the `reviews` area (docs/openapi.yaml `x-py-module: app.schemas.reviews`)."""

from __future__ import annotations

import html
import re
from datetime import datetime
from typing import Final

import nh3
from pydantic import Field, field_validator

from app.models.enums import ReviewStatus
from app.schemas.catalog import ProductRef
from app.schemas.common import ApiModel

_CONTROL_RE: Final = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_SPACES_RE: Final = re.compile(r"[ \t]+")
_BLANK_LINES_RE: Final = re.compile(r"\n{3,}")


def sanitize_plain_text(value: str, *, multiline: bool) -> str:
    """Plain-text sanitiser for user-generated copy (rendered escaped by the client).

    Strips HTML tags (and script/style contents), control characters and excess whitespace.
    """
    text = value.replace("\r\n", "\n").replace("\r", "\n")
    text = html.unescape(nh3.clean(text, tags=set()))
    text = _CONTROL_RE.sub("", text)
    if multiline:
        lines = [_SPACES_RE.sub(" ", line).strip() for line in text.split("\n")]
        text = _BLANK_LINES_RE.sub("\n\n", "\n".join(lines))
    else:
        text = _SPACES_RE.sub(" ", text.replace("\n", " "))
    return text.strip()


class Review(ApiModel):
    id: int = Field(ge=1)
    product: ProductRef
    rating: int = Field(ge=1, le=5)
    title: str
    body: str
    author_name: str = Field(description='Display name, e.g. "Priya S." (first name + initial).')
    verified_purchase: bool
    created_at: datetime


class ReviewPage(ApiModel):
    items: list[Review]
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total: int = Field(ge=0)


class ReviewCreate(ApiModel):
    rating: int = Field(ge=1, le=5)
    title: str = Field(min_length=3, max_length=120)
    body: str = Field(min_length=10, max_length=2000)

    @field_validator("title", mode="before")
    @classmethod
    def _clean_title(cls, value: object) -> object:
        return sanitize_plain_text(value, multiline=False) if isinstance(value, str) else value

    @field_validator("body", mode="before")
    @classmethod
    def _clean_body(cls, value: object) -> object:
        return sanitize_plain_text(value, multiline=True) if isinstance(value, str) else value


class MyReview(ApiModel):
    id: int = Field(ge=1)
    product: ProductRef
    rating: int
    title: str
    body: str
    status: ReviewStatus
    verified_purchase: bool = Field(
        description="Computed server-side: user has a delivered order containing this product."
    )
    created_at: datetime
