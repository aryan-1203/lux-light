from collections.abc import Callable, Iterator
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.rate_limit import limiter
from tests.fakes import FakeSheetsClient

ORIGIN = "http://localhost:3000"


@pytest.fixture(autouse=True)
def _reset_rate_limits() -> Iterator[None]:
    limiter.reset()
    yield
    limiter.reset()


@pytest.fixture
def settings_factory(tmp_path) -> Callable[..., Settings]:
    def make(**overrides: Any) -> Settings:
        base: dict[str, Any] = {
            "_env_file": None,
            "app_env": "development",
            "cors_origins": f"{ORIGIN},https://lamp.example",
            "google_service_account_b64": "",
            "sheet_id": "",
            "turnstile_secret": "",
            "outbox_path": str(tmp_path / "data" / "outbox.sqlite3"),
            "outbox_worker_enabled": False,
            "sheets_backoff_base_seconds": 0.0,
            "rate_limit_leads": "1000/minute",
            "rate_limit_newsletter": "1000/minute",
        }
        base.update(overrides)
        return Settings(**base)

    return make


@pytest.fixture
def fake_sheets() -> FakeSheetsClient:
    return FakeSheetsClient()


@pytest.fixture
def client_factory(settings_factory, fake_sheets) -> Iterator[Callable[..., TestClient]]:
    clients: list[TestClient] = []

    def make(
        *,
        sheets: FakeSheetsClient | None | bool = True,
        turnstile_transport: httpx.AsyncBaseTransport | None = None,
        **overrides: Any,
    ) -> TestClient:
        if sheets is True:
            sheets = fake_sheets
        factory = (lambda: sheets) if sheets else None
        app = create_app(
            settings_factory(**overrides),
            sheets_client_factory=factory,
            turnstile_transport=turnstile_transport,
        )
        client = TestClient(app)
        client.__enter__()
        clients.append(client)
        return client

    yield make
    for c in clients:
        c.__exit__(None, None, None)


@pytest.fixture
def client(client_factory) -> TestClient:
    return client_factory()


def short_lead(**overrides: Any) -> dict[str, Any]:
    data: dict[str, Any] = {
        "form": "short",
        "name": "Asha Rao",
        "phone": "+91 98765 43210",
        "city": "Bengaluru",
        "interests": ["mood", "sleep_routine"],
        "consent": True,
    }
    data.update(overrides)
    return data


def full_lead(**overrides: Any) -> dict[str, Any]:
    data = short_lead(
        form="full",
        email="Asha.Rao@Gmail.com",
        state="Karnataka",
        use_location="both",
        quantity="2-5",
        budget="10-15k",
        heard_from="Instagram",
        whatsapp_opt_in=True,
        utm_source="ig",
        utm_medium="social",
        utm_campaign="launch",
        landing_page="/early-access",
        referrer="https://instagram.com/",
    )
    data.update(overrides)
    return data
