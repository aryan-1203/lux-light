from __future__ import annotations

from typing import Any

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import register_exception_handlers
from app.core.pagination import PageParams, paginate
from app.models import Category
from tests import factories


def _app() -> FastAPI:
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/items")
    def items(params: PageParams = Depends()) -> dict[str, Any]:
        return {"page": params.page, "page_size": params.page_size, "offset": params.offset}

    return app


def test_page_params_defaults_and_bounds() -> None:
    with TestClient(_app()) as c:
        assert c.get("/items").json() == {"page": 1, "page_size": 20, "offset": 0}
        assert c.get("/items?page=3&page_size=100").json() == {"page": 3, "page_size": 100, "offset": 200}
        for query in ("page=0", "page_size=0", "page_size=101", "page=abc"):
            response = c.get(f"/items?{query}")
            assert response.status_code == 422, query
            assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_paginate_entities(db: Session) -> None:
    created = [factories.make_category(db, slug=f"pg-{i}", sort_order=i) for i in range(5)]
    stmt = select(Category).where(Category.slug.like("pg-%")).order_by(Category.sort_order)
    items, total = paginate(db, stmt, PageParams.of(page=2, page_size=2))
    assert total == 5
    assert [c.slug for c in items] == ["pg-2", "pg-3"]
    last, _ = paginate(db, stmt, PageParams.of(page=3, page_size=2))
    assert [c.id for c in last] == [created[4].id]
    beyond, total_beyond = paginate(db, stmt, PageParams.of(page=9, page_size=2))
    assert beyond == []
    assert total_beyond == 5


def test_paginate_rows(db: Session) -> None:
    for i in range(3):
        factories.make_category(db, slug=f"row-{i}")
    stmt = select(Category.id, Category.slug).where(Category.slug.like("row-%")).order_by(Category.slug)
    rows, total = paginate(db, stmt, PageParams.of(page=1, page_size=10))
    assert total == 3
    assert [r.slug for r in rows] == ["row-0", "row-1", "row-2"]
