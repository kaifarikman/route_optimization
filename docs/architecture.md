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
        -> geocoding provider
```

## Frontend

Frontend лежит в `frontend/` и отдается nginx как статические файлы.

В нем нет сборщика и отдельного frontend framework. Это обычные HTML, CSS и ES modules:

- `frontend/index.html` - разметка страницы.
- `frontend/css/styles.css` - стили интерфейса.
- `frontend/js/app.js` - точка входа.
- `frontend/js/api/client.js` - HTTP-клиент для backend API.
- `frontend/js/features/` - действия пользователя: генерация, geocoding, построение, оптимизация, очистка.
- `frontend/js/map/` - MapLibre-карта, маркеры и линии маршрутов.
- `frontend/js/state/store.js` - простой общий state.

Frontend ходит в API через `FRONTEND_API_BASE_URL`. В Docker это `/api`, а nginx проксирует запросы в backend.

Адреса ищутся только по явному действию пользователя: отдельная кнопка для центра генерации и отдельная кнопка для ручной точки. Frontend не делает autocomplete и не геокодирует импортированные файлы пачкой. Если provider возвращает несколько кандидатов, пользователь выбирает один результат.

### Экономия в рублях

Блок экономии реализован на frontend без отдельного backend endpoint. После построения базового и оптимизированного маршрутов frontend сравнивает уже полученные метрики:

- сохраненные километры;
- сохраненные минуты;
- оценку экономии в рублях.

Расчет использует коэффициенты из интерфейса: `₽/км` и `₽/мин`. По умолчанию это `35 ₽/км` и `8 ₽/мин`. Если коэффициент пустой, отрицательный или нечисловой, он считается равным нулю.

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

В БД основные таблицы:

- `points` - точки с `id`, `lat`, `lon` и nullable address metadata.
- `routes` - маршруты, порядок точек, координаты, метрики, geometry и информация о провайдере.
- `geocode_cache` - cache ответов forward geocoding для повторных запросов.

Генерация нового набора точек очищает старые точки и маршруты. Это сделано намеренно: приложение работает с одним текущим рабочим набором.

Ручное добавление точки расширяет текущий набор, но очищает сохраненные маршруты. Уже построенные маршруты становятся неактуальными после изменения состава точек.

Адреса хранятся в `points.address`, `points.geocoding_provider` и `points.geocoding_place_id`. Сгенерированные, импортированные и добавленные кликом точки могут не иметь адреса; UI тогда показывает координаты.

## Маршруты

Базовый маршрут строится в порядке, который передал клиент.

Оптимизированный маршрут строится алгоритмом ближайшего соседа:

1. Берется первая точка из запроса.
2. Среди непосещенных точек выбирается ближайшая.
3. Шаг повторяется, пока не закончатся точки.

Алгоритм быстрый и понятный, но не гарантирует глобально самый короткий маршрут.

Сравнение маршрутов для UI считается на клиенте: frontend берет метрики базового и оптимизированного маршрутов из state и показывает разницу по расстоянию, времени, проценту улучшения и приблизительной экономии в рублях.

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

## Geocoding provider

Forward geocoding идет через backend endpoint `POST /geocode`, чтобы frontend не ходил напрямую во внешний сервис. По умолчанию используется Nominatim-compatible endpoint:

- `GEOCODING_PROVIDER=nominatim`;
- `GEOCODING_BASE_URL=https://nominatim.openstreetmap.org`;
- `GEOCODING_TIMEOUT_SECONDS=10`;
- `GEOCODING_USER_AGENT=route-optimization-demo/1.0`;
- `GEOCODING_ACCEPT_LANGUAGE=ru,en`.

Backend нормализует результаты, кеширует ответы в SQLite и ограничивает исходящие запросы к provider до 1 request/sec на приложение. Reverse geocoding не используется в MVP, чтобы не создавать bulk-запросы для генерации, импорта и map-click точек.

## Docker Compose

Локальный `docker-compose.yml` собирает два сервиса:

- `backend` - FastAPI, порт из `BACKEND_PORT`, volume `./data:/app/data`.
- `frontend` - nginx, порт из `FRONTEND_PORT`, proxy `/api` в backend.

Frontend стартует после успешного healthcheck backend.
