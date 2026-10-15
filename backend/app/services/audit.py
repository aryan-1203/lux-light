"""Admin audit log (PLAN §4.1). Append-only.

Action naming: ``"<entity>.<verb>"`` e.g. ``order.status_update``, ``order.refund``, ``product.update``,
``promo.create``, ``customer.block``, ``export.orders``.
"""

from __future__ import annotations

import re
from collections.abc import Mapping
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Final

from fastapi import Request
from sqlalchemy.orm import Session

from app.core.security import ip_hash
from app.models import AuditLog, User

REDACTED: Final = "[REDACTED]"
_SENSITIVE_RE: Final = re.compile(
    r"password|passwd|token|secret|otp|signature|api_?key|authorization|cookie|_hash$", re.IGNORECASE
)
_MAX_USER_AGENT: Final = 255


def _is_sensitive(key: str) -> bool:
    return bool(_SENSITIVE_RE.search(key))


def _jsonable(value: Any) -> Any:
    if value is None or isinstance(value, bool | int | float | str):
        return value
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, datetime | date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, Mapping):
        return {str(k): (REDACTED if _is_sensitive(str(k)) else _jsonable(v)) for k, v in value.items()}
    if isinstance(value, list | tuple | set | frozenset):
        return [_jsonable(v) for v in value]
    return str(value)


def diff_fields(before: Mapping[str, Any], after: Mapping[str, Any]) -> dict[str, list[Any]]:
    """``{field: [old, new]}`` for every changed field; secret-looking fields are redacted."""
    changes: dict[str, list[Any]] = {}
    for key in sorted(set(before) | set(after)):
        old, new = before.get(key), after.get(key)
        if _jsonable(old) == _jsonable(new):
            continue
        if _is_sensitive(key):
            changes[key] = [REDACTED, REDACTED]
        else:
            changes[key] = [_jsonable(old), _jsonable(new)]
    return changes


def log_admin_action(
    db: Session,
    actor: User | None,
    action: str,
    entity: str,
    entity_id: int | str,
    diff: Mapping[str, Any] | None = None,
    *,
    request: Request | None = None,
) -> AuditLog:
    """Append an ``audit_log`` row (flushed, not committed — the caller owns the transaction)."""
    ip: str | None = None
    user_agent: str | None = None
    if request is not None:
        from app.api.deps import get_client_ip

        ip = ip_hash(get_client_ip(request))
        ua = request.headers.get("user-agent")
        user_agent = ua[:_MAX_USER_AGENT] if ua else None
    entry = AuditLog(
        actor_user_id=actor.id if actor is not None else None,
        actor_email=actor.email if actor is not None else None,
        action=action[:64],
        entity_type=entity[:40],
        entity_id=str(entity_id)[:64],
        diff=_jsonable(diff) if diff is not None else None,
        ip_hash=ip,
        user_agent=user_agent,
    )
    db.add(entry)
    db.flush()
    return entry
