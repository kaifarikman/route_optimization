#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f compose.yaml ]; then
  COMPOSE_ARGS=(-f compose.yaml)
else
  COMPOSE_ARGS=()
fi

BACKEND_PORT="${BACKEND_PORT:-$(grep '^BACKEND_PORT=' .env 2>/dev/null | cut -d= -f2 || echo 8000)}"
FRONTEND_PORT="${FRONTEND_PORT:-$(grep '^FRONTEND_PORT=' .env 2>/dev/null | cut -d= -f2 || echo 8080)}"

echo "== Compose status =="
docker compose "${COMPOSE_ARGS[@]}" ps

echo
echo "== Backend health =="
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health"
echo

echo "== Frontend root =="
curl -fsSI "http://127.0.0.1:${FRONTEND_PORT}/"
echo

echo "== Frontend env =="
curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/js/env.js"
echo

echo "== Frontend API proxy =="
curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/api/health"
echo

echo "== Backend points API =="
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/points"
echo

echo "Smoke check completed."
