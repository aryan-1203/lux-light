# Production image for Render (also works on Cloud Run / Railway).
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000 \
    OUTBOX_PATH=/app/data/outbox.sqlite3

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY app ./app
COPY scripts ./scripts
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN useradd --create-home --uid 10001 appuser \
    && mkdir -p /app/data /var/data \
    && chown -R appuser:appuser /app /var/data \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

# No `USER appuser` on purpose: Render mounts the persistent disk at /var/data as root *at runtime*.
# The entrypoint chowns the outbox directory and then drops to appuser (uid 10001) before starting
# uvicorn; if that is impossible it stays root so the outbox remains writable. See docker-entrypoint.sh.
ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 8000
# $PORT is injected by the platform; one worker keeps the in-memory rate limiter, dedupe index,
# Sheets write lock and outbox worker consistent. Do not raise --workers or scale to >1 instance.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 1 --proxy-headers --forwarded-allow-ips='*'"]
