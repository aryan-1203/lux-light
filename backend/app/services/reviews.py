"""Reviews service: public listings, customer submissions, rating aggregates. Owner: Backend Core.

Only ``approved`` reviews are public. New reviews start ``pending``; ``verified_purchase`` is computed
at creation (the user has a ``delivered`` order containing the product). Rating aggregates on
``products`` are recomputed by ``recompute_product_rating`` (called by admin moderation).
"""

from __future__ import annotations

from typing import Any, Final, cast

from sqlalchemy import Select, exists, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import ConflictError
from app.core.pagination import PageParams, paginate
from app.models import Order, OrderItem, Product, Review, User
from app.models.catalog import EMPTY_RATING_DIST
from app.models.enums import OrderStatus, ReviewSort, ReviewSource, ReviewStatus
from app.schemas import reviews as schemas
from app.services import catalog as catalog_service

AUTHOR_NAME_MAX: Final = 80
ANONYMOUS_AUTHOR: Final = "Dawnlit customer"


def recompute_product_rating(db: Session, product_id: int) -> None:
    """Lock the product row and recompute rating_count/sum/dist from approved reviews."""
    product = db.scalar(select(Product).where(Product.id == product_id).with_for_update())
    if product is None:
        return
    dist = dict(EMPTY_RATING_DIST)
    rows = db.execute(
        select(Review.rating, func.count())
        .where(Review.product_id == product_id, Review.status == ReviewStatus.APPROVED)
        .group_by(Review.rating)
    ).all()
    for rating, count in rows:
        dist[str(int(rating))] = int(count)
    product.rating_dist = dist
    product.rating_count = sum(dist.values())
    product.rating_sum = sum(int(star) * n for star, n in dist.items())
    db.flush()


def display_name(full_name: str | None) -> str:
    """``"Priya Sharma"`` → ``"Priya S."``; a single name is kept; no name → generic label."""
    parts = (full_name or "").split()
    if not parts:
        return ANONYMOUS_AUTHOR
    name = parts[0] if len(parts) == 1 else f"{parts[0]} {parts[-1][0].upper()}."
    return name[:AUTHOR_NAME_MAX]


def has_delivered_purchase(db: Session, user_id: int, product_id: int) -> bool:
    stmt = select(
        exists().where(
            Order.user_id == user_id,
            Order.status == OrderStatus.DELIVERED,
            OrderItem.order_id == Order.id,
            OrderItem.product_id == product_id,
        )
    )
    return bool(db.scalar(stmt))


def build_review(review: Review, product: Product) -> schemas.Review:
    return schemas.Review(
        id=review.id,
        product=catalog_service.build_product_ref(product),
        rating=review.rating,
        title=review.title,
        body=review.body,
        author_name=review.author_name,
        verified_purchase=review.verified_purchase,
        created_at=review.created_at,
    )


def _page(db: Session, stmt: Select[Review, Product], params: PageParams) -> schemas.ReviewPage:
    # core.pagination.paginate is typed for single-entity selects (Select[Any]); rows are (Review, Product).
    rows, total = paginate(db, cast("Select[Any]", stmt), params)
    return schemas.ReviewPage(
        items=[build_review(review, product) for review, product in rows],
        page=params.page,
        page_size=params.page_size,
        total=total,
    )


def list_product_reviews(
    db: Session, slug: str, *, sort: ReviewSort, rating: int | None, params: PageParams
) -> schemas.ReviewPage:
    product = catalog_service.get_visible_product_by_slug(db, slug)
    stmt = (
        select(Review, Product)
        .join(Product, Product.id == Review.product_id)
        .where(Review.product_id == product.id, Review.status == ReviewStatus.APPROVED)
    )
    if rating is not None:
        stmt = stmt.where(Review.rating == rating)
    if sort is ReviewSort.HIGHEST:
        stmt = stmt.order_by(Review.rating.desc(), Review.created_at.desc(), Review.id.desc())
    elif sort is ReviewSort.LOWEST:
        stmt = stmt.order_by(Review.rating.asc(), Review.created_at.desc(), Review.id.desc())
    else:
        stmt = stmt.order_by(Review.created_at.desc(), Review.id.desc())
    return _page(db, stmt, params)


def list_reviews(
    db: Session, *, min_rating: int, verified_only: bool, params: PageParams
) -> schemas.ReviewPage:
    stmt = (
        select(Review, Product)
        .join(Product, Product.id == Review.product_id)
        .where(
            Review.status == ReviewStatus.APPROVED,
            Review.rating >= min_rating,
            catalog_service.product_is_visible(),
        )
        .order_by(Review.created_at.desc(), Review.id.desc())
    )
    if verified_only:
        stmt = stmt.where(Review.verified_purchase.is_(True))
    return _page(db, stmt, params)


def _already_reviewed() -> ConflictError:
    return ConflictError("REVIEW_ALREADY_EXISTS", "You have already reviewed this product.")


def create_review(db: Session, user: User, slug: str, data: schemas.ReviewCreate) -> schemas.MyReview:
    """Pending review by ``user``. 404 ``PRODUCT_NOT_FOUND``, 409 ``REVIEW_ALREADY_EXISTS``."""
    product = catalog_service.get_visible_product_by_slug(db, slug)
    if db.scalar(select(Review.id).where(Review.product_id == product.id, Review.user_id == user.id)):
        raise _already_reviewed()
    review = Review(
        product_id=product.id,
        user_id=user.id,
        author_name=display_name(user.full_name),
        rating=data.rating,
        title=data.title,
        body=data.body,
        status=ReviewStatus.PENDING,
        verified_purchase=has_delivered_purchase(db, user.id, product.id),
        source=ReviewSource.CUSTOMER,
    )
    db.add(review)
    try:
        with db.begin_nested():
            db.flush()
    except IntegrityError as exc:  # concurrent duplicate submission
        raise _already_reviewed() from exc
    return schemas.MyReview(
        id=review.id,
        product=catalog_service.build_product_ref(product),
        rating=review.rating,
        title=review.title,
        body=review.body,
        status=review.status,
        verified_purchase=review.verified_purchase,
        created_at=review.created_at,
    )
