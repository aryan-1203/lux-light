# Dawnlit — 10,000 lux light lamps, D2C store for India

**"Your own sunrise, on demand."** A production-grade direct-to-consumer store for Dawnlit
(placeholder brand) 10,000 lux light lamps: a dark, cinematic, mobile-first storefront plus an
admin dashboard, built on a FastAPI + MySQL backend with Razorpay payments, Shiprocket shipping,
GST invoices and WhatsApp/email notifications. Every external integration has a **mock** that is used
by default, so the whole flow runs offline with no keys.

> **Compliance:** Dawnlit lamps are wellness products. All copy follows the guardrail in
> [`docs/DECISIONS.md`](docs/DECISIONS.md): no claims that the product cures, treats, prevents or
> diagnoses anything. The disclaimer reads exactly: *"Not a medical device. Consult a doctor for
> medical conditions."*

---

## Contents

- [What's inside](#whats-inside)
- [Architecture](#architecture)
- [Quick start A — Docker (one command)](#quick-start-a--docker-one-command)
- [Quick start B — local without Docker](#quick-start-b--local-without-docker)
- [Demo data, logins and promo codes](#demo-data-logins-and-promo-codes)
- [How mock payments work](#how-mock-payments-work)
- [Tests and quality gates](#tests-and-quality-gates)
- [Switching to live keys](#switching-to-live-keys)
- [Project structure](#project-structure)
- [Renaming the brand](#renaming-the-brand)
- [Troubleshooting](#troubleshooting)
- [Further docs](#further-docs)

## What's inside

**Storefront:** home page with a scroll-driven story and interactive Lux Slider, science page, routine
quiz with product recommendation, shop + product pages (variants by colour temperature and bundle),
cart drawer + cart page, checkout (address, pincode serviceability, promo codes, Razorpay or COD),
order success, order tracking, account (orders, addresses, invoices), blog, FAQ, contact and policy
pages. English first, i18n-ready (Hindi stubbed). Reduced-motion fallbacks, WCAG 2.2 AA target.

**Admin (`/admin`, staff/admin roles):** sales dashboard, orders (filters, status updates, shipments,
refunds), products/variants with image upload, inventory and stock adjustments, supplier purchase
batches with landed cost and margins, promo codes, customers, review moderation, blog CMS (Markdown),
content blocks, audit log and CSV exports.

**Backend:** REST API under `/api/v1` (contract: [`docs/openapi.yaml`](docs/openapi.yaml), 114
operations), JWT access/refresh tokens in httpOnly cookies, CSRF double-submit, rate limiting,
server-side pricing/promo/GST computation, stock reservation with `SELECT … FOR UPDATE`, idempotent
webhooks, GST invoice PDFs, a transactional notification outbox and a background worker.

## Architecture

```
Browser ──► nginx (frontend container :80, published on :8080)
             ├─ /               → React SPA (Vite build; /admin is a lazy chunk)
             └─ /api /media /sitemap.xml /robots.txt → FastAPI (backend :8000, uvicorn)
                                                         ├─ MySQL 8.4 (InnoDB, utf8mb4)
                                                         ├─ Redis 7 (rate limits; optional)
                                                         ├─ storage volume (media / invoices / outbox)
                                                         └─ Razorpay · Shiprocket · SMTP · WhatsApp (or mocks)
             worker (same image: python -m app.jobs.worker) — reservation expiry, notification
             retries, abandoned carts, shipment sync, invoice backfill, purge
```

| Layer | Stack |
|---|---|
| Frontend | React 18, TypeScript (strict), Vite, Tailwind CSS 3, Framer Motion, React Router 6, TanStack Query 5, Zustand, React Hook Form + Zod, Lenis, react-i18next, openapi-fetch (types generated from the contract) |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 (sync) + PyMySQL, Alembic, Pydantic v2, argon2, reportlab |
| Data | MySQL 8.4, Redis 7 (optional) |
| Infra | Docker, docker compose, nginx, Caddy (production TLS), GitHub Actions |

Full design — request flow, auth/CSRF, checkout and webhook sequences, order state machine, GST
rules, background jobs, folder layout and conventions — is in **[`docs/PLAN.md`](docs/PLAN.md)**. Data
model: [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md). Binding product decisions:
[`docs/DECISIONS.md`](docs/DECISIONS.md).

## Quick start A — Docker (one command)

Requirements: Docker Engine with **Docker Compose v2.24+**.

```bash
cp .env.example .env
docker compose up --build        # add -d to run in the background (or: make up)
```

The first start builds both images, runs `alembic upgrade head` and loads the demo data
(`SEED_ON_START=true`, idempotent — safe on every restart). Wait until `backend` reports healthy
(`docker compose ps`), then open:

| What | URL |
|---|---|
| Storefront | <http://localhost:8080> |
| Admin dashboard | <http://localhost:8080/admin> |
| API docs (Swagger UI) | <http://localhost:8080/api/docs> |
| OpenAPI JSON | <http://localhost:8080/api/v1/openapi.json> |
| Health | <http://localhost:8080/api/v1/health> |

Port **8080** is the nginx container (change with `FRONTEND_PUBLISH` in `.env`). The API is not
published separately — it is always reached through nginx on the same origin, exactly as in
production, so cookies and CSRF behave identically.

Services: `mysql` (8.4), `redis` (7), `backend` (API), `worker` (jobs), `frontend` (nginx + SPA).
Data lives in the named volumes `mysql-data` and `storage`.

```bash
docker compose logs -f backend worker                  # logs (or: make logs SVC=backend)
docker compose run --rm backend seed --purge-demo      # remove demo customers/orders/reviews
docker compose run --rm backend migrate                # run migrations only
docker compose exec mysql mysql -udawnlit -p luxlight  # SQL shell (password = MYSQL_PASSWORD)
docker compose down                                    # stop (keeps data)
docker compose down -v                                 # stop and wipe DB + uploaded media
```

Defaults in `.env.example` are **mock everything**: `PAYMENT_PROVIDER=mock`, empty Razorpay,
Shiprocket, SMTP and WhatsApp credentials. Emails and WhatsApp messages are written to the
`storage` volume under `outbox/` and logged in `notifications_log`.

## Quick start B — local without Docker

Requirements: Python 3.12, Node 24 (npm 11), MySQL 8 server binaries (`mysqld`). Redis is optional
(the rate limiter falls back to memory).

```bash
# 1. Database: isolated MySQL on 127.0.0.1:3307 (root, no password; DBs luxlight + luxlight_test)
infra/local/mysql.sh start                     # stop | status   (or: make local-db)

# 2. Backend
cd backend
python3.12 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
cp .env.example .env                           # local defaults: port 3307, mock integrations
.venv/bin/alembic upgrade head
.venv/bin/python -m app.seeds                  # essential + demo data (idempotent)
.venv/bin/uvicorn app.main:app --reload --port 8000
# in a second terminal (optional locally; needed for reservation expiry, notification retries):
.venv/bin/python -m app.jobs.worker            # --once <job> to run a single job

# 3. Frontend (third terminal)
cd frontend
npm ci
npm run dev                                    # http://localhost:5173 (proxies /api, /media → :8000)
```

Locally the storefront is at <http://localhost:5173>, admin at <http://localhost:5173/admin>, API docs
at <http://localhost:8000/api/docs>.

**Frontend only, no backend at all:** `VITE_API_MOCK=true npm run dev` — Mock Service Worker answers
every API call in the browser with fixture data (handlers in `frontend/src/mocks/handlers/`).

## Demo data, logins and promo codes

Seeded by `python -m app.seeds` (details: [`docs/DB_SCHEMA.md` §10](docs/DB_SCHEMA.md)):
3 products / 12 variants with stock (one low-stock, one out-of-stock variant), a supplier with two
landed-cost purchase batches, blog posts, FAQs, two demo customers and six demo orders in different
states (with invoices, shipments and notifications).

| Account | Email | Password |
|---|---|---|
| Admin | `admin@dawnlit.in` | value of `SEED_ADMIN_PASSWORD` — local default `ChangeMe!2026` |
| Staff | `staff@dawnlit.in` | value of `SEED_STAFF_PASSWORD` — local default `ChangeMe!2026` |
| Demo customer | `priya.demo@example.com` (Mumbai, intra-state GST) | value of `SEED_DEMO_PASSWORD` — local default `DemoPass!2026` |
| Demo customer | `arjun.demo@example.com` (Bengaluru, inter-state GST) | same as above |

The default passwords are accepted **only outside production**; seeding a production database
refuses them. Demo customers/orders are refused in production and can be removed anywhere with
`python -m app.seeds --purge-demo`.

| Promo code | Rule |
|---|---|
| `WELCOME10` | 10 % off, max ₹500, min order ₹1,999, first order only, once per customer, stackable |
| `SUNRISE500` | ₹500 off, min order ₹4,999, once per customer, 1,000 uses total, not stackable, ends 31 Mar 2027 |

Shipping is free above ₹999 (else ₹79); COD adds ₹49 and is limited to orders up to ₹10,000.
Mock courier pincode rules: starting with `9` → not serviceable; `18`, `19`, `79` → serviceable but no
COD; everything else serviceable (e.g. `400050`, `560034`).

## How mock payments work

With `PAYMENT_PROVIDER=mock` (or `razorpay` with empty keys) checkout runs the **same code path** as
Razorpay, with a local gateway instead of Razorpay's servers:

1. `POST /api/v1/checkout` creates the order (stock reserved for 15 minutes) and a gateway order.
2. Instead of Razorpay's checkout.js the SPA opens a **mock payment dialog** where you choose success
   or failure. The backend signs the result with HMAC-SHA256 using `MOCK_PAYMENT_SECRET` — the same
   signature scheme Razorpay uses.
3. `POST /api/v1/payments/verify` verifies the signature exactly as in live mode, marks the order paid,
   commits stock, generates the GST invoice PDF and queues notifications.

No money moves and no Razorpay account is needed. Production refuses to start with the mock gateway.
To test with **Razorpay test mode** instead, see [Switching to live keys](#switching-to-live-keys) —
test keys show Razorpay's real checkout with test cards/UPI.

## Tests and quality gates

The same gates run locally (Make targets) and in CI (`.github/workflows/ci.yml`):

| Gate | Command | Notes |
|---|---|---|
| Backend | `make be-gate` → `ruff check`, `ruff format --check`, `mypy app` (strict), `pytest` | needs the local MySQL (`luxlight_test`) |
| Database | `make db-gate` → `alembic upgrade head` + seeds twice (idempotency) | |
| Frontend | `make fe-gate` → `npm run lint`, `npm run typecheck`, `npm run test -- --run`, `npm run build` | |
| Contract | `make contract` → regenerate `src/api/schema.d.ts` from `docs/openapi.yaml` (must be unchanged) + `CONTRACT_STRICT=1 pytest tests/test_contract.py` | the live API must equal the contract |
| E2E | `make e2e` → resets + seeds the local DB, starts the API (`ENV=test`, mock gateway) and runs Playwright (mobile + desktop Chromium) against `vite preview` on :4173 | **wipes the local `luxlight` DB** |

Install Playwright's browser once: `cd frontend && npx playwright install chromium`.
CI additionally builds both Docker images (no push) and validates the compose files. Coverage XML,
JUnit and the Playwright HTML report are uploaded as workflow artifacts. Test results for each phase
are recorded in `docs/TEST_REPORT.md`.

## Switching to live keys

All keys are read from environment variables only (`.env` for Docker, `backend/.env` locally). Never
commit them. Generate random secrets with
`python3 -c "import secrets; print(secrets.token_urlsafe(48))"`.

### Razorpay — test mode first

1. Create a Razorpay account → Dashboard in **Test Mode** → *Account & Settings → API Keys* →
   generate a key pair (`rzp_test_…`).
2. In `.env`: `PAYMENT_PROVIDER=razorpay`, `RAZORPAY_KEY_ID=rzp_test_…`, `RAZORPAY_KEY_SECRET=…`.
3. Webhook (needs a public HTTPS URL — use your staging domain or a tunnel such as `cloudflared`/`ngrok`
   for local tests): *Dashboard → Webhooks → Add New Webhook*
   - URL: `https://<your-domain>/api/v1/payments/webhook/razorpay`
   - Secret: a random value → put the same value in `RAZORPAY_WEBHOOK_SECRET`
   - Active events: `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`, `refund.failed`
4. Restart (`docker compose up -d`). `GET /api/v1/health` now reports `"payment_gateway": "razorpay"`.
5. Place a test order with Razorpay's test cards / test UPI IDs and confirm the order becomes *paid*
   both via the browser callback and the webhook (admin → order → payments).

### Razorpay — live

Complete KYC and activation first ([`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md)). Then switch
the Dashboard to **Live Mode**, generate live keys (`rzp_live_…`), create the webhook **again in live
mode** (test and live webhooks are separate, with their own secret) and replace the three
`RAZORPAY_*` values. Set `ENV=production` — the app then refuses to start unless Razorpay keys, the
webhook secret and all secrets are non-default.

### Shiprocket

Shiprocket → *Settings → API → Create an API user* (a separate login, not your main account). Set
`SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD` and `SHIPROCKET_PICKUP_LOCATION` (the pickup address
nickname exactly as in *Settings → Pickup Addresses*). Configure the tracking webhook to
`https://<your-domain>/api/v1/shipping/webhook/shiprocket` sending header
`X-Webhook-Token: <SHIPPING_WEBHOOK_TOKEN>`. With empty credentials the mock courier is used.

### Email (SMTP)

Use a transactional provider (Amazon SES, Postmark, SendGrid, Zoho ZeptoMail, …) with SPF, DKIM and
DMARC set up for your sending domain. Set `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_USER`,
`SMTP_PASSWORD`, `SMTP_FROM` (e.g. `Dawnlit <orders@your-domain>`), `SMTP_STARTTLS=true`.
Empty `SMTP_HOST` keeps writing emails to `storage/outbox/`.

### WhatsApp

Pick a WhatsApp Business API provider (Gupshup, Interakt, Twilio, 360dialog, …), get your message
templates approved, then set `WHATSAPP_PROVIDER_URL` and `WHATSAPP_API_KEY`. The adapter in
`backend/app/adapters/whatsapp/http.py` is a provider-agnostic HTTP stub — map it to your provider's
request format before going live.

### Production settings checklist

`ENV=production` also turns on `Secure` cookies, JSON logs and disables `/api/docs`. Set
`CORS_ORIGINS`, `PUBLIC_SITE_URL` and `VITE_SITE_URL` to `https://<your-domain>`, plus `SECRET_KEY`,
`MOCK_PAYMENT_SECRET`, `SHIPPING_WEBHOOK_TOKEN`, `SEED_ADMIN_PASSWORD`, `SEED_STAFF_PASSWORD` and the
seller details (`BRAND_LEGAL_NAME`, `SELLER_GSTIN`, `SELLER_STATE_CODE`, `SELLER_ADDRESS`,
`SUPPORT_EMAIL`, `SUPPORT_PHONE`). Deployment: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Project structure

```
backend/                  FastAPI app (Python 3.12)
  app/core/               settings (config.py), security, CSRF, errors, logging, rate limiting
  app/models/ schemas/    SQLAlchemy models / Pydantic schemas (names match the OpenAPI contract)
  app/services/           business logic (pricing, GST, cart, checkout, orders, payments, …)
  app/api/v1/             routers (storefront + admin/), app/api/seo.py (sitemap, robots)
  app/adapters/           payments, shipping, email, whatsapp (real + mock)
  app/jobs/               background worker and periodic jobs
  app/seeds/              python -m app.seeds (essential + demo data)
  alembic/                migrations
  tests/                  pytest (unit + API + integration)
  Dockerfile              multi-stage, non-root; same image for API and worker
frontend/                 React SPA (storefront + /admin)
  src/                    pages, features, design-system, layout, admin, api (generated types), mocks (MSW), i18n
  e2e/                    Playwright specs
  nginx.conf, Dockerfile  production serving + same-origin proxy
docs/                     BRIEF, DECISIONS, PLAN, DB_SCHEMA, DESIGN_SYSTEM, openapi.yaml,
                          DEPLOYMENT, LAUNCH_CHECKLIST, TEST_REPORT, SECURITY_REVIEW
infra/docker/             backend container entrypoint (wait for DB → migrate → seed → exec)
infra/caddy/              Caddyfile for production TLS
infra/local/mysql.sh      isolated local MySQL without Docker
docker-compose.yml        local stack; docker-compose.prod.yml = production override
.github/                  CI workflow + Dependabot
Makefile                  shortcuts: make help
```

## Renaming the brand

"Dawnlit" is a placeholder. A rename touches two places:

1. **Frontend:** `frontend/src/config/brand.ts` — `BRAND_NAME`, `TAGLINE`, `BRAND_LEGAL_NAME`, support
   contacts, social links and the footer compliance block (importer, IEC, BIS R-number, GSTIN).
   Also update the static `<title>`/meta in `frontend/index.html`, `public/manifest.webmanifest` and
   the favicon/OG image.
2. **Backend:** env `BRAND_NAME` and `BRAND_LEGAL_NAME` (used in invoices, emails and SEO), plus
   `SMTP_FROM`, `SUPPORT_EMAIL` and the seller variables.

Seeded product names/SKUs (`DL-…`), the order/invoice prefixes and staff emails (`admin@dawnlit.in`)
come from the seed data and DECISIONS; change those in `backend/app/seeds/` before seeding production
if you want them renamed too.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `docker compose up` says `additional_contexts` / `required` is unsupported | Upgrade to Docker Compose v2.24+ (`docker compose version`). |
| `backend` restarts with `invalid configuration: … Invalid production settings` | `ENV=production` requires real secrets and Razorpay keys — see the production checklist above, or use `ENV=development` locally. |
| `backend` unhealthy on first start | First boot runs migrations and renders seed images; give it up to ~3 min. `docker compose logs backend`. |
| `database not reachable` | Check `MYSQL_PASSWORD` uses URL-safe characters (it is embedded in `DATABASE_URL`). After changing MySQL credentials, the existing `mysql-data` volume keeps the old ones: `docker compose down -v` (wipes data). |
| Port 8080 already in use | Set `FRONTEND_PUBLISH=8081` in `.env`. |
| Login works but every POST returns `403 CSRF_FAILED` | Open the site via the same origin as the API (8080 for Docker, 5173 locally); don't call `:8000` directly from the browser. |
| Cookies not kept after login on `http://` | `ENV=production` sets `Secure` cookies — use HTTPS, or `ENV=development` locally. |
| Local tests fail with `Refusing to run tests against a non-test database` | `TEST_DATABASE_URL` must point at a database whose name ends in `_test`. |
| `infra/local/mysql.sh: mysqld: command not found` | Install MySQL server (`brew install mysql`) — only the binaries are used; it runs on port 3307 with its own data dir in `.localdata/`. |
| Frontend shows fixture data instead of your DB | `VITE_API_MOCK=true` is set — unset it or set `false`. |
| Payment stays pending in Razorpay test mode | Check the webhook URL is public HTTPS, the secret matches `RAZORPAY_WEBHOOK_SECRET`, and look at admin → order → payments. The worker must be running for expiry/retries. |
| Emails not arriving | With empty `SMTP_HOST` they are files under `storage/outbox/`. With SMTP set, check `notifications_log` (admin) for the error. |

## Further docs

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — production topology, hardening, migrations, backups, rollback
- [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) — payments, GST, courier, legal/BIS, analytics, go-live smoke test
- [`docs/PLAN.md`](docs/PLAN.md) · [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md) · [`docs/openapi.yaml`](docs/openapi.yaml) · [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- `docs/TEST_REPORT.md` (QA) · `docs/SECURITY_REVIEW.md` (security review)
