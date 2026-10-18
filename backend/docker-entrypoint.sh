#!/bin/sh
# Render mounts persistent disks (e.g. /var/data) owned by root at runtime, after the image is built,
# so a chown in the Dockerfile cannot help. The container therefore starts as root, makes the outbox
# directory writable for `appuser`, then drops privileges before exec'ing the server.
# If the chown fails (read-only or exotic mount) we keep running as root rather than fail to write
# the outbox: never losing a submission matters more here than the extra hardening.
set -e

OUTBOX_DIR="$(dirname "${OUTBOX_PATH:-/app/data/outbox.sqlite3}")"

if [ "$(id -u)" = "0" ]; then
  if mkdir -p "$OUTBOX_DIR" && chown -R appuser:appuser "$OUTBOX_DIR" 2>/dev/null; then
    # Drop to appuser with the Python stdlib (no gosu/su-exec needed in the slim image).
    exec python -c 'import os, pwd, sys
u = pwd.getpwnam("appuser")
os.setgroups([]); os.setgid(u.pw_gid); os.setuid(u.pw_uid)
os.environ["HOME"] = u.pw_dir
os.execvp(sys.argv[1], sys.argv[1:])' "$@"
  fi
  echo "entrypoint: could not chown $OUTBOX_DIR; running as root so the outbox stays writable" >&2
fi

exec "$@"
