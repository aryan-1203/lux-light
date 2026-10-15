"""Blog service (public, published posts only). Owner: Backend Core.

A post is public when ``status = published`` and ``published_at <= now`` (scheduled posts stay hidden).
Bodies are returned as markdown; the client renders them without raw HTML.
"""

from __future__ import annotations

from typing import Final

from sqlalchemy import ColumnElement, and_, func, select
from sqlalchemy.orm import Session

from app.core import clock
from app.core.errors import NotFoundError
from app.core.pagination import PageParams, paginate
from app.models import BlogPost
from app.models.enums import BlogStatus
from app.schemas import blog as schemas
from app.schemas.catalog import SeoMeta

SEO_DESCRIPTION_MAX: Final = 160


def is_public() -> ColumnElement[bool]:
    return and_(
        BlogPost.status == BlogStatus.PUBLISHED,
        BlogPost.published_at.is_not(None),
        BlogPost.published_at <= clock.now_utc(),
    )


def build_summary(post: BlogPost) -> schemas.BlogPostSummary:
    assert post.published_at is not None
    return schemas.BlogPostSummary(
        id=post.id,
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt,
        cover_image_url=post.cover_image_url,
        cover_image_alt=post.cover_image_alt,
        author_name=post.author_name,
        tags=[str(t) for t in post.tags or []],
        published_at=post.published_at,
        reading_time_minutes=post.reading_time_minutes,
    )


def list_posts(db: Session, *, tag: str | None, params: PageParams) -> schemas.BlogPostSummaryPage:
    stmt = select(BlogPost).where(is_public())
    if tag:
        stmt = stmt.where(func.json_contains(BlogPost.tags, func.json_quote(tag)) == 1)
    stmt = stmt.order_by(BlogPost.published_at.desc(), BlogPost.id.desc())
    posts, total = paginate(db, stmt, params)
    return schemas.BlogPostSummaryPage(
        items=[build_summary(p) for p in posts], page=params.page, page_size=params.page_size, total=total
    )


def _truncate(text: str, limit: int) -> str:
    text = " ".join(text.split())
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def get_post(db: Session, slug: str) -> schemas.BlogPost:
    """404 ``BLOG_POST_NOT_FOUND`` for unknown, draft or scheduled posts."""
    post = db.scalar(select(BlogPost).where(BlogPost.slug == slug, is_public()))
    if post is None:
        raise NotFoundError("BLOG_POST_NOT_FOUND", "Blog post not found.")
    summary = build_summary(post)
    return schemas.BlogPost(
        **summary.model_dump(),
        body_md=post.body_md,
        seo=SeoMeta(
            title=post.seo_title or post.title,
            description=_truncate(post.seo_description or post.excerpt or post.title, SEO_DESCRIPTION_MAX),
            og_image_url=post.og_image_url or post.cover_image_url,
        ),
        updated_at=post.updated_at,
    )


def list_public_posts_for_sitemap(db: Session) -> list[BlogPost]:
    return list(db.scalars(select(BlogPost).where(is_public()).order_by(BlogPost.published_at.desc())).all())
