# Текущее состояние backend

Backend - FastAPI-приложение с SQLAlchemy/SQLite, сервисным слоем и routing providers. Он находится в папке `backend/`.

## API

Основные endpoints:

| Метод | Путь | Назначение |
| --- | --- | --- |
| `GET` | `/` | корневой статус приложения |
| `GET` | `/health` | health check |
| `GET` | `/config` | routing provider, версия, database |
| `POST` | `/points/generate` | генерация нового набора точек |
| `GET` | `/points` | список текущих точек |
| `DELETE` | `/points` | удаление всех точек и маршрутов |
| `POST` | `/routes/base` | построение базового маршрута |
| `POST` | `/routes/optimize` | построение оптимизированного маршрута |
| `GET` | `/routes/{route_id}` | получение маршрута по ID |
| `GET` | `/routes` | список сохранённых маршрутов |

Контракт подробнее описан в [docs/api.md](../api.md), но часть примеров там короче текущих Pydantic-схем: реальные route-ответы также содержат `geometry`, `provider`, `is_fallback`, `geometry_type`, `transport_type`.

## Данные

В SQLite есть две таблицы:

- `points`: `id`, `lat`, `lon`;
- `routes`: `id`, `points`, `coordinates`, `distance_km`, `duration_minutes`, `geometry`, `provider`, `is_fallback`, `geometry_type`, `transport_type`.

SQLAlchemy-модели находятся в `backend/db/models.py`. Доступ к данным идёт через `PointRepository`, `RouteRepository` и `SqlAlchemyUnitOfWork`.

## Генерация точек

`backend/services/point.py` генерирует точки внутри круга вокруг заданного центра. Расстояние до центра берётся через корень из случайной величины, чтобы точки распределялись равномернее по площади круга, а не скапливались в центре.

Генерация всегда заменяет текущий рабочий набор: перед добавлением новых точек удаляются все маршруты и все старые точки.

## Маршруты

`backend/services/route.py` отвечает за два сценария:

- `build_base_route` - маршрут в порядке, переданном пользователем;
- `optimize_route` - маршрут после перестановки точек через `build_nearest_neighbor_route`.

Обе функции сохраняют результат в БД через `uow.routes.add(...)`.

## Routing providers

Сейчас есть два provider-направления:

- `OSRMRoutingProvider` - основной provider в env-шаблонах, запрашивает OSRM API и возвращает полную дорожную geometry.
- `HaversineRoutingProvider` - fallback provider, считает прямолинейное расстояние между точками и время из скорости 40 км/ч.

`backend/config.py` задаёт `ROUTING_PROVIDER = os.getenv("ROUTING_PROVIDER", "osrm")`. Для `osrm` factory возвращает `RoutingRouter` с fallback на haversine.

## OSRM и fallback

Сервис маршрутов ожидает provider с методом:

```python
build_route(points, transport_type="driving")
```

`HaversineRoutingProvider`, `OSRMRoutingProvider` и `RoutingRouter` поддерживают этот путь. При ошибке основного OSRM-провайдера `RoutingRouter` вызывает haversine и выставляет `is_fallback=true`.
