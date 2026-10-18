import logging

from fastapi import APIRouter, Request

from app.logging_utils import log_event

router = APIRouter(tags=["health"])
logger = logging.getLogger("app.health")


@router.get("/api/health")
async def health(request: Request) -> dict[str, str | bool | int]:
    try:
        pending = await request.app.state.outbox.pending_count()
    except Exception as exc:  # a broken disk must not take the health check down with it
        log_event(logger, logging.ERROR, "outbox_unavailable", error=f"{type(exc).__name__}: {exc}")
        pending = -1
    return {
        "status": "ok",
        "sheets_configured": request.app.state.store.configured,
        "outbox_pending": pending,
    }
