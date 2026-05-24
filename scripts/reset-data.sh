#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DB_PATH="$ROOT_DIR/data/database.db"
STAMP="$(date +%Y%m%d_%H%M%S)"

if [[ -f "$DB_PATH" ]]; then
  cp "$DB_PATH" "$ROOT_DIR/data/database.db.bak_${STAMP}"
  echo "Backup created: data/database.db.bak_${STAMP}"
fi

docker compose down
rm -f "$DB_PATH"
docker compose up --build -d

"$ROOT_DIR/scripts/smoke-check.sh"
