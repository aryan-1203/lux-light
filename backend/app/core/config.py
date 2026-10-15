"""Application settings (pydantic-settings).

Every variable below is read from the process environment, falling back to ``backend/.env``
(gitignored, local only) and then to the safe local-development default shown here.
Defaults never contain real credentials: every external integration (Razorpay, Shiprocket,
SMTP, WhatsApp) falls back to a mock adapter when its credentials are empty.

Required in production (``ENV=production``; startup fails otherwise):
  SECRET_KEY, MOCK_PAYMENT_SECRET, SHIPPING_WEBHOOK_TOKEN  — non-default random values
  PAYMENT_PROVIDER=razorpay + RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET
  CORS_ORIGINS, PUBLIC_SITE_URL, SELLER_GSTIN, SELLER_ADDRESS, SUPPORT_EMAIL ...

Full variable list (default in brackets):
  ENV [development] · SECRET_KEY [dev placeholder] · DATABASE_URL [mysql+pymysql://root@127.0.0.1:3307/luxlight]
  TEST_DATABASE_URL [.../luxlight_test] · REDIS_URL [empty → in-memory rate limiter]
  CORS_ORIGINS [http://localhost:5173,http://localhost:4173] · PUBLIC_SITE_URL [http://localhost:5173]
  COOKIE_DOMAIN [empty] · API_DOCS_ENABLED [true outside production]
  BRAND_NAME [Dawnlit] · BRAND_LEGAL_NAME · SELLER_GSTIN [27AAAAA0000A1Z5] · SELLER_STATE_CODE [27]
  SELLER_ADDRESS · SUPPORT_EMAIL · SUPPORT_PHONE · ADMIN_ALERT_EMAIL · STORAGE_DIR [backend/storage]
  PAYMENT_PROVIDER [mock] · RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET [empty]
  MOCK_PAYMENT_SECRET [dev placeholder] · SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD /
  SHIPROCKET_PICKUP_LOCATION [empty → mock] · SHIPPING_WEBHOOK_TOKEN [dev placeholder]
  SMTP_HOST [empty → console/file outbox] · SMTP_PORT [587] · SMTP_USER · SMTP_PASSWORD · SMTP_FROM ·
  SMTP_STARTTLS [true] · WHATSAPP_PROVIDER_URL / WHATSAPP_API_KEY [empty → mock]
  FREE_SHIPPING_THRESHOLD_PAISE [99900] · SHIPPING_FEE_PAISE [7900] · COD_FEE_PAISE [4900]
  COD_MAX_ORDER_PAISE [1000000] · RESERVATION_TTL_MINUTES [15] · MAX_QTY_PER_LINE [5]
  ACCESS_TOKEN_TTL_MINUTES [15] · REFRESH_TOKEN_TTL_DAYS [30] · OTP_DEV_ECHO [false]
  RATE_LIMIT_ENABLED [true] · SEED_ADMIN_PASSWORD / SEED_STAFF_PASSWORD [ChangeMe!2026, dev only]
  SEED_DEMO_PASSWORD [DemoPass!2026] · LOG_LEVEL [INFO] · LOG_JSON [false; true in production]
"""

from __future__ import annotations

from enum import StrEnum
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]

DEV_SECRET_KEY = "dev-insecure-secret-key-change-me-0123456789abcdef"  # noqa: S105 - dev placeholder
DEV_MOCK_PAYMENT_SECRET = "dev-mock-payment-secret"  # noqa: S105 - dev placeholder
DEV_SHIPPING_WEBHOOK_TOKEN = "dev-shipping-webhook-token"  # noqa: S105 - dev placeholder
DEV_SEED_PASSWORD = "ChangeMe!2026"  # noqa: S105 - documented dev default (DB_SCHEMA §10)
DEV_DEMO_PASSWORD = "DemoPass!2026"  # noqa: S105 - documented dev default (DB_SCHEMA §10)


