"""Procedural placeholder renders of the Dawnlit lamps (Pillow), used by the seeds.

Each render is a glowing light panel on a near-black stage, tinted by colour temperature.
Deterministic output: the same arguments always produce the same image.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from PIL import Image, ImageChops, ImageDraw, ImageFilter

LampKind = Literal["desk", "panel", "go"]

SIZE = 1600
BG_TOP = (10, 9, 8)
BG_BOTTOM = (24, 21, 18)
FRAME = (46, 40, 34)
FRAME_EDGE = (78, 68, 58)
SUNRISE = (245, 165, 36)

#: Approximate sRGB of each colour temperature (warm-neutral, daylight, cool).
KELVIN_RGB: dict[int, tuple[int, int, int]] = {
    4000: (255, 206, 156),
    5500: (255, 238, 222),
    6500: (246, 247, 255),
}


@dataclass(frozen=True)
class _Geometry:
    panel: tuple[int, int, int, int]  # x0, y0, x1, y1
    radius: int
    floor_y: int


_GEOMETRY: dict[LampKind, _Geometry] = {
    "desk": _Geometry(panel=(530, 330, 1070, 1050), radius=48, floor_y=1330),
    "panel": _Geometry(panel=(300, 380, 1300, 1050), radius=40, floor_y=1330),
    "go": _Geometry(panel=(610, 520, 990, 1080), radius=56, floor_y=1260),
}


def _mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return (
        round(a[0] + (b[0] - a[0]) * t),
        round(a[1] + (b[1] - a[1]) * t),
        round(a[2] + (b[2] - a[2]) * t),
    )


def _vertical_gradient(size: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    column = Image.new("RGB", (1, size))
    for y in range(size):
        column.putpixel((0, y), _mix(top, bottom, y / (size - 1)))
    return column.resize((size, size))


def _glow(
    size: int, box: tuple[int, int, int, int], color: tuple[int, int, int], blur: int, alpha: int
) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse(box, fill=alpha)
    mask = mask.filter(ImageFilter.GaussianBlur(blur))
    layer = Image.new("RGBA", (size, size), (*color, 0))
    layer.putalpha(mask)
    return layer


def _panel_face(width: int, height: int, tint: tuple[int, int, int]) -> Image.Image:
    """Radial-ish bright face: near-white centre falling off to the tint at the edges."""
    small = Image.new("RGB", (64, 64))
    for y in range(64):
        for x in range(64):
            dx, dy = (x - 31.5) / 31.5, (y - 31.5) / 31.5
            d = min(1.0, (dx * dx + dy * dy) ** 0.5)
            small.putpixel((x, y), _mix((255, 253, 248), tint, d * 0.85))
    return small.resize((width, height), Image.Resampling.BICUBIC)


def _rounded_mask(width: int, height: int, radius: int) -> Image.Image:
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, height - 1), radius=radius, fill=255)
    return mask


def _draw_stand(draw: ImageDraw.ImageDraw, kind: LampKind, geo: _Geometry) -> None:
    x0, _, x1, y1 = geo.panel
    cx = (x0 + x1) // 2
    if kind == "desk":
        draw.rounded_rectangle((cx - 22, y1 - 10, cx + 22, geo.floor_y - 40), radius=12, fill=FRAME)
        draw.rounded_rectangle((cx - 210, geo.floor_y - 52, cx + 210, geo.floor_y), radius=26, fill=FRAME)
        draw.line((cx - 190, geo.floor_y - 50, cx + 190, geo.floor_y - 50), fill=FRAME_EDGE, width=3)
    elif kind == "panel":
        for foot in (x0 + 180, x1 - 180):
            draw.polygon(
                [
                    (foot - 14, y1 - 6),
                    (foot + 14, y1 - 6),
                    (foot + 70, geo.floor_y),
                    (foot + 30, geo.floor_y),
                ],
                fill=FRAME,
            )
        draw.rounded_rectangle((x0 + 60, geo.floor_y - 14, x1 - 60, geo.floor_y), radius=7, fill=FRAME)
    else:
        draw.rounded_rectangle((cx - 120, y1 + 40, cx + 120, y1 + 70), radius=14, fill=FRAME)
        draw.line((cx + 120, y1 + 55, cx + 260, y1 + 150), fill=FRAME_EDGE, width=10)


def render_lamp(kind: LampKind, kelvin: int, *, detail: bool = False) -> Image.Image:
    """Render a lit lamp (``detail=True`` → close-up of the diffuser with a dot texture)."""
    tint = KELVIN_RGB.get(kelvin, KELVIN_RGB[5500])
    geo = _GEOMETRY[kind]
    canvas = _vertical_gradient(SIZE, BG_TOP, BG_BOTTOM).convert("RGBA")

    x0, y0, x1, y1 = geo.panel
    if detail:
        # Zoom: scale the panel up so only a corner + edge glow is visible.
        x0, y0, x1, y1 = 220, 260, 2400, 2400
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    w, h = x1 - x0, y1 - y0

    # Ambient room glow (tinted) + a touch of brand sunrise warmth low in the frame.
    ambient_alpha = 70 if detail else min(150, round(150 * 560 / max(w, 560)))
    canvas.alpha_composite(_glow(SIZE, (cx - w, cy - h, cx + w, cy + h), tint, 220, ambient_alpha))
    canvas.alpha_composite(_glow(SIZE, (0, SIZE - 520, SIZE, SIZE + 380), SUNRISE, 200, 70))

    draw = ImageDraw.Draw(canvas)
    if not detail:
        # Floor reflection.
        canvas.alpha_composite(
            _glow(
                SIZE, (cx - w // 2 - 60, geo.floor_y - 30, cx + w // 2 + 60, geo.floor_y + 60), tint, 40, 90
            )
        )
        _draw_stand(draw, kind, geo)

    # Frame + lit face.
    frame_pad = 22 if not detail else 40
    draw.rounded_rectangle(
        (x0 - frame_pad, y0 - frame_pad, x1 + frame_pad, y1 + frame_pad),
        radius=geo.radius + frame_pad,
        fill=FRAME,
        outline=FRAME_EDGE,
        width=4,
    )
    face = _panel_face(w, h, tint)
    if detail:
        dots = ImageDraw.Draw(face)
        step = 26
        for yy in range(step // 2, h, step):
            for xx in range(step // 2 + (yy // step % 2) * (step // 2), w, step):
                dots.ellipse((xx - 4, yy - 4, xx + 4, yy + 4), fill=_mix(tint, (196, 184, 168), 0.55))
    paste_box = (x0, y0)
    canvas.paste(face, paste_box, _rounded_mask(w, h, geo.radius))

    # Bloom: blurred bright copy screened on top.
    bloom_src = Image.new("RGB", (SIZE, SIZE), (0, 0, 0))
    bloom_src.paste(face, paste_box, _rounded_mask(w, h, geo.radius))
    bloom = bloom_src.filter(ImageFilter.GaussianBlur(60))
    rgb = ImageChops.screen(
        canvas.convert("RGB"), ImageChops.multiply(bloom, Image.new("RGB", bloom.size, (150,) * 3))
    )
    if not detail and kind == "go":
        ImageDraw.Draw(rgb).rounded_rectangle((cx - 30, y1 - 60, cx + 30, y1 - 48), radius=6, fill=FRAME_EDGE)
    return rgb


def render_cover(seed: int) -> Image.Image:
    """Wide (16:9) sunrise-glow cover for blog posts; ``seed`` shifts the horizon and glow."""
    width, height = 1600, 900
    base = _vertical_gradient(width, (16, 12, 10), (40, 26, 14)).resize((width, height)).convert("RGBA")
    horizon = 560 + (seed % 4) * 30
    sun_x = 380 + (seed * 290) % 900
    base.alpha_composite(
        _glow(width, (sun_x - 520, horizon - 420, sun_x + 520, horizon + 420), SUNRISE, 160, 170).crop(
            (0, 0, width, height)
        )
    )
    base.alpha_composite(
        _glow(width, (sun_x - 160, horizon - 160, sun_x + 160, horizon + 160), (255, 236, 200), 50, 230).crop(
            (0, 0, width, height)
        )
    )
    draw = ImageDraw.Draw(base)
    draw.rectangle((0, horizon, width, height), fill=(12, 10, 9, 235))
    draw.line((0, horizon, width, horizon), fill=(255, 196, 120, 160), width=2)
    return base.convert("RGB")
