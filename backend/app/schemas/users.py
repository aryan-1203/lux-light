"""API schemas for the `users` area (docs/openapi.yaml `x-py-module: app.schemas.users`).

``AddressInput`` is shared with checkout (inline shipping addresses).
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Annotated, Any, Final

from pydantic import Field, field_validator, model_validator
from pydantic.json_schema import SkipJsonSchema

from app.models.enums import IndianStateCode, UserRole
from app.schemas.common import ApiModel

PHONE_PATTERN: Final = r"^\+91[6-9][0-9]{9}$"
PINCODE_PATTERN: Final = r"^[1-9][0-9]{5}$"
PHONE_DESCRIPTION: Final = "Indian mobile in E.164 (+91XXXXXXXXXX)."

_LETTER_RE: Final = re.compile(r"[A-Za-z]")
_DIGIT_RE: Final = re.compile(r"[0-9]")

Phone = Annotated[str, Field(pattern=PHONE_PATTERN, description=PHONE_DESCRIPTION)]
Pincode = Annotated[str, Field(pattern=PINCODE_PATTERN)]


def validate_password_strength(value: str) -> str:
    """Password policy (contract): ≥ 8 chars (schema), at least one letter and one digit."""
    if not _LETTER_RE.search(value) or not _DIGIT_RE.search(value):
        raise ValueError("Password must contain at least one letter and one digit.")
    return value


def _strip(value: Any) -> Any:
    return value.strip() if isinstance(value, str) else value


class UserProfile(ApiModel):
    id: int = Field(ge=1)
    email: str = Field(max_length=254, json_schema_extra={"format": "email"})
    full_name: str | None
    phone: Annotated[str, Field(pattern=PHONE_PATTERN)] | None = Field(description=PHONE_DESCRIPTION)
    role: UserRole
    email_verified: bool
    has_password: bool = Field(description="False for OTP-only accounts.")
    marketing_opt_in: bool
    created_at: datetime


class UserProfileUpdate(ApiModel):
    """Partial profile update. Email is immutable. Explicit ``null`` clears name/phone."""

    full_name: Annotated[str, Field(min_length=1, max_length=120)] | None = None
    phone: Annotated[str, Field(pattern=PHONE_PATTERN)] | None = Field(
        default=None, description=PHONE_DESCRIPTION
    )
    marketing_opt_in: bool | None = None

    _strip_name = field_validator("full_name", mode="before")(_strip)


class PasswordChangeRequest(ApiModel):
    current_password: Annotated[str, Field(max_length=128)] | None = None
    new_password: str = Field(min_length=8, max_length=128)

    _policy = field_validator("new_password")(validate_password_strength)


class AddressInput(ApiModel):
    label: Annotated[str, Field(max_length=40)] | None = Field(default=None, description="e.g. Home, Office")
    full_name: str = Field(min_length=1, max_length=120)
    phone: Phone
    line1: str = Field(min_length=3, max_length=200)
    line2: Annotated[str, Field(max_length=200)] | None = None
    landmark: Annotated[str, Field(max_length=120)] | None = None
    city: str = Field(min_length=2, max_length=80)
    state_code: IndianStateCode
    pincode: Pincode
    is_default: bool = False

    _strip_text = field_validator(
        "label", "full_name", "line1", "line2", "landmark", "city", "phone", "pincode", mode="before"
    )(_strip)


#: Fields of ``AddressUpdate`` that may be omitted but never set to ``null``.
_NON_NULLABLE_ADDRESS_FIELDS: Final = (
    "full_name",
    "phone",
    "line1",
    "city",
    "state_code",
    "pincode",
    "is_default",
)


class AddressUpdate(ApiModel):
    """Partial address update (omitted fields are unchanged)."""

    label: Annotated[str, Field(max_length=40)] | None = None
    full_name: Annotated[str, Field(min_length=1, max_length=120)] | SkipJsonSchema[None] = None
    phone: Annotated[str, Field(pattern=PHONE_PATTERN)] | SkipJsonSchema[None] = Field(
        default=None, description=PHONE_DESCRIPTION
    )
    line1: Annotated[str, Field(min_length=3, max_length=200)] | SkipJsonSchema[None] = None
    line2: Annotated[str, Field(max_length=200)] | None = None
    landmark: Annotated[str, Field(max_length=120)] | None = None
    city: Annotated[str, Field(min_length=2, max_length=80)] | SkipJsonSchema[None] = None
    state_code: IndianStateCode | SkipJsonSchema[None] = None
    pincode: Annotated[str, Field(pattern=PINCODE_PATTERN)] | SkipJsonSchema[None] = None
    is_default: bool | SkipJsonSchema[None] = None

    _strip_text = field_validator(
        "label", "full_name", "line1", "line2", "landmark", "city", "phone", "pincode", mode="before"
    )(_strip)

    @model_validator(mode="after")
    def _reject_nulls(self) -> AddressUpdate:
        for name in _NON_NULLABLE_ADDRESS_FIELDS:
            if name in self.model_fields_set and getattr(self, name) is None:
                raise ValueError(f"{name} cannot be null")
        return self


class Address(ApiModel):
    id: int = Field(ge=1)
    label: str | None
    full_name: str
    phone: str = Field(pattern=PHONE_PATTERN, description=PHONE_DESCRIPTION)
    line1: str
    line2: str | None
    landmark: str | None
    city: str
    state: str
    state_code: IndianStateCode
    pincode: str = Field(pattern=PINCODE_PATTERN)
    country: str = Field(description="ISO-3166 alpha-2, always IN.")
    is_default: bool
    created_at: datetime
    updated_at: datetime


class AddressListResponse(ApiModel):
    items: list[Address]
