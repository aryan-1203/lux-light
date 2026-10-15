from __future__ import annotations

import io

import pytest
from PIL import Image

from app.core.config import Settings
from app.core.errors import PayloadTooLargeError, UnprocessableError
from app.core.images import delete_stored, store_image


def _png(width: int, height: int) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (width, height), (245, 165, 36)).save(buf, format="PNG")
    return buf.getvalue()


def test_store_image_creates_webp_renditions(settings: Settings) -> None:
    stored = store_image(_png(2000, 1000), subdir="products/999", stem="unit")
    assert [r.width for r in stored.renditions] == [480, 960, 1600]
    assert stored.url == "/media/products/999/unit-1600.webp"
    assert (stored.width, stored.height) == (1600, 800)
    assert stored.renditions_json()[0] == {"width": 480, "url": "/media/products/999/unit-480.webp"}
    media = settings.media_dir
    assert (media / stored.storage_path).is_file()
    for r in stored.renditions:
        path = media / r.url.removeprefix("/media/")
        assert Image.open(path).format == "WEBP"
    delete_stored(stored.storage_path, stored.renditions_json())
    assert not (media / stored.storage_path).exists()


def test_small_image_is_not_upscaled() -> None:
    stored = store_image(_png(300, 300), subdir="tmp")
    assert [r.width for r in stored.renditions] == [300]


def test_rejects_too_large() -> None:
    with pytest.raises(PayloadTooLargeError) as info:
        store_image(b"x" * (8 * 1024 * 1024 + 1), subdir="tmp")
    assert info.value.code == "IMAGE_TOO_LARGE"
    assert info.value.status_code == 413


@pytest.mark.parametrize("payload", [b"not an image", b"GIF89a" + b"\x00" * 50])
def test_rejects_invalid(payload: bytes) -> None:
    with pytest.raises(UnprocessableError) as info:
        store_image(payload, subdir="tmp")
    assert info.value.code == "IMAGE_INVALID"


def test_rejects_unsupported_format_and_tiny() -> None:
    gif = io.BytesIO()
    Image.new("RGB", (400, 400)).save(gif, format="GIF")
    with pytest.raises(UnprocessableError):
        store_image(gif.getvalue(), subdir="tmp")
    with pytest.raises(UnprocessableError):
        store_image(_png(100, 400), subdir="tmp")


def test_delete_stored_ignores_paths_outside_media(settings: Settings) -> None:
    outside = settings.STORAGE_DIR / "keep.txt"
    outside.write_text("x")
    delete_stored("../keep.txt", [{"url": "/media/../keep.txt"}])
    assert outside.exists()
