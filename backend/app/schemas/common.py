"""Shared API schemas: ErrorBody, ErrorResponse, HealthResponse, WebhookAck + the ``ApiModel`` base."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.enums import GatewayMode, HealthStatus, ShippingProvider


class ApiModel(BaseModel):
    """Base for contract schemas: unknown fields rejected (``additionalProperties: false``),
    ORM attribute access enabled for response building."""

    model_config = ConfigDict(extra="forbid", from_attributes=True)


class ErrorBody(ApiModel):
    code: str
    message: str
    details: dict[str, Any] | None


class ErrorResponse(ApiModel):
    error: ErrorBody


class HealthResponse(ApiModel):
    status: HealthStatus
    version: str
    database: bool
    redis: bool | None
    payment_gateway: GatewayMode
    shipping_provider: ShippingProvider
    time: datetime


class WebhookAck(ApiModel):
    received: bool
    duplicate: bool
