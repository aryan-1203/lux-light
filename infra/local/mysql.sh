#!/usr/bin/env bash
# Isolated local MySQL for development without Docker.
# Uses a project-local data dir (.localdata/mysql) on port 3307, root with no password,
# so it never touches any MySQL server already installed on this machine.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DATA="$ROOT/.localdata/mysql"
RUN="$ROOT/.localdata/run"
PORT="${LOCAL_MYSQL_PORT:-3307}"
MYSQLD="$(command -v mysqld || echo /opt/homebrew/opt/mysql/bin/mysqld)"
cmd="${1:-start}"
mkdir -p "$RUN"
case "$cmd" in
  start)
    if [ ! -d "$DATA/mysql" ]; then
      mkdir -p "$DATA"
      "$MYSQLD" --initialize-insecure --datadir="$DATA" --user="$(whoami)" >/dev/null 2>&1
    fi
    if mysqladmin -h127.0.0.1 -P"$PORT" -uroot ping >/dev/null 2>&1; then echo "already running on $PORT"; exit 0; fi
    "$MYSQLD" --datadir="$DATA" --port="$PORT" --bind-address=127.0.0.1 --mysqlx=OFF \
      --socket="$RUN/mysql.sock" --pid-file="$RUN/mysql.pid" --log-error="$RUN/mysql.err" \
      --character-set-server=utf8mb4 --collation-server=utf8mb4_0900_ai_ci --daemonize >/dev/null
    for i in $(seq 1 30); do mysqladmin -h127.0.0.1 -P"$PORT" -uroot ping >/dev/null 2>&1 && break; sleep 1; done
    mysql -h127.0.0.1 -P"$PORT" -uroot -e "CREATE DATABASE IF NOT EXISTS luxlight CHARACTER SET utf8mb4; CREATE DATABASE IF NOT EXISTS luxlight_test CHARACTER SET utf8mb4;"
    echo "local mysql running on 127.0.0.1:$PORT (root, no password; dbs: luxlight, luxlight_test)";;
  stop) mysqladmin -h127.0.0.1 -P"$PORT" -uroot shutdown && echo stopped;;
  status) mysqladmin -h127.0.0.1 -P"$PORT" -uroot ping;;
  *) echo "usage: $0 start|stop|status"; exit 1;;
esac
