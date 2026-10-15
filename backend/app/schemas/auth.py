"""API schemas for the `auth` area (docs/openapi.yaml `x-py-module: app.schemas.auth`)."""

from __future__ import annotations

from typing import Annotated

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import ApiModel
from app.schemas.users import PHONE_DESCRIPTION, PHONE_PATTERN, UserProfile, validate_password_strength

Email = Annotated[EmailStr, Field(max_length=254)]


def _normalise_email(value: object) -> object:
    return value.strip().lower() if isinstance(value, str) else value


class CsrfTokenResponse(ApiModel):
    csrf_token: str


class SignupRequest(ApiModel):
    email: Email
    password: str = Field(
        min_length=8, max_length=128, description="≥8 chars, must contain a letter and a digit."
    )
    full_name: str = Field(min_length=1, max_length=120)
    phone: Annotated[str, Field(pattern=PHONE_PATTERN)] | None = Field(
        default=None, description=PHONE_DESCRIPTION
    )
    marketing_opt_in: bool = False

    _email = field_validator("email", mode="before")(_normalise_email)
    _policy = field_validator("password")(validate_password_strength)

    @field_validator("full_name", mode="before")
    @classmethod
    def _strip_name(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value


class LoginRequest(ApiModel):
    email: Email
    password: str = Field(min_length=1, max_length=128)

    _email = field_validator("email", mode="before")(_normalise_email)


class OtpSendRequest(ApiModel):
    email: Email

    _email = field_validator("email", mode="before")(_normalise_email)


class OtpSendResponse(ApiModel):
    message: str
    expires_in_seconds: int
    resend_after_seconds: int
    dev_code: str | None = Field(
        description=(
            "Only populated when ENV != production AND OTP_DEV_ECHO=true (tests/e2e). "
            "Always null in production."
        )
    )


class OtpVerifyRequest(ApiModel):
    email: Email
    code: str = Field(pattern=r"^[0-9]{6}$")

    _email = field_validator("email", mode="before")(_normalise_email)


class AuthResponse(ApiModel):
    user: UserProfile
    is_new_user: bool
    cart_merged: bool = Field(description="True when a guest `dl_cart` was merged into the user's cart.")
