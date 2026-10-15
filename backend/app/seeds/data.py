"""Seed data (DB_SCHEMA §10). All copy follows the compliance guardrail (PLAN §6.5): wellness wording
only, never claims about diseases or conditions, and the exact disclaimer where required."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Final

from app.models.enums import FaqCategory
from app.seeds.render import LampKind

DISCLAIMER: Final = "Not a medical device. Consult a doctor for medical conditions."

CATEGORIES: Final = [
    {
        "slug": "desk-lamps",
        "name": "Desk lamps",
        "description": "Compact 10,000 lux lamps that sit beside your monitor or breakfast plate.",
        "sort_order": 1,
    },
    {
        "slug": "panels",
        "name": "Light panels",
        "description": "Large, room-filling 10,000 lux panels for shared spaces and longer mornings.",
        "sort_order": 2,
    },
    {
        "slug": "portable",
        "name": "Portable",
        "description": "Pocketable bright light for travel, hotel rooms and early commutes.",
        "sort_order": 3,
    },
]

KELVIN_LABELS: Final = {4000: "Warm-neutral", 5500: "Daylight", 6500: "Cool"}


@dataclass(frozen=True)
class VariantSeed:
    sku: str
    kelvin: int
    bundle: str
    bundle_label: str
    price_paise: int
    compare_at_price_paise: int | None
    weight_grams: int
    dims_mm: tuple[int, int, int]
    is_default: bool = False


@dataclass(frozen=True)
class ProductSeed:
    slug: str
    name: str
    category_slug: str
    kind: LampKind  # render shape
    tagline: str
    is_featured: bool
    sort_order: int
    highlights: list[str]
    specs: list[dict[str, str]]
    badges: list[str]
    seo_title: str
    seo_description: str
    description_md: str
    variants: list[VariantSeed] = field(default_factory=list)


_DESK_DIMS = (380, 260, 90)
_DESK_DUO_DIMS = (380, 260, 180)
_PANEL_DIMS = (520, 380, 80)
_PANEL_STAND_DIMS = (1250, 300, 120)
_GO_DIMS = (200, 140, 50)
_GO_CASE_DIMS = (230, 170, 70)

PRODUCTS: Final[list[ProductSeed]] = [
    ProductSeed(
        slug="dawnlit-desk",
        name="Dawnlit Desk — 10,000 lux desk lamp",
        category_slug="desk-lamps",
        kind="desk",
        tagline="Your own sunrise, right on your desk.",
        is_featured=True,
        sort_order=1,
        highlights=[
            "10,000 lux at 30–40 cm",
            "UV-free diffused LED panel",
            "3 brightness levels",
            "Flicker-free, even light",
            "10 / 20 / 30 minute auto-off timer",
            "Slim stand with a small desk footprint",
        ],
        specs=[
            {"label": "Illuminance", "value": "10,000 lux at 35 cm"},
            {"label": "Light source", "value": "LED with UV-free diffuser"},
            {"label": "Colour temperature", "value": "4000K, 5500K or 6500K (by variant)"},
            {"label": "Panel size", "value": "30 × 20 cm"},
            {"label": "Power", "value": "12 V DC adapter (included), 36 W"},
            {"label": "Controls", "value": "Touch on/off, 3 brightness levels, timer"},
            {"label": "In the box", "value": "Lamp, stand, adapter, quick-start guide"},
        ],
        badges=["Bestseller"],
        seo_title="Dawnlit Desk — 10,000 lux desk lamp",
        seo_description=(
            "A slim 10,000 lux desk lamp with UV-free diffused light, three brightness levels and an "
            "auto-off timer — designed for daily morning routines."
        ),
        description_md=(
            "Dawnlit Desk brings bright, sunrise-like light to the place you already start your day: your "
            "desk. Switch it on with your first email or your morning chai and let 10,000 lux of soft, "
            "diffused light keep you company for 10–20 minutes.\n\n"
            "## Designed for daily wellness routines\n\n"
            "- **10,000 lux at 30–40 cm** from a large, evenly lit panel\n"
            "- **UV-free diffuser** for soft, glare-reduced light\n"
            "- **Three colour temperatures** — warm-neutral 4000K, daylight 5500K or cool 6500K\n"
            "- **Auto-off timer** so your session fits neatly into your morning\n\n"
            "## How to use\n\n"
            "Place the lamp slightly to the side of your screen at about 30–40 cm. Let the light reach your "
            "eyes indirectly while you read, type or eat — don't stare into the panel. Most people find a "
            "consistent 10–20 minute session in the first hour after waking easy to keep.\n\n"
            f"*{DISCLAIMER}*\n"
        ),
        variants=[
            VariantSeed("DL-DESK-4000-SOLO", 4000, "solo", "Solo", 499900, None, 1400, _DESK_DIMS),
            VariantSeed("DL-DESK-4000-DUO", 4000, "duo", "Duo pack", 899900, 999800, 2700, _DESK_DUO_DIMS),
            VariantSeed("DL-DESK-5500-SOLO", 5500, "solo", "Solo", 499900, None, 1400, _DESK_DIMS, True),
            VariantSeed("DL-DESK-5500-DUO", 5500, "duo", "Duo pack", 899900, 999800, 2700, _DESK_DUO_DIMS),
            VariantSeed("DL-DESK-6500-SOLO", 6500, "solo", "Solo", 499900, None, 1400, _DESK_DIMS),
            VariantSeed("DL-DESK-6500-DUO", 6500, "duo", "Duo pack", 899900, 999800, 2700, _DESK_DUO_DIMS),
        ],
    ),
    ProductSeed(
        slug="dawnlit-panel",
        name="Dawnlit Panel — large 10,000 lux panel",
        category_slug="panels",
        kind="panel",
        tagline="Room-filling brightness for your morning routine.",
        is_featured=True,
        sort_order=2,
        highlights=[
            "10,000 lux at about 50 cm over a wide area",
            "Large 45 × 30 cm UV-free diffused panel",
            "5 brightness levels",
            "Flicker-free, even light",
            "Optional height-adjustable floor stand",
        ],
        specs=[
            {"label": "Illuminance", "value": "10,000 lux at 50 cm"},
            {"label": "Light source", "value": "LED with UV-free diffuser"},
            {"label": "Colour temperature", "value": "5500K or 6500K (by variant)"},
            {"label": "Panel size", "value": "45 × 30 cm"},
            {"label": "Power", "value": "24 V DC adapter (included), 60 W"},
            {"label": "Controls", "value": "Remote + panel buttons, 5 brightness levels, timer"},
            {"label": "In the box", "value": "Panel, desk kickstand, adapter, remote, guide"},
        ],
        badges=["Room-filling"],
        seo_title="Dawnlit Panel — large 10,000 lux light panel",
        seo_description=(
            "A large 10,000 lux panel with a wide, even glow for shared spaces and longer mornings. "
            "UV-free, flicker-free, with an optional floor stand."
        ),
        description_md=(
            "Dawnlit Panel is our biggest light: a wide, evenly lit 10,000 lux panel that fills a breakfast "
            "nook, a reading chair or a shared workspace with bright morning light.\n\n"
            "## Why a larger panel\n\n"
            "A bigger light source keeps the brightness more even as you move around, so you can sit a "
            "little further back (about 50 cm) and still enjoy a bright, comfortable session.\n\n"
            "- **10,000 lux at about 50 cm**\n"
            "- **UV-free, flicker-free LEDs** behind a soft diffuser\n"
            "- **Daylight 5500K or cool 6500K**\n"
            "- **Floor-stand bundle** for reading chairs and yoga corners\n\n"
            "## How to use\n\n"
            "Angle the panel slightly towards you from the side, keep the recommended distance and don't "
            "stare into the light. Pair your session with an existing habit — breakfast, stretching or "
            "planning your day.\n\n"
            f"*{DISCLAIMER}*\n"
        ),
        variants=[
            VariantSeed("DL-PANEL-5500-SOLO", 5500, "solo", "Solo", 799900, None, 3200, _PANEL_DIMS, True),
            VariantSeed(
                "DL-PANEL-5500-STAND",
                5500,
                "floor_stand",
                "With floor stand",
                949900,
                None,
                5600,
                _PANEL_STAND_DIMS,
            ),
            VariantSeed("DL-PANEL-6500-SOLO", 6500, "solo", "Solo", 799900, None, 3200, _PANEL_DIMS),
            VariantSeed(
                "DL-PANEL-6500-STAND",
                6500,
                "floor_stand",
                "With floor stand",
                949900,
                None,
                5600,
                _PANEL_STAND_DIMS,
            ),
        ],
    ),
    ProductSeed(
        slug="dawnlit-go",
        name="Dawnlit Go — portable travel lamp",
        category_slug="portable",
        kind="go",
        tagline="Bright mornings that fit in your bag.",
        is_featured=False,
        sort_order=3,
        highlights=[
            "10,000 lux at about 25 cm",
            "USB-C powered — works with a laptop or power bank",
            "Weighs about 300 g",
            "UV-free diffused LED",
            "Built-in kickstand",
        ],
        specs=[
            {"label": "Illuminance", "value": "10,000 lux at 25 cm"},
            {"label": "Light source", "value": "LED with UV-free diffuser"},
            {"label": "Colour temperature", "value": "5500K daylight"},
            {"label": "Size", "value": "16 × 10 × 1.5 cm"},
            {"label": "Power", "value": "USB-C, 5 V / 3 A (cable included)"},
            {"label": "Weight", "value": "About 300 g"},
            {"label": "In the box", "value": "Lamp, USB-C cable, quick-start guide"},
        ],
        badges=["Travel-friendly"],
        seo_title="Dawnlit Go — portable 10,000 lux travel lamp",
        seo_description=(
            "A pocketable, USB-C powered 10,000 lux lamp for hotel rooms, early commutes and travel days. "
            "UV-free diffused light with a built-in kickstand."
        ),
        description_md=(
            "Dawnlit Go keeps your morning light routine going wherever you wake up. It is small enough for "
            "a laptop sleeve and runs from any USB-C charger or power bank.\n\n"
            "## Made for travel days\n\n"
            "- **10,000 lux at about 25 cm** from a compact diffused panel\n"
            "- **USB-C power** — no bulky adapter to pack\n"
            "- **Built-in kickstand** for hotel desks and tray tables\n"
            "- **Travel case bundle** to protect it in your bag\n\n"
            "## How to use\n\n"
            "Stand the lamp to the side at about 25 cm while you have breakfast or check messages, and keep "
            "your session at the same time you would at home. Don't stare directly into the light.\n\n"
            f"*{DISCLAIMER}*\n"
        ),
        variants=[
            VariantSeed("DL-GO-5500-SOLO", 5500, "solo", "Solo", 349900, None, 450, _GO_DIMS, True),
            VariantSeed(
                "DL-GO-5500-CASE", 5500, "travel_case", "With travel case", 399900, None, 650, _GO_CASE_DIMS
            ),
        ],
    ),
]

SUPPLIER: Final = {
    "name": "Shenzhen Brightway Lighting Co., Ltd.",
    "contact_name": "Ms. Lin",
    "email": "sales@brightway.example.com",
    "phone": "+86 755 0000 0000",
    "country": "CN",
    "city": "Shenzhen",
    "address": "Placeholder address, Bao'an District, Shenzhen, Guangdong, China",
    "notes": "Fictional placeholder supplier for demo data.",
}


@dataclass(frozen=True)
class BatchSeed:
    reference: str
    received_days_ago: int
    lines: list[tuple[str, int, int]]  # (sku, quantity, unit cost paise)
    shipping_paise: int
    duty_paise: int
    other_charges_paise: int
    gst_paise: int


BATCHES: Final[list[BatchSeed]] = [
    BatchSeed(
        reference="PB-2026-001",
        received_days_ago=45,
        lines=[
            ("DL-DESK-4000-SOLO", 40, 115000),
            ("DL-DESK-4000-DUO", 6, 225000),
            ("DL-DESK-5500-SOLO", 121, 115000),
            ("DL-DESK-5500-DUO", 30, 225000),
            ("DL-DESK-6500-SOLO", 60, 115000),
            ("DL-DESK-6500-DUO", 21, 225000),
            ("DL-GO-5500-SOLO", 82, 82000),
            ("DL-GO-5500-CASE", 36, 98000),
        ],
        shipping_paise=4200000,
        duty_paise=6800000,
        other_charges_paise=950000,
        gst_paise=9600000,
    ),
    BatchSeed(
        reference="PB-2026-002",
        received_days_ago=30,
        lines=[
            ("DL-PANEL-5500-SOLO", 46, 205000),
            ("DL-PANEL-5500-STAND", 15, 270000),
            ("DL-PANEL-6500-SOLO", 25, 205000),
        ],
        shipping_paise=3000000,
        duty_paise=4100000,
        other_charges_paise=600000,
        gst_paise=5500000,
    ),
]

SUNRISE500_ENDS_AT: Final = datetime(2027, 3, 31, 18, 29, 59, tzinfo=UTC)

PROMOS: Final[list[dict[str, Any]]] = [
    {
        "code": "WELCOME10",
        "title": "Welcome — 10% off your first order",
        "description": "10% off your first order (up to ₹500) on orders of ₹1,999 or more.",
        "discount_type": "percentage",
        "percent_off": 10,
        "amount_off_paise": None,
        "max_discount_paise": 50000,
        "min_order_paise": 199900,
        "usage_limit_total": None,
        "usage_limit_per_user": 1,
        "first_order_only": True,
        "stackable": True,
        "ends_at": None,
    },
    {
        "code": "SUNRISE500",
        "title": "Sunrise — ₹500 off",
        "description": "Flat ₹500 off on orders of ₹4,999 or more. Cannot be combined with other codes.",
        "discount_type": "flat",
        "percent_off": None,
        "amount_off_paise": 50000,
        "max_discount_paise": None,
        "min_order_paise": 499900,
        "usage_limit_total": 1000,
        "usage_limit_per_user": 1,
        "first_order_only": False,
        "stackable": False,
        "ends_at": SUNRISE500_ENDS_AT,
    },
]

FAQS: Final[list[tuple[FaqCategory, str, str]]] = [
    (
        FaqCategory.USAGE,
        "What does 10,000 lux mean?",
        "Lux measures how much light reaches a surface. 10,000 lux is far brighter than typical indoor "
        "lighting (usually a few hundred lux) and closer to outdoor daylight on a cloudy day. Our lamps "
        "are rated for 10,000 lux at a specific distance, so sitting at the recommended distance matters.",
    ),
    (
        FaqCategory.USAGE,
        "How long should I use the lamp each day?",
        "Most people find 10–20 minutes in the morning easy to fit into their routine. Use the built-in "
        "timer, keep the session consistent from day to day, and stop if the light feels uncomfortable.",
    ),
    (
        FaqCategory.USAGE,
        "How far should I sit from the lamp?",
        "Dawnlit Desk: about 30–40 cm. Dawnlit Panel: about 50 cm. Dawnlit Go: about 25 cm. Place the lamp "
        "slightly to the side so the light reaches your eyes indirectly.",
    ),
    (
        FaqCategory.USAGE,
        "What is the best time of day to use it?",
        "Morning, ideally within the first hour after you wake up. Bright light early in the day and "
        "dimmer light in the evening make for a clear, consistent daily rhythm. Avoid bright light late "
        "in the evening.",
    ),
    (
        FaqCategory.SAFETY,
        "Is Dawnlit a medical device?",
        f"No. Dawnlit lamps are designed for daily wellness routines. {DISCLAIMER} If you have an eye "
        "condition or take medication that makes you sensitive to light, talk to your doctor before use.",
    ),
    (
        FaqCategory.SAFETY,
        "Is the light UV-free and comfortable for my eyes?",
        "Dawnlit lamps use diffused, UV-free LEDs with flicker-free output. Don't stare directly into the "
        "lamp — let the light reach your eyes from the side — and ask your doctor if you have an eye "
        "condition.",
    ),
    (
        FaqCategory.PRODUCT,
        "Which colour temperature should I choose?",
        "4000K warm-neutral feels softer and cosier; 5500K daylight is a balanced, natural white; 6500K "
        "cool feels crisp and bright. All deliver the same rated brightness — pick the tone you find most "
        "comfortable.",
    ),
    (
        FaqCategory.SHIPPING,
        "How long does delivery take, and do you ship to my pincode?",
        "Most orders arrive in 2–7 working days depending on your location. Enter your pincode at "
        "checkout or on the product page to see serviceability and an estimated delivery window. "
        "Shipping is free on orders above ₹999; otherwise a ₹79 fee applies.",
    ),
    (
        FaqCategory.PAYMENTS,
        "Is Cash on Delivery available?",
        "Yes, on eligible pincodes for orders up to ₹10,000. A ₹49 COD handling fee applies. You can also "
        "pay online with UPI, cards, netbanking, wallets or EMI via Razorpay.",
    ),
    (
        FaqCategory.RETURNS,
        "What is your return and warranty policy?",
        "You can return an unused product within 30 days of delivery. Every Dawnlit lamp also comes with "
        "a 12-month warranty against manufacturing defects.",
    ),
    (
        FaqCategory.PAYMENTS,
        "Will I get a GST invoice?",
        "Yes. A GST invoice is generated automatically for every order and can be downloaded from your "
        "account or the order page once it is ready. Add your GSTIN at checkout to include it on the "
        "invoice.",
    ),
]


@dataclass(frozen=True)
class BlogSeed:
    slug: str
    title: str
    excerpt: str
    tags: list[str]
    published_days_ago: int
    seo_description: str
    cover_alt: str


BLOG_POSTS: Final[list[BlogSeed]] = [
    BlogSeed(
        slug="morning-light-routine-for-desk-workers",
        title="Morning light routine for desk workers",
        excerpt=(
            "Indoor lighting is often far dimmer than daylight. Here is a simple, realistic morning light "
            "routine for people who spend most of the day at a desk."
        ),
        tags=["routine", "work-from-home", "mornings"],
        published_days_ago=40,
        seo_description="A simple morning light routine for desk workers: timing, lamp placement and habits.",
        cover_alt="A warm sunrise glow rising over a dark horizon",
    ),
    BlogSeed(
        slug="what-is-lux",
        title="What is lux? Understanding light intensity in everyday life",
        excerpt=(
            "Lux measures how much light lands on a surface. Learn typical light levels, why distance "
            "matters and how to read a lamp's spec sheet."
        ),
        tags=["science", "lux", "guides"],
        published_days_ago=30,
        seo_description="What lux means, typical indoor and outdoor light levels, and why distance matters.",
        cover_alt="Soft golden light spreading across a dark sky",
    ),
    BlogSeed(
        slug="ten-minutes-of-bright-light-busy-mornings",
        title="How to fit 10 minutes of bright light into a busy morning",
        excerpt=(
            "You don't need a new slot in your day. Stack a short bright light session onto habits you "
            "already have with these ready-made plans."
        ),
        tags=["routine", "habits", "mornings"],
        published_days_ago=20,
        seo_description="Practical ways to fit a 10-minute bright light session into a busy morning.",
        cover_alt="An amber sunrise glow above a calm horizon",
    ),
    BlogSeed(
        slug="building-a-consistent-daily-rhythm",
        title="Light, screens and evenings: building a consistent daily rhythm",
        excerpt=(
            "Bright days and dim evenings give your body clock a clear signal. Here is how light, screens "
            "and evening habits fit together."
        ),
        tags=["rhythm", "evenings", "screens"],
        published_days_ago=10,
        seo_description="How daytime light, evening screens and a regular wake time shape your daily rhythm.",
        cover_alt="Evening light fading to a deep amber horizon",
    ),
]


@dataclass(frozen=True)
class CustomerSeed:
    email: str
    full_name: str
    phone: str
    address: dict[str, str]


DEMO_CUSTOMERS: Final[list[CustomerSeed]] = [
    CustomerSeed(
        email="priya.demo@example.com",
        full_name="Priya Sharma",
        phone="+919800000001",
        address={
            "label": "Home",
            "line1": "Flat 12, Sea Breeze Apartments, Hill Road",
            "line2": "Bandra West",
            "landmark": "Near Mehboob Studio",
            "city": "Mumbai",
            "state_code": "27",
            "pincode": "400050",
        },
    ),
    CustomerSeed(
        email="arjun.demo@example.com",
        full_name="Arjun Rao",
        phone="+919800000002",
        address={
            "label": "Home",
            "line1": "No. 45, 5th Cross, 6th Block",
            "line2": "Koramangala",
            "landmark": "Near Sony World Junction",
            "city": "Bengaluru",
            "state_code": "29",
            "pincode": "560034",
        },
    ),
]


@dataclass(frozen=True)
class ReviewSeed:
    product_slug: str
    rating: int
    author_name: str
    title: str
    body: str
    customer_email: str | None = None  # demo customer → source=customer, verified purchase
    days_ago: int = 5


REVIEWS: Final[list[ReviewSeed]] = [
    ReviewSeed(
        "dawnlit-desk",
        5,
        "Priya S.",
        "Part of my morning now",
        "I switch it on with my first coffee and planning session. It helps me feel more awake during "
        "early calls, and the timer means I don't have to think about it.",
        customer_email="priya.demo@example.com",
        days_ago=6,
    ),
    ReviewSeed(
        "dawnlit-desk",
        5,
        "Neha K.",
        "Bright, even and easy to place",
        "Fits next to my monitor without taking over the desk. The light is very even and the daylight "
        "tone feels natural.",
        days_ago=14,
    ),
    ReviewSeed(
        "dawnlit-desk",
        5,
        "Rohan M.",
        "Easy to fit into my routine",
        "Ten minutes with breakfast is all it takes. Mornings in our north-facing flat feel a lot less "
        "gloomy now.",
        days_ago=21,
    ),
    ReviewSeed(
        "dawnlit-desk",
        5,
        "Ananya R.",
        "Lovely warm-neutral option",
        "I went with 4000K because I find cool light harsh. It's bright but still feels cosy at 7 am.",
        days_ago=27,
    ),
    ReviewSeed(
        "dawnlit-desk",
        4,
        "Karan V.",
        "Great lamp, wish the cable was longer",
        "Build quality is solid and the brightness levels are useful. The adapter cable could be a bit "
        "longer for my desk setup.",
        days_ago=33,
    ),
    ReviewSeed(
        "dawnlit-desk",
        4,
        "Meera J.",
        "Nice addition to WFH mornings",
        "I like having a fixed start to my workday — lamp on, email, lamp off. Simple and it sticks.",
        days_ago=40,
    ),
    ReviewSeed(
        "dawnlit-panel",
        4,
        "Siddharth P.",
        "Fills our breakfast nook",
        "We share it at the breakfast table. The panel is big enough for two people and the remote is handy.",
        days_ago=9,
    ),
    ReviewSeed(
        "dawnlit-panel",
        4,
        "Ishita G.",
        "Great with the floor stand",
        "I use it next to my reading chair. The stand adjusts easily and the light stays even across the "
        "page.",
        days_ago=18,
    ),
    ReviewSeed(
        "dawnlit-panel",
        5,
        "Vikram S.",
        "Wide, comfortable light",
        "Much more comfortable than a small lamp for longer sessions. Feels like sitting by a big window.",
        days_ago=29,
    ),
    ReviewSeed(
        "dawnlit-go",
        5,
        "Priya S.",
        "Comes on every work trip",
        "Hotel rooms are always dim in the morning. This keeps my routine the same wherever I am, and it "
        "runs off my laptop charger.",
        customer_email="priya.demo@example.com",
        days_ago=3,
    ),
    ReviewSeed(
        "dawnlit-go",
        4,
        "Aditya N.",
        "Small but genuinely bright",
        "Surprisingly bright for the size. I'd love a slightly bigger panel, but for travel it's ideal.",
        days_ago=12,
    ),
    ReviewSeed(
        "dawnlit-go",
        3,
        "Farah Q.",
        "Good, but sit close",
        "Works well when it's right beside me; further away it's noticeably less bright, so follow the "
        "distance guide.",
        days_ago=24,
    ),
]
