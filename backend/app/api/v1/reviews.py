"""Routes for the `reviews` tag (docs/openapi.yaml): public listings and review submission."""

from __future__ import annotations

from typing import Annotated, Final

from fastapi import APIRouter, Depends, Query

from app.api.deps import CurrentUser, DbSession
from app.api.v1.auth import error_responses
from app.api.v1.catalog import Slug
from app.core.pagination import PageParams
from app.core.rate_limit import check_rate_limit
from app.models.enums import ReviewSort
from app.schemas.reviews import MyReview, ReviewCreate, ReviewPage
from app.services import reviews as reviews_service

router = APIRouter(tags=["reviews"])

CREATE_REVIEW_LIMIT: Final = (5, 3600)


@router.get(
    "/products/{slug}/reviews",
    operation_id="listProductReviews",
    response_model=ReviewPage,
    responses=error_responses(404, 422),
)
def list_product_reviews(
    slug: Slug,
    db: DbSession,
    page: Annotated[PageParams, Depends()],
    sort: ReviewSort = ReviewSort.NEWEST,
    rating: Annotated[int | None, Query(ge=1, le=5, description="Exact star filter.")] = None,
) -> ReviewPage:
    return reviews_service.list_product_reviews(db, slug, sort=sort, rating=rating, params=page)


@router.post(
    "/products/{slug}/reviews",
    operation_id="createReview",
    status_code=201,
    response_model=MyReview,
    responses=error_responses(401, 403, 404, 409, 422, 429),
)
def create_review(slug: Slug, payload: ReviewCreate, user: CurrentUser, db: DbSession) -> MyReview:
    check_rate_limit(f"reviews.create:user:{user.id}", *CREATE_REVIEW_LIMIT)
    review = reviews_service.create_review(db, user, slug, payload)
    db.commit()
    return review


@router.get(
    "/reviews",
    operation_id="listReviews",
    response_model=ReviewPage,
    responses=error_responses(422),
)
def list_reviews(
    db: DbSession,
    page: Annotated[PageParams, Depends()],
    min_rating: Annotated[int, Query(ge=1, le=5)] = 4,
    verified_only: bool = False,
) -> ReviewPage:
    return reviews_service.list_reviews(db, min_rating=min_rating, verified_only=verified_only, params=page)
