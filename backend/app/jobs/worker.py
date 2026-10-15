"""Background worker: ``python -m app.jobs.worker [--once [JOB]]`` (PLAN §1.9).

asyncio scheduler; each job runs in a thread (``asyncio.to_thread``) guarded by a MySQL advisory lock
``GET_LOCK('dl_job_<name>', 0)`` so two workers never run the same job concurrently. SIGTERM/SIGINT
let the current job finish and then exit. Jobs that still raise ``NotImplementedError`` (Phase 2
stubs) are logged at DEBUG and skipped.
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import signal
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from sqlalchemy import text

from app.core import clock
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.session import engine
from app.jobs import abandoned_cart, invoices, notifications, purge, reservations, shipments

logger = logging.getLogger("app.jobs.worker")


@dataclass
class Job:
    name: str
    func: Callable[[], int]
    interval_seconds: int | None = None
    #: For daily jobs: IST wall-clock (hour, minute).
    daily_at_ist: tuple[int, int] | None = None
    next_run: float = field(default=0.0)

    def schedule_next(self, now: float) -> None:
        if self.daily_at_ist is None:
            assert self.interval_seconds is not None
            self.next_run = now + self.interval_seconds
            return
        self.next_run = next_daily_run(clock.now_utc(), self.daily_at_ist).timestamp()


def next_daily_run(now_utc: datetime, at_ist: tuple[int, int]) -> datetime:
    local = clock.to_ist(now_utc)
    target = local.replace(hour=at_ist[0], minute=at_ist[1], second=0, microsecond=0)
    if target <= local:
        target += timedelta(days=1)
    return target.astimezone(now_utc.tzinfo)


def build_jobs() -> list[Job]:
    return [
        Job("reservations", reservations.run, interval_seconds=60),
        Job("notifications", notifications.run, interval_seconds=30),
        Job("abandoned_cart", abandoned_cart.run, interval_seconds=3600),
        Job("shipments", shipments.run, interval_seconds=1800),
        Job("invoices", invoices.run, interval_seconds=600),
        Job("purge", purge.run, daily_at_ist=(3, 0)),
    ]


def run_job(job: Job) -> int | None:
    """Run one job under its advisory lock. Returns the job's count, or None if skipped/failed."""
    lock_name = f"dl_job_{job.name}"
    with engine.connect() as conn:
        acquired = conn.execute(text("SELECT GET_LOCK(:n, 0)"), {"n": lock_name}).scalar()
        if acquired != 1:
            logger.info("job %s skipped: lock held by another worker", job.name)
            return None
        started = time.perf_counter()
        try:
            result = job.func()
        except NotImplementedError:
            logger.debug("job %s not implemented yet; skipping", job.name)
            return None
        except Exception:
            logger.exception("job %s failed", job.name)
            return None
        finally:
            conn.execute(text("SELECT RELEASE_LOCK(:n)"), {"n": lock_name})
        logger.info(
            "job %s done: %s item(s) in %.0fms", job.name, result, (time.perf_counter() - started) * 1000
        )
        return result


async def run_forever(jobs: list[Job], stop: asyncio.Event) -> None:
    now = time.time()
    for job in jobs:
        if job.daily_at_ist is not None:
            job.schedule_next(now)
        else:
            job.next_run = now
    while not stop.is_set():
        now = time.time()
        for job in jobs:
            if stop.is_set():
                break
            if job.next_run <= now:
                await asyncio.to_thread(run_job, job)
                job.schedule_next(time.time())
        wake = min(job.next_run for job in jobs) - time.time()
        try:
            await asyncio.wait_for(stop.wait(), timeout=max(0.5, min(wake, 30.0)))
        except TimeoutError:
            continue


def run_once(jobs: list[Job], name: str | None) -> int:
    selected = [j for j in jobs if name in (None, "all", j.name)]
    if not selected:
        raise SystemExit(f"unknown job {name!r}; choose from: {', '.join(j.name for j in jobs)}")
    for job in selected:
        run_job(job)
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.jobs.worker")
    parser.add_argument(
        "--once",
        nargs="?",
        const="all",
        default=None,
        metavar="JOB",
        help="run all jobs (or only JOB) once and exit",
    )
    args = parser.parse_args(argv)
    settings = get_settings()
    configure_logging(settings.LOG_LEVEL, json_logs=settings.log_json)
    jobs = build_jobs()
    if args.once is not None:
        return run_once(jobs, args.once)

    async def runner() -> None:
        stop = asyncio.Event()
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, stop.set)
        logger.info("worker started with jobs: %s", ", ".join(j.name for j in jobs))
        await run_forever(jobs, stop)
        logger.info("worker stopped")

    asyncio.run(runner())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
