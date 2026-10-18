# Pre-launch site: 10,000 lux light lamp (India)

A marketing and early-access site. Visitors fill an interest form, which is saved to Google Sheets, and then
continue the conversation on WhatsApp.

| Folder | What it is |
|---|---|
| `frontend/` | Next.js 16 (App Router, Turbopack, Cache Components), TypeScript strict, Tailwind CSS 4, Motion, Lenis, React Three Fiber, Velite (MDX), React Hook Form + Zod |
| `backend/` | FastAPI on Python 3.12: `POST /api/leads`, `POST /api/newsletter`, `GET /api/health`, Google Sheets writer with a durable SQLite outbox, Cloudflare Turnstile, rate limiting, xlsx export script |
| `DESIGN.md` | Tokens, type, motion rules, hero choreography, components |
| `PLAN.md` | Phases, decisions, risks |
| `render.yaml` | Render Blueprint for the backend |

**Everything brand-related lives in `frontend/site.config.ts`:** brand name, tagline, WhatsApp number, price,
batch size, offer text, socials and budget ranges. Product figures are in `frontend/data/specs.ts` and statistics
are in `frontend/data/stats.ts`. Figures still to be confirmed are flagged `verify: true` in those files (not shown on the site).

---

## 1. Run it locally

Requirements: Node 22+ (tested on 24) and Python 3.12.

```bash
# Backend → http://localhost:8000 (API docs at /docs)
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env          # with no Sheets credentials, leads go to the local outbox (202 "queued")
uvicorn app.main:app --reload --port 8000

# Frontend → http://localhost:3000 (in a second terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The form works end to end locally. Without Google credentials, each submission is stored in
`backend/data/outbox.sqlite3`, and it's written to the sheet automatically once credentials are added.

Useful QA switches: `/?hero=2d` forces the 2D hero, `/?hero=3d` forces the WebGL hero.

### Checks (CI runs the same)

```bash
cd frontend && npm run format:check && npm run lint && npm run typecheck && npm run build
cd backend  && ruff check . && ruff format --check . && pytest -q
```

---

## 2. Deploy: the order that works

You'll set up four things. Each one gives you a value the next step needs.

1. **Google Sheets + service account** → `LEADS_SHEET_ID`, `NEWSLETTER_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_B64`
2. **Cloudflare Turnstile** → site key (frontend), secret key (backend)
3. **Render (backend API)** → the API URL, e.g. `https://lamp-api.onrender.com`
4. **Vercel (frontend)** → the site URL, which goes back into the backend's `CORS_ORIGINS`

### Step 1: Google Sheets API

1. Open <https://console.cloud.google.com/> → project picker → **New project** (e.g. `lamp-leads`) → **Create**.
2. **APIs & Services → Library** → search **Google Sheets API** → **Enable**.
3. **APIs & Services → Credentials → Create credentials → Service account**. Name it `sheets-writer`, skip the
   optional role steps, then click **Done**.
4. Open the service account → **Keys → Add key → Create new key → JSON**. A `key.json` downloads.
   Treat it like a password and never commit it.
5. Turn the key into one base64 line (this is what the backend reads):
   ```bash
   base64 -i key.json | tr -d '\n' | pbcopy      # macOS: copies to clipboard
   base64 -w0 key.json                           # Linux
   ```
6. Create two empty Google Sheets, one for **Leads** and one for **Newsletter**. The API writes the header rows,
   and renames a fresh sheet's empty "Sheet1" tab to `Leads` / `Newsletter`.
   (One spreadsheet with both tabs also works: set `SHEET_ID` instead of the two IDs below.)
7. Click **Share** on each and add the service account's email (it ends in `iam.gserviceaccount.com`; it's also
   `client_email` inside `key.json`) as an **Editor**. Untick "Notify people".
8. Copy each sheet's ID from its URL: `https://docs.google.com/spreadsheets/d/`**`<ID>`**`/edit`. These are
   `LEADS_SHEET_ID` and `NEWSLETTER_SHEET_ID`.

Columns written to **Leads**: `timestamp_ist, lead_id, name, email, phone, city, state, interests, use_location,
quantity, budget, source, whatsapp_opt_in, consent, utm_source, utm_medium, utm_campaign, landing_page, referrer,
user_agent, status`. `status` starts as "New" and is never overwritten, so your team can change it freely.

### Step 2: Cloudflare Turnstile (spam protection)

