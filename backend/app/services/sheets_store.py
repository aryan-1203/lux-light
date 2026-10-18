"""De-duplicating writes to the Leads / Newsletter tabs.

All Sheets I/O runs in a worker thread under one asyncio.Lock (single instance assumed), so the
read-check-write of an upsert is atomic from this process's point of view.
"""

import asyncio
import logging
import random
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import TypeVar

from app.logging_utils import log_event
from app.schemas import normalise_phone
from app.services.rows import LEADS_HEADER, NEWSLETTER_HEADER, row_values
from app.services.sheets_client import SheetsClient, is_transient

logger = logging.getLogger("app.sheets")

T = TypeVar("T")

_LEAD_ID = LEADS_HEADER.index("lead_id")
_EMAIL = LEADS_HEADER.index("email")
_PHONE = LEADS_HEADER.index("phone")
# Columns rewritten on update: everything between lead_id and status (timestamp, id, status are kept).
_UPDATE_FIRST = LEADS_HEADER.index("name")
_UPDATE_LAST = LEADS_HEADER.index("user_agent")
_NEWS_EMAIL = NEWSLETTER_HEADER.index("email")


def col_letter(index: int) -> str:
    """0 -> 'A', 25 -> 'Z', 26 -> 'AA'."""
    letters = ""
    index += 1
    while index:
        index, rem = divmod(index - 1, 26)
        letters = chr(65 + rem) + letters
    return letters


def _clean(value: str) -> str:
    return value[1:] if value.startswith("'") else value


def phone_key(value: str) -> str | None:
    try:
        return "+91" + normalise_phone(_clean(value))
    except ValueError:
        return None


def email_key(value: str) -> str | None:
    value = _clean(value).strip().lower()
    return value or None


def _cell(row: list[str], i: int) -> str:
    return row[i] if i < len(row) else ""


@dataclass
class _TabIndex:
    rows: list[list[str]] = field(default_factory=list)  # all values incl. header row
    keys: dict[str, int] = field(default_factory=dict)  # "p:+91..." / "e:email" -> 1-based row number
    loaded_at: float = 0.0

    def invalidate(self) -> None:
        self.loaded_at = 0.0


@dataclass(frozen=True)
class LeadWriteResult:
    lead_id: str
    updated: bool


