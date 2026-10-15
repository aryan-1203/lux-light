# Orchestrator Decisions (defaults chosen where the brief was open)

These are binding for every agent. Changing one requires the orchestrator.

## Brand & catalog
- **Brand name:** `Dawnlit` (placeholder — the brief left `{{BRAND_NAME}}` unfilled). Tagline: **"Your own sunrise, on demand."**
  Brand strings live ONLY in `frontend/src/config/brand.ts` and backend env `BRAND_NAME` / `BRAND_LEGAL_NAME` so a rename is a 2-file change.
- **3 SKUs** (product → variants):
  | Product | slug | Base price (INR, GST-incl.) | Variants |
  |---|---|---|---|
  | Dawnlit Desk — 10,000 lux desk lamp | `dawnlit-desk` | ₹4,999 | colour temp {4000K Warm-neutral, 5500K Daylight, 6500K Cool} × bundle {Solo, Duo pack (₹8,999)} |
  | Dawnlit Panel — large 10,000 lux panel | `dawnlit-panel` | ₹7,999 | colour temp {5500K, 6500K} × bundle {Solo, With floor stand (₹9,499)} |
  | Dawnlit Go — portable travel lamp | `dawnlit-go` | ₹3,499 | colour temp {5500K} × bundle {Solo, With travel case (₹3,999)} |
  Categories: `desk-lamps`, `panels`, `portable`. SKU format `DL-{PRODUCT}-{K}-{BUNDLE}` e.g. `DL-DESK-5500-SOLO`.
- **HSN 9405** (lamps & lighting fittings), **GST rate stored per product (default 18%)** — must be verified by the user's CA; flagged in LAUNCH_CHECKLIST.
- Seller registered state default **Maharashtra (state code 27)**, GSTIN placeholder `27AAAAA0000A1Z5` via env `SELLER_GSTIN`.

## Money & tax
- All money is **integer paise** (`BIGINT`) in DB and API (`*_paise` fields). Never floats.
- Prices are **GST-inclusive**. Taxable value = `round(gross * 100 / (100 + rate))`; tax = gross − taxable.
  Intra-state (ship-to state == seller state) → CGST = SGST = tax/2 (odd paise goes to SGST); inter-state → IGST = tax.
- Shipping: free above ₹999 (`FREE_SHIPPING_THRESHOLD_PAISE=99900`), else ₹79. COD fee ₹49 (`COD_FEE_PAISE=4900`), COD max order ₹10,000.
- Order number `DL-YYMMDD-XXXXXX` (random base32, unique). Invoice number `DL/{FY}/{seq:06d}` e.g. `DL/2026-27/000001`, sequence per financial year from `invoice_sequences` row locked `FOR UPDATE`.

