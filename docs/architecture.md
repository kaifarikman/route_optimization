# Архитектура

Проект состоит из двух контейнеров и одной SQLite базы.

```text
browser
  -> nginx frontend
    -> static files
    -> /api proxy
      -> FastAPI backend
        -> service layer
        -> repositories
        -> SQLite
        -> routing provider
```

## Frontend

Frontend лежит в `frontend/` и отдается nginx как статические файлы.

В нем нет сборщика и отдельного frontend framework. Это обычные HTML, CSS и ES modules:

- `frontend/index.html` - разметка страницы.
- `frontend/css/styles.css` - стили интерфейса.
- `frontend/js/app.js` - точка входа.
- `frontend/js/api/client.js` - HTTP-клиент для backend API.
- `frontend/js/features/` - действия пользователя: генерация, построение, оптимизация, очистка.
- `frontend/js/map/` - Leaflet-карта, маркеры и линии маршрутов.
- `frontend/js/state/store.js` - простой общий state.

Frontend ходит в API через `FRONTEND_API_BASE_URL`. В Docker это `/api`, а nginx проксирует запросы в backend.

## Backend

Backend лежит в `backend/` и запускается как FastAPI приложение.

Основные слои:

- `backend/api/` - HTTP endpoints.
- `backend/schemas/` - Pydantic-схемы request и response.
- `backend/services/` - бизнес-логика генерации точек, построения и оптимизации маршрутов.
- `backend/repositories/` - работа с таблицами через SQLAlchemy session.
- `backend/db/` - модели, session factory и Unit of Work.
- `backend/domain/` - простые доменные модели.

`backend/main.py` собирает приложение, подключает CORS, инициализирует БД и регистрирует роутеры.

## Данные

База - SQLite. По умолчанию файл находится в `data/database.db`.

В БД две основные таблицы:

- `points` - точки с `id`, `lat`, `lon`.
- `routes` - маршруты, порядок точек, координаты, метрики, geometry и информация о провайдере.

Генерация нового набора точек очищает старые точки и маршруты. Это сделано намеренно: приложение работает с одним текущим рабочим набором.

## Маршруты

Базовый маршрут строится в порядке, который передал клиент.

Оптимизированный маршрут строится алгоритмом ближайшего соседа:

1. Берется первая точка из запроса.
2. Среди непосещенных точек выбирается ближайшая.
3. Шаг повторяется, пока не закончатся точки.

Алгоритм быстрый и понятный, но не гарантирует глобально самый короткий маршрут.

## Routing providers

Основной провайдер задается через `ROUTING_PROVIDER`.

В обычном режиме используется OSRM:

- backend отправляет координаты в OSRM;
- OSRM возвращает расстояние, время и дорожную geometry;
- frontend рисует маршрут по дорогам.

Если основной провайдер падает, `RoutingRouter` переключается на haversine:

- расстояние считается по прямой между координатами;
- время считается из фиксированной скорости 40 км/ч;
- geometry становится прямой линией между точками;
- в response выставляется `is_fallback=true`.

## Docker Compose

Локальный `docker-compose.yml` собирает два сервиса:

- `backend` - FastAPI, порт из `BACKEND_PORT`, volume `./data:/app/data`.
- `frontend` - nginx, порт из `FRONTEND_PORT`, proxy `/api` в backend.

Frontend стартует после успешного healthcheck backend.
