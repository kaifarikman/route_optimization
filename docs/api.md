# API

Backend отдает JSON API. Локально он доступен напрямую на `http://localhost:8000` и через frontend proxy на `http://localhost:8080/api`.

Swagger UI доступен на `http://localhost:8000/docs`.

## Общие правила

Request и response body используют `application/json`.

Ошибки возвращаются в стандартном формате FastAPI:

```json
{
  "detail": "Текст ошибки"
}
```

Чаще всего клиенту важны такие статусы:

- `200 OK` - запрос выполнен.
- `400 Bad Request` - некорректный запрос или не найдены точки для маршрута.
- `404 Not Found` - маршрут с таким ID не найден.
- `500 Internal Server Error` - ошибка чтения или записи на стороне backend.

## Модели

### Point

```json
{
  "id": 1,
  "lat": 55.751244,
  "lon": 37.618423
}
```

### Route

```json
{
  "id": 1,
  "points": [1, 3, 2],
  "distance_km": 12.4,
  "duration_minutes": 23.8,
  "coordinates": [
    [55.751244, 37.618423],
    [55.761244, 37.628423],
    [55.741244, 37.608423]
  ],
  "geometry": [
    [55.751244, 37.618423],
    [55.755000, 37.620000],
    [55.761244, 37.628423]
  ],
  "provider": "osrm",
  "is_fallback": false,
  "geometry_type": "full",
  "transport_type": "driving"
}
```

Поля маршрута:

- `points` - ID точек в порядке посещения.
- `coordinates` - координаты выбранных точек в том же порядке.
- `geometry` - линия для отрисовки на карте.
- `provider` - `osrm` или `haversine`.
- `is_fallback` - `true`, если основной провайдер маршрутизации упал и использован резервный расчет.
- `geometry_type` - `full` для дорожной геометрии OSRM, `straight` для прямых линий haversine.
- `transport_type` - сейчас используется `driving`.

## System

### `GET /health`

Проверяет, что backend отвечает.

Response:

```json
{
  "status": "ok",
  "message": "Сервер запущен"
}
```

### `GET /config`

Возвращает runtime-настройки, которые нужны frontend и проверкам.

Response:

```json
{
  "routing_api": "osrm",
  "version": "1.0.0",
  "cors_enabled": true,
  "database": "sqlite"
}
```

## Points

### `POST /points/generate`

Генерирует новый набор точек вокруг заданного центра.

Важно: генерация заменяет текущий рабочий набор. Перед созданием новых точек backend удаляет старые точки и сохраненные маршруты.

Request:

```json
{
  "center_lat": 55.751244,
  "center_lon": 37.618423,
  "radius_km": 10,
  "count": 5
}
```

Response:

```json
{
  "points": [
    {
      "id": 1,
      "lat": 55.754100,
      "lon": 37.612300
    }
  ]
}
```

### `GET /points`

Возвращает все сохраненные точки.

Response:

```json
{
  "points": [
    {
      "id": 1,
      "lat": 55.754100,
      "lon": 37.612300
    }
  ]
}
```

### `POST /points`

Добавляет одну точку в текущий рабочий набор.

Важно: ручное добавление не удаляет текущие точки, но удаляет сохраненные маршруты. После изменения набора точек старые маршруты нужно построить заново.

Request:

```json
{
  "lat": 55.751244,
  "lon": 37.618423
}
```

Response:

```json
{
  "point": {
    "id": 2,
    "lat": 55.751244,
    "lon": 37.618423
  }
}
```

### `DELETE /points`

Удаляет все точки и все маршруты.

Response:

```json
{
  "status": "cleared",
  "message": "Удалено точек: 5"
}
```

## Routes

### `POST /routes/base`

Строит маршрут в том порядке, в котором переданы `point_ids`.

Request:

```json
{
  "point_ids": [1, 2, 3]
}
```

Response:

```json
{
  "route": {
    "id": 1,
    "points": [1, 2, 3],
    "distance_km": 12.5,
    "duration_minutes": 18.75,
    "coordinates": [
      [55.751244, 37.618423],
      [55.761244, 37.628423],
      [55.741244, 37.608423]
    ],
    "geometry": [
      [55.751244, 37.618423],
      [55.761244, 37.628423],
      [55.741244, 37.608423]
    ],
    "provider": "osrm",
    "is_fallback": false,
    "geometry_type": "full",
    "transport_type": "driving"
  }
}
```

### `POST /routes/optimize`

Строит оптимизированный маршрут по тем же точкам.

Алгоритм начинает с первой переданной точки, затем каждый раз выбирает ближайшую еще не посещенную точку. Это быстрый жадный алгоритм, а не поиск глобального оптимума.

Request:

```json
{
  "point_ids": [1, 2, 3]
}
```

Response:

```json
{
  "route": {
    "id": 2,
    "points": [1, 3, 2],
    "distance_km": 10.2,
    "duration_minutes": 15.3,
    "coordinates": [
      [55.751244, 37.618423],
      [55.741244, 37.608423],
      [55.761244, 37.628423]
    ],
    "geometry": [
      [55.751244, 37.618423],
      [55.741244, 37.608423],
      [55.761244, 37.628423]
    ],
    "provider": "osrm",
    "is_fallback": false,
    "geometry_type": "full",
    "transport_type": "driving"
  }
}
```

### `GET /routes/{route_id}`

Возвращает сохраненный маршрут по ID.

Response:

```json
{
  "route": {
    "id": 1,
    "points": [1, 2, 3],
    "distance_km": 12.5,
    "duration_minutes": 18.75,
    "coordinates": [
      [55.751244, 37.618423],
      [55.761244, 37.628423],
      [55.741244, 37.608423]
    ],
    "geometry": [
      [55.751244, 37.618423],
      [55.761244, 37.628423],
      [55.741244, 37.608423]
    ],
    "provider": "osrm",
    "is_fallback": false,
    "geometry_type": "full",
    "transport_type": "driving"
  }
}
```

### `GET /routes`

Возвращает все сохраненные маршруты.

Response:

```json
{
  "routes": [
    {
      "id": 1,
      "points": [1, 2, 3],
      "distance_km": 12.5,
      "duration_minutes": 18.75,
      "coordinates": [
        [55.751244, 37.618423],
        [55.761244, 37.628423],
        [55.741244, 37.608423]
      ],
      "geometry": [
        [55.751244, 37.618423],
        [55.761244, 37.628423],
        [55.741244, 37.608423]
      ],
      "provider": "osrm",
      "is_fallback": false,
      "geometry_type": "full",
      "transport_type": "driving"
    }
  ],
  "total": 1
}
```

## Маршрутизация и fallback

По умолчанию backend использует OSRM:

```env
ROUTING_PROVIDER=osrm
OSRM_BASE_URL=https://router.project-osrm.org
```

Если OSRM недоступен, backend автоматически строит маршрут через haversine. Такой маршрут возвращается с `is_fallback=true`, `provider="haversine"` и `geometry_type="straight"`.
