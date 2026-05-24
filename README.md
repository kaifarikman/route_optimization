# Route Optimization

Веб-приложение для генерации точек доставки, построения маршрута между ними и сравнения базового порядка с оптимизированным порядком обхода.

Production URL: http://111.88.157.91/

## Стек

- Backend: FastAPI, SQLAlchemy, SQLite, pytest.
- Frontend: nginx, HTML/CSS, ES modules, Leaflet, OpenStreetMap tiles.
- Routing: OSRM для маршрутов по дорогам, haversine как fallback.
- Runtime: Docker Compose локально и на сервере.

## Архитектура

```text
browser
  -> nginx frontend
    -> static HTML/CSS/JS + Leaflet
    -> /api proxy
      -> FastAPI backend
        -> service layer
        -> SQLAlchemy repositories
        -> SQLite data/database.db
        -> OSRM public API, fallback haversine
```

## Локальный запуск

```shell
cp .env.example .env
docker compose up --build -d
```

- Frontend: http://localhost:8080
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Config через frontend proxy: http://localhost:8080/api/config

Диагностика:

```shell
./scripts/diagnose.sh
./scripts/smoke-check.sh
./scripts/restart-soft.sh
./scripts/rebuild-hard.sh
./scripts/reset-data.sh
```

## Production

Деплой работает через push в `main`:

```text
git push origin main
  -> GitHub Actions
  -> pytest
  -> Docker image build + push
  -> SCP deploy/compose.yaml на сервер
  -> docker compose pull && up -d
  -> health checks
```

Production compose находится в `deploy/compose.yaml` и использует готовые Docker Hub images. Серверный `.env` не хранится в git и создаётся один раз по `deploy/server.env.example`.

Инструкции для агентов:

- локально: `docs/agent-local-setup.md`;
- на сервере: `docs/agent-server-setup.md`;
- deploy details: `docs/deploy-runbook.md`;
- recovery: `docs/recovery-runbook.md`.

## Основные env-переменные

| Переменная | Dev default | Production default | Назначение |
| --- | --- | --- | --- |
| `APP_ENV` | `development` | `production` | Режим приложения |
| `BACKEND_PORT` | `8000` | `8000` | Порт FastAPI |
| `FRONTEND_PORT` | `8080` | `80` | Публичный порт nginx frontend |
| `FRONTEND_API_BASE_URL` | `/api` | `/api` | Base URL для frontend API client |
| `CORS_ALLOW_ORIGINS` | `http://localhost:8080,http://127.0.0.1:8080` | `http://111.88.157.91,http://111.88.157.91:80,http://localhost:8080` | Разрешённые browser origins |
| `DATABASE_URL` | `sqlite:///./data/database.db` | `sqlite:///./data/database.db` | SQLite database path |
| `NGINX_BACKEND_UPSTREAM` | `backend:8000` | `backend:8000` | nginx upstream для `/api` |
| `ROUTING_PROVIDER` | `osrm` | `osrm` | Основной routing provider |
| `OSRM_BASE_URL` | `https://router.project-osrm.org` | `https://router.project-osrm.org` | Public OSRM endpoint |
| `ROUTING_TIMEOUT_SECONDS` | `10` | `10` | Timeout внешнего routing API |
| `DEFAULT_TRANSPORT_TYPE` | `driving` | `driving` | Профиль маршрутизации |

## Алгоритмы и маршрутизация

- Базовый маршрут строится в порядке выбранных point IDs.
- Оптимизация порядка использует Nearest Neighbor heuristic.
- 2-opt сейчас не реализован; это честное ограничение текущей версии.
- OSRM возвращает дорожную geometry (`geometry_type="full"`).
- Если OSRM недоступен, backend должен вернуть haversine route с `is_fallback=true` и `geometry_type="straight"`.

## Проверки

```shell
python3 -m pytest tests/ -q
```

```shell
docker compose -f docker-compose.yml config
docker compose up --build -d
curl -fsS http://localhost:8080/api/config
curl -fsS http://localhost:8080/api/health
```

## Ограничения

- Нет авторизации и разделения пользователей.
- Нет ввода адресов и геокодинга: приложение работает с координатами.
- SQLite подходит для демо и одного пользователя, но не для конкурентной production-нагрузки.
- Nearest Neighbor не гарантирует глобально оптимальный маршрут.
- OSRM зависит от внешнего публичного API; для демонстрации предусмотрен haversine fallback.