class Environment(StrEnum):
    DEVELOPMENT = "development"
    TEST = "test"
    PRODUCTION = "production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    ENV: Environment = Environment.DEVELOPMENT
    SECRET_KEY: str = DEV_SECRET_KEY
    DATABASE_URL: str = "mysql+pymysql://root@127.0.0.1:3307/luxlight"
    TEST_DATABASE_URL: str = "mysql+pymysql://root@127.0.0.1:3307/luxlight_test"
    REDIS_URL: str = ""
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:4173"
    PUBLIC_SITE_URL: str = "http://localhost:5173"
    COOKIE_DOMAIN: str = ""
    API_DOCS_ENABLED: bool | None = None

    BRAND_NAME: str = "Dawnlit"
    BRAND_LEGAL_NAME: str = "Dawnlit (placeholder legal name)"
    SELLER_GSTIN: str = "27AAAAA0000A1Z5"
    SELLER_STATE_CODE: str = "27"
    SELLER_ADDRESS: str = "Placeholder address, Mumbai, Maharashtra 400001, India"
    SUPPORT_EMAIL: str = "support@dawnlit.in"
    SUPPORT_PHONE: str = "+910000000000"
    ADMIN_ALERT_EMAIL: str = "alerts@dawnlit.in"
    STORAGE_DIR: Path = BACKEND_DIR / "storage"

    PAYMENT_PROVIDER: Literal["razorpay", "mock"] = "mock"
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""
    MOCK_PAYMENT_SECRET: str = DEV_MOCK_PAYMENT_SECRET

    SHIPROCKET_EMAIL: str = ""
    SHIPROCKET_PASSWORD: str = ""
    SHIPROCKET_PICKUP_LOCATION: str = ""
    SHIPPING_WEBHOOK_TOKEN: str = DEV_SHIPPING_WEBHOOK_TOKEN

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "Dawnlit <no-reply@dawnlit.in>"
    SMTP_STARTTLS: bool = True
    WHATSAPP_PROVIDER_URL: str = ""
    WHATSAPP_API_KEY: str = ""

    FREE_SHIPPING_THRESHOLD_PAISE: int = Field(default=99900, ge=0)
    SHIPPING_FEE_PAISE: int = Field(default=7900, ge=0)
    COD_FEE_PAISE: int = Field(default=4900, ge=0)
    COD_MAX_ORDER_PAISE: int = Field(default=1000000, ge=0)
    RESERVATION_TTL_MINUTES: int = Field(default=15, ge=1)
    MAX_QTY_PER_LINE: int = Field(default=5, ge=1)
    ACCESS_TOKEN_TTL_MINUTES: int = Field(default=15, ge=1)
    REFRESH_TOKEN_TTL_DAYS: int = Field(default=30, ge=1)
    OTP_DEV_ECHO: bool = False
    RATE_LIMIT_ENABLED: bool = True

    SEED_ADMIN_PASSWORD: str = DEV_SEED_PASSWORD
    SEED_STAFF_PASSWORD: str = DEV_SEED_PASSWORD
    SEED_DEMO_PASSWORD: str = DEV_DEMO_PASSWORD

    LOG_LEVEL: str = "INFO"
    LOG_JSON: bool | None = None

    @model_validator(mode="after")
    def _production_guard(self) -> Settings:
        if self.ENV is not Environment.PRODUCTION:
            return self
        problems: list[str] = []
        if self.SECRET_KEY == DEV_SECRET_KEY or len(self.SECRET_KEY) < 32:
            problems.append("SECRET_KEY must be a random value of at least 32 characters")
        if self.MOCK_PAYMENT_SECRET == DEV_MOCK_PAYMENT_SECRET:
            problems.append("MOCK_PAYMENT_SECRET must not use the dev placeholder")
        if self.SHIPPING_WEBHOOK_TOKEN == DEV_SHIPPING_WEBHOOK_TOKEN:
            problems.append("SHIPPING_WEBHOOK_TOKEN must not use the dev placeholder")
        if self.PAYMENT_PROVIDER == "mock":
            problems.append("PAYMENT_PROVIDER=mock is not allowed in production")
        if not (self.RAZORPAY_KEY_ID and self.RAZORPAY_KEY_SECRET and self.RAZORPAY_WEBHOOK_SECRET):
            problems.append("RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET are required")
        if problems:
            raise ValueError("Invalid production settings: " + "; ".join(problems))
        return self

    # ----- derived helpers -------------------------------------------------------------------
    @property
    def is_production(self) -> bool:
        return self.ENV is Environment.PRODUCTION

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def docs_enabled(self) -> bool:
        if self.API_DOCS_ENABLED is not None:
            return self.API_DOCS_ENABLED
        return not self.is_production

    @property
    def log_json(self) -> bool:
        if self.LOG_JSON is not None:
            return self.LOG_JSON
        return self.is_production

    @property
    def cookie_secure(self) -> bool:
        return self.is_production

    @property
    def cookie_domain(self) -> str | None:
        return self.COOKIE_DOMAIN or None

    @property
    def media_dir(self) -> Path:
        return self.STORAGE_DIR / "media"

    @property
    def invoices_dir(self) -> Path:
        return self.STORAGE_DIR / "invoices"

    @property
    def outbox_dir(self) -> Path:
        return self.STORAGE_DIR / "outbox"

    @property
    def payment_gateway_mode(self) -> Literal["razorpay", "mock"]:
        """Effective online gateway (PLAN §1.6: razorpay without keys falls back to mock)."""
        if self.PAYMENT_PROVIDER == "razorpay" and self.RAZORPAY_KEY_ID and self.RAZORPAY_KEY_SECRET:
            return "razorpay"
        return "mock"

    @property
    def shipping_provider_mode(self) -> Literal["shiprocket", "mock"]:
        if self.SHIPROCKET_EMAIL and self.SHIPROCKET_PASSWORD:
            return "shiprocket"
        return "mock"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
