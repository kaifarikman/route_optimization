# Текущее состояние frontend

Frontend - статическое приложение без сборщика. Оно лежит в `frontend/`, использует Leaflet и OpenStreetMap tiles, а данные получает через backend API.

## UI

Главная страница `frontend/index.html` содержит:

- карту;
- карточку генерации точек;
- индикатор статуса;
- кнопку построения базового маршрута;
- кнопку оптимизации;
- карточку сравнения;
- список порядка посещения.

Стили находятся в `frontend/css/styles.css`. UI сейчас компактный: карта занимает основную область, панель управления расположена справа.

## State store

`frontend/js/state/store.js` хранит общий state:

- `points`;
- `baseRoute`;
- `optimizedRoute`;
- `selectedRouteMode`;
- `status`;
- `isLoading`;
- `loadingAction`.

Store простой: `setState` объединяет обновления и уведомляет подписчиков.

## API client

`frontend/js/api/client.js` оборачивает backend-вызовы:

- `generatePoints`;
- `getPoints`;
- `clearPoints`;
- `buildBaseRoute`;
- `optimizeRoute`;
- `getRoute`;
- `getAllRoutes`;
- `checkHealth`;
- `getConfig`.

Базовый URL берётся из `window.APP_CONFIG.API_BASE_URL`, который задаётся в `frontend/js/env.js` локально и через nginx template в контейнере. Сейчас используется same-origin `/api`, чтобы frontend одинаково работал локально и на production.

## Карта

Leaflet инициализируется в `frontend/js/map/map.js`. При изменении store:

- точки отрисовываются через `renderPoints`;
- выбранный маршрут берётся из `baseRoute` или `optimizedRoute`;
- линия маршрута рисуется через `drawRoute`.

`frontend/js/map/routes.js` использует `routeData.geometry`, если она есть и содержит минимум две точки, иначе fallback на `routeData.coordinates`. Для `geometry_type === "straight"` или `is_fallback === true` линия рисуется пунктиром.

## Пользовательские действия

Основные feature-модули:

- `generate-points.js` - читает форму, валидирует значения, вызывает генерацию;
- `build-route.js` - строит базовый маршрут;
- `optimize-route.js` - строит оптимизированный маршрут;
- `clear-points.js` - очищает точки и маршруты;
- `compare-metrics.js` - считает разницу между маршрутами.

## Метрики и состояния

`frontend/js/ui/metrics.js` показывает:

- длину;
- время;
- provider;
- тип геометрии;
- fallback-предупреждение при `is_fallback`.

`frontend/js/ui/controls.js` управляет состоянием кнопок:

- кнопки блокируются во время loading;
- построение маршрута недоступно, если точек меньше двух;
- оптимизация недоступна, пока нет базового маршрута;
- текст кнопок меняется на «Генерация...», «Построение...», «Оптимизация...» и т.п.

## Текущие ограничения frontend

- Приложение работает с координатами, а не адресами.
- `env.js` содержит локальный backend URL и требует замены/генерации для публичного деплоя.
- UI рассчитан на один текущий набор точек, без истории пользовательских сессий.
- Карта зависит от внешних OpenStreetMap tiles.
