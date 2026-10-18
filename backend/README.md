# Backend: lead and newsletter API

This is a FastAPI service with three endpoints. It writes submissions to Google Sheets. If Sheets is down or not set up, it saves them to a durable SQLite **outbox** first, so a submission is never lost.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/leads` | Early-access form, short (Home) or full. Validates the data, checks Turnstile, removes duplicates by phone or email, then writes to the **Leads** tab. |
| `POST /api/newsletter` | Newsletter sign-up. Removes duplicates by email, then writes to the **Newsletter** tab. |
| `GET /api/health` | Returns `{"status":"ok","sheets_configured":bool,"outbox_pending":int}` |

## Run locally

```bash
cd backend
python3.12 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
cp .env.example .env            # Sheets vars can stay empty: rows then queue in ./data/outbox.sqlite3
.venv/bin/uvicorn app.main:app --reload --port 8000   # docs at http://localhost:8000/docs (non-production only)

# checks
.venv/bin/ruff check . && .venv/bin/ruff format --check . && .venv/bin/pytest -q
```

## Environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| `APP_ENV` | `development` | Set it to `production` on Render. This disables `/docs`. With this setting, a missing Turnstile secret rejects every lead. |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated list of exact origins, e.g. `https://site.vercel.app,https://www.domain.in` |
| `GOOGLE_SERVICE_ACCOUNT_B64` | (empty) | The service-account JSON, base64-encoded. **Secret.** |
| `SHEET_ID` | (empty) | One spreadsheet holding both tabs (the ID from its URL) |
| `LEADS_SHEET_ID` / `NEWSLETTER_SHEET_ID` | (empty) | A separate spreadsheet each; overrides `SHEET_ID` for that tab |
| `LEADS_TAB` / `NEWSLETTER_TAB` | `Leads` / `Newsletter` | Tab names. A missing tab is created and its header row is written. |
| `SHEETS_REQUEST_RETRIES` | `3` | Retries during the request when Sheets returns 429/5xx or a network error |
| `SHEETS_BACKOFF_BASE_SECONDS` | `0.5` | Retry delays are about 0.5 s, 1 s and 2 s, with ±20 % jitter |
| `SHEETS_TIMEOUT_SECONDS` | `10` | HTTP timeout for each Sheets call |
| `SHEETS_INDEX_TTL_SECONDS` | `120` | How long the in-memory phone/email dedupe index is cached |
| `TURNSTILE_SECRET` | (empty) | Cloudflare Turnstile secret key. **Secret.** |
| `OUTBOX_PATH` | `./data/outbox.sqlite3` | Use `/var/data/outbox.sqlite3` on Render (the persistent disk) |
| `OUTBOX_WORKER_ENABLED` | `true` | Background replay of the outbox |
| `OUTBOX_RETRY_SECONDS` | `30` | How often the outbox drains. Also the base for per-item backoff. |
| `OUTBOX_BACKOFF_CAP_SECONDS` | `1800` | Maximum backoff for one item (30 min) |
| `RATE_LIMIT_LEADS` | `5/minute` | Limit per client IP (slowapi syntax) |
| `RATE_LIMIT_NEWSLETTER` | `10/minute` | Limit per client IP |
| `MAX_BODY_BYTES` | `16384` | Larger bodies get a `413` response |

## Response shapes (for the frontend)

- `200` `{"ok": true, "lead_id": "LX-7F3K9Q", "updated": false}`. `updated: true` means the phone or email already existed. That row was updated and the response carries its original `lead_id`.
- `202` `{"ok": true, "lead_id": "LX-…", "queued": true}`. Sheets was unavailable and the lead was saved to the outbox. Treat this as success. The newsletter endpoint returns `{"ok": true, "queued": true}`.
- `400` `{"error": "verification_failed"}`. Turnstile failed. Get a new token and retry.
- `422` FastAPI's standard `{"detail": [{"loc": ["body", "<field>"], "msg": "...", "type": "..."}]}`. Missing full-form fields come back as `type: "missing"` on their own field.
- `413` `{"error": "payload_too_large"}` · `429` `{"error": "rate_limited"}` (with a `Retry-After` header)
- Honeypot: if `company` is non-empty, the response looks like a normal `200`, but nothing is stored.

## Google Cloud setup (Sheets access)

1. Go to <https://console.cloud.google.com/> and create a project, for example `lamp-leads`.
2. Open **APIs & Services → Library**, search for **Google Sheets API** and click **Enable**.
3. Open **APIs & Services → Credentials → Create credentials → Service account**. Give it a name, for example `sheets-writer`. Skip the optional role steps and click **Done**.
4. Open the service account, then go to **Keys → Add key → Create new key → JSON**. A `key.json` file downloads. Keep it private and never commit it.
5. Base64-encode the key on one line. On macOS this copies it to the clipboard:
   ```bash
   base64 -i key.json | tr -d '\n' | pbcopy
   ```
   On Linux, use `base64 -w0 key.json`.