## Backend
- Python 3.12, FastAPI, **sync SQLAlchemy 2.0 + PyMySQL** (simpler, battle-tested; endpoints run in threadpool). Alembic. Pydantic v2 + pydantic-settings.
- Package layout `backend/app/{core,db,models,schemas,services,api/v1,adapters,jobs,templates}`; tests in `backend/tests`.
- **Pydantic model class names MUST equal the component schema names in `docs/openapi.yaml`**, and every route MUST set `operation_id` equal to the contract's `operationId`, so FastAPI's generated schema matches the contract.
- Error format (all non-2xx): `{"error": {"code": "STRING_CODE", "message": "human readable", "details": {...}|null}}`.
- Pagination: query `page` (1-based), `page_size` (default 20, max 100) → `{"items": [...], "page", "page_size", "total"}`.
- Auth: JWT access (15 min) + refresh (30 days, rotating, hashed in `refresh_tokens` table) in **httpOnly cookies** (`dl_access`, `dl_refresh`), `Secure` when `ENV=production`, `SameSite=Lax`. Passwords argon2 (passlib).
- **CSRF:** double-submit — server sets readable cookie `dl_csrf`; every unsafe method (POST/PUT/PATCH/DELETE) under `/api/v1` must send header `X-CSRF-Token` equal to it. Exempt: `/api/v1/payments/webhook/*`, `/api/v1/shipping/webhook/*`. `GET /api/v1/auth/csrf` issues the cookie.
- Guest carts: `dl_cart` httpOnly cookie holding a signed cart token; merged into user cart on login.
- Rate limiting: fixed-window limiter; Redis backend when `REDIS_URL` set, in-memory otherwise. Applied to auth, promo-validate and payment endpoints.
- Background work: FastAPI `BackgroundTasks` for immediate side effects (emails, WhatsApp, invoice PDF) + a **worker process** `python -m app.jobs.worker` (asyncio loop) for periodic jobs: expire stock reservations (every 60s), abandoned-cart emails (hourly). No Celery.
- Stock: `inventory(variant_id, on_hand, reserved, low_stock_threshold)`. Reservation at order creation with `SELECT … FOR UPDATE` on inventory rows **ordered by variant_id** (deadlock avoidance) → `stock_reservations` rows with `expires_at = now + 15 min`. On payment captured: on_hand −= qty, reserved −= qty, movement logged. On failure/expiry/cancel: reserved −= qty.
- Payments: `PAYMENT_PROVIDER=razorpay|mock`. If `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are empty → **mock gateway** (HMAC-SHA256 with a local dev secret, same verification code path). Real mode uses Razorpay Orders API + checkout.js. Webhooks verified with `RAZORPAY_WEBHOOK_SECRET`, idempotent via unique `payments.razorpay_payment_id` + `webhook_events` (unique event id).
- Shipping: `ShippingAdapter` protocol; `MockShippingAdapter` (default) and `ShiprocketAdapter` (used when `SHIPROCKET_EMAIL`/`SHIPROCKET_PASSWORD` set).
- Notifications: `EmailAdapter` (console/file mock default; SMTP when `SMTP_HOST` set) and `WhatsAppAdapter` (mock default; generic HTTP provider stub). Everything logged to `notifications_log` (no message bodies with PII in app logs).
- Invoice PDF: `reportlab` (pure Python). Stored under `backend/storage/invoices/`.
- Media uploads: `backend/storage/media/`, served at `/media/*`.

## Frontend
- React 18 + TS strict + Vite + Tailwind 3 + Framer Motion + React Router 6 + TanStack Query 5 + Zustand + RHF + Zod + Lenis + react-i18next + react-helmet-async.
- API types generated with `openapi-typescript` → `src/api/schema.d.ts`; calls via `openapi-fetch` client in `src/api/client.ts` (adds `X-CSRF-Token`, `credentials: 'include'`).
- Dev: Vite on :5173 proxies `/api` and `/media` to :8000 (same origin → cookies/CSRF simple). Prod: nginx serves the SPA and proxies `/api` (same origin).
- Mocks: MSW enabled when `VITE_API_MOCK=true`; handlers split per domain under `src/mocks/handlers/*.ts`.
- Admin lives in the same SPA under `/admin/*`, lazy-loaded chunk.
- i18n: `react-i18next`, resources in `src/i18n/locales/{en,hi}/<namespace>.json`; English complete, Hindi stubbed.

## Design system (from ui-ux-pro-max skill)
Skill queries run: `--design-system "premium wellness dark immersive"` (motion 8, density 3), plus `--domain style|color|typography|ux`.
- **Pattern:** Scroll-Triggered Storytelling — Intro hook → problem → journey → solution → climax CTA; mini CTA at end of each chapter; progress indicator; narrative must remain readable with all scroll effects disabled; disable parallax/scrub under reduced motion.
- **Style:** Dark Mode (OLED) base — deep near-black backgrounds, minimal glow used sparingly, high contrast text (target 7:1 body), visible focus. Light is the hero: warm amber→daylight gradients emanating from the lamp.
- **Palette** (adapted from skill's "premium black + gold accent" to dark): bg `#0A0908`, surface `#141210`, surface-2 `#1E1A16`, border `#2E2822`, text `#F5F1EA`, text-muted `#A8A096` (≥4.5:1 on bg), primary/sunrise `#F5A524`, sunrise-strong `#FFB84D`, daylight `#FFF4D6`, CTA = sunrise on dark text `#0A0908`, destructive `#F87171`, success `#4ADE80`, focus ring `#FFD27A`.
- **Typography:** "Tech Startup" pairing — **Space Grotesk** (headings) + **DM Sans** (body); base 16px, line-height 1.5–1.6; fluid display sizes via clamp().
- **Motion:** context-aware durations (micro 150–200ms, UI 250–300ms, page 500–700ms), exit faster than enter, spring for magnetic/drag, transform/opacity only, honor `prefers-reduced-motion` everywhere (Framer `MotionConfig reducedMotion="user"` + Lenis disabled).
- **Checklist:** SVG icons only (lucide-react), no emoji icons; 44×44 touch targets; visible labels on forms with inline errors; CLS < 0.1 (reserve media space); responsive at 375/768/1024/1440; no horizontal scroll.

## Local dev without Docker (this machine has no Docker/Redis)
- `infra/local/mysql.sh start` → isolated MySQL on `127.0.0.1:3307`, root/no password, DBs `luxlight` and `luxlight_test`.
- Backend venv: `backend/.venv` (python3.12). Redis optional (in-memory fallbacks).
- Docker files are still delivered (compose with mysql:8.4 + redis:7) — verified only on a machine with Docker.

## Compliance guardrail (all copy)
Never claim the product cures, treats, prevents or diagnoses any disease/condition (no "SAD treatment", "cures insomnia", "treats depression"). Use "supports", "helps you feel", "designed for daily wellness routines". Disclaimer text exactly: **"Not a medical device. Consult a doctor for medical conditions."** Footer has a placeholder block for BIS / import compliance (IEC, BIS R-number, importer address).
