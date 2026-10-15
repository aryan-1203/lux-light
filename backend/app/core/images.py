"""Image upload validation + WebP rendition generation (product images, generic media).

Uploads: JPEG/PNG/WebP, ≤ 8 MB (413 ``IMAGE_TOO_LARGE``), decodable and at least
``MIN_DIMENSION`` px on the short side (422 ``IMAGE_INVALID``). Renditions are WebP at 480/960/1600 px
wide (never upscaled; an image narrower than 480 px yields a single rendition at its own width).
Files live under ``STORAGE_DIR/media/<subdir>/`` and are served at ``/media/<subdir>/...``.
"""

from __future__ import annotations

import io
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Final

from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import get_settings
from app.core.errors import PayloadTooLargeError, UnprocessableError

MAX_UPLOAD_BYTES: Final = 8 * 1024 * 1024
MIN_DIMENSION: Final = 200
MAX_PIXELS: Final = 40_000_000
RENDITION_WIDTHS: Final = (480, 960, 1600)
ALLOWED_FORMATS: Final = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}
MEDIA_URL_PREFIX: Final = "/media"


@dataclass(frozen=True)
class Rendition:
    width: int
    height: int
    url: str

    def as_dict(self) -> dict[str, Any]:
        return {"width": self.width, "url": self.url}


@dataclass(frozen=True)
class StoredImage:
    storage_path: str  # original, relative to STORAGE_DIR/media
    url: str  # largest rendition URL
    width: int  # of largest rendition
    height: int
    renditions: tuple[Rendition, ...]

    def renditions_json(self) -> list[dict[str, Any]]:
        return [r.as_dict() for r in self.renditions]


def media_url(relative_path: str) -> str:
    return f"{MEDIA_URL_PREFIX}/{relative_path.lstrip('/')}"


def open_validated(data: bytes) -> tuple[Image.Image, str]:
    """Validate upload bytes → ``(image, extension)``; raises 413/422 AppErrors."""
    if len(data) > MAX_UPLOAD_BYTES:
        raise PayloadTooLargeError("IMAGE_TOO_LARGE", "Images must be 8 MB or smaller.")
    try:
        probe = Image.open(io.BytesIO(data))
        fmt = probe.format or ""
        probe.verify()
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as exc:
        raise UnprocessableError("IMAGE_INVALID", "The file is not a valid image.") from exc
    if fmt not in ALLOWED_FORMATS:
        raise UnprocessableError("IMAGE_INVALID", "Only JPEG, PNG and WebP images are accepted.")
    image: Image.Image = Image.open(io.BytesIO(data))
    if image.width * image.height > MAX_PIXELS:
        raise UnprocessableError("IMAGE_INVALID", "Image dimensions are too large.")
    if min(image.width, image.height) < MIN_DIMENSION:
        raise UnprocessableError(
            "IMAGE_INVALID", f"Images must be at least {MIN_DIMENSION} px on the shortest side."
        )
    image = ImageOps.exif_transpose(image)
    return image, ALLOWED_FORMATS[fmt]


def store_image(
    data: bytes,
    *,
    subdir: str,
    stem: str | None = None,
    widths: tuple[int, ...] = RENDITION_WIDTHS,
    quality: int = 82,
) -> StoredImage:
    """Validate ``data``, save the original and WebP renditions under ``media/<subdir>/``."""
    image, ext = open_validated(data)
    return save_renditions(
        image, original=data, original_ext=ext, subdir=subdir, stem=stem, widths=widths, quality=quality
    )


def save_renditions(
    image: Image.Image,
    *,
    subdir: str,
    stem: str | None = None,
    original: bytes | None = None,
    original_ext: str = "png",
    widths: tuple[int, ...] = RENDITION_WIDTHS,
    quality: int = 82,
) -> StoredImage:
    media_root = get_settings().media_dir
    rel_dir = Path(subdir.strip("/"))
    out_dir = media_root / rel_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = stem or uuid.uuid4().hex

    original_rel = rel_dir / f"{stem}-orig.{original_ext}"
    if original is not None:
        (media_root / original_rel).write_bytes(original)
    else:
        image.save(media_root / original_rel)

    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
    targets = sorted({w for w in widths if w <= image.width}) or [image.width]
    renditions: list[Rendition] = []
    for width in targets:
        height = max(1, round(image.height * width / image.width))
        resized = image if width == image.width else image.resize((width, height), Image.Resampling.LANCZOS)
        rel = rel_dir / f"{stem}-{width}.webp"
        resized.save(media_root / rel, format="WEBP", quality=quality, method=4)
        renditions.append(Rendition(width=width, height=height, url=media_url(rel.as_posix())))
    largest = renditions[-1]
    return StoredImage(
        storage_path=original_rel.as_posix(),
        url=largest.url,
        width=largest.width,
        height=largest.height,
        renditions=tuple(renditions),
    )


def delete_stored(storage_path: str, renditions: list[dict[str, Any]] | None) -> None:
    """Best-effort removal of an original + its renditions (paths are confined to the media root)."""
    media_root = get_settings().media_dir.resolve()
    candidates = [storage_path]
    for r in renditions or []:
        url = str(r.get("url", ""))
        if url.startswith(MEDIA_URL_PREFIX + "/"):
            candidates.append(url[len(MEDIA_URL_PREFIX) + 1 :])
    for rel in candidates:
        path = (media_root / rel).resolve()
        if path.is_relative_to(media_root) and path.is_file():
            path.unlink()
