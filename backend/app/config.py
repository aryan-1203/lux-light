from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration. Every value comes from the environment (see .env.example)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    # Comma-separated list of allowed frontend origins.
    cors_origins: str = "http://localhost:3000"

    # Google Sheets
    google_service_account_b64: str = ""
    # One spreadsheet for both tabs (sheet_id), or a separate spreadsheet each (the two below override it).
    sheet_id: str = ""
    leads_sheet_id: str = ""
    newsletter_sheet_id: str = ""
    leads_tab: str = "Leads"
    newsletter_tab: str = "Newsletter"
    # Request-time retries on transient Sheets errors (429/5xx/network): delays base, 2*base, 4*base ...
    sheets_request_retries: int = Field(default=3, ge=0, le=6)
    sheets_backoff_base_seconds: float = Field(default=0.5, ge=0)
    sheets_timeout_seconds: float = Field(default=10.0, gt=0)
    # How long the in-memory dedupe index (phone/email -> row) is trusted before re-reading the sheet.
    sheets_index_ttl_seconds: float = Field(default=120.0, ge=0)

    # Cloudflare Turnstile (empty secret disables verification in development only)
    turnstile_secret: str = ""

    # Durable outbox for writes that fail (Render persistent disk mount in production)
    outbox_path: str = "./data/outbox.sqlite3"
    outbox_worker_enabled: bool = True
    outbox_retry_seconds: float = Field(default=30.0, gt=0, description="Drain interval and backoff base")
    outbox_backoff_cap_seconds: float = Field(default=1800.0, gt=0)

    rate_limit_leads: str = Field(default="5/minute", description="slowapi limit string per IP")
    rate_limit_newsletter: str = Field(default="10/minute", description="slowapi limit string per IP")

    # Reject request bodies larger than this (bytes) with 413.
    max_body_bytes: int = Field(default=16_384, gt=0)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def leads_spreadsheet_id(self) -> str:
        return (self.leads_sheet_id or self.sheet_id).strip()

    @property
    def newsletter_spreadsheet_id(self) -> str:
        return (self.newsletter_sheet_id or self.sheet_id).strip()

    @property
    def spreadsheet_ids(self) -> dict[str, str]:
        """Tab name -> spreadsheet key."""
        return {
            self.leads_tab: self.leads_spreadsheet_id,
            self.newsletter_tab: self.newsletter_spreadsheet_id,
        }

    @property
    def sheets_configured(self) -> bool:
        return bool(
            self.google_service_account_b64.strip()
            and self.leads_spreadsheet_id
            and self.newsletter_spreadsheet_id
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
