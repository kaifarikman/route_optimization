# Route Optimization

Route Optimization - небольшое веб-приложение для построения и сравнения маршрутов доставки.

Сценарий простой: пользователь задает центр, радиус и количество точек, приложение генерирует точки на карте, строит маршрут в исходном порядке и затем показывает оптимизированный порядок обхода. В интерфейсе видно, сколько километров и минут удалось сэкономить.

Проект сделан как цельное демо: frontend, backend, база, маршрутизация, тесты, Docker Compose и production deploy.

Production: <http://111.88.157.91:8080/>

## Быстрый запуск

Нужны Docker и Docker Compose.

```shell
cp .env.example .env
docker compose up --build -d
```

После запуска:

- frontend: <http://localhost:8080>
- backend: <http://localhost:8000>
- Swagger UI: <http://localhost:8000/docs>
- API через frontend proxy: <http://localhost:8080/api/health>

Проверить, что все поднялось:

```shell
docker compose ps
curl -fsS http://localhost:8000/health
curl -fsS http://localhost:8080/api/health
```

Остановить контейнеры:

```shell
docker compose down
```

## Что умеет приложение

- Генерирует точки доставки вокруг заданных координат.
- Показывает точки на карте Leaflet/OpenStreetMap.
- Строит базовый маршрут в текущем порядке точек.
- Оптимизирует порядок обхода через алгоритм ближайшего соседа.
- Сравнивает базовый и оптимизированный маршруты по расстоянию и времени.
- Рисует маршрут по реальным дорогам через OSRM.
- Если OSRM недоступен, считает приближенный маршрут по haversine и явно помечает fallback.
- Позволяет сбросить текущие точки и маршруты.

## Как пользоваться

1. Откройте frontend на <http://localhost:8080>.
2. Укажите широту, долготу, радиус и количество точек.
3. Нажмите генерацию точек.
4. Постройте базовый маршрут.
5. Постройте оптимизированный маршрут.
6. Сравните карточки с расстоянием, временем и процентом улучшения.

Приложение работает с координатами, а не с адресами. Геокодинга здесь нет.

## Архитектура коротко

```text
browser
  -> nginx frontend
    -> static HTML/CSS/JS + Leaflet
    -> /api proxy
      -> FastAPI backend
        -> services
        -> repositories
        -> SQLite database
        -> OSRM or haversine fallback
```

Backend написан на FastAPI и SQLAlchemy. Frontend - обычные HTML/CSS/ES modules без сборщика. SQLite лежит в `data/database.db` и монтируется в Docker-контейнер backend.

Подробности: [docs/architecture.md](docs/architecture.md).

## Структура проекта

```text
backend/          FastAPI, сервисы, репозитории, модели БД
frontend/         nginx static frontend, Leaflet-карта, UI-логика
data/             SQLite database и локальные данные
deploy/           production compose и пример server env
docs/             техническая документация
tests/            unit и integration тесты
```

## Проверки

Запустить тесты:

```shell
python3 -m pytest tests/ -q
```

Проверить Docker Compose конфигурацию:

```shell
docker compose -f docker-compose.yml config
```

Проверить поднятое приложение:

```shell
docker compose ps
curl -fsS http://localhost:8000/health
curl -fsS http://localhost:8080/api/health
curl -fsS http://localhost:8080/js/env.js
```

Если что-то не работает, начать с диагностики:

```shell
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
```

Больше команд для локальной разработки: [docs/development.md](docs/development.md).

## API

Основной backend API:

- `GET /health`
- `GET /config`
- `POST /points/generate`
- `POST /points`
- `GET /points`
- `DELETE /points`
- `POST /routes/base`
- `POST /routes/optimize`
- `GET /routes/{route_id}`
- `GET /routes`

Подробный контракт с примерами: [docs/api.md](docs/api.md).

## Production deploy

Деплой идет через GitHub Actions при push в `main`:

```text
push to main
  -> tests
  -> Docker image build and push
  -> upload production compose to server
  -> docker compose pull && docker compose up -d
  -> health checks
```

Production compose использует готовые Docker Hub images и лежит в `deploy/compose.yaml`. Серверный `.env` не хранится в git, пример находится в `deploy/server.env.example`.

Подробности: [docs/deployment.md](docs/deployment.md).

## Основные настройки

Настройки берутся из `.env`. Для локального запуска достаточно скопировать `.env.example`.

Самые важные переменные:

- `BACKEND_PORT` - порт FastAPI, по умолчанию `8000`.
- `FRONTEND_PORT` - порт nginx frontend, по умолчанию `8080`.
- `DATABASE_URL` - путь к SQLite базе.
- `ROUTING_PROVIDER` - основной провайдер маршрутов, по умолчанию `osrm`.
- `OSRM_BASE_URL` - endpoint OSRM.
- `ROUTING_TIMEOUT_SECONDS` - timeout внешнего routing API.
- `FRONTEND_API_BASE_URL` - base URL для frontend API client.
- `CORS_ALLOW_ORIGINS` - разрешенные browser origins.

## Ограничения

- Нет авторизации и разделения пользователей.
- Нет ввода адресов: приложение принимает координаты.
- SQLite подходит для демо и одного пользователя, но не для конкурентной нагрузки.
- Оптимизация использует nearest neighbor heuristic и не гарантирует глобальный оптимум.
- Публичный OSRM может быть недоступен или отвечать медленно; для этого есть haversine fallback.
- История маршрутов хранится в БД и доступна через API, но UI ориентирован на текущий рабочий сценарий.
