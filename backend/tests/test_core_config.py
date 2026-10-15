from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Environment, Settings

_PROD_OK = {
    "ENV": "production",
    "SECRET_KEY": "x" * 48,
    "MOCK_PAYMENT_SECRET": "prod-mock-secret",
    "SHIPPING_WEBHOOK_TOKEN": "prod-token",
    "PAYMENT_PROVIDER": "razorpay",
    "RAZORPAY_KEY_ID": "rzp_live_x",
    "RAZORPAY_KEY_SECRET": "s",
    "RAZORPAY_WEBHOOK_SECRET": "w",
    "LOG_JSON": None,
}


def test_defaults_are_safe_for_local_dev() -> None:
    s = Settings(_env_file=None, ENV="development")
    assert s.RAZORPAY_KEY_ID == ""
    assert s.payment_gateway_mode == "mock"
    assert s.shipping_provider_mode == "mock"
    assert s.docs_enabled is True
    assert s.log_json is False
    assert s.cookie_secure is False
    assert s.cors_origin_list == ["http://localhost:5173", "http://localhost:4173"]


def test_production_requires_real_secrets() -> None:
    with pytest.raises(ValidationError) as info:
        Settings(_env_file=None, ENV="production")
    message = str(info.value)
    assert "SECRET_KEY" in message
    assert "PAYMENT_PROVIDER=mock" in message


def test_production_with_real_values() -> None:
    s = Settings(_env_file=None, **_PROD_OK)
    assert s.ENV is Environment.PRODUCTION
    assert s.payment_gateway_mode == "razorpay"
    assert s.docs_enabled is False
    assert s.log_json is True
    assert s.cookie_secure is True


def test_razorpay_without_keys_falls_back_to_mock_outside_production() -> None:
    s = Settings(_env_file=None, PAYMENT_PROVIDER="razorpay")
    assert s.payment_gateway_mode == "mock"


def test_cors_parsing_and_overrides() -> None:
    s = Settings(
        _env_file=None,
        CORS_ORIGINS=" https://dawnlit.in/ ,https://www.dawnlit.in,, ",
        API_DOCS_ENABLED=False,
        SHIPROCKET_EMAIL="a@b.c",
        SHIPROCKET_PASSWORD="p",
        COOKIE_DOMAIN="",
    )
    assert s.cors_origin_list == ["https://dawnlit.in", "https://www.dawnlit.in"]
    assert s.docs_enabled is False
    assert s.shipping_provider_mode == "shiprocket"
    assert s.cookie_domain is None
    assert s.media_dir == s.STORAGE_DIR / "media"
    assert s.invoices_dir.name == "invoices"
    assert s.outbox_dir.name == "outbox"