6. Create a Google Sheet with two tabs named exactly **Leads** and **Newsletter**. You can leave them empty, because the API writes the header rows.
7. Click **Share** on the sheet and add the service-account email (`…@….iam.gserviceaccount.com`, also the `client_email` in key.json) as an **Editor**.
8. Copy the sheet ID from the URL. It is the part between `/d/` and `/edit`: `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`.
9. Set `GOOGLE_SERVICE_ACCOUNT_B64` (the clipboard value) and `LEADS_SHEET_ID` + `NEWSLETTER_SHEET_ID` (or a single `SHEET_ID`), either in `.env` locally or in the Render environment.
10. Run `curl …/api/health`. It should show `"sheets_configured": true`. Submit a test lead and check that a row appears.

Leads columns: `timestamp_ist, lead_id, name, email, phone, city, state, interests, use_location, quantity, budget, source, whatsapp_opt_in, consent, utm_source, utm_medium, utm_campaign, landing_page, referrer, user_agent, status`. Values are written as RAW text, so `+91…` stays text. Any other value that starts with `= + - @` gets an apostrophe prefix to block formula injection. When a lead updates an existing row, `timestamp_ist`, `lead_id` and `status` are kept as they are. This means the team can safely edit `status` in the sheet.

## Deploy on Render (Blueprint)

The `render.yaml` file at the repo root defines one Docker web service in Singapore on the Starter plan, with a 1 GB disk mounted at `/var/data`. Persistent disks need a paid plan.

1. In Render, go to **New → Blueprint** and pick this repository. Render finds `render.yaml`.
2. Fill in the `sync: false` variables when prompted: `CORS_ORIGINS` (your Vercel URL and custom domain), `GOOGLE_SERVICE_ACCOUNT_B64`, `LEADS_SHEET_ID`, `NEWSLETTER_SHEET_ID` and `TURNSTILE_SECRET`.
3. Click **Apply** or **Deploy**. When it is live, open `https://<service>.onrender.com/api/health` and confirm it shows `"status":"ok"`, `"sheets_configured":true` and `"outbox_pending":0`.
4. Point the frontend's API base URL at the service URL.

Keep the service at **one instance** with one worker. The rate limiter, the dedupe index, the Sheets write lock and the outbox all live in one process and on one disk. The container starts as root only to `chown` the mounted disk, then drops to `appuser`. See `docker-entrypoint.sh`.

## Cloudflare Turnstile

1. In the Cloudflare dashboard, go to **Turnstile → Add widget/site**.
2. Add your domains: the Vercel domain, the custom domain, and `localhost` if you want to test with real keys.
3. Put the **site key** in the frontend env and the **secret key** in `TURNSTILE_SECRET` on Render.
4. Cloudflare's test secret `1x0000000000000000000000000000000AA` always passes, which is handy for staging.

Without a secret, development skips verification. Production rejects every lead with `400` and logs `turnstile_secret_missing`.

## Export leads to Excel

```bash
cd backend
.venv/bin/python scripts/export_leads_xlsx.py --out leads.xlsx            # reads the sheet (needs the env vars)
.venv/bin/python scripts/export_leads_xlsx.py --out leads.xlsx --tab Leads --from-csv leads.csv   # offline
```

The output uses Abadi 9 pt in every cell. The header row is bold and frozen, with an autofilter, and column widths are fitted automatically. Abadi is a Microsoft font, so Excel uses a fallback font where it is not installed.

## The outbox

- If Sheets is not configured, or still fails after the request-time retries (429, 5xx, network or any other error), the fully formed row is stored in SQLite at `OUTBOX_PATH`. That row includes `lead_id` and `timestamp_ist`. The API then returns `202`.
- A background task drains the outbox at startup and every `OUTBOX_RETRY_SECONDS`. Each item backs off exponentially (30 s, 60 s, 120 s, … up to 30 min). Replays go through the same upsert, so dedupe still applies.
- Failures are logged as one-line JSON (`sheets_write_failed`, `outbox_enqueued`, `outbox_replay_failed`) with phone and email masked (`+91******3210`, `a***@gmail.com`). `/api/health` shows `outbox_pending`.

To inspect the outbox, use the Render **Shell** tab or a local copy:

```bash
sqlite3 /var/data/outbox.sqlite3 \
  "SELECT id, kind, attempts, datetime(next_attempt_at,'unixepoch'), last_error, created_at FROM outbox;"
sqlite3 /var/data/outbox.sqlite3 "SELECT payload FROM outbox WHERE id = 1;"
```

If `sqlite3` is not in the image, use `python -c "import sqlite3; print(sqlite3.connect('/var/data/outbox.sqlite3').execute('select id,kind,attempts,last_error from outbox').fetchall())"`. Rows are deleted once they are delivered. To force an immediate retry, run `UPDATE outbox SET next_attempt_at = 0;`.
