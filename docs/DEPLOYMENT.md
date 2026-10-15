# Deployment guide

Owner: DevOps. Companion to [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md) (business/compliance items)
and the [README](../README.md) (local setup, live-key switch).

## 1. Production topology

### Option A — single VM with docker compose (recommended to start)

```
Internet ──443/80──► caddy (TLS, Let's Encrypt, HSTS)
                       └─► frontend: nginx :80  (published only on 127.0.0.1:8080)
                              ├─ SPA static files (hashed assets cached 1 y, index.html no-cache)
                              └─ /api /media /sitemap.xml /robots.txt ─► backend :8000 (uvicorn × WEB_CONCURRENCY)
                                                                          worker (python -m app.jobs.worker)
                                                                          mysql 8.4  ·  redis 7
                                                                          volume: storage (media, invoices, outbox)
```

- Size: 2 vCPU / 4 GB RAM / 40 GB SSD comfortably runs everything for launch traffic
  (AWS Lightsail/EC2 `ap-south-1`, DigitalOcean BLR1, Hetzner, E2E Networks, …). Choose an Indian
  region for latency and data-residency comfort.
- Files: `docker-compose.yml` + `docker-compose.prod.yml` (adds Caddy, `ENV=production`, JSON logs,
  memory limits, no demo seeding) and `infra/caddy/Caddyfile`.
- Firewall: allow 22 (restricted to your IPs), 80, 443 only. MySQL, Redis and the API are reachable
  only on the internal docker network.

### Option B — managed database

Use a managed MySQL 8 (Amazon RDS / Aurora MySQL, Google Cloud SQL, DigitalOcean Managed MySQL) for
automated backups, PITR and failover. Set `DATABASE_URL=mysql+pymysql://user:pass@host:3306/luxlight`
in `.env`; it overrides the compose default. Then remove the `mysql` service from `depends_on` (or keep
it and simply don't use it) — the backend entrypoint waits for whatever `DATABASE_URL` points to.
Requirements: MySQL 8.0+, InnoDB, `character_set_server=utf8mb4`, `collation_server=utf8mb4_0900_ai_ci`,
TLS to the DB if it crosses a network boundary. Redis can likewise be a managed instance (`REDIS_URL`).

### Option C — containers on a PaaS / Kubernetes

The two images are ordinary 12-factor containers:

| Image | Command | Notes |
|---|---|---|
| `backend` | default CMD (uvicorn) | runs migrations on start (advisory-locked, safe with replicas); health `GET /api/v1/health` |
| `backend` | `python -m app.jobs.worker` | exactly **one** replica is enough (jobs also hold MySQL `GET_LOCK`s, so extra replicas are harmless); no HTTP port |
| `frontend` | default (nginx) | expects the API at DNS name `backend:8000` (edit `set $dl_backend` in `frontend/nginx.conf` otherwise) and Docker's DNS at `127.0.0.11` (`resolver` line; use the cluster DNS elsewhere) |

`/app/storage` must be a persistent volume shared by API and worker (ReadWriteMany), or move media to
object storage later (see §8).

## 2. First deployment (Option A)

```bash
# on the VM (Docker Engine + compose plugin ≥ 2.24 installed)
git clone <repo> dawnlit && cd dawnlit
cp .env.example .env && chmod 600 .env
$EDITOR .env          # see §3 — every [PROD-REQUIRED] value
# DNS: A/AAAA records for SITE_DOMAIN → VM public IP (must resolve before Caddy can get a certificate)
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d mysql redis
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend seed --essential
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl -fsS https://$SITE_DOMAIN/api/v1/health
```

`seed --essential` creates the admin/staff users (with `SEED_ADMIN_PASSWORD`/`SEED_STAFF_PASSWORD`),
categories, the three products, stock, promo codes and content. It is idempotent; demo customers and
orders are never created in production. Log in at `/admin` and change anything product-related there.

Tip: `alias dc='docker compose -f docker-compose.yml -f docker-compose.prod.yml'` (or `make prod-up`).

## 3. Environment hardening

`ENV=production` changes behaviour in `backend/app/core/config.py`:

| Effect | Detail |
|---|---|
| Startup guard | refuses to start unless `SECRET_KEY` (≥ 32 chars, non-default), `MOCK_PAYMENT_SECRET`, `SHIPPING_WEBHOOK_TOKEN` are non-default and `PAYMENT_PROVIDER=razorpay` with `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` set |
| Cookies | `dl_access`, `dl_refresh`, `dl_csrf`, `dl_cart` get `Secure` (HTTPS only), `SameSite=Lax`, httpOnly where applicable |
| API docs | `/api/docs` and `/api/v1/openapi.json` disabled (override with `API_DOCS_ENABLED=true` only if needed) |
| Logs | JSON lines with `request_id`; PII masked (PLAN §6.6) |
| Seeds | demo data refused; default seed passwords refused |
| OTP | `OTP_DEV_ECHO` ignored |

Also set:

- `CORS_ORIGINS=https://<domain>` (exact origin, no trailing slash; add the apex/www twin only if
  both serve the SPA), `PUBLIC_SITE_URL=https://<domain>`, `VITE_SITE_URL=https://<domain>` (build arg —
  rebuild the frontend after changing it), `COOKIE_DOMAIN` empty (host-only cookies) unless you
  deliberately share sessions across subdomains.
- `FRONTEND_PUBLISH=127.0.0.1:8080` so only Caddy is public; `SITE_DOMAIN`, `ACME_EMAIL`.
- Strong, unique `MYSQL_PASSWORD` / `MYSQL_ROOT_PASSWORD` (URL-safe characters) **before the first
  start** — MySQL only applies them when the data volume is created.
- Seeding on start is forced off by the prod override — seed explicitly, once, with `run --rm backend seed --essential`.
- `.env` permissions `600`, owned by the deploy user; never in git, never in images
  (`.dockerignore` excludes it). Prefer your platform's secret store (SSM Parameter Store, Doppler,
  1Password Connect, Vault) on larger setups.
