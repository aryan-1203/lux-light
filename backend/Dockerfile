# syntax=docker/dockerfile:1.7
#
# Dawnlit backend image — one image, two roles:
#   API     (default CMD)   uvicorn app.main:app …
#   worker  (compose cmd)   python -m app.jobs.worker
# The entrypoint (infra/docker/backend-entrypoint.sh) waits for MySQL, runs `alembic upgrade head`
# (API role only, under a MySQL advisory lock), optionally seeds (SEED_ON_START=true), then execs CMD.
#
# Build (the entrypoint lives outside this context, so pass the `infra` named context):
#   docker build -t dawnlit-backend --build-context infra=./infra ./backend
# docker compose does this automatically (build.additional_contexts).

# Base images are written out in FROM (not via ARG) so Dependabot can bump them.

# ---------------------------------------------------------------------------------------------
# Stage 1: install pinned runtime dependencies into an isolated virtualenv (no dev/test tools).
# ---------------------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS builder

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

COPY requirements.txt /tmp/requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip setuptools wheel \
 && pip install -r /tmp/requirements.txt

# ---------------------------------------------------------------------------------------------
# Stage 2: slim runtime, non-root.
# ---------------------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS runtime

LABEL org.opencontainers.image.title="dawnlit-backend" \
      org.opencontainers.image.description="Dawnlit storefront + admin API (FastAPI) and background worker" \
      org.opencontainers.image.source="https://github.com/OWNER/REPO"

# uvicorn reads --workers from WEB_CONCURRENCY (override per deployment; ~2×vCPU, mind the RAM).
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:${PATH}" \
    STORAGE_DIR=/app/storage \
    WEB_CONCURRENCY=2

RUN groupadd --system --gid 10001 app \
 && useradd --system --uid 10001 --gid app --home-dir /app --no-create-home --shell /usr/sbin/nologin app

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv

# Application code is owned by root and read-only for the runtime user; only /app/storage is writable.
COPY alembic.ini ./alembic.ini
COPY alembic ./alembic
COPY scripts ./scripts
COPY app ./app
COPY --from=infra --chmod=0755 docker/backend-entrypoint.sh /usr/local/bin/backend-entrypoint.sh

RUN python -m compileall -q /app/app /app/alembic \
 && mkdir -p /app/storage/media /app/storage/invoices /app/storage/outbox \
 && chown -R app:app /app/storage

# media/ (product images, public via /media), invoices/ (private PDFs), outbox/ (mock email/WhatsApp).
VOLUME ["/app/storage"]

USER app:app
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD ["python", "-c", "import sys, urllib.request; r = urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health', timeout=4); sys.exit(0 if r.status == 200 else 1)"]

ENTRYPOINT ["backend-entrypoint.sh"]
# --no-access-log: the app logs its own access lines without query strings (PLAN §6.6, no PII/tokens).
# --proxy-headers + --forwarded-allow-ips=*: the container is only reachable through nginx, which
# overwrites X-Forwarded-For with the real client IP. Never publish :8000 to the internet.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*", "--no-access-log", "--no-server-header"]
