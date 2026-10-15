"""API schemas for the `catalog` area (docs/openapi.yaml `x-py-module: app.schemas.catalog`).

``ProductCard`` / ``ProductVariant`` / ``ProductImage`` are reused by the quiz, related products,
cart and admin modules.
"""

from __future__ import annotations

from typing import Final

from pydantic import Field

from app.models.enums import StockStatus
from app.schemas.common import ApiModel

PAISE_DESCRIPTION: Final = "Amount in paise (1 INR = 100 paise)."


class ImageRendition(ApiModel):
    width: int
    url: str


class ProductImage(ApiModel):
    id: int = Field(ge=1)
    url: str = Field(description="Largest rendition URL (/media/...).")
    alt: str
    width: int
    height: int
    renditions: list[ImageRendition]
    sort_order: int
    variant_id: int | None = Field(description="When set, the image is specific to a variant.")


class CategoryRef(ApiModel):
    id: int = Field(ge=1)
    slug: str
    name: str


class ProductRef(ApiModel):
    id: int = Field(ge=1)
    slug: str
    name: str


class Category(ApiModel):
    id: int = Field(ge=1)
    slug: str
    name: str
    description: str | None
    image_url: str | None
    sort_order: int
    product_count: int


class CategoryListResponse(ApiModel):
    items: list[Category]


class RatingDistribution(ApiModel):
    star_1: int
    star_2: int
    star_3: int
    star_4: int
    star_5: int


class RatingSummary(ApiModel):
    average: float = Field(ge=0, le=5, description="Rounded to 1 decimal; 0 when count = 0.")
    count: int
    distribution: RatingDistribution


class ProductCard(ApiModel):
    id: int = Field(ge=1)
    slug: str
    name: str
    tagline: str
    category: CategoryRef
    price_from_paise: int = Field(ge=0, description=PAISE_DESCRIPTION)
    compare_at_price_from_paise: int | None = Field(ge=0, description=PAISE_DESCRIPTION)
    primary_image: ProductImage | None
    rating: RatingSummary
    stock_status: StockStatus = Field(
        description="in_stock if any active variant is in stock; low_stock if all in-stock variants are low."
    )
    badges: list[str] = Field(description='Short merchandising labels, e.g. "Bestseller".')
    default_variant_id: int = Field(ge=1)


class ProductCardListResponse(ApiModel):
    items: list[ProductCard]


class ProductListPage(ApiModel):
    items: list[ProductCard]
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total: int = Field(ge=0)


class ProductVariant(ApiModel):
    id: int = Field(ge=1)
    sku: str = Field(description="Format DL-{PRODUCT}-{K}-{BUNDLE}, e.g. DL-DESK-5500-SOLO.")
    name: str
    colour_temperature_k: int = Field(description="Kelvin, e.g. 5500.")
    colour_temperature_label: str
    bundle: str = Field(description="Bundle code: solo | duo | floor_stand | travel_case (extensible).")
    bundle_label: str
    price_paise: int = Field(ge=0, description=PAISE_DESCRIPTION)
    compare_at_price_paise: int | None = Field(ge=0, description=PAISE_DESCRIPTION)
    stock_status: StockStatus
    is_default: bool


class ColourTemperatureOption(ApiModel):
    kelvin: int
    label: str


class BundleOption(ApiModel):
    code: str
    label: str


class ProductOptions(ApiModel):
    colour_temperatures: list[ColourTemperatureOption]
    bundles: list[BundleOption]


class ProductSpec(ApiModel):
    label: str = Field(max_length=80)
    value: str = Field(max_length=200)


class SeoMeta(ApiModel):
    title: str
    description: str
    og_image_url: str | None


class ProductDetail(ApiModel):
    id: int = Field(ge=1)
    slug: str
    name: str
    tagline: str
    description_md: str = Field(description="Markdown (compliance-reviewed copy).")
    highlights: list[str]
    specs: list[ProductSpec]
    badges: list[str]
    category: CategoryRef
    images: list[ProductImage]
    variants: list[ProductVariant] = Field(description="Active variants ordered by sort_order.")
    options: ProductOptions
    default_variant_id: int = Field(ge=1)
    rating: RatingSummary
    warranty_months: int
    return_window_days: int
    seo: SeoMeta
