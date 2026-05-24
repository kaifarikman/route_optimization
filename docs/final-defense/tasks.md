# Все задачи перед финальной защитой

Единый список задач по ролям. Используйте ID и теги при постановке задач в команде.

## Легенда тегов

- `[BACKEND]` - backend API, routing providers, fallback, алгоритмы, server-side tests.
- `[FRONTEND]` - карта, UI, метрики, frontend config, browser smoke.
- `[QA]` - автотесты, checklist, ручной прогон, browser matrix.
- `[TL]` - README, деплой, презентация, демо-сценарий, финальная упаковка.
- `[CRITICAL]` - без этого защита рискованная.
- `[HIGH]` - важно для оценки и уверенного демо.
- `[TODO]` - ещё не закрыто.
- `[DONE]` - закрыто и проверено.

## Backend

### BE-FINAL-01 `[BACKEND][CRITICAL][DONE]` - настоящий fallback OSRM -> haversine

Сделать fallback совместимым с текущим backend-интерфейсом:

```python
build_route(points: list[Point], transport_type: str = "driving") -> RoutingResult
```

Критерий готовности:

- при успешном OSRM маршрут возвращается с `provider="osrm"`, `is_fallback=false`, `geometry_type="full"`;
- при падении OSRM маршрут возвращается с `provider="haversine"`, `is_fallback=true`, `geometry_type="straight"`;
- `POST /routes/base` и `POST /routes/optimize` не падают при недоступном OSRM;
- frontend получает fallback warning через `is_fallback=true`.

### BE-FINAL-02 `[BACKEND][CRITICAL][DONE]` - зелёные тесты без реальной сети

Убрать зависимость route-service/API тестов от публичного OSRM.

Критерий готовности:

```shell
python3 -m pytest tests/ -q
```

должен проходить с `0 failed` без `ROUTING_PROVIDER=haversine`.

### BE-FINAL-03 `[BACKEND][HIGH][TODO]` - 2-opt или честный limitation

Решить судьбу 2-opt:

- либо реализовать `two_opt_improve(...)`, подключить его после Nearest Neighbor и покрыть тестами;
- либо честно зафиксировать в README/презентации, что сейчас реализован только Nearest Neighbor.

## Frontend

### FE-FINAL-01 `[FRONTEND][HIGH][TODO]` - smoke-проверка OSRM full geometry

Проверить, что route с `geometry_type="full"` и длинным `geometry` массивом рисуется по дорожной линии, а не только соединяет delivery points.

Критерий готовности:

- `route.geometry.length > route.coordinates.length`;
- `frontend/js/map/routes.js` берёт `routeData.geometry`;
- карта автоматически приближает маршрут через `fitBounds`;
- визуально линия идёт по дорогам.

### FE-FINAL-02 `[FRONTEND][HIGH][TODO]` - fallback UI

Проверить frontend-поведение при fallback route.

Критерий готовности:

- `route.is_fallback=true` отображает warning;
- `geometry_type="straight"` отображается как “прямые линии”;
- `geometry_type="full"` отображается как “по дорогам”;
- fallback route рисуется пунктиром;
- warning виден в карточке метрик.

### FE-FINAL-03 `[FRONTEND][HIGH][TODO]` - production backend URL

Проверить, что frontend на деплое ходит в правильный backend.

Критерий готовности:

- публичный frontend не делает запросы к `http://localhost:8000`;
- `API_BASE_URL` корректный;
- CORS разрешает публичный frontend origin;
- генерация и построение маршрута работают из браузера на публичной ссылке.

### FE-FINAL-04 `[FRONTEND][HIGH][TODO]` - UI sanity на 10-20 точках

Проверить основной MVP-сценарий на демонстрационном размере.

Критерий готовности:

- 10-20 точек генерируются без визуального мусора;
- кнопки корректно disabled/enabled;
- loading text появляется на активной кнопке;
- список порядка посещения читаемый;
- сравнение метрик не ломает layout.

## QA / Tester

### QA-FINAL-01 `[QA][CRITICAL][DONE]` - полный автопрогон без env override

Запустить полный pytest без подмены `ROUTING_PROVIDER`.

Критерий готовности:

```shell
python3 -m pytest tests/ -q
```

