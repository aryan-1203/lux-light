"""Page/page_size query parameters and a SQLAlchemy paginate helper."""

from __future__ import annotations

from typing import Any

from fastapi import Query
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


class PageParams:
    """``Depends(PageParams)`` → ``page`` (1-based) and ``page_size`` (1..100, default 20)."""

    def __init__(
        self,
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    ) -> None:
        self.page = page
        self.page_size = page_size

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size

    @classmethod
    def of(cls, page: int = 1, page_size: int = DEFAULT_PAGE_SIZE) -> PageParams:
        """Construct outside FastAPI (services, tests)."""
        return cls(page=page, page_size=page_size)


def paginate(db: Session, stmt: Select[Any], params: PageParams) -> tuple[list[Any], int]:
    """Return ``(items, total)``.

    Single-entity/column selects yield scalars (e.g. ORM objects); multi-column selects yield rows.
    """
    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total = int(db.execute(count_stmt).scalar_one())
    page_stmt = stmt.limit(params.limit).offset(params.offset)
    if len(stmt.column_descriptions) == 1:
        items: list[Any] = list(db.execute(page_stmt).scalars().all())
    else:
        items = list(db.execute(page_stmt).all())
    return items, total
