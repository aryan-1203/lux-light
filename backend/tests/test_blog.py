"""Blog API: published posts only, tag filter, pagination, SEO fallbacks."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core import clock
from app.models import BlogPost
from app.models.enums import BlogStatus

DISCLAIMER = "Not a medical device. Consult a doctor for medical conditions."
BODY_MD = f"# Morning light\n\nStep outside after waking.[^1]\n\n{DISCLAIMER}\n\n[^1]: NIGMS fact sheet."


def assert_error(response: httpx.Response, status: int, code: str) -> dict[str, Any]:
    assert response.status_code == status, response.text
    body: dict[str, Any] = response.json()
    assert body["error"]["code"] == code
    return body


def add_post(
    db: Session,
    slug: str,
    *,
    status: BlogStatus = BlogStatus.PUBLISHED,
    published_days_ago: float | None = 1,
    tags: list[str] | None = None,
    **extra: Any,
) -> BlogPost:
    post = BlogPost(
        slug=slug,
        title=extra.pop("title", slug.replace("-", " ").capitalize()),
        excerpt=extra.pop("excerpt", "A short, practical read about morning light."),
        body_md=BODY_MD,
        tags=tags or [],
        status=status,
        published_at=None
        if published_days_ago is None
        else clock.now_utc() - timedelta(days=published_days_ago),
        reading_time_minutes=4,
        **extra,
    )
    db.add(post)
    db.flush()
    return post


def test_list_blog_posts_published_newest_first(client: TestClient, db: Session) -> None:
    older = add_post(db, "what-is-lux", published_days_ago=10)
    newer = add_post(db, "morning-light-routine-for-desk-workers", published_days_ago=2)
    add_post(db, "draft-post", status=BlogStatus.DRAFT, published_days_ago=None)
    add_post(db, "scheduled-post", published_days_ago=-3)  # future publish date

    response = client.get("/api/v1/blog/posts")
    assert response.status_code == 200, response.text
    body = response.json()
    assert [p["slug"] for p in body["items"]] == [newer.slug, older.slug]
    assert body["total"] == 2
    item = body["items"][0]
    assert set(item) == {
        "id",
        "slug",
        "title",
        "excerpt",
        "cover_image_url",
        "cover_image_alt",
        "author_name",
        "tags",
        "published_at",
        "reading_time_minutes",
    }
    assert item["author_name"] == "Dawnlit Team"


def test_list_blog_posts_tag_filter_and_pagination(client: TestClient, db: Session) -> None:
    add_post(db, "post-a", tags=["routine", "mornings"], published_days_ago=3)
    add_post(db, "post-b", tags=["science"], published_days_ago=2)
    add_post(db, "post-c", tags=["routine"], published_days_ago=1)
    routine = client.get("/api/v1/blog/posts", params={"tag": "routine"}).json()
    assert [p["slug"] for p in routine["items"]] == ["post-c", "post-a"]
    assert client.get("/api/v1/blog/posts", params={"tag": "rout"}).json()["total"] == 0
    page = client.get("/api/v1/blog/posts", params={"page": 2, "page_size": 2}).json()
    assert [p["slug"] for p in page["items"]] == ["post-a"]
    assert (page["page"], page["page_size"], page["total"]) == (2, 2, 3)


@pytest.mark.parametrize("params", [{"page": 0}, {"page_size": 101}])
def test_list_blog_posts_validation(client: TestClient, params: dict[str, Any]) -> None:
    assert_error(client.get("/api/v1/blog/posts", params=params), 422, "VALIDATION_ERROR")


def test_get_blog_post(client: TestClient, db: Session) -> None:
    post = add_post(
        db,
        "what-is-lux",
        cover_image_url="/media/blog/what-is-lux.webp",
        cover_image_alt="Morning sunlight on a desk",
        tags=["science"],
    )
    response = client.get("/api/v1/blog/posts/what-is-lux")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["id"] == post.id
    assert body["body_md"].endswith("[^1]: NIGMS fact sheet.")
    assert DISCLAIMER in body["body_md"]
    assert body["tags"] == ["science"]
    assert body["seo"] == {
        "title": post.title,
        "description": post.excerpt,
        "og_image_url": "/media/blog/what-is-lux.webp",
    }
    assert body["updated_at"]


def test_get_blog_post_seo_overrides(client: TestClient, db: Session) -> None:
    add_post(
        db,
        "seo-post",
        seo_title="Custom title",
        seo_description="Custom description",
        og_image_url="/media/og/custom.jpg",
    )
    seo = client.get("/api/v1/blog/posts/seo-post").json()["seo"]
    assert seo == {
        "title": "Custom title",
        "description": "Custom description",
        "og_image_url": "/media/og/custom.jpg",
    }


def test_get_blog_post_not_found(client: TestClient, db: Session) -> None:
    add_post(db, "draft-post", status=BlogStatus.DRAFT, published_days_ago=None)
    add_post(db, "draft-with-date", status=BlogStatus.DRAFT)
    add_post(db, "scheduled-post", published_days_ago=-1)
    for slug in ("missing-post", "draft-post", "draft-with-date", "scheduled-post"):
        assert_error(client.get(f"/api/v1/blog/posts/{slug}"), 404, "BLOG_POST_NOT_FOUND")


def test_get_blog_post_invalid_slug(client: TestClient) -> None:
    assert_error(client.get("/api/v1/blog/posts/Not_A_Slug"), 422, "VALIDATION_ERROR")