Результат должен быть `0 failed`.

### QA-FINAL-02 `[QA][HIGH][TODO]` - regression checklist 15+ пунктов

Обновить ручной чеклист перед защитой.

Критерий готовности:

- минимум 15 пунктов;
- у каждого пункта есть `✅` или `❌`;
- есть результат автопрогона pytest;
- есть browser matrix: Chrome, Firefox, Safari;
- проверены генерация, валидация, базовый маршрут, оптимизация, сравнение, порядок посещения, OSRM, fallback, сброс и loading/disabled кнопки.

### QA-FINAL-03 `[QA][HIGH][TODO]` - fallback-сценарий

Проверить, что при недоступном OSRM пользовательский сценарий не умирает.

Критерий готовности:

- backend возвращает маршрут вместо 400/500;
- `provider="haversine"`;
- `is_fallback=true`;
- `geometry_type="straight"`;
- frontend показывает warning и пунктирную линию.

### QA-FINAL-04 `[QA][HIGH][TODO]` - demo run

Пройти полный сценарий так, как он будет показан комиссии.

Критерий готовности:

- параметры демо записаны;
- результат базового маршрута записан;
- результат оптимизации записан;
- улучшение в км/мин/% записано;
- известен план B на случай недоступного OSRM.

## Team Lead

### TL-FINAL-01 `[TL][CRITICAL][DONE]` - полноценный README по ТЗ

Заменить текущий README на финальную версию.

Критерий готовности:

- описание продукта;
- стек;
- архитектурная схема;
- инструкция запуска;
- ссылки на frontend/backend/docs;
- env-переменные;
- описание алгоритма Nearest Neighbor и статуса 2-opt;
- объяснение OSRM, haversine и fallback;
- ограничения;
- публичная ссылка на деплой после TL-FINAL-02.

### TL-FINAL-02 `[TL][CRITICAL][TODO]` - публичный деплой

Довести deploy до состояния, которое можно показать комиссии.

Критерий готовности:

- публичный frontend URL открывается без VPN;
- backend `/health` доступен публично;
- frontend на публичном URL строит маршрут и не ходит в localhost;
- `CORS_ALLOW_ORIGINS` содержит публичный frontend origin;
- ссылки внесены в README и презентацию.

### TL-FINAL-03 `[TL][HIGH][TODO]` - финальная презентация 10-15 слайдов

Подготовить презентацию для защиты.

Критерий готовности:

- файл `.pptx` или `.pdf` готов;
- 10-15 слайдов;
- есть проблема, решение, демо, архитектура, алгоритмы, OSRM/fallback, тесты, ограничения, развитие, ссылки;
- есть конкретные числа из демо: расстояние, время, процент улучшения;
- последний слайд содержит Git repo и публичный URL.

### TL-FINAL-04 `[TL][HIGH][TODO]` - демо-сценарий

Подготовить короткий сценарий, который команда повторит на защите.

Критерий готовности:

- записаны параметры генерации;
- известны ожидаемые действия по кнопкам;
- есть план B, если OSRM недоступен;
- есть локальный fallback-сценарий через Docker.

### TL-FINAL-05 `[TL][HIGH][DONE]` - синхронизация документации

Обновить устаревшие документы после backend/frontend изменений.

Критерий готовности:

- `docs/project-state/` больше не утверждает, что OSRM не имеет `build_route`;
- статус тестов актуальный;
- `PROJECT_SUMMARY.md` не противоречит README или помечен как historical summary;
- `TASKS.md` либо обновлён статусами, либо `docs/final-defense/tasks.md` объявлен основным task-board документом.

## Порядок выполнения

1. `[BACKEND][CRITICAL]` BE-FINAL-01 и BE-FINAL-02.
2. `[QA][CRITICAL]` QA-FINAL-01.
3. `[FRONTEND][HIGH]` FE-FINAL-01 и FE-FINAL-02.
4. `[QA][HIGH]` QA-FINAL-02, QA-FINAL-03, QA-FINAL-04.
5. `[TL][CRITICAL]` TL-FINAL-01 и TL-FINAL-02.
6. `[TL][HIGH]` TL-FINAL-03, TL-FINAL-04, TL-FINAL-05.
