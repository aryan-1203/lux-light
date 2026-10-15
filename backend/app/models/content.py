"""Content & engagement tables (DB_SCHEMA §8.1–8.5): reviews, blog_posts, faqs, contact_messages,
quiz_results."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.mysql import CHAR, MEDIUMTEXT, TINYINT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, created_at_column, pk_column, table_args, updated_at_column
from app.db.types import (
    FALSE_DEFAULT,
    JSON_ARRAY_DEFAULT,
    TRUE_DEFAULT,
    UTCDateTime,
    enum_type,
    int_default,
    str_default,
)
from app.models.enums import (
    BlogStatus,
    ContactMessageStatus,
    ContactTopic,
    FaqCategory,
    ReviewSource,
    ReviewStatus,
)

if TYPE_CHECKING:
    from app.models.catalog import Product


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = table_args(
        UniqueConstraint("product_id", "user_id"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="rating_range"),
        Index("ix_reviews_product_id_status_created_at", "product_id", "status", "created_at"),
        Index("ix_reviews_status_rating_created_at", "status", "rating", "created_at"),
    )

    id: Mapped[int] = pk_column()
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    author_name: Mapped[str] = mapped_column(String(80), nullable=False)
    rating: Mapped[int] = mapped_column(TINYINT, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ReviewStatus] = mapped_column(
        enum_type(ReviewStatus, 16),
        nullable=False,
        default=ReviewStatus.PENDING,
        server_default=str_default(ReviewStatus.PENDING.value),
    )
    verified_purchase: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=FALSE_DEFAULT
    )
    source: Mapped[ReviewSource] = mapped_column(
        enum_type(ReviewSource, 16),
        nullable=False,
        default=ReviewSource.CUSTOMER,
        server_default=str_default(ReviewSource.CUSTOMER.value),
    )
    moderated_by_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    moderated_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    moderation_note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    product: Mapped[Product] = relationship()


class BlogPost(Base):
    __tablename__ = "blog_posts"
    __table_args__ = table_args(
        UniqueConstraint("slug"),
        Index("ix_blog_posts_status_published_at", "status", "published_at"),
    )

    id: Mapped[int] = pk_column()
    slug: Mapped[str] = mapped_column(String(160), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    excerpt: Mapped[str] = mapped_column(
        String(400), nullable=False, default="", server_default=str_default("")
    )
    body_md: Mapped[str] = mapped_column(MEDIUMTEXT, nullable=False)
    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cover_image_alt: Mapped[str | None] = mapped_column(String(200), nullable=True)
    author_name: Mapped[str] = mapped_column(
        String(80), nullable=False, default="Dawnlit Team", server_default=str_default("Dawnlit Team")
    )
    tags: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list, server_default=JSON_ARRAY_DEFAULT
    )
    status: Mapped[BlogStatus] = mapped_column(
        enum_type(BlogStatus, 16),
        nullable=False,
        default=BlogStatus.DRAFT,
        server_default=str_default(BlogStatus.DRAFT.value),
    )
    published_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    reading_time_minutes: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=1, server_default=int_default(1)
    )
    seo_title: Mapped[str | None] = mapped_column(String(70), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(160), nullable=True)
    og_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_by_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()


class Faq(Base):
    __tablename__ = "faqs"
    __table_args__ = table_args(
        Index("ix_faqs_is_active_category_sort_order", "is_active", "category", "sort_order")
    )

    id: Mapped[int] = pk_column()
    question: Mapped[str] = mapped_column(String(300), nullable=False)
    answer_md: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[FaqCategory] = mapped_column(enum_type(FaqCategory, 24), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=int_default(0))
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=TRUE_DEFAULT
    )
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()


class ContactMessage(Base):
    __tablename__ = "contact_messages"
    __table_args__ = table_args(Index("ix_contact_messages_status_created_at", "status", "created_at"))

    id: Mapped[int] = pk_column()
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(16), nullable=True)
    topic: Mapped[ContactTopic] = mapped_column(enum_type(ContactTopic, 16), nullable=False)
    order_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ContactMessageStatus] = mapped_column(
        enum_type(ContactMessageStatus, 16),
        nullable=False,
        default=ContactMessageStatus.NEW,
        server_default=str_default(ContactMessageStatus.NEW.value),
    )
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    ip_hash: Mapped[str | None] = mapped_column(CHAR(64), nullable=True)
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()


class QuizResult(Base):
    __tablename__ = "quiz_results"
    __table_args__ = table_args(
        Index("ix_quiz_results_user_id_created_at", "user_id", "created_at"),
        Index("ix_quiz_results_created_at", "created_at"),
    )

    id: Mapped[int] = pk_column()
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    cart_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("carts.id", ondelete="SET NULL"), nullable=True
    )
    answers: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    recommended_product_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    recommended_variant_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True
    )
    routine: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = created_at_column()