- TLS: Caddy handles certificates and HSTS (`max-age=31536000; includeSubDomains`). Submit to the
  HSTS preload list only once every subdomain is HTTPS. If you terminate TLS elsewhere (Cloudflare,
  ALB), keep `X-Forwarded-Proto` and `X-Forwarded-For` and make sure nginx's `set_real_ip_from` covers
  the proxy's addresses (otherwise rate limits key on the proxy IP).
- CSP: `frontend/nginx.conf` ships a strict policy (self + Razorpay). Switch to the analytics variant
  in the same file when enabling GA4 / Meta Pixel.
- Admin: strong passwords for every staff account; restrict `/admin` further if desired (Caddy
  `remote_ip` matcher or a VPN) — the API enforces roles regardless. Admin 2FA is on the roadmap.
- OS: unattended security upgrades, SSH keys only, fail2ban, Docker log rotation (already set per
  service: 10 MB × 5 files).

## 4. Migrations on deploy

- The API container runs `alembic upgrade head` on start (`RUN_MIGRATIONS=true`), holding MySQL
  `GET_LOCK('dl_migrate')` so concurrent replicas never migrate twice. The worker never migrates and
  starts only after the API is healthy.
- Write migrations **expand → migrate → contract**: additive changes first (new nullable columns,
  new tables), deploy code that uses both shapes, drop old columns in a later release. This keeps the
  previous image working during a rollback.
- Large tables: test the migration on a copy of production data first; prefer online DDL
  (`ALGORITHM=INPLACE, LOCK=NONE`) where MySQL supports it.
- One-off: `docker compose … run --rm backend migrate`. Check state:
  `docker compose … run --rm backend alembic current`.

## 5. Routine deploy

```bash
git fetch && git checkout <release-tag>
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
/srv/dawnlit/backup.sh   # §7 script — always take a fresh backup before a release with migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d    # recreates changed services
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps && curl -fsS https://$SITE_DOMAIN/api/v1/health
```

Downtime is a few seconds while the backend container restarts. For zero-downtime, run two backend
replicas behind nginx/Caddy or move to Option C with rolling updates. Prefer building images in CI,
pushing them to a registry (GHCR/ECR) tagged with the git SHA and setting `BACKEND_IMAGE` /
`FRONTEND_IMAGE` in `.env`, so the VM only pulls.

## 6. The worker

`python -m app.jobs.worker` (service `worker`) runs: reservation expiry (60 s), notification outbox
dispatch/retries (30 s), abandoned-cart emails (hourly), shipment tracking sync (30 min), invoice PDF
backfill (10 min) and a daily purge (03:00 IST). Each job takes a MySQL advisory lock, so running a
second worker is safe but unnecessary. On SIGTERM it finishes the current job (`stop_grace_period: 60s`).
If the worker is down, stock stays reserved for unpaid orders and failed notifications are not
retried — monitor it (§9). Single job by hand: `docker compose … run --rm worker python -m app.jobs.worker --once reservations`.

## 7. Storage and backups

| Data | Where | Backup |
|---|---|---|
| Database | volume `mysql-data` (or managed DB) | nightly logical dump + binlog/PITR on managed DBs |
| Product media | volume `storage` → `media/` | nightly sync to object storage |
| GST invoices (PDF) | volume `storage` → `invoices/` | nightly sync; retain for 72 months from the due date of that year's annual return (CGST Act s.36, ≈ 8 years — confirm with your CA) |
| Mock outbox | volume `storage` → `outbox/` | not needed in production (real SMTP/WhatsApp) |

Example nightly job (`/srv/dawnlit/backup.sh`, run from cron on the VM; compose project `dawnlit` ⇒ volume `dawnlit_storage`):

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /srv/dawnlit
mkdir -p backups
TS=$(date +%Y%m%d-%H%M)
DC="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
$DC exec -T mysql sh -c 'exec mysqldump --single-transaction --routines --triggers --set-gtid-purged=OFF -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' | gzip > "backups/db-$TS.sql.gz"
docker run --rm -v dawnlit_storage:/data:ro -v "$PWD/backups:/backup" alpine:3 tar czf "/backup/storage-$TS.tgz" -C /data .
# ship off-box (S3/B2/GCS) and prune local copies older than 7 days:
# aws s3 cp backups/ s3://<bucket>/dawnlit/ --recursive --exclude '*' --include "*$TS*"
find backups -type f -mtime +7 -delete
```

Encrypt backups at rest, keep 30 daily + 12 monthly copies off the VM, and **test a restore every
quarter** (restore into a scratch DB, run `alembic current`, open a few orders/invoices).
Restore: `gunzip -c db-….sql.gz | docker compose … exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'`.

