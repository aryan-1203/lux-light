"""Cloudflare Turnstile server-side verification."""

import logging

import httpx

from app.logging_utils import log_event

logger = logging.getLogger("app.turnstile")

SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


class TurnstileVerifier:
    def __init__(
        self,
        secret: str,
        *,
        production: bool,
        transport: httpx.AsyncBaseTransport | None = None,
        timeout: float = 5.0,
    ) -> None:
        self.secret = secret.strip()
        self.production = production
        self._transport = transport
        self._timeout = timeout

    async def verify(self, token: str, remote_ip: str | None) -> bool:
        if not self.secret:
            if self.production:
                log_event(logger, logging.ERROR, "turnstile_secret_missing", detail="rejecting in production")
                return False
            return True
        if not token:
            log_event(logger, logging.INFO, "turnstile_failed", reason="missing_token")
            return False
        data = {"secret": self.secret, "response": token}
        if remote_ip:
            data["remoteip"] = remote_ip
        try:
            async with httpx.AsyncClient(timeout=self._timeout, transport=self._transport) as client:
                res = await client.post(SITEVERIFY_URL, data=data)
            body = res.json()
        except (httpx.HTTPError, ValueError) as exc:
            log_event(logger, logging.WARNING, "turnstile_unreachable", error=f"{type(exc).__name__}: {exc}")
            return False
        if body.get("success") is True:
            return True
        log_event(logger, logging.INFO, "turnstile_failed", codes=body.get("error-codes", []))
        return False
