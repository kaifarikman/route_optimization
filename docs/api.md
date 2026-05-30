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
- `422 Unprocessable Entity` - входной JSON не прошел schema-валидацию FastAPI.
- `404 Not Found` - маршрут с таким ID не найден.
- `500 Internal Server Error` - ошибка чтения или записи на стороне backend.

## Модели

### Point

```json
{
  "id": 1,
  "lat": 55.751244,
  "lon": 37.618423,
  "address": "Москва, Красная площадь",
  "geocoding_provider": "nominatim",
  "geocoding_place_id": "123"
}
```

Поля `address`, `geocoding_provider` и `geocoding_place_id` опциональны. У сгенерированных, импортированных и добавленных кликом точек они обычно отсутствуют.

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

## Geocoding

### `POST /geocode`

Ищет координаты по адресу через backend proxy к Nominatim-compatible provider.

Request:

```json
{
  "query": "Москва, Красная площадь",
  "limit": 5
}
```

Ограничения:

- `query`: от `3` до `300` символов.
- `limit`: от `1` до `5`.

Response:

```json
{
  "results": [
    {
      "lat": 55.75393,
      "lon": 37.6208,
      "display_name": "Красная площадь, Тверской район, Москва, Россия",
      "provider": "nominatim",
      "place_id": "123",
      "category": "place",
      "type": "square",
      "importance": 0.9
    }
  ]
}
```

Если найдено несколько результатов, frontend показывает список кандидатов и не выбирает адрес за пользователя. Если ничего не найдено, `results` будет пустым.

Provider errors:

- `429 Too Many Requests` - локальный лимит 1 request/sec или upstream rate limit.
- `502 Bad Gateway` - provider вернул некорректный ответ или недоступен.
- `504 Gateway Timeout` - timeout provider.

Reverse geocoding в MVP не реализован.

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

Ограничения:

- `center_lat`: от `-90` до `90`.
- `center_lon`: от `-180` до `180`.
- `radius_km`: больше `0`, не больше `50`.
- `count`: от `2` до `50`.

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
  "lon": 37.618423,
  "address": "Москва, Красная площадь",
  "geocoding_provider": "nominatim",
  "geocoding_place_id": "123"
}
```

Ограничения:

- `lat`: от `-90` до `90`.
- `lon`: от `-180` до `180`.
- address metadata опциональна; coordinate-only request остается валидным.

Response:

```json
{
  "point": {
    "id": 2,
    "lat": 55.751244,
    "lon": 37.618423,
    "address": "Москва, Красная площадь",
    "geocoding_provider": "nominatim",
    "geocoding_place_id": "123"
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

Ограничения:

- `point_ids`: от `2` до `50` идентификаторов.

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

Ограничения:

- `point_ids`: от `2` до `50` идентификаторов.

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

## Геокодинг и лимиты

По умолчанию backend использует Nominatim-compatible provider:

```env
GEOCODING_PROVIDER=nominatim
GEOCODING_BASE_URL=https://nominatim.openstreetmap.org
GEOCODING_TIMEOUT_SECONDS=10
GEOCODING_USER_AGENT=route-optimization-demo/1.0
GEOCODING_ACCEPT_LANGUAGE=ru,en
```

Backend кеширует forward geocoding ответы в SQLite и ограничивает исходящие запросы до 1 request/sec на приложение. Это нужно для совместимости с public Nominatim policy. Frontend вызывает `/geocode` только по кнопке поиска адреса; autocomplete и address-only bulk import не используются.
