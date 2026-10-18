"""Durable SQLite outbox: submissions that could not reach Google Sheets wait here for replay."""

import asyncio
import json
import sqlite3
import time
from contextlib import closing
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

Kind = Literal["lead", "newsletter"]

_SCHEMA = """
CREATE TABLE IF NOT EXISTS outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL CHECK (kind IN ('lead', 'newsletter')),
    payload TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at REAL NOT NULL,
    last_error TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS outbox_due ON outbox (next_attempt_at);
"""


@dataclass(frozen=True)
class OutboxItem:
    id: int
    kind: Kind
    payload: dict[str, Any]
    attempts: int


class Outbox:
    def __init__(self, path: str) -> None:
        self.path = Path(path)
        self._ready = False

    def _connect(self) -> sqlite3.Connection:
        if not self._ready:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with closing(sqlite3.connect(self.path, timeout=10)) as conn:
                conn.executescript(_SCHEMA)
            self._ready = True
        return sqlite3.connect(self.path, timeout=10)

    # -- blocking ---------------------------------------------------------------------------------

    def enqueue_sync(self, kind: Kind, payload: dict[str, Any], error: str = "") -> int:
        with closing(self._connect()) as conn, conn:
            cur = conn.execute(
                "INSERT INTO outbox (kind, payload, attempts, next_attempt_at, last_error, created_at) "
                "VALUES (?, ?, 0, ?, ?, ?)",
                (kind, json.dumps(payload, ensure_ascii=False), time.time(), error[:500], _utcnow()),
            )
            return int(cur.lastrowid or 0)

    def pending_count_sync(self) -> int:
        with closing(self._connect()) as conn:
            return int(conn.execute("SELECT COUNT(*) FROM outbox").fetchone()[0])

    def due_sync(self, limit: int = 50, now: float | None = None) -> list[OutboxItem]:
        now = time.time() if now is None else now
        with closing(self._connect()) as conn:
            rows = conn.execute(
                "SELECT id, kind, payload, attempts FROM outbox "
                "WHERE next_attempt_at <= ? ORDER BY id LIMIT ?",
                (now, limit),
            ).fetchall()
        return [OutboxItem(id=r[0], kind=r[1], payload=json.loads(r[2]), attempts=r[3]) for r in rows]

    def delete_sync(self, item_id: int) -> None:
        with closing(self._connect()) as conn, conn:
            conn.execute("DELETE FROM outbox WHERE id = ?", (item_id,))

    def mark_failed_sync(self, item_id: int, attempts: int, next_attempt_at: float, error: str) -> None:
        with closing(self._connect()) as conn, conn:
            conn.execute(
                "UPDATE outbox SET attempts = ?, next_attempt_at = ?, last_error = ? WHERE id = ?",
                (attempts, next_attempt_at, error[:500], item_id),
            )

    # -- async wrappers ---------------------------------------------------------------------------

    async def enqueue(self, kind: Kind, payload: dict[str, Any], error: str = "") -> int:
        return await asyncio.to_thread(self.enqueue_sync, kind, payload, error)

    async def pending_count(self) -> int:
        return await asyncio.to_thread(self.pending_count_sync)

    async def due(self, limit: int = 50) -> list[OutboxItem]:
        return await asyncio.to_thread(self.due_sync, limit)

    async def delete(self, item_id: int) -> None:
        await asyncio.to_thread(self.delete_sync, item_id)

    async def mark_failed(self, item_id: int, attempts: int, next_attempt_at: float, error: str) -> None:
        await asyncio.to_thread(self.mark_failed_sync, item_id, attempts, next_attempt_at, error)


def _utcnow() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
