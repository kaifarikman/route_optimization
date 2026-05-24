#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f compose.yaml ]; then
  COMPOSE_ARGS=(-f compose.yaml)
else
  COMPOSE_ARGS=()
fi

read_env_value() {
  local key="$1"
  local default_value="$2"

  if [ -f .env ]; then
    local value
    value="$(grep "^${key}=" .env 2>/dev/null | tail -n 1 | cut -d= -f2- | sed 's/^"//; s/"$//; s/^'\''//; s/'\''$//')"
    if [ -n "$value" ]; then
      echo "$value"
      return
    fi
  fi

  echo "$default_value"
}

BACKEND_PORT="${BACKEND_PORT:-$(read_env_value BACKEND_PORT 8000)}"
FRONTEND_PORT="${FRONTEND_PORT:-$(read_env_value FRONTEND_PORT 8080)}"
PUBLIC_URL="${1:-}"

check_url() {
  local name="$1"
  local url="$2"

  echo
  echo "== ${name}: ${url} =="
  if curl -fsS -D - -o /tmp/domain-check-response "$url"; then
    if [ -s /tmp/domain-check-response ]; then
      echo "-- body preview --"
      head -c 300 /tmp/domain-check-response
      echo
    fi
    echo "OK: ${name}"
    return 0
  fi

  echo "FAILED: ${name}"
  return 1
}

echo "== Compose status =="
docker compose "${COMPOSE_ARGS[@]}" ps || true

local_ok=1

check_url "backend health" "http://127.0.0.1:${BACKEND_PORT}/health" || local_ok=0
check_url "frontend root" "http://127.0.0.1:${FRONTEND_PORT}/" || local_ok=0
check_url "frontend env" "http://127.0.0.1:${FRONTEND_PORT}/js/env.js" || local_ok=0
check_url "frontend api proxy" "http://127.0.0.1:${FRONTEND_PORT}/api/health" || local_ok=0

echo
echo "== Frontend runtime config =="
curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/js/env.js" || true
echo

if [ -z "$PUBLIC_URL" ]; then
  echo
  echo "No public URL was provided."
  echo "Usage: ./scripts/check-domain.sh https://your-domain.example"
  echo
  echo "If local frontend root is OK but the public domain returns 404/Page not found,"
  echo "the domain or external reverse proxy is not pointing to 127.0.0.1:${FRONTEND_PORT}."
  exit 0
fi

public_ok=1
check_url "public domain root" "$PUBLIC_URL" || public_ok=0

if [ "$local_ok" -eq 1 ] && [ "$public_ok" -ne 1 ]; then
  echo
  echo "Diagnosis:"
  echo "- Docker frontend is reachable locally on 127.0.0.1:${FRONTEND_PORT}."
  echo "- Public domain is not reachable or does not return 2xx/3xx."
  echo "- Fix the external reverse proxy, DNS, firewall, or hosting panel route."
  echo "- The proxy target should be http://127.0.0.1:${FRONTEND_PORT}."
  exit 2
fi

if [ "$local_ok" -ne 1 ]; then
  echo
  echo "Diagnosis:"
  echo "- Local Docker checks failed. Inspect container logs first:"
  echo "  docker compose -f compose.yaml logs --tail=150 frontend"
  echo "  docker compose -f compose.yaml logs --tail=150 backend"
  exit 3
fi

echo
echo "Domain check completed."
