"""Routes for the `catalog` tag (docs/openapi.yaml): categories and products."""

from __future__ import annotations

from typing import Annotated, Final

from fastapi import APIRouter, Depends, Path, Query

from app.api.deps import DbSession
from app.api.v1.auth import error_responses
from app.core.pagination import PageParams
from app.models.enums import ProductSort
from app.schemas.catalog import CategoryListResponse, ProductCardListResponse, ProductDetail, ProductListPage
from app.services import catalog as catalog_service

router = APIRouter(tags=["catalog"])

SLUG_PATTERN: Final = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
Slug = Annotated[str, Path(pattern=SLUG_PATTERN, max_length=160)]


@router.get("/categories", operation_id="listCategories", response_model=CategoryListResponse)
def list_categories(db: DbSession) -> CategoryListResponse:
    return CategoryListResponse(items=catalog_service.list_categories(db))


@router.get(
    "/products",
    operation_id="listProducts",
    response_model=ProductListPage,
    responses=error_responses(404, 422),
)
def list_products(
    db: DbSession,
    page: Annotated[PageParams, Depends()],
    category: Annotated[str | None, Query(description="Category slug.")] = None,
    sort: ProductSort = ProductSort.FEATURED,
    q: Annotated[
        str | None, Query(max_length=80, description="Case-insensitive name/tagline search.")
    ] = None,
) -> ProductListPage:
    return catalog_service.list_products(db, category_slug=category, sort=sort, q=q, params=page)


@router.get(
    "/products/{slug}",
    operation_id="getProduct",
    response_model=ProductDetail,
    responses=error_responses(404, 422),
)
def get_product(slug: Slug, db: DbSession) -> ProductDetail:
    return catalog_service.get_product_detail(db, slug)


@router.get(
    "/products/{slug}/related",
    operation_id="listRelatedProducts",
    response_model=ProductCardListResponse,
    responses=error_responses(404, 422),
)
def list_related_products(
    slug: Slug, db: DbSession, limit: Annotated[int, Query(ge=1, le=8)] = 3
) -> ProductCardListResponse:
    return ProductCardListResponse(items=catalog_service.list_related_products(db, slug, limit=limit))
