# Архитектура

Проект устроен как небольшой full-stack сервис: статический frontend общается с FastAPI backend, backend хранит данные в SQLite и рассчитывает маршруты через выбранный routing provider.

## Схема

```text
browser
  -> nginx / frontend container
    -> static HTML/CSS/JS + Leaflet
      -> fetch API
        -> FastAPI / backend container
          -> service layer
            -> repositories + unit of work
              -> SQLite database
```

В `docker-compose.yml` объявлены два сервиса:

- `backend` - собирается из `backend/Dockerfile`, запускает FastAPI/uvicorn и монтирует `./data` в `/app/data`.
- `frontend` - собирается из `frontend/Dockerfile`, отдаёт статические файлы через nginx.

## Backend слои

Backend разделён на несколько уровней:

- `backend/main.py` - создание FastAPI-приложения, CORS, lifespan и подключение роутеров.
- `backend/api/` - HTTP-эндпоинты.
- `backend/services/` - бизнес-сценарии генерации и маршрутизации.
- `backend/domain/` - доменные dataclass-модели `Point` и `Route`.
- `backend/schemas/` - Pydantic-схемы запросов и ответов.
- `backend/repositories/` - доступ к данным.
- `backend/db/` - SQLAlchemy-модели, сессии и unit of work.
- `backend/utils/` - вспомогательные функции, например haversine-расстояние.

## Frontend слои

Frontend построен без сборщика: обычный `index.html`, CSS и ES modules.

Основные зоны:

- `frontend/js/app.js` - старт приложения и первичная загрузка точек.
- `frontend/js/state/store.js` - общий store состояния.
- `frontend/js/api/client.js` - клиент backend API.
- `frontend/js/features/` - пользовательские действия.
- `frontend/js/map/` - Leaflet-карта, маркеры и маршруты.
- `frontend/js/ui/` - controls, metrics, notifications.

## Конфигурация

Backend читает переменные окружения из `.env` через `python-dotenv`. Важные значения по текущему коду:

- `ROUTING_PROVIDER` по умолчанию равен `osrm`;
- `OSRM_BASE_URL` по умолчанию `https://router.project-osrm.org`;
- `DATABASE_URL` по умолчанию указывает на SQLite в `data/database.db`;
- `BACKEND_PORT` по умолчанию `8000`;
- `FRONTEND_PORT` по умолчанию `8080` для локальной разработки.

Production-порт frontend задаётся серверным `.env` и равен `80`.

## Routing provider и fallback

`get_routing_provider()` возвращает provider, от которого сервис `backend/services/route.py` ожидает метод `build_route(points)`. Для `ROUTING_PROVIDER=osrm` factory собирает `RoutingRouter`: основной provider — OSRM, резервный — haversine. Если внешний OSRM недоступен, backend возвращает маршрут с `is_fallback=true`.
