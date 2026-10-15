"""API schemas for the `blog` area (docs/openapi.yaml `x-py-module: app.schemas.blog`)."""

from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.schemas.catalog import SeoMeta
from app.schemas.common import ApiModel


class BlogPostSummary(ApiModel):
    id: int = Field(ge=1)
    slug: str
    title: str
    excerpt: str
    cover_image_url: str | None
    cover_image_alt: str | None
    author_name: str
    tags: list[str]
    published_at: datetime
    reading_time_minutes: int


class BlogPostSummaryPage(ApiModel):
    items: list[BlogPostSummary]
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total: int = Field(ge=0)


class BlogPost(ApiModel):
    id: int = Field(ge=1)
    slug: str
    title: str
    excerpt: str
    cover_image_url: str | None
    cover_image_alt: str | None
    author_name: str
    tags: list[str]
    published_at: datetime
    reading_time_minutes: int
    body_md: str = Field(description="Markdown. Rendered client-side with react-markdown (no raw HTML).")
    seo: SeoMeta
    updated_at: datetime
