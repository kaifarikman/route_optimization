# Frontend задачи перед финальной защитой

Цель роли: убедиться, что пользовательский сценарий на карте выглядит убедительно: точки, маршрут по дорогам, fallback-отличие, метрики, loading/error-состояния.

## Текущее состояние

Frontend уже умеет:

- генерировать точки через backend API;
- показывать Leaflet-карту и маркеры;
- строить базовый и оптимизированный маршрут;
- показывать длину, время, provider и тип geometry;
- блокировать кнопки при недостаточном состоянии;
- рисовать `straight`/fallback route пунктиром.

## Задачи

### FE-FINAL-01 `[FRONTEND][HIGH][TODO]` - smoke-проверка OSRM full geometry

Проверить, что route с `geometry_type="full"` и длинным `geometry` массивом рисуется по дорожной линии, а не только соединяет delivery points.

Критерий готовности:

- `POST /routes/base` возвращает `geometry_type="full"` при доступном OSRM;
- `route.geometry.length > route.coordinates.length` для маршрута по дорогам;
- `frontend/js/map/routes.js` берёт `routeData.geometry`;
- карта автоматически приближает маршрут через `fitBounds`;
- визуально линия идёт по дорогам.

Что зафиксировать для защиты:

- скриншот или короткий GIF маршрута по дорогам;
- демо-параметры: город, центр, радиус, количество точек.

### FE-FINAL-02 `[FRONTEND][HIGH][TODO]` - fallback UI

Проверить frontend-поведение, когда backend возвращает fallback route.

Критерий готовности:

- `route.is_fallback=true` отображает warning;
- `geometry_type="straight"` отображается как “прямые линии”;
- `geometry_type="full"` отображается как “по дорогам”;
- fallback route рисуется пунктиром;
- warning не теряется под скроллом и виден в карточке метрик.

### FE-FINAL-03 `[FRONTEND][HIGH][TODO]` - production backend URL

Проверить, что frontend на деплое ходит в правильный backend.

Критерий готовности:

- `frontend/js/env.js` или nginx template отдаёт корректный `API_BASE_URL`;
- в публичном frontend нет запросов к `http://localhost:8000`;
- CORS backend разрешает публичный frontend origin;
- генерация и построение маршрута работают из браузера на публичной ссылке.

### FE-FINAL-04 `[FRONTEND][HIGH][TODO]` - UI sanity на 10-20 точках

Проверить основной MVP-сценарий на демонстрационном размере.

Критерий готовности:

- 10-20 точек генерируются без визуального мусора;
- кнопки корректно disabled/enabled;
- loading text появляется на активной кнопке;
- список порядка посещения читаемый;
- сравнение “Экономия / Длина совпадает / Длиннее” не ломает layout.

## Команды и ручные проверки

```shell
docker compose up --build -d
```

```shell
curl http://localhost:8000/config
```

Открыть:

- frontend: `http://localhost:8080`;
- backend docs: `http://localhost:8000/docs`.

Демо-набор для Москвы:

- центр N: `55.75`;
- центр W: `37.62`;
- радиус: `5`;
- точки: `10` или `20`.

