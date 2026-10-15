#!/usr/bin/env bash
# Dawnlit backend container entrypoint (used by backend/Dockerfile for both the API and the worker).
#
#   1. Wait for MySQL (DATABASE_URL) to accept connections         [api, worker, migrate, seed]
#   2. API role only: `alembic upgrade head` under a MySQL advisory lock so several replicas
#      never migrate concurrently                                    [RUN_MIGRATIONS, default true]
#   3. API role only: `python -m app.seeds $SEED_ARGS` (idempotent)   [SEED_ON_START, default false]
#   4. exec the container command (CMD)
#
# Roles are inferred from the command (override with APP_ROLE=api|worker|other):
#   uvicorn …                       → api     (Dockerfile default CMD)
#   python -m app.jobs.worker …     → worker  (docker-compose `worker` service)
#   migrate                         → one-off `alembic upgrade head`, then exit
#   seed [--essential|--demo|--all|--purge-demo] → one-off seeding, then exit
#   anything else (bash, pytest, python …) → exec'd as-is, no waiting
#
# Environment knobs (all optional):
#   DB_WAIT_TIMEOUT   seconds to wait for MySQL (default 90)
#   ALEMBIC_CONFIG    path to alembic.ini (default /app/alembic.ini)
#   RUN_MIGRATIONS    true|false (default true for the api role, ignored otherwise)
#   SEED_ON_START     true|false (default false; docker-compose.yml sets true for local demo data)
#   SEED_ARGS         extra args for `python -m app.seeds` (default empty → --all outside production,
#                     --essential in production; demo seeds are refused when ENV=production)
set -euo pipefail

log() { printf '[entrypoint] %s\n' "$*" >&2; }

is_true() {
  case "${1:-}" in
    1 | true | TRUE | True | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

# Validate settings (pydantic) and wait until MySQL answers `SELECT 1`. Settings are loaded through
# the app so a bad production config (dev secrets, mock gateway …) fails here with a clear message.
wait_for_db() {
  python - <<'PY'
import os
import sys
import time

from sqlalchemy import text

try:
    from app.core.config import get_settings

    settings = get_settings()
except Exception as exc:  # pydantic ValidationError on invalid production settings
    print(f"[entrypoint] invalid configuration: {exc}", file=sys.stderr)
    sys.exit(2)

from app.db.session import build_engine

timeout = float(os.environ.get("DB_WAIT_TIMEOUT", "90"))
deadline = time.monotonic() + timeout
engine = build_engine(settings.DATABASE_URL, pool_pre_ping=False)
attempt = 0
while True:
    attempt += 1
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[entrypoint] database reachable (attempt {attempt})", file=sys.stderr)
        break
    except Exception as exc:
        if time.monotonic() >= deadline:
            print(
                f"[entrypoint] database not reachable after {timeout:.0f}s: {type(exc).__name__}",
                file=sys.stderr,
            )
            sys.exit(1)
        time.sleep(2)
engine.dispose()
PY
}

# Run migrations (and optionally seeds) while holding GET_LOCK('dl_migrate') on a dedicated
# connection; a second replica blocks until the first one finishes, then finds nothing to do.
migrate_and_seed() {
  local do_seed="$1"
  shift
  DL_DO_SEED="$do_seed" python - "$@" <<'PY'
import os
import subprocess
import sys

from alembic import command
from alembic.config import Config
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import build_engine

seed_args = sys.argv[1:]
engine = build_engine(get_settings().DATABASE_URL, pool_pre_ping=False)
with engine.connect() as conn:
    got = conn.execute(text("SELECT GET_LOCK('dl_migrate', 600)")).scalar()
    if got != 1:
        print("[entrypoint] could not acquire migration lock within 600s", file=sys.stderr)
        sys.exit(1)
    try:
        print("[entrypoint] alembic upgrade head", file=sys.stderr)
        command.upgrade(Config(os.environ.get("ALEMBIC_CONFIG", "/app/alembic.ini")), "head")
        if os.environ.get("DL_DO_SEED") == "1":
            print(f"[entrypoint] seeding: python -m app.seeds {' '.join(seed_args)}".rstrip(), file=sys.stderr)
            result = subprocess.run([sys.executable, "-m", "app.seeds", *seed_args], check=False)  # noqa: S603
            if result.returncode != 0:
                sys.exit(result.returncode)
    finally:
        conn.execute(text("SELECT RELEASE_LOCK('dl_migrate')"))
engine.dispose()
PY
}

# ----- role detection --------------------------------------------------------------------------
if [ "$#" -eq 0 ]; then
  set -- uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'
fi

case "$1" in
  migrate)
    wait_for_db
    migrate_and_seed 0
    exit 0
    ;;
  seed)
    shift
    wait_for_db
    migrate_and_seed 1 "$@"
    exit 0
    ;;
esac

role="other"
case "$1" in
  uvicorn | gunicorn) role="api" ;;
  python | python3)
    case " $* " in
      *" app.jobs.worker "*) role="worker" ;;
    esac
    ;;
esac
role="${APP_ROLE:-$role}"
log "role=$role"

case "$role" in
  api)
    wait_for_db
    if is_true "${RUN_MIGRATIONS:-true}"; then
      if is_true "${SEED_ON_START:-false}"; then
        # shellcheck disable=SC2086  # SEED_ARGS is a space-separated flag list
        migrate_and_seed 1 ${SEED_ARGS:-}
      else
        migrate_and_seed 0
      fi
    else
      log "RUN_MIGRATIONS=false: skipping alembic upgrade"
    fi
    ;;
  worker)
    wait_for_db
    ;;
  *) ;;
esac

exec "$@"
