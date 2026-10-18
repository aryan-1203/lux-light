"""Submission delivery: Sheets first (with short retries), durable outbox as the fallback."""

import asyncio
import logging
import random
import time
from dataclasses import dataclass

from app.logging_utils import log_event, mask_email, mask_phone
from app.services.outbox import Kind, Outbox, OutboxItem
from app.services.sheets_store import SheetsStore

logger = logging.getLogger("app.delivery")

NOT_CONFIGURED = "sheets_not_configured"


@dataclass(frozen=True)
class LeadOutcome:
    lead_id: str
    updated: bool = False
    queued: bool = False


def _masked(kind: Kind, payload: dict[str, str]) -> dict[str, str]:
    fields = {"email": mask_email(payload.get("email", "").lstrip("'"))}
    if kind == "lead":
        fields["lead_id"] = payload.get("lead_id", "")
        fields["phone"] = mask_phone(payload.get("phone", ""))
    return fields


def _err(exc: BaseException) -> str:
    return f"{type(exc).__name__}: {exc}"[:500]


class Delivery:
    def __init__(
        self, store: SheetsStore, outbox: Outbox, *, retry_seconds: float = 30.0, backoff_cap: float = 1800.0
    ) -> None:
        self.store = store
        self.outbox = outbox
        self.retry_seconds = retry_seconds
        self.backoff_cap = backoff_cap

    async def submit_lead(self, row: dict[str, str]) -> LeadOutcome:
        if self.store.configured:
            try:
                result = await self.store.upsert_lead(row)
                return LeadOutcome(lead_id=result.lead_id, updated=result.updated)
            except Exception as exc:
                error = self._write_failed("lead", row, exc)
        else:
            error = NOT_CONFIGURED
        await self._enqueue("lead", row, error)
        return LeadOutcome(lead_id=row["lead_id"], queued=True)

    async def submit_newsletter(self, row: dict[str, str]) -> bool:
        """Returns True when the row was queued in the outbox instead of written."""
        if self.store.configured:
            try:
                await self.store.add_newsletter(row)
                return False
            except Exception as exc:
                error = self._write_failed("newsletter", row, exc)
        else:
            error = NOT_CONFIGURED
        await self._enqueue("newsletter", row, error)
        return True

    @staticmethod
    def _write_failed(kind: Kind, row: dict[str, str], exc: BaseException) -> str:
        log_event(
            logger, logging.WARNING, "sheets_write_failed", kind=kind, error=_err(exc), **_masked(kind, row)
        )
        return _err(exc)

    async def _enqueue(self, kind: Kind, row: dict[str, str], error: str) -> None:
        try:
            item_id = await self.outbox.enqueue(kind, row, error)
        except Exception as exc:
            log_event(
                logger,
                logging.ERROR,
                "outbox_enqueue_failed",
                kind=kind,
                error=_err(exc),
                **_masked(kind, row),
            )
            raise
        level = logging.INFO if error == NOT_CONFIGURED else logging.WARNING
        log_event(
            logger, level, "outbox_enqueued", kind=kind, outbox_id=item_id, reason=error, **_masked(kind, row)
        )

    # -- outbox replay ----------------------------------------------------------------------------

    def next_delay(self, attempts: int) -> float:
        base = min(self.backoff_cap, self.retry_seconds * (2 ** max(attempts - 1, 0)))
        return base * random.uniform(0.8, 1.2)

    async def replay(self, item: OutboxItem) -> None:
        if item.kind == "lead":
            await self.store.upsert_lead(item.payload, retries=0)
        else:
            await self.store.add_newsletter(item.payload, retries=0)

    async def drain_once(self) -> int:
        """Replay due outbox items through the normal upsert path. Returns how many were delivered."""
        if not self.store.configured:
            return 0
        delivered = 0
        for item in await self.outbox.due():
            try:
                await self.replay(item)
            except Exception as exc:
                attempts = item.attempts + 1
                delay = self.next_delay(attempts)
                await self.outbox.mark_failed(item.id, attempts, time.time() + delay, _err(exc))
                log_event(
                    logger,
                    logging.WARNING,
                    "outbox_replay_failed",
                    kind=item.kind,
                    outbox_id=item.id,
                    attempts=attempts,
                    retry_in_s=round(delay),
                    error=_err(exc),
                    **_masked(item.kind, item.payload),
                )
                continue
            await self.outbox.delete(item.id)
            delivered += 1
            log_event(logger, logging.INFO, "outbox_replayed", kind=item.kind, outbox_id=item.id)
        return delivered

    async def run_worker(self) -> None:
        while True:
            try:
                await self.drain_once()
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                log_event(logger, logging.ERROR, "outbox_worker_error", error=_err(exc))
            await asyncio.sleep(self.retry_seconds)