## 8. Razorpay and courier webhooks

| Provider | URL | Auth |
|---|---|---|
| Razorpay (test and live are configured separately) | `https://<domain>/api/v1/payments/webhook/razorpay` | `X-Razorpay-Signature` = HMAC-SHA256(body, `RAZORPAY_WEBHOOK_SECRET`) |
| Shiprocket | `https://<domain>/api/v1/shipping/webhook/shiprocket` | header `X-Webhook-Token: <SHIPPING_WEBHOOK_TOKEN>` |

Razorpay events: `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`,
`refund.failed`. Both endpoints are CSRF-exempt, idempotent (`webhook_events` table) and return 200 for
duplicates; Razorpay retries non-2xx responses. Do not put the webhook paths behind any auth wall
or bot protection (Cloudflare "challenge" pages break webhooks). Verify delivery in the Razorpay
dashboard's webhook logs after go-live.

## 9. Logs, monitoring and alerting

- Logs go to stdout/stderr → Docker `json-file` driver with rotation. Backend lines are JSON with
  `request_id` (also returned as the `X-Request-ID` response header — ask customers for it in
  support tickets). nginx logs paths **without query strings** (order-tracking tokens live there).
  Ship logs to a central service if you need retention/search (Grafana Loki, Better Stack, Datadog,
  CloudWatch via the `awslogs` driver).
- Uptime: external check on `https://<domain>/` and `https://<domain>/api/v1/health` every minute
  (UptimeRobot, Better Stack, Healthchecks.io). `health` returns `"status": "degraded"` if MySQL or
  Redis is unreachable.
- Worker liveness: alert if `docker compose ps worker` is not `running`, or add a Healthchecks.io ping
  from a cron job; also watch `notifications_log` rows stuck in `queued`/`failed`.
- Error tracking: Sentry (or similar) is a placeholder — add `sentry-sdk[fastapi]` and
  `@sentry/react`, with PII scrubbing consistent with PLAN §6.6, and extend the CSP `connect-src`.
- Host metrics: disk usage of the `storage` and `mysql-data` volumes, memory, CPU (node-exporter,
  provider monitoring). Alert at 80 % disk.

## 10. Scaling notes

- Vertical first: raise `WEB_CONCURRENCY` (each uvicorn worker holds its own SQLAlchemy pool —
  keep `WEB_CONCURRENCY × pool size` well under MySQL `max_connections`), give MySQL more RAM
  (`innodb_buffer_pool_size`).
- Horizontal API: several backend containers behind nginx/Caddy/LB. Requirements: shared Redis
  (`REDIS_URL`, already used for rate limits), shared storage for `media/` and `invoices/`
  (NFS/EFS or move to S3-compatible object storage), migrations stay safe thanks to the advisory lock.
- Static assets: put a CDN (Cloudflare, CloudFront, Bunny) in front of the domain; hashed
  `/assets/*` are `immutable` for a year, `index.html` is `no-cache`, `/media/*` is cached 1 day.
  Never cache `/api/*` at the CDN.
- Database: add a read replica for reporting/exports if the admin dashboard gets heavy; checkout
  must always use the primary (row locks).

## 11. Rollback

1. **Code only (no migration in the release):** check out the previous tag (or set the previous
   `BACKEND_IMAGE`/`FRONTEND_IMAGE` tag) and `up -d` again.
2. **Release with an additive migration (expand step):** roll back the code as in 1 — the old code
   ignores new columns/tables. Leave the schema as is.
3. **Release with a destructive migration:** restore the pre-deploy backup (§7) into the database,
   then deploy the previous images. Only use `alembic downgrade <rev>` if the downgrade was tested and
   no data written since needs keeping.
4. Payments during an incident: Razorpay retries failed webhook deliveries for a period (see its
   webhook docs), and `verify` is
   idempotent, so paid orders reconcile once the API is back. Cross-check the Razorpay dashboard
   against admin orders for the incident window.

## 12. Validation status of these files

Docker is not installed on the machine where these files were written. Validated there: YAML parse
and JSON-schema validation of both compose files, the workflow (`actionlint` + shellcheck) and
`dependabot.yml`; `frontend/nginx.conf` parsed with `crossplane` (nginx's own parser model — `nginx -t`
runs in CI inside the built image); `bash -n` + shellcheck for `infra/docker/backend-entrypoint.sh`,
whose migrate/seed/role logic was exercised against a local MySQL. `docker compose config`, both
image builds and a container smoke test run in the CI `docker` job; run `docker compose up` on a
Docker machine before the first release.
