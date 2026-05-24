# Инструкция для LLM-агента: настройка прод-сервера

> Выполнять только на прод-сервере после того, как локальные изменения запушены в `main` и GitHub Actions deploy запущен.

## Цель

Подготовить серверную директорию `~/route_optimization`, создать runtime `.env`, открыть HTTP-порт и проверить, что контейнеры отвечают на production URL `http://111.88.157.91/`.

## Ограничения

- Не коммитить серверный `.env`.
- Не менять файлы в репозитории на локальной машине.
- Не хранить Docker Hub, SSH или другие secrets в markdown-файлах.
- Production compose на сервере должен называться `~/route_optimization/compose.yaml`; его копирует GitHub Actions из `deploy/compose.yaml`.

## Шаг 1. Подготовить директорию

```bash
mkdir -p ~/route_optimization/data
cd ~/route_optimization
```

Если `compose.yaml` ещё нет, это нормально до первого успешного workflow run. Его загрузит GitHub Actions.

## Шаг 2. Создать `.env`

Создать файл `~/route_optimization/.env`:

```env
APP_ENV=production
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
BACKEND_RELOAD=false
FRONTEND_PORT=80
FRONTEND_API_BASE_URL=/api
CORS_ALLOW_ORIGINS=http://111.88.157.91,http://111.88.157.91:80,http://localhost:8080
DATABASE_URL=sqlite:///./data/database.db
NGINX_BACKEND_UPSTREAM=backend:8000
ROUTING_PROVIDER=osrm
OSRM_BASE_URL=https://router.project-osrm.org
ROUTING_TIMEOUT_SECONDS=10
DEFAULT_TRANSPORT_TYPE=driving
```

Проверить:

```bash
grep -E '^(FRONTEND_PORT|ROUTING_PROVIDER|FRONTEND_API_BASE_URL|CORS_ALLOW_ORIGINS)=' .env
```

Ожидаемо: `FRONTEND_PORT=80`, `ROUTING_PROVIDER=osrm`, `FRONTEND_API_BASE_URL=/api`.

## Шаг 3. Firewall

Открыть HTTP и backend health-check порт, если firewall включён:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
sudo ufw status
```

Если используется внешний reverse proxy или hosting panel, он должен вести frontend на `http://127.0.0.1:80`.

## Шаг 4. После GitHub Actions deploy

Когда workflow завершится, проверить:

```bash
cd ~/route_optimization
docker compose -f compose.yaml ps
curl -fsS http://127.0.0.1:8000/health
curl -fsSI http://127.0.0.1/
curl -fsS http://127.0.0.1/js/env.js
curl -fsS http://127.0.0.1/api/health
```

Публичная проверка:

```bash
curl -fsSI http://111.88.157.91/
curl -fsS http://111.88.157.91/api/health
```

## Если деплой падает

1. Проверить, что `.env` существует в `~/route_optimization`.
2. Проверить логи:

```bash
docker compose -f ~/route_optimization/compose.yaml logs --tail=150 backend
docker compose -f ~/route_optimization/compose.yaml logs --tail=150 frontend
```

3. Если контейнеры локально отвечают, но публичный URL нет, проблема обычно в firewall, DNS или внешнем reverse proxy.

## HTTPS

Не настраивать до стабильного HTTP. После успешного HTTP можно добавить домен и TLS через внешний nginx/Caddy или панель хостинга.