1. Cloudflare dashboard → **Turnstile → Add widget**. Choose the **Managed** widget mode.
2. Hostnames: your Vercel domain (e.g. `your-site.vercel.app`) and your custom domain if you have one.
3. Keep the **site key** (frontend) and the **secret key** (backend).

For testing, Cloudflare publishes keys that always pass: site key `1x00000000000000000000AA`, secret
`1x0000000000000000000000000000000AA`.

### Step 3: Backend on Render

The repo includes `render.yaml`, which defines one Docker web service in **Singapore** (the closest region to India)
on the **Starter** plan, with a **1 GB persistent disk** at `/var/data` for the lead outbox. Persistent disks need a
paid plan, and the disk is what guarantees no submission is lost if Google Sheets is briefly unavailable.

1. Push this repo to GitHub, GitLab or Bitbucket.
2. Render → **New → Blueprint** → pick the repo. Render reads `render.yaml`.
3. Fill in the prompted secrets:
   - `GOOGLE_SERVICE_ACCOUNT_B64`: the base64 line from step 1.5
   - `LEADS_SHEET_ID` and `NEWSLETTER_SHEET_ID`: from step 1.8
   - `TURNSTILE_SECRET`: from step 2
   - `CORS_ORIGINS`: for now, `https://your-project.vercel.app` (you'll update it after step 4)
4. **Apply**. When it's live, open `https://<your-service>.onrender.com/api/health`. You should see
   `{"status":"ok","sheets_configured":true,"outbox_pending":0}`.
5. Keep it at **one instance**. The rate limiter, duplicate check and outbox live in that one process and disk.

Without Render: the same `backend/Dockerfile` runs on Cloud Run or Railway. On Cloud Run the filesystem is
ephemeral, so set min and max instances to 1 and accept that the outbox only survives while the instance lives.
Every queued lead is also logged, so it can be recovered from logs. See PLAN.md (R1).

### Step 4: Frontend on Vercel

1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory: `frontend`**. The framework is detected as Next.js. Leave the build command as `npm run build`,
   which runs Velite for the MDX journal and then `next build`.
3. **Environment variables** (Production, and Preview if you like):

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.in`, or the Vercel URL until you have a domain |
   | `NEXT_PUBLIC_API_URL` | `https://<your-service>.onrender.com` |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | site key from step 2 |
   | `NEXT_PUBLIC_ANALYTICS_PROVIDER` | `plausible`, `ga4` or `none` |
   | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` / `NEXT_PUBLIC_GA4_ID` | only for the provider you chose |

4. **Deploy**. Then go back to Render and set `CORS_ORIGINS` to your real site origins, comma-separated with no
   trailing slashes, e.g. `https://your-domain.in,https://www.your-domain.in,https://your-project.vercel.app`.
   Render redeploys automatically.
5. (Optional) Vercel → **Settings → Domains** → add your domain and follow the DNS instructions.

### Step 5: Smoke test

1. Open the site and submit the Home form with your own number.
2. Within a few seconds, a row appears in **Leads** with an IST timestamp and status "New".
3. Submit again with the same phone number: the same row updates (no duplicate) and you get the same lead ID.
4. Tap **Continue on WhatsApp**. The chat opens with your name and lead ID prefilled.
5. Check `/api/health` shows `"outbox_pending": 0`.

Analytics events: `form_start`, `form_submit`, `whatsapp_click`, `hero_complete`.

### Export leads to Excel

```bash
cd backend && .venv/bin/python scripts/export_leads_xlsx.py --out leads.xlsx
```

Every cell is set in Abadi 9 pt, with a bold, frozen header row and auto-fitted columns. Abadi is a Microsoft
font, so Excel substitutes a similar font where it isn't installed. More detail is in `backend/README.md`.

---

## 3. Before you launch

- [ ] `site.config.ts`: real brand name, tagline, **WhatsApp number**, price, batch size, socials, contact email.
- [ ] Every figure flagged `verify: true` checked (`data/specs.ts`, `data/stats.ts`, lux values in the journal).
- [ ] **Testimonials**: replace the placeholders in `data/testimonials.ts` with real, consented reviews (ASCI).
- [ ] **About**: real team names, roles and photos (currently marked Placeholder).
- [ ] **Privacy & Terms**: fill the bracketed placeholders and have a lawyer review them (DPDP Act 2023).
- [ ] Replace the default OG wordmark if the brand gets a custom logo (`app/og.tsx`, `components/layout/Logo.tsx`).
- [ ] Turnstile production keys set; Render `CORS_ORIGINS` lists only your real domains.
- [ ] Test the form on a real Android phone on mobile data.
