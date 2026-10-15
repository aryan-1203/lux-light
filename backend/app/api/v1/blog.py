"""Routes for the `blog` tag (docs/openapi.yaml): published posts."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DbSession
from app.api.v1.auth import error_responses
from app.api.v1.catalog import Slug
from app.core.pagination import PageParams
from app.schemas.blog import BlogPost, BlogPostSummaryPage
from app.services import blog as blog_service

router = APIRouter(tags=["blog"])


@router.get(
    "/blog/posts",
    operation_id="listBlogPosts",
    response_model=BlogPostSummaryPage,
    responses=error_responses(422),
)
def list_blog_posts(
    db: DbSession, page: Annotated[PageParams, Depends()], tag: str | None = None
) -> BlogPostSummaryPage:
    return blog_service.list_posts(db, tag=tag, params=page)


@router.get(
    "/blog/posts/{slug}",
    operation_id="getBlogPost",
    response_model=BlogPost,
    responses=error_responses(404, 422),
)
def get_blog_post(slug: Slug, db: DbSession) -> BlogPost:
    return blog_service.get_post(db, slug)
