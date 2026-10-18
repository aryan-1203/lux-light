"""Sheet layouts and builders that turn validated submissions into fully-formed rows."""

import secrets
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.schemas import INTEREST_LABELS, LeadIn, NewsletterIn

LEADS_HEADER: list[str] = [
    "timestamp_ist",
    "lead_id",
    "name",
    "email",
    "phone",
    "city",
    "state",
    "interests",
    "use_location",
    "quantity",
    "budget",
    "source",
    "whatsapp_opt_in",
    "consent",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "landing_page",
    "referrer",
    "user_agent",
    "status",
]
NEWSLETTER_HEADER: list[str] = ["timestamp_ist", "email", "source", "page", "user_agent"]

# Columns never sanitised: phone is always "+91XXXXXXXXXX" and must stay text (RAW write).
_UNSANITISED = {"phone"}
_FORMULA_PREFIXES = ("=", "+", "-", "@")

# Unambiguous alphabet: no 0/O/1/I.
LEAD_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

_USE_LOCATION_LABELS = {"home": "Home", "office": "Office", "both": "Both"}
_QUANTITY_LABELS = {"1": "1", "2-5": "2-5", "bulk": "Bulk"}

try:
    IST: timezone | ZoneInfo = ZoneInfo("Asia/Kolkata")
except ZoneInfoNotFoundError:  # slim images without tzdata; India has no DST so a fixed offset is exact
    IST = timezone(timedelta(hours=5, minutes=30), "IST")


def new_lead_id() -> str:
    return "LX-" + "".join(secrets.choice(LEAD_ID_ALPHABET) for _ in range(6))


def now_ist() -> str:
    return datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S")


def safe_cell(value: str) -> str:
    """Neutralise spreadsheet formula injection by prefixing an apostrophe."""
    return "'" + value if value.startswith(_FORMULA_PREFIXES) else value


def _yes_no(value: bool) -> str:
    return "Yes" if value else "No"


def build_lead_row(lead: LeadIn, *, user_agent: str, lead_id: str | None = None) -> dict[str, str]:
    row = {
        "timestamp_ist": now_ist(),
        "lead_id": lead_id or new_lead_id(),
        "name": lead.name,
        "email": lead.email or "",
        "phone": "+91" + lead.phone,
        "city": lead.city,
        "state": lead.state or "",
        "interests": ", ".join(INTEREST_LABELS[i] for i in lead.interests),
        "use_location": _USE_LOCATION_LABELS.get(lead.use_location or "", ""),
        "quantity": _QUANTITY_LABELS.get(lead.quantity or "", ""),
        "budget": lead.budget or "",
        "source": lead.heard_from or "",
        "whatsapp_opt_in": _yes_no(lead.whatsapp_opt_in),
        "consent": _yes_no(lead.consent),
        "utm_source": lead.utm_source,
        "utm_medium": lead.utm_medium,
        "utm_campaign": lead.utm_campaign,
        "landing_page": lead.landing_page,
        "referrer": lead.referrer,
        "user_agent": user_agent.strip()[:300],
        "status": "New",
    }
    return {k: (v if k in _UNSANITISED else safe_cell(v)) for k, v in row.items()}


def build_newsletter_row(sub: NewsletterIn, *, user_agent: str) -> dict[str, str]:
    row = {
        "timestamp_ist": now_ist(),
        "email": sub.email,
        "source": sub.source,
        "page": sub.page,
        "user_agent": user_agent.strip()[:300],
    }
    return {k: safe_cell(v) for k, v in row.items()}


def row_values(row: dict[str, str], header: list[str]) -> list[str]:
    return [row.get(col, "") for col in header]
