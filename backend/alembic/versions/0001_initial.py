"""Initial schema: all 39 tables from docs/DB_SCHEMA.md.

Revision ID: 0001_initial
Revises:
Create Date: 2026-10-15 07:51:07.297023+00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import mysql

from alembic import op

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_categories")),
        sa.UniqueConstraint("slug", name=op.f("uq_categories_slug")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_categories_is_active_sort_order", "categories", ["is_active", "sort_order"], unique=False
    )
    op.create_table(
        "faqs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("question", sa.String(length=300), nullable=False),
        sa.Column("answer_md", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=24), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_faqs")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_faqs_is_active_category_sort_order", "faqs", ["is_active", "category", "sort_order"], unique=False
    )
    op.create_table(
        "invoice_sequences",
        sa.Column("financial_year", sa.String(length=7), nullable=False),
        sa.Column("next_value", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("financial_year", name=op.f("pk_invoice_sequences")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_table(
        "otp_codes",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("purpose", sa.String(length=16), server_default=sa.text("'login'"), nullable=False),
        sa.Column("code_hash", mysql.CHAR(length=64), nullable=False),
        sa.Column("attempts", sa.SmallInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("max_attempts", sa.SmallInteger(), server_default=sa.text("5"), nullable=False),
        sa.Column("expires_at", mysql.DATETIME(fsp=6), nullable=False),
        sa.Column("consumed_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("ip_hash", mysql.CHAR(length=64), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_otp_codes")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_otp_codes_email_purpose_created_at", "otp_codes", ["email", "purpose", "created_at"], unique=False
    )
    op.create_index("ix_otp_codes_expires_at", "otp_codes", ["expires_at"], unique=False)
    op.create_table(
        "suppliers",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("contact_name", sa.String(length=120), nullable=True),
        sa.Column("email", sa.String(length=254), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("country", mysql.CHAR(length=2), server_default=sa.text("'CN'"), nullable=False),
        sa.Column("city", sa.String(length=80), nullable=True),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_suppliers")),
        sa.UniqueConstraint("name", name=op.f("uq_suppliers_name")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("full_name", sa.String(length=120), nullable=True),
        sa.Column("phone", sa.String(length=16), nullable=True),
        sa.Column("role", sa.String(length=16), server_default=sa.text("'customer'"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("email_verified_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("marketing_opt_in", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("last_login_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_users_phone", "users", ["phone"], unique=False)
    op.create_index("ix_users_role_created_at", "users", ["role", "created_at"], unique=False)
    op.create_table(
        "webhook_events",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("source", sa.String(length=24), nullable=False),
        sa.Column("event_id", sa.String(length=128), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=16), server_default=sa.text("'received'"), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("error", sa.String(length=500), nullable=True),
        sa.Column("attempts", sa.SmallInteger(), server_default=sa.text("1"), nullable=False),
        sa.Column(
            "received_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column("processed_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_webhook_events")),
        sa.UniqueConstraint("source", "event_id", name=op.f("uq_webhook_events_source_event_id")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_webhook_events_status_received_at", "webhook_events", ["status", "received_at"], unique=False
    )
    op.create_table(
        "addresses",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("label", sa.String(length=40), nullable=True),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=16), nullable=False),
        sa.Column("line1", sa.String(length=200), nullable=False),
        sa.Column("line2", sa.String(length=200), nullable=True),
        sa.Column("landmark", sa.String(length=120), nullable=True),
        sa.Column("city", sa.String(length=80), nullable=False),
        sa.Column("state", sa.String(length=60), nullable=False),
        sa.Column("state_code", mysql.CHAR(length=2), nullable=False),
        sa.Column("pincode", mysql.CHAR(length=6), nullable=False),
        sa.Column("country", mysql.CHAR(length=2), server_default=sa.text("'IN'"), nullable=False),
        sa.Column("is_default", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_addresses_user_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_addresses")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_addresses_user_id_is_default", "addresses", ["user_id", "is_default"], unique=False)
    op.create_table(
        "audit_log",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("actor_user_id", sa.BigInteger(), nullable=True),
        sa.Column("actor_email", sa.String(length=254), nullable=True),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("entity_type", sa.String(length=40), nullable=False),
        sa.Column("entity_id", sa.String(length=64), nullable=False),
        sa.Column("diff", sa.JSON(), nullable=True),
        sa.Column("ip_hash", mysql.CHAR(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["users.id"],
            name=op.f("fk_audit_log_actor_user_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_audit_log")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_audit_log_action_created_at", "audit_log", ["action", "created_at"], unique=False)
    op.create_index(
        "ix_audit_log_actor_user_id_created_at", "audit_log", ["actor_user_id", "created_at"], unique=False
    )
    op.create_index("ix_audit_log_created_at", "audit_log", ["created_at"], unique=False)
    op.create_index(
        "ix_audit_log_entity_type_entity_id_created_at",
        "audit_log",
        ["entity_type", "entity_id", "created_at"],
        unique=False,
    )
    op.create_table(
        "blog_posts",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("excerpt", sa.String(length=400), server_default=sa.text("''"), nullable=False),
        sa.Column("body_md", mysql.MEDIUMTEXT(), nullable=False),
        sa.Column("cover_image_url", sa.String(length=500), nullable=True),
        sa.Column("cover_image_alt", sa.String(length=200), nullable=True),
        sa.Column(
            "author_name", sa.String(length=80), server_default=sa.text("'Dawnlit Team'"), nullable=False
        ),
        sa.Column("tags", sa.JSON(), server_default=sa.text("(JSON_ARRAY())"), nullable=False),
        sa.Column("status", sa.String(length=16), server_default=sa.text("'draft'"), nullable=False),
        sa.Column("published_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("reading_time_minutes", sa.SmallInteger(), server_default=sa.text("1"), nullable=False),
        sa.Column("seo_title", sa.String(length=70), nullable=True),
        sa.Column("seo_description", sa.String(length=160), nullable=True),
        sa.Column("og_image_url", sa.String(length=500), nullable=True),
        sa.Column("created_by_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            name=op.f("fk_blog_posts_created_by_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_blog_posts")),
        sa.UniqueConstraint("slug", name=op.f("uq_blog_posts_slug")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_blog_posts_status_published_at", "blog_posts", ["status", "published_at"], unique=False
    )
    op.create_table(
        "carts",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("token", sa.String(length=64), nullable=True),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("email", sa.String(length=254), nullable=True),
        sa.Column("marketing_opt_in", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column(
            "last_activity_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column("abandoned_email_sent_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_carts_user_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_carts")),
        sa.UniqueConstraint("token", name=op.f("uq_carts_token")),
        sa.UniqueConstraint("user_id", name=op.f("uq_carts_user_id")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_carts_last_activity_at", "carts", ["last_activity_at"], unique=False)
    op.create_table(
        "contact_messages",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("phone", sa.String(length=16), nullable=True),
        sa.Column("topic", sa.String(length=16), nullable=False),
        sa.Column("order_number", sa.String(length=20), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), server_default=sa.text("'new'"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("ip_hash", mysql.CHAR(length=64), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_contact_messages_user_id_users"), ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_contact_messages")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_contact_messages_status_created_at", "contact_messages", ["status", "created_at"], unique=False
    )
    op.create_table(
        "products",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("category_id", sa.BigInteger(), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("tagline", sa.String(length=255), server_default=sa.text("''"), nullable=False),
        sa.Column("description_md", mysql.MEDIUMTEXT(), nullable=False),
        sa.Column("highlights", sa.JSON(), server_default=sa.text("(JSON_ARRAY())"), nullable=False),
        sa.Column("specs", sa.JSON(), server_default=sa.text("(JSON_ARRAY())"), nullable=False),
        sa.Column("badges", sa.JSON(), server_default=sa.text("(JSON_ARRAY())"), nullable=False),
        sa.Column("hsn_code", sa.String(length=8), server_default=sa.text("'9405'"), nullable=False),
        sa.Column("gst_rate_percent", sa.SmallInteger(), server_default=sa.text("18"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("is_featured", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("warranty_months", sa.SmallInteger(), server_default=sa.text("12"), nullable=False),
        sa.Column("return_window_days", sa.SmallInteger(), server_default=sa.text("30"), nullable=False),
        sa.Column("seo_title", sa.String(length=70), nullable=True),
        sa.Column("seo_description", sa.String(length=160), nullable=True),
        sa.Column("rating_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("rating_sum", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column(
            "rating_dist",
            sa.JSON(),
            server_default=sa.text("(JSON_OBJECT('1', 0, '2', 0, '3', 0, '4', 0, '5', 0))"),
            nullable=False,
        ),
        sa.Column("archived_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "gst_rate_percent IN (0, 5, 12, 18, 28, 40)", name=op.f("ck_products_gst_rate_valid")
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["categories.id"],
            name=op.f("fk_products_category_id_categories"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_products")),
        sa.UniqueConstraint("slug", name=op.f("uq_products_slug")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_products_category_id_is_active_sort_order",
        "products",
        ["category_id", "is_active", "sort_order"],
        unique=False,
    )
    op.create_index("ix_products_is_active_created_at", "products", ["is_active", "created_at"], unique=False)
    op.create_index("ix_products_is_active_sort_order", "products", ["is_active", "sort_order"], unique=False)
    op.create_table(
        "promo_codes",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("discount_type", sa.String(length=16), nullable=False),
        sa.Column("percent_off", sa.SmallInteger(), nullable=True),
        sa.Column("amount_off_paise", sa.BigInteger(), nullable=True),
        sa.Column("max_discount_paise", sa.BigInteger(), nullable=True),
        sa.Column("min_order_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("usage_limit_total", sa.Integer(), nullable=True),
        sa.Column("usage_limit_per_user", sa.Integer(), nullable=True),
        sa.Column("times_redeemed", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("starts_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("ends_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("first_order_only", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("stackable", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("created_by_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.CheckConstraint("amount_off_paise >= 0", name=op.f("ck_promo_codes_amount_off_paise_nonneg")),
        sa.CheckConstraint("max_discount_paise >= 0", name=op.f("ck_promo_codes_max_discount_paise_nonneg")),
        sa.CheckConstraint("min_order_paise >= 0", name=op.f("ck_promo_codes_min_order_paise_nonneg")),
        sa.CheckConstraint("percent_off BETWEEN 1 AND 100", name=op.f("ck_promo_codes_percent_off_range")),
        sa.CheckConstraint("times_redeemed >= 0", name=op.f("ck_promo_codes_times_redeemed_nonneg")),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            name=op.f("fk_promo_codes_created_by_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_promo_codes")),
        sa.UniqueConstraint("code", name=op.f("uq_promo_codes_code")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_promo_codes_is_active_ends_at", "promo_codes", ["is_active", "ends_at"], unique=False)
    op.create_table(
        "purchase_batches",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("supplier_id", sa.BigInteger(), nullable=False),
        sa.Column("reference", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=16), server_default=sa.text("'draft'"), nullable=False),
        sa.Column("ordered_on", sa.Date(), nullable=True),
        sa.Column("received_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("shipping_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("duty_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("other_charges_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("gst_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("gst_claimable", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.CheckConstraint("duty_paise >= 0", name=op.f("ck_purchase_batches_duty_paise_nonneg")),
        sa.CheckConstraint("gst_paise >= 0", name=op.f("ck_purchase_batches_gst_paise_nonneg")),
        sa.CheckConstraint(
            "other_charges_paise >= 0", name=op.f("ck_purchase_batches_other_charges_paise_nonneg")
        ),
        sa.CheckConstraint("shipping_paise >= 0", name=op.f("ck_purchase_batches_shipping_paise_nonneg")),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            name=op.f("fk_purchase_batches_created_by_id_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["supplier_id"],
            ["suppliers.id"],
            name=op.f("fk_purchase_batches_supplier_id_suppliers"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_purchase_batches")),
        sa.UniqueConstraint("reference", name=op.f("uq_purchase_batches_reference")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_purchase_batches_status_created_at", "purchase_batches", ["status", "created_at"], unique=False
    )
    op.create_index(
        "ix_purchase_batches_supplier_id_created_at",
        "purchase_batches",
        ["supplier_id", "created_at"],
        unique=False,
    )
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("token_hash", mysql.CHAR(length=64), nullable=False),
        sa.Column("family_id", mysql.CHAR(length=32), nullable=False),
        sa.Column("expires_at", mysql.DATETIME(fsp=6), nullable=False),
        sa.Column("revoked_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("replaced_by_id", sa.BigInteger(), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("ip_hash", mysql.CHAR(length=64), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["replaced_by_id"],
            ["refresh_tokens.id"],
            name=op.f("fk_refresh_tokens_replaced_by_id_refresh_tokens"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_refresh_tokens_user_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_refresh_tokens")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_refresh_tokens_token_hash")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_refresh_tokens_expires_at", "refresh_tokens", ["expires_at"], unique=False)
    op.create_index("ix_refresh_tokens_family_id", "refresh_tokens", ["family_id"], unique=False)
    op.create_index(
        "ix_refresh_tokens_user_id_revoked_at", "refresh_tokens", ["user_id", "revoked_at"], unique=False
    )
    op.create_table(
        "cart_promos",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("cart_id", sa.BigInteger(), nullable=False),
        sa.Column("promo_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "applied_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["cart_id"], ["carts.id"], name=op.f("fk_cart_promos_cart_id_carts"), ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["promo_id"],
            ["promo_codes.id"],
            name=op.f("fk_cart_promos_promo_id_promo_codes"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cart_promos")),
        sa.UniqueConstraint("cart_id", "promo_id", name=op.f("uq_cart_promos_cart_id_promo_id")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_table(
        "orders",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("order_number", sa.String(length=20), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("cart_id", sa.BigInteger(), nullable=True),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("phone", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=24), server_default=sa.text("'pending'"), nullable=False),
        sa.Column("payment_method", sa.String(length=16), nullable=False),
        sa.Column(
            "payment_status", sa.String(length=24), server_default=sa.text("'created'"), nullable=False
        ),
        sa.Column("currency", mysql.CHAR(length=3), server_default=sa.text("'INR'"), nullable=False),
        sa.Column("subtotal_paise", sa.BigInteger(), nullable=False),
        sa.Column("discount_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("shipping_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("cod_fee_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("total_paise", sa.BigInteger(), nullable=False),
        sa.Column("refunded_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("taxable_value_paise", sa.BigInteger(), nullable=False),
        sa.Column("cgst_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("sgst_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("igst_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("tax_paise", sa.BigInteger(), nullable=False),
        sa.Column("place_of_supply_state_code", mysql.CHAR(length=2), nullable=False),
        sa.Column("buyer_gstin", sa.String(length=15), nullable=True),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("whatsapp_opt_in", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("access_token_hash", mysql.CHAR(length=64), nullable=False),
        sa.Column("idempotency_key", sa.String(length=64), nullable=True),
        sa.Column("reservation_expires_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column(
            "placed_at", mysql.DATETIME(fsp=6), server_default=sa.text("CURRENT_TIMESTAMP(6)"), nullable=False
        ),
        sa.Column("paid_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("packed_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("shipped_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("delivered_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("cancelled_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("returned_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("refunded_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("cancel_reason", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.CheckConstraint("cgst_paise >= 0", name=op.f("ck_orders_cgst_paise_nonneg")),
        sa.CheckConstraint("cod_fee_paise >= 0", name=op.f("ck_orders_cod_fee_paise_nonneg")),
        sa.CheckConstraint("discount_paise >= 0", name=op.f("ck_orders_discount_paise_nonneg")),
        sa.CheckConstraint("igst_paise >= 0", name=op.f("ck_orders_igst_paise_nonneg")),
        sa.CheckConstraint("refunded_paise >= 0", name=op.f("ck_orders_refunded_paise_nonneg")),
        sa.CheckConstraint("sgst_paise >= 0", name=op.f("ck_orders_sgst_paise_nonneg")),
        sa.CheckConstraint("shipping_paise >= 0", name=op.f("ck_orders_shipping_paise_nonneg")),
        sa.CheckConstraint("subtotal_paise >= 0", name=op.f("ck_orders_subtotal_paise_nonneg")),
        sa.CheckConstraint("tax_paise >= 0", name=op.f("ck_orders_tax_paise_nonneg")),
        sa.CheckConstraint("taxable_value_paise >= 0", name=op.f("ck_orders_taxable_value_paise_nonneg")),
        sa.CheckConstraint(
            "total_paise = subtotal_paise - discount_paise + shipping_paise + cod_fee_paise",
            name=op.f("ck_orders_total_math"),
        ),
        sa.CheckConstraint("total_paise >= 0", name=op.f("ck_orders_total_paise_nonneg")),
        sa.ForeignKeyConstraint(
            ["cart_id"], ["carts.id"], name=op.f("fk_orders_cart_id_carts"), ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_orders_user_id_users"), ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_orders")),
        sa.UniqueConstraint("idempotency_key", name=op.f("uq_orders_idempotency_key")),
        sa.UniqueConstraint("order_number", name=op.f("uq_orders_order_number")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_orders_cart_id_status", "orders", ["cart_id", "status"], unique=False)
    op.create_index("ix_orders_email", "orders", ["email"], unique=False)
    op.create_index(
        "ix_orders_payment_method_placed_at", "orders", ["payment_method", "placed_at"], unique=False
    )
    op.create_index(
        "ix_orders_payment_status_placed_at", "orders", ["payment_status", "placed_at"], unique=False
    )
    op.create_index("ix_orders_phone", "orders", ["phone"], unique=False)
    op.create_index("ix_orders_placed_at", "orders", ["placed_at"], unique=False)
    op.create_index("ix_orders_status_placed_at", "orders", ["status", "placed_at"], unique=False)
    op.create_index("ix_orders_user_id_placed_at", "orders", ["user_id", "placed_at"], unique=False)
    op.create_table(
        "product_variants",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("product_id", sa.BigInteger(), nullable=False),
        sa.Column("sku", sa.String(length=40), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("colour_temperature_k", sa.SmallInteger(), nullable=False),
        sa.Column("colour_temperature_label", sa.String(length=40), nullable=False),
        sa.Column("bundle", sa.String(length=32), server_default=sa.text("'solo'"), nullable=False),
        sa.Column("bundle_label", sa.String(length=80), nullable=False),
        sa.Column("price_paise", sa.BigInteger(), nullable=False),
        sa.Column("compare_at_price_paise", sa.BigInteger(), nullable=True),
        sa.Column("weight_grams", sa.Integer(), nullable=False),
        sa.Column("length_mm", sa.Integer(), nullable=False),
        sa.Column("breadth_mm", sa.Integer(), nullable=False),
        sa.Column("height_mm", sa.Integer(), nullable=False),
        sa.Column("is_default", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("archived_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "compare_at_price_paise >= 0", name=op.f("ck_product_variants_compare_at_price_paise_nonneg")
        ),
        sa.CheckConstraint("price_paise > 0", name=op.f("ck_product_variants_price_paise_positive")),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_product_variants_product_id_products"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_variants")),
        sa.UniqueConstraint(
            "product_id",
            "colour_temperature_k",
            "bundle",
            name=op.f("uq_product_variants_product_id_colour_temperature_k_bundle"),
        ),
        sa.UniqueConstraint("sku", name=op.f("uq_product_variants_sku")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_product_variants_product_id_is_active_price_paise",
        "product_variants",
        ["product_id", "is_active", "price_paise"],
        unique=False,
    )
    op.create_table(
        "promo_code_categories",
        sa.Column("promo_id", sa.BigInteger(), nullable=False),
        sa.Column("category_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["categories.id"],
            name=op.f("fk_promo_code_categories_category_id_categories"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["promo_id"],
            ["promo_codes.id"],
            name=op.f("fk_promo_code_categories_promo_id_promo_codes"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("promo_id", "category_id", name=op.f("pk_promo_code_categories")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_promo_code_categories_category_id", "promo_code_categories", ["category_id"], unique=False
    )
    op.create_table(
        "promo_code_products",
        sa.Column("promo_id", sa.BigInteger(), nullable=False),
        sa.Column("product_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_promo_code_products_product_id_products"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["promo_id"],
            ["promo_codes.id"],
            name=op.f("fk_promo_code_products_promo_id_promo_codes"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("promo_id", "product_id", name=op.f("pk_promo_code_products")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_promo_code_products_product_id", "promo_code_products", ["product_id"], unique=False)
    op.create_table(
        "reviews",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("product_id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("author_name", sa.String(length=80), nullable=False),
        sa.Column("rating", mysql.TINYINT(), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), server_default=sa.text("'pending'"), nullable=False),
        sa.Column("verified_purchase", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("source", sa.String(length=16), server_default=sa.text("'customer'"), nullable=False),
        sa.Column("moderated_by_id", sa.BigInteger(), nullable=True),
        sa.Column("moderated_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("moderation_note", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.CheckConstraint("rating BETWEEN 1 AND 5", name=op.f("ck_reviews_rating_range")),
        sa.ForeignKeyConstraint(
            ["moderated_by_id"],
            ["users.id"],
            name=op.f("fk_reviews_moderated_by_id_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"], ["products.id"], name=op.f("fk_reviews_product_id_products"), ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_reviews_user_id_users"), ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_reviews")),
        sa.UniqueConstraint("product_id", "user_id", name=op.f("uq_reviews_product_id_user_id")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_reviews_product_id_status_created_at",
        "reviews",
        ["product_id", "status", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_reviews_status_rating_created_at", "reviews", ["status", "rating", "created_at"], unique=False
    )
    op.create_table(
        "cart_items",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("cart_id", sa.BigInteger(), nullable=False),
        sa.Column("variant_id", sa.BigInteger(), nullable=False),
        sa.Column("quantity", sa.SmallInteger(), server_default=sa.text("1"), nullable=False),
        sa.Column("added_price_paise", sa.BigInteger(), nullable=False),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.CheckConstraint("added_price_paise >= 0", name=op.f("ck_cart_items_added_price_paise_nonneg")),
        sa.CheckConstraint("quantity BETWEEN 1 AND 5", name=op.f("ck_cart_items_quantity_range")),
        sa.ForeignKeyConstraint(
            ["cart_id"], ["carts.id"], name=op.f("fk_cart_items_cart_id_carts"), ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["variant_id"],
            ["product_variants.id"],
            name=op.f("fk_cart_items_variant_id_product_variants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cart_items")),
        sa.UniqueConstraint("cart_id", "variant_id", name=op.f("uq_cart_items_cart_id_variant_id")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_table(
        "inventory",
        sa.Column("variant_id", sa.BigInteger(), autoincrement=False, nullable=False),
        sa.Column("on_hand", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("reserved", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("low_stock_threshold", sa.Integer(), server_default=sa.text("10"), nullable=False),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.CheckConstraint("on_hand >= 0", name=op.f("ck_inventory_on_hand_nonneg")),
        sa.CheckConstraint("reserved <= on_hand", name=op.f("ck_inventory_reserved_le_on_hand")),
        sa.CheckConstraint("reserved >= 0", name=op.f("ck_inventory_reserved_nonneg")),
        sa.ForeignKeyConstraint(
            ["variant_id"],
            ["product_variants.id"],
            name=op.f("fk_inventory_variant_id_product_variants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("variant_id", name=op.f("pk_inventory")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_table(
        "invoices",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("invoice_number", sa.String(length=24), nullable=False),
        sa.Column("financial_year", sa.String(length=7), nullable=False),
        sa.Column("sequence_no", sa.Integer(), nullable=False),
        sa.Column("issued_at", mysql.DATETIME(fsp=6), nullable=False),
        sa.Column("seller_gstin", sa.String(length=15), nullable=False),
        sa.Column("seller_state_code", mysql.CHAR(length=2), nullable=False),
        sa.Column("place_of_supply_state_code", mysql.CHAR(length=2), nullable=False),
        sa.Column("buyer_gstin", sa.String(length=15), nullable=True),
        sa.Column("taxable_value_paise", sa.BigInteger(), nullable=False),
        sa.Column("cgst_paise", sa.BigInteger(), nullable=False),
        sa.Column("sgst_paise", sa.BigInteger(), nullable=False),
        sa.Column("igst_paise", sa.BigInteger(), nullable=False),
        sa.Column("total_paise", sa.BigInteger(), nullable=False),
        sa.Column("pdf_path", sa.String(length=500), nullable=True),
        sa.Column("pdf_generated_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.CheckConstraint("cgst_paise >= 0", name=op.f("ck_invoices_cgst_paise_nonneg")),
        sa.CheckConstraint("igst_paise >= 0", name=op.f("ck_invoices_igst_paise_nonneg")),
        sa.CheckConstraint("sgst_paise >= 0", name=op.f("ck_invoices_sgst_paise_nonneg")),
        sa.CheckConstraint("taxable_value_paise >= 0", name=op.f("ck_invoices_taxable_value_paise_nonneg")),
        sa.CheckConstraint("total_paise >= 0", name=op.f("ck_invoices_total_paise_nonneg")),
        sa.ForeignKeyConstraint(
            ["order_id"], ["orders.id"], name=op.f("fk_invoices_order_id_orders"), ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_invoices")),
        sa.UniqueConstraint(
            "financial_year", "sequence_no", name=op.f("uq_invoices_financial_year_sequence_no")
        ),
        sa.UniqueConstraint("invoice_number", name=op.f("uq_invoices_invoice_number")),
        sa.UniqueConstraint("order_id", name=op.f("uq_invoices_order_id")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_table(
        "notifications_log",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("kind", sa.String(length=40), nullable=False),
        sa.Column("channel", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=16), server_default=sa.text("'queued'"), nullable=False),
        sa.Column("recipient", sa.String(length=254), nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=True),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("template", sa.String(length=64), nullable=False),
        sa.Column("context", sa.JSON(), nullable=True),
        sa.Column("dedupe_key", sa.String(length=128), nullable=True),
        sa.Column("provider", sa.String(length=32), nullable=True),
        sa.Column("provider_message_id", sa.String(length=128), nullable=True),
        sa.Column("attempts", sa.SmallInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("error", sa.String(length=500), nullable=True),
        sa.Column("sent_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.id"],
            name=op.f("fk_notifications_log_order_id_orders"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_notifications_log_user_id_users"), ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notifications_log")),
        sa.UniqueConstraint("dedupe_key", name=op.f("uq_notifications_log_dedupe_key")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_notifications_log_order_id", "notifications_log", ["order_id"], unique=False)
    op.create_index(
        "ix_notifications_log_status_created_at", "notifications_log", ["status", "created_at"], unique=False
    )
    op.create_index("ix_notifications_log_user_id", "notifications_log", ["user_id"], unique=False)
    op.create_table(
        "order_addresses",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=16), nullable=False),
        sa.Column("line1", sa.String(length=200), nullable=False),
        sa.Column("line2", sa.String(length=200), nullable=True),
        sa.Column("landmark", sa.String(length=120), nullable=True),
        sa.Column("city", sa.String(length=80), nullable=False),
        sa.Column("state", sa.String(length=60), nullable=False),
        sa.Column("state_code", mysql.CHAR(length=2), nullable=False),
        sa.Column("pincode", mysql.CHAR(length=6), nullable=False),
        sa.Column("country", mysql.CHAR(length=2), server_default=sa.text("'IN'"), nullable=False),
        sa.ForeignKeyConstraint(
            ["order_id"], ["orders.id"], name=op.f("fk_order_addresses_order_id_orders"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_order_addresses")),
        sa.UniqueConstraint("order_id", "kind", name=op.f("uq_order_addresses_order_id_kind")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_order_addresses_pincode", "order_addresses", ["pincode"], unique=False)
    op.create_table(
        "order_items",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("product_id", sa.BigInteger(), nullable=True),
        sa.Column("variant_id", sa.BigInteger(), nullable=True),
        sa.Column("product_slug", sa.String(length=120), nullable=False),
        sa.Column("product_name", sa.String(length=160), nullable=False),
        sa.Column("variant_name", sa.String(length=160), nullable=False),
        sa.Column("sku", sa.String(length=40), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("hsn_code", sa.String(length=8), nullable=False),
        sa.Column("gst_rate_percent", sa.SmallInteger(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price_paise", sa.BigInteger(), nullable=False),
        sa.Column("compare_at_price_paise", sa.BigInteger(), nullable=True),
        sa.Column("line_subtotal_paise", sa.BigInteger(), nullable=False),
        sa.Column("discount_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("line_total_paise", sa.BigInteger(), nullable=False),
        sa.Column("taxable_value_paise", sa.BigInteger(), nullable=False),
        sa.Column("cgst_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("sgst_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("igst_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.CheckConstraint("cgst_paise >= 0", name=op.f("ck_order_items_cgst_paise_nonneg")),
        sa.CheckConstraint(
            "compare_at_price_paise >= 0", name=op.f("ck_order_items_compare_at_price_paise_nonneg")
        ),
        sa.CheckConstraint("discount_paise >= 0", name=op.f("ck_order_items_discount_paise_nonneg")),
        sa.CheckConstraint("igst_paise >= 0", name=op.f("ck_order_items_igst_paise_nonneg")),
        sa.CheckConstraint(
            "line_subtotal_paise >= 0", name=op.f("ck_order_items_line_subtotal_paise_nonneg")
        ),
        sa.CheckConstraint("line_total_paise >= 0", name=op.f("ck_order_items_line_total_paise_nonneg")),
        sa.CheckConstraint("quantity > 0", name=op.f("ck_order_items_quantity_positive")),
        sa.CheckConstraint("sgst_paise >= 0", name=op.f("ck_order_items_sgst_paise_nonneg")),
        sa.CheckConstraint(
            "taxable_value_paise >= 0", name=op.f("ck_order_items_taxable_value_paise_nonneg")
        ),
        sa.CheckConstraint("unit_price_paise >= 0", name=op.f("ck_order_items_unit_price_paise_nonneg")),
        sa.ForeignKeyConstraint(
            ["order_id"], ["orders.id"], name=op.f("fk_order_items_order_id_orders"), ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_order_items_product_id_products"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["variant_id"],
            ["product_variants.id"],
            name=op.f("fk_order_items_variant_id_product_variants"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_order_items")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"], unique=False)
    op.create_index("ix_order_items_product_id", "order_items", ["product_id"], unique=False)
    op.create_index("ix_order_items_variant_id", "order_items", ["variant_id"], unique=False)
    op.create_table(
        "order_status_history",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("from_status", sa.String(length=24), nullable=True),
        sa.Column("to_status", sa.String(length=24), nullable=False),
        sa.Column("note", sa.String(length=500), nullable=True),
        sa.Column("actor_type", sa.String(length=16), nullable=False),
        sa.Column("actor_user_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["users.id"],
            name=op.f("fk_order_status_history_actor_user_id_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.id"],
            name=op.f("fk_order_status_history_order_id_orders"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_order_status_history")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_order_status_history_order_id_created_at",
        "order_status_history",
        ["order_id", "created_at"],
        unique=False,
    )
    op.create_table(
        "payments",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("provider", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=24), server_default=sa.text("'created'"), nullable=False),
        sa.Column("amount_paise", sa.BigInteger(), nullable=False),
        sa.Column("amount_refunded_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("currency", mysql.CHAR(length=3), server_default=sa.text("'INR'"), nullable=False),
        sa.Column("method_detail", sa.String(length=32), nullable=True),
        sa.Column("razorpay_order_id", sa.String(length=64), nullable=True),
        sa.Column("razorpay_payment_id", sa.String(length=64), nullable=True),
        sa.Column("razorpay_signature", sa.String(length=128), nullable=True),
        sa.Column("error_code", sa.String(length=64), nullable=True),
        sa.Column("error_description", sa.String(length=255), nullable=True),
        sa.Column("attempts", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("captured_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("failed_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("gateway_payload", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.CheckConstraint("amount_paise >= 0", name=op.f("ck_payments_amount_paise_nonneg")),
        sa.CheckConstraint(
            "amount_refunded_paise >= 0", name=op.f("ck_payments_amount_refunded_paise_nonneg")
        ),
        sa.ForeignKeyConstraint(
            ["order_id"], ["orders.id"], name=op.f("fk_payments_order_id_orders"), ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_payments")),
        sa.UniqueConstraint("razorpay_order_id", name=op.f("uq_payments_razorpay_order_id")),
        sa.UniqueConstraint("razorpay_payment_id", name=op.f("uq_payments_razorpay_payment_id")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_payments_order_id_created_at", "payments", ["order_id", "created_at"], unique=False)
    op.create_index("ix_payments_status_created_at", "payments", ["status", "created_at"], unique=False)
    op.create_table(
        "product_images",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("product_id", sa.BigInteger(), nullable=False),
        sa.Column("variant_id", sa.BigInteger(), nullable=True),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("alt", sa.String(length=200), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("renditions", sa.JSON(), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_product_images_product_id_products"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["variant_id"],
            ["product_variants.id"],
            name=op.f("fk_product_images_variant_id_product_variants"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_images")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_product_images_product_id_sort_order",
        "product_images",
        ["product_id", "sort_order"],
        unique=False,
    )
    op.create_table(
        "promo_redemptions",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("promo_id", sa.BigInteger(), nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("discount_paise", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(length=16), server_default=sa.text("'reserved'"), nullable=False),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.CheckConstraint("discount_paise >= 0", name=op.f("ck_promo_redemptions_discount_paise_nonneg")),
        sa.ForeignKeyConstraint(
            ["order_id"], ["orders.id"], name=op.f("fk_promo_redemptions_order_id_orders"), ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["promo_id"],
            ["promo_codes.id"],
            name=op.f("fk_promo_redemptions_promo_id_promo_codes"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_promo_redemptions_user_id_users"), ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_promo_redemptions")),
        sa.UniqueConstraint("promo_id", "order_id", name=op.f("uq_promo_redemptions_promo_id_order_id")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_promo_redemptions_promo_id_email_status",
        "promo_redemptions",
        ["promo_id", "email", "status"],
        unique=False,
    )
    op.create_index(
        "ix_promo_redemptions_promo_id_user_id_status",
        "promo_redemptions",
        ["promo_id", "user_id", "status"],
        unique=False,
    )
    op.create_table(
        "purchase_batch_items",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("batch_id", sa.BigInteger(), nullable=False),
        sa.Column("variant_id", sa.BigInteger(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_cost_paise", sa.BigInteger(), nullable=False),
        sa.Column("allocated_shipping_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("allocated_duty_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("allocated_other_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("allocated_gst_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("landed_unit_cost_paise", sa.BigInteger(), server_default=sa.text("0"), nullable=False),
        sa.CheckConstraint(
            "allocated_duty_paise >= 0", name=op.f("ck_purchase_batch_items_allocated_duty_paise_nonneg")
        ),
        sa.CheckConstraint(
            "allocated_gst_paise >= 0", name=op.f("ck_purchase_batch_items_allocated_gst_paise_nonneg")
        ),
        sa.CheckConstraint(
            "allocated_other_paise >= 0", name=op.f("ck_purchase_batch_items_allocated_other_paise_nonneg")
        ),
        sa.CheckConstraint(
            "allocated_shipping_paise >= 0",
            name=op.f("ck_purchase_batch_items_allocated_shipping_paise_nonneg"),
        ),
        sa.CheckConstraint(
            "landed_unit_cost_paise >= 0", name=op.f("ck_purchase_batch_items_landed_unit_cost_paise_nonneg")
        ),
        sa.CheckConstraint("quantity > 0", name=op.f("ck_purchase_batch_items_quantity_positive")),
        sa.CheckConstraint(
            "unit_cost_paise >= 0", name=op.f("ck_purchase_batch_items_unit_cost_paise_nonneg")
        ),
        sa.ForeignKeyConstraint(
            ["batch_id"],
            ["purchase_batches.id"],
            name=op.f("fk_purchase_batch_items_batch_id_purchase_batches"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["variant_id"],
            ["product_variants.id"],
            name=op.f("fk_purchase_batch_items_variant_id_product_variants"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_purchase_batch_items")),
        sa.UniqueConstraint(
            "batch_id", "variant_id", name=op.f("uq_purchase_batch_items_batch_id_variant_id")
        ),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_purchase_batch_items_variant_id", "purchase_batch_items", ["variant_id"], unique=False
    )
    op.create_table(
        "quiz_results",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("cart_id", sa.BigInteger(), nullable=True),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("recommended_product_id", sa.BigInteger(), nullable=True),
        sa.Column("recommended_variant_id", sa.BigInteger(), nullable=True),
        sa.Column("routine", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["cart_id"], ["carts.id"], name=op.f("fk_quiz_results_cart_id_carts"), ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["recommended_product_id"],
            ["products.id"],
            name=op.f("fk_quiz_results_recommended_product_id_products"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["recommended_variant_id"],
            ["product_variants.id"],
            name=op.f("fk_quiz_results_recommended_variant_id_product_variants"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_quiz_results_user_id_users"), ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_quiz_results")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_quiz_results_created_at", "quiz_results", ["created_at"], unique=False)
    op.create_index(
        "ix_quiz_results_user_id_created_at", "quiz_results", ["user_id", "created_at"], unique=False
    )
    op.create_table(
        "shipments",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("provider", sa.String(length=16), nullable=False),
        sa.Column("provider_order_id", sa.String(length=64), nullable=True),
        sa.Column("provider_shipment_id", sa.String(length=64), nullable=True),
        sa.Column("awb", sa.String(length=40), nullable=True),
        sa.Column("courier_name", sa.String(length=80), nullable=True),
        sa.Column("status", sa.String(length=24), server_default=sa.text("'created'"), nullable=False),
        sa.Column("tracking_url", sa.String(length=500), nullable=True),
        sa.Column("label_url", sa.String(length=500), nullable=True),
        sa.Column("weight_grams", sa.Integer(), nullable=False),
        sa.Column("length_cm", sa.Integer(), nullable=True),
        sa.Column("breadth_cm", sa.Integer(), nullable=True),
        sa.Column("height_cm", sa.Integer(), nullable=True),
        sa.Column("eta_date", sa.Date(), nullable=True),
        sa.Column("shipped_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("delivered_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column("last_synced_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["order_id"], ["orders.id"], name=op.f("fk_shipments_order_id_orders"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_shipments")),
        sa.UniqueConstraint("awb", name=op.f("uq_shipments_awb")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_shipments_order_id", "shipments", ["order_id"], unique=False)
    op.create_index("ix_shipments_status_updated_at", "shipments", ["status", "updated_at"], unique=False)
    op.create_table(
        "stock_movements",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("variant_id", sa.BigInteger(), nullable=False),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("on_hand_after", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=32), nullable=False),
        sa.Column("reference_type", sa.String(length=32), nullable=True),
        sa.Column("reference_id", sa.BigInteger(), nullable=True),
        sa.Column("note", sa.String(length=500), nullable=True),
        sa.Column("actor_user_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.CheckConstraint("delta <> 0", name=op.f("ck_stock_movements_delta_nonzero")),
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["users.id"],
            name=op.f("fk_stock_movements_actor_user_id_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["variant_id"],
            ["product_variants.id"],
            name=op.f("fk_stock_movements_variant_id_product_variants"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_stock_movements")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_stock_movements_reason_created_at", "stock_movements", ["reason", "created_at"], unique=False
    )
    op.create_index(
        "ix_stock_movements_reference_type_reference_id",
        "stock_movements",
        ["reference_type", "reference_id"],
        unique=False,
    )
    op.create_index(
        "ix_stock_movements_variant_id_created_at",
        "stock_movements",
        ["variant_id", "created_at"],
        unique=False,
    )
    op.create_table(
        "stock_reservations",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("variant_id", sa.BigInteger(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=16), server_default=sa.text("'active'"), nullable=False),
        sa.Column("expires_at", mysql.DATETIME(fsp=6), nullable=False),
        sa.Column("resolved_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.CheckConstraint("quantity > 0", name=op.f("ck_stock_reservations_quantity_positive")),
        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.id"],
            name=op.f("fk_stock_reservations_order_id_orders"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["variant_id"],
            ["product_variants.id"],
            name=op.f("fk_stock_reservations_variant_id_product_variants"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_stock_reservations")),
        sa.UniqueConstraint("order_id", "variant_id", name=op.f("uq_stock_reservations_order_id_variant_id")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_stock_reservations_status_expires_at",
        "stock_reservations",
        ["status", "expires_at"],
        unique=False,
    )
    op.create_index(
        "ix_stock_reservations_variant_id_status",
        "stock_reservations",
        ["variant_id", "status"],
        unique=False,
    )
    op.create_table(
        "refunds",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("payment_id", sa.BigInteger(), nullable=True),
        sa.Column("amount_paise", sa.BigInteger(), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=16), server_default=sa.text("'pending'"), nullable=False),
        sa.Column("method", sa.String(length=16), nullable=False),
        sa.Column("provider_refund_id", sa.String(length=64), nullable=True),
        sa.Column("restock", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("failure_reason", sa.String(length=255), nullable=True),
        sa.Column("created_by_id", sa.BigInteger(), nullable=True),
        sa.Column("processed_at", mysql.DATETIME(fsp=6), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.CheckConstraint("amount_paise > 0", name=op.f("ck_refunds_amount_paise_positive")),
        sa.ForeignKeyConstraint(
            ["created_by_id"], ["users.id"], name=op.f("fk_refunds_created_by_id_users"), ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["order_id"], ["orders.id"], name=op.f("fk_refunds_order_id_orders"), ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["payment_id"], ["payments.id"], name=op.f("fk_refunds_payment_id_payments"), ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_refunds")),
        sa.UniqueConstraint("provider_refund_id", name=op.f("uq_refunds_provider_refund_id")),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index("ix_refunds_order_id", "refunds", ["order_id"], unique=False)
    op.create_index("ix_refunds_processed_at", "refunds", ["processed_at"], unique=False)
    op.create_index("ix_refunds_status_created_at", "refunds", ["status", "created_at"], unique=False)
    op.create_table(
        "shipment_events",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("shipment_id", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("raw_status", sa.String(length=80), nullable=True),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("location", sa.String(length=120), nullable=True),
        sa.Column("occurred_at", mysql.DATETIME(fsp=6), nullable=False),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["shipment_id"],
            ["shipments.id"],
            name=op.f("fk_shipment_events_shipment_id_shipments"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_shipment_events")),
        sa.UniqueConstraint(
            "shipment_id",
            "occurred_at",
            "status",
            name=op.f("uq_shipment_events_shipment_id_occurred_at_status"),
        ),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_shipment_events_shipment_id_occurred_at",
        "shipment_events",
        ["shipment_id", "occurred_at"],
        unique=False,
    )


def downgrade() -> None:
    # Dropping a table drops its indexes; dropping FK-backing indexes first fails on MySQL.
    op.drop_table("shipment_events")
    op.drop_table("refunds")
    op.drop_table("stock_reservations")
    op.drop_table("stock_movements")
    op.drop_table("shipments")
    op.drop_table("quiz_results")
    op.drop_table("purchase_batch_items")
    op.drop_table("promo_redemptions")
    op.drop_table("product_images")
    op.drop_table("payments")
    op.drop_table("order_status_history")
    op.drop_table("order_items")
    op.drop_table("order_addresses")
    op.drop_table("notifications_log")
    op.drop_table("invoices")
    op.drop_table("inventory")
    op.drop_table("cart_items")
    op.drop_table("reviews")
    op.drop_table("promo_code_products")
    op.drop_table("promo_code_categories")
    op.drop_table("product_variants")
    op.drop_table("orders")
    op.drop_table("cart_promos")
    op.drop_table("refresh_tokens")
    op.drop_table("purchase_batches")
    op.drop_table("promo_codes")
    op.drop_table("products")
    op.drop_table("contact_messages")
    op.drop_table("carts")
    op.drop_table("blog_posts")
    op.drop_table("audit_log")
    op.drop_table("addresses")
    op.drop_table("webhook_events")
    op.drop_table("users")
    op.drop_table("suppliers")
    op.drop_table("otp_codes")
    op.drop_table("invoice_sequences")
    op.drop_table("faqs")
    op.drop_table("categories")
