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

echo "== Repo =="
pwd

echo
echo "== Docker compose ps =="
docker compose "${COMPOSE_ARGS[@]}" ps || true

echo
echo "== Backend logs =="
docker compose "${COMPOSE_ARGS[@]}" logs --tail=200 backend || true

echo
echo "== Frontend logs =="
docker compose "${COMPOSE_ARGS[@]}" logs --tail=200 frontend || true

echo
echo "== Ports =="
if command -v lsof >/dev/null 2>&1; then
  lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN || true
  lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN || true
else
  echo "lsof not found"
fi

echo
echo "== Backend health =="
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" || true

echo
echo "== Frontend env =="
curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/js/env.js" || true

echo
echo "== Frontend API proxy =="
curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/api/health" || true

echo
echo "== Frontend root =="
curl -I "http://127.0.0.1:${FRONTEND_PORT}/" || true
