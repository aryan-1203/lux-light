"""Request models for the public forms and helpers that validate raw JSON bodies.

Bodies are parsed by hand (instead of a typed FastAPI body parameter) so the honeypot can be
checked *before* validation; errors are still raised as `RequestValidationError` so the response
keeps FastAPI's standard `{"detail": [{"loc": ["body", <field>], ...}]}` shape.
"""

import json
import re
from typing import Annotated, Any, Literal

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from pydantic import AfterValidator, BaseModel, BeforeValidator, ConfigDict, EmailStr, Field, ValidationError

INTEREST_LABELS: dict[str, str] = {
    "mood": "Mood",
    "energy": "Energy",
    "sleep_routine": "Sleep routine",
    "focus": "Focus",
    "shift_work": "Shift work",
    "gifting": "Gifting",
}
Interest = Literal["mood", "energy", "sleep_routine", "focus", "shift_work", "gifting"]

FULL_FORM_REQUIRED = ("email", "state", "use_location", "quantity", "budget", "heard_from")

_PHONE_ALLOWED = re.compile(r"^[\s(]*\+?[\d\s\-().]+$")
_INDIAN_MOBILE = re.compile(r"^[6-9]\d{9}$")


def normalise_phone(value: str) -> str:
    """Return the 10-digit Indian mobile number or raise ValueError.

    Accepts '+91 98765 43210', '919876543210', '09876543210', '0091 98765-43210', '9876543210'.
    """
    raw = value.strip()
    if not raw or not _PHONE_ALLOWED.match(raw):
        raise ValueError("Enter a valid 10-digit Indian mobile number")
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 14 and digits.startswith("0091"):
        digits = digits[4:]
    elif len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if not _INDIAN_MOBILE.match(digits):
        raise ValueError("Enter a valid 10-digit Indian mobile number")
    return digits


def _empty_to_none(value: Any) -> Any:
    if value is None or (isinstance(value, str) and not value.strip()):
        return None
    return value


def _none_to_empty(value: Any) -> Any:
    return "" if value is None else value


def _require_true(value: bool) -> bool:
    if value is not True:
        raise ValueError("Consent is required")
    return value


def _unique(values: list[str]) -> list[str]:
    if len(set(values)) != len(values):
        raise ValueError("Interests must be unique")
    return values


def _lower(value: str) -> str:
    return value.lower()


Phone = Annotated[str, AfterValidator(normalise_phone)]
Email = Annotated[EmailStr, AfterValidator(_lower)]


def _optional_str(min_length: int, max_length: int) -> Any:
    return Annotated[
        Annotated[str, Field(min_length=min_length, max_length=max_length)] | None,
        BeforeValidator(_empty_to_none),
    ]


TrackingStr = Annotated[str, BeforeValidator(_none_to_empty), Field(max_length=300)]


class LeadIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="ignore")

    form: Literal["short", "full"]
    name: str = Field(min_length=2, max_length=80)
    phone: Phone
    city: str = Field(min_length=2, max_length=60)
    interests: Annotated[list[Interest], Field(min_length=1), AfterValidator(_unique)]
    consent: Annotated[bool, Field(strict=True), AfterValidator(_require_true)]
    whatsapp_opt_in: bool = False

    # Required when form == "full" (checked in `validate_lead`).
    email: Annotated[Email | None, BeforeValidator(_empty_to_none)] = None
    state: _optional_str(2, 60) = None
    use_location: Annotated[Literal["home", "office", "both"] | None, BeforeValidator(_empty_to_none)] = None
    quantity: Annotated[Literal["1", "2-5", "bulk"] | None, BeforeValidator(_empty_to_none)] = None
    budget: _optional_str(1, 40) = None
    heard_from: _optional_str(1, 60) = None

    utm_source: TrackingStr = ""
    utm_medium: TrackingStr = ""
    utm_campaign: TrackingStr = ""
    landing_page: TrackingStr = ""
    referrer: TrackingStr = ""

    turnstile_token: Annotated[str, BeforeValidator(_none_to_empty), Field(max_length=4096)] = ""
    company: Annotated[str, BeforeValidator(_none_to_empty)] = ""


class NewsletterIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="ignore")

    email: Email
    source: Annotated[str, BeforeValidator(_none_to_empty), Field(max_length=40)] = ""
    page: Annotated[str, BeforeValidator(_none_to_empty), Field(max_length=300)] = ""
    company: Annotated[str, BeforeValidator(_none_to_empty)] = ""


async def read_json_body(request: Request) -> Any:
    body = await request.body()
    if not body:
        raise RequestValidationError(
            [{"type": "missing", "loc": ("body",), "msg": "Field required", "input": None}]
        )
    try:
        return json.loads(body)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        pos = exc.pos if isinstance(exc, json.JSONDecodeError) else 0
        raise RequestValidationError(
            [
                {
                    "type": "json_invalid",
                    "loc": ("body", pos),
                    "msg": "JSON decode error",
                    "input": {},
                    "ctx": {"error": str(exc)},
                }
            ]
        ) from None


def is_honeypot(raw: Any) -> bool:
    if not isinstance(raw, dict):
        return False
    value = raw.get("company")
    return value is not None and str(value).strip() != ""


def _body_errors(exc: ValidationError) -> list[dict[str, Any]]:
    errors = []
    for err in exc.errors(include_url=False):
        err = dict(err)
        err["loc"] = ("body", *err["loc"])
        if "ctx" in err:
            err["ctx"] = {k: (str(v) if isinstance(v, Exception) else v) for k, v in err["ctx"].items()}
        errors.append(err)
    return errors


def validate_lead(raw: Any) -> LeadIn:
    errors: list[dict[str, Any]] = []
    lead: LeadIn | None = None
    try:
        lead = LeadIn.model_validate(raw)
    except ValidationError as exc:
        errors = _body_errors(exc)

    if isinstance(raw, dict) and raw.get("form") == "full":
        failed = {e["loc"][1] for e in errors if len(e["loc"]) > 1}
        for field in FULL_FORM_REQUIRED:
            if field not in failed and _empty_to_none(raw.get(field)) is None:
                errors.append(
                    {"type": "missing", "loc": ("body", field), "msg": "Field required", "input": None}
                )

    if errors:
        raise RequestValidationError(errors)
    assert lead is not None
    return lead


def validate_newsletter(raw: Any) -> NewsletterIn:
    try:
        return NewsletterIn.model_validate(raw)
    except ValidationError as exc:
        raise RequestValidationError(_body_errors(exc)) from None
