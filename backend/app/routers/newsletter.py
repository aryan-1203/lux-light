import logging

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.logging_utils import log_event
from app.rate_limit import client_ip, limiter, newsletter_limit
from app.schemas import is_honeypot, read_json_body, validate_newsletter
from app.services.rows import build_newsletter_row

router = APIRouter(tags=["newsletter"])
logger = logging.getLogger("app.newsletter")


@router.post("/api/newsletter")
@limiter.limit(newsletter_limit)
async def subscribe(request: Request) -> JSONResponse:
    raw = await read_json_body(request)
    if is_honeypot(raw):
        log_event(logger, logging.INFO, "honeypot_triggered", endpoint="newsletter", ip=client_ip(request))
        return JSONResponse({"ok": True})

    sub = validate_newsletter(raw)
    row = build_newsletter_row(sub, user_agent=request.headers.get("user-agent", ""))
    if await request.app.state.delivery.submit_newsletter(row):
        return JSONResponse({"ok": True, "queued": True}, status_code=202)
    return JSONResponse({"ok": True})
