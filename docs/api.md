# API Contract

Актуальный контракт backend API по текущей реализации.

## Content Type

- Request: `application/json`
- Response: `application/json`

## Error Format

При ошибках endpoints возвращают стандартный объект FastAPI:

```json
{
  "detail": "Текст ошибки"
}
```

## Schemas

### Point

```json
{
  "id": 1,
  "lat": 55.75,
  "lon": 37.61
}
```

### Route

```json
{
  "id": 1,
  "points": [1, 2, 3],
  "distance_km": 12.5,
  "duration_minutes": 18.75,
  "coordinates": [
    [55.75, 37.61],
    [55.76, 37.62],
    [55.77, 37.63]
  ]
}
```

## Points

### `POST /points/generate`

Генерирует точки вокруг заданного центра и сохраняет их в БД.

Request body:

```json
{
  "center_lat": 55.75,
  "center_lon": 37.61,
  "radius_km": 10,
  "count": 5
}
```

Success response `200 OK`:

```json
{
  "points": [
    {
      "id": 1,
      "lat": 55.7541,
      "lon": 37.6123
    }
  ]
}
```

Error response:

- `400 Bad Request` если произошла ошибка при генерации или сохранении

### `GET /points`

Возвращает все сохраненные точки.

Success response `200 OK`:

```json
{
  "points": [
    {
      "id": 1,
      "lat": 55.7541,
      "lon": 37.6123
    }
  ]
}
```

Error response:

- `500 Internal Server Error` если произошла ошибка чтения

### `DELETE /points`

Удаляет все точки и все сохраненные маршруты.

Success response `200 OK`:

```json
{
  "status": "cleared",
  "message": "Удалено точек: 5"
}
```

Error response:

- `500 Internal Server Error` если произошла ошибка удаления

## Routes

### `POST /routes/base`

Строит базовый маршрут в порядке переданных `point_ids`, рассчитывает метрики и сохраняет маршрут в БД.

Request body:

```json
{
  "point_ids": [1, 2, 3]
}
```

Success response `200 OK`:

```json
{
  "route": {
    "id": 1,
    "points": [1, 2, 3],
    "distance_km": 12.5,
    "duration_minutes": 18.75,
    "coordinates": [
      [55.75, 37.61],
      [55.76, 37.62],
      [55.77, 37.63]
    ]
  }
}
```

Error responses:

- `400 Bad Request` если одна или несколько точек не найдены или запрос некорректен

### `POST /routes/optimize`

Строит оптимизированный маршрут по алгоритму nearest neighbor, рассчитывает метрики и сохраняет маршрут в БД.

Request body:

```json
{
  "point_ids": [1, 2, 3]
}
```

Success response `200 OK`:

```json
{
  "route": {
    "id": 1,
    "points": [1, 3, 2],
    "distance_km": 10.2,
    "duration_minutes": 15.3,
    "coordinates": [
      [55.75, 37.61],
      [55.77, 37.63],
      [55.76, 37.62]
    ]
  }
}
```

Error responses:

- `400 Bad Request` если одна или несколько точек не найдены или запрос некорректен

### `GET /routes/{route_id}`

Возвращает сохраненный маршрут по ID.

Path params:

- `route_id: int`

Success response `200 OK`:

```json
{
  "route": {
    "id": 1,
    "points": [1, 2, 3],
    "distance_km": 12.5,
    "duration_minutes": 18.75,
    "coordinates": [
      [55.75, 37.61],
      [55.76, 37.62],
      [55.77, 37.63]
    ]
  }
}
```

Error responses:

- `404 Not Found` если маршрут не найден
- `500 Internal Server Error` если произошла ошибка чтения

### `GET /routes`

Возвращает список всех сохраненных маршрутов.

Success response `200 OK`:

```json
{
  "routes": [
    {
      "id": 1,
      "points": [1, 2, 3],
      "distance_km": 12.5,
      "duration_minutes": 18.75,
      "coordinates": [
        [55.75, 37.61],
        [55.76, 37.62],
        [55.77, 37.63]
      ]
    }
  ],
  "total": 1
}
```

Error response:

- `500 Internal Server Error` если произошла ошибка чтения

## System

### `GET /health`

Проверка доступности backend.

Success response `200 OK`:

```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### `GET /config`

Возвращает текущую конфигурацию, которую backend отдает как service info.

Success response `200 OK`:

```json
{
  "routing_api": "osrm",
  "version": "1.0.0",
  "cors_enabled": true,
  "database": "sqlite"
}
```
