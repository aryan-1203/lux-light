import logging

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.logging_utils import log_event
from app.rate_limit import client_ip, leads_limit, limiter
from app.schemas import is_honeypot, read_json_body, validate_lead
from app.services.rows import build_lead_row, new_lead_id

router = APIRouter(tags=["leads"])
logger = logging.getLogger("app.leads")


@router.post("/api/leads")
@limiter.limit(leads_limit)
async def create_lead(request: Request) -> JSONResponse:
    raw = await read_json_body(request)
    if is_honeypot(raw):
        log_event(logger, logging.INFO, "honeypot_triggered", endpoint="leads", ip=client_ip(request))
        return JSONResponse({"ok": True, "lead_id": new_lead_id(), "updated": False})

    lead = validate_lead(raw)
    if not await request.app.state.turnstile.verify(lead.turnstile_token, client_ip(request)):
        return JSONResponse({"error": "verification_failed"}, status_code=400)

    row = build_lead_row(lead, user_agent=request.headers.get("user-agent", ""))
    outcome = await request.app.state.delivery.submit_lead(row)
    if outcome.queued:
        return JSONResponse({"ok": True, "lead_id": outcome.lead_id, "queued": True}, status_code=202)
    return JSONResponse({"ok": True, "lead_id": outcome.lead_id, "updated": outcome.updated})