class SheetsStore:
    def __init__(
        self,
        client_factory: Callable[[], SheetsClient] | None,
        *,
        leads_tab: str,
        newsletter_tab: str,
        index_ttl: float = 120.0,
        retries: int = 3,
        backoff_base: float = 0.5,
    ) -> None:
        self._factory = client_factory
        self._client: SheetsClient | None = None
        self._lock = asyncio.Lock()
        self.leads_tab = leads_tab
        self.newsletter_tab = newsletter_tab
        self._ttl = index_ttl
        self._retries = retries
        self._backoff_base = backoff_base
        self._leads = _TabIndex()
        self._news = _TabIndex()
        self._sleep = asyncio.sleep  # swappable in tests

    @property
    def configured(self) -> bool:
        return self._factory is not None

    # -- public API -------------------------------------------------------------------------------

    async def upsert_lead(self, row: dict[str, str], *, retries: int | None = None) -> LeadWriteResult:
        return await self._run(lambda: self._upsert_lead_sync(row), retries)

    async def add_newsletter(self, row: dict[str, str], *, retries: int | None = None) -> bool:
        """Append unless the email is already present. Returns True when a row was written."""
        return await self._run(lambda: self._add_newsletter_sync(row), retries)

    # -- retry wrapper ----------------------------------------------------------------------------

    async def _run(self, fn: Callable[[], T], retries: int | None) -> T:
        if self._factory is None:
            raise RuntimeError("Google Sheets is not configured")
        retries = self._retries if retries is None else retries
        attempt = 0
        while True:
            try:
                async with self._lock:
                    return await asyncio.to_thread(fn)
            except Exception as exc:
                if not is_transient(exc) or attempt >= retries:
                    raise
                delay = self._backoff_base * (2**attempt) * random.uniform(0.8, 1.2)
                attempt += 1
                log_event(
                    logger,
                    logging.WARNING,
                    "sheets_retry",
                    attempt=attempt,
                    delay_s=round(delay, 2),
                    error=f"{type(exc).__name__}: {exc}"[:300],
                )
                await self._sleep(delay)

    # -- blocking internals (run in a thread, under the lock) -------------------------------------

    def _get_client(self) -> SheetsClient:
        if self._client is None:
            assert self._factory is not None
            self._client = self._factory()
        return self._client

    def _load(self, client: SheetsClient, tab: str, header: list[str], idx: _TabIndex, keys_of) -> None:
        rows = client.get_all_values(tab)
        if not rows or not any(c.strip() for c in rows[0]):
            client.update_range(tab, f"A1:{col_letter(len(header) - 1)}1", [header])
            rows = [list(header)]
        idx.rows = rows
        idx.keys = {}
        for n, row in enumerate(rows[1:], start=2):
            for key in keys_of(row):
                idx.keys.setdefault(key, n)
        idx.loaded_at = time.monotonic()

    def _ensure(self, client, tab, header, idx: _TabIndex, keys_of, force: bool = False) -> None:
        if force or not idx.loaded_at or time.monotonic() - idx.loaded_at > self._ttl:
            self._load(client, tab, header, idx, keys_of)

    @staticmethod
    def _lead_keys(row: list[str]) -> list[str]:
        keys = []
        if p := phone_key(_cell(row, _PHONE)):
            keys.append("p:" + p)
        if e := email_key(_cell(row, _EMAIL)):
            keys.append("e:" + e)
        return keys

    @staticmethod
    def _news_keys(row: list[str]) -> list[str]:
        e = email_key(_cell(row, _NEWS_EMAIL))
        return ["e:" + e] if e else []

    @staticmethod
    def _remember(idx: _TabIndex, n: int | None, values: list[str], keys: list[str]) -> None:
        if n is None:
            idx.invalidate()
            return
        while len(idx.rows) < n:
            idx.rows.append([])
        idx.rows[n - 1] = values
        for key in keys:
            idx.keys[key] = n

    def _find_lead(self, client: SheetsClient, keys: list[str]) -> tuple[int, list[str]] | None:
        idx = self._leads
        for attempt in range(2):
            n = next((idx.keys[k] for k in keys if k in idx.keys), None)
            if n is None:
                return None
            # Re-read the row: a human may have sorted/deleted rows or edited status since we indexed.
            existing = client.row_values(self.leads_tab, n)
            if set(keys) & set(self._lead_keys(existing)):
                return n, existing
            if attempt == 0:
                self._ensure(client, self.leads_tab, LEADS_HEADER, idx, self._lead_keys, force=True)
        return None

    def _upsert_lead_sync(self, row: dict[str, str]) -> LeadWriteResult:
        client = self._get_client()
        self._ensure(client, self.leads_tab, LEADS_HEADER, self._leads, self._lead_keys)
        new = row_values(row, LEADS_HEADER)
        keys = self._lead_keys(new)
        found = self._find_lead(client, keys) if keys else None

        if found is None:
            n = client.append_row(self.leads_tab, new)
            self._remember(self._leads, n, new, keys)
            return LeadWriteResult(lead_id=row["lead_id"], updated=False)

        n, existing = found
        existing = existing + [""] * (len(LEADS_HEADER) - len(existing))
        merged = list(existing[: len(LEADS_HEADER)])
        for i in range(_UPDATE_FIRST, _UPDATE_LAST + 1):
            if new[i] != "":
                merged[i] = new[i]
        first = _UPDATE_FIRST
        if not merged[_LEAD_ID].strip():  # hand-entered row without an id: adopt ours
            merged[_LEAD_ID] = new[_LEAD_ID]
            first = _LEAD_ID
        a1 = f"{col_letter(first)}{n}:{col_letter(_UPDATE_LAST)}{n}"
        client.update_range(self.leads_tab, a1, [merged[first : _UPDATE_LAST + 1]])
        self._remember(self._leads, n, merged, self._lead_keys(merged))
        return LeadWriteResult(lead_id=_clean(merged[_LEAD_ID]), updated=True)

    def _add_newsletter_sync(self, row: dict[str, str]) -> bool:
        client = self._get_client()
        idx = self._news
        self._ensure(client, self.newsletter_tab, NEWSLETTER_HEADER, idx, self._news_keys)
        values = row_values(row, NEWSLETTER_HEADER)
        keys = self._news_keys(values)
        if keys and keys[0] in idx.keys:
            return False
        n = client.append_row(self.newsletter_tab, values)
        self._remember(idx, n, values, keys)
        return True
