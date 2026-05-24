# Backend задачи перед финальной защитой

Цель роли: закрыть backend-риски, из-за которых MVP может упасть на защите: fallback, зелёные тесты, корректная маршрутизация и алгоритм оптимизации.

## Текущее состояние

OSRM geometry уже частично сделана после pull: `OSRMRoutingProvider.build_route(...)` запрашивает `geometries=geojson&overview=full` и возвращает `RoutingResult` с `geometry_type="full"`.

Критичные backend-риски по fallback и сетевой зависимости автотестов закрыты: factory для `ROUTING_PROVIDER=osrm` возвращает `RoutingRouter`, а route-service/API тесты используют network-free provider override.

## Задачи

### BE-FINAL-01 `[BACKEND][CRITICAL][DONE]` - настоящий fallback OSRM -> haversine

Сделать fallback совместимым с текущим backend-интерфейсом:

```python
build_route(points: list[Point], transport_type: str = "driving") -> RoutingResult
```

Критерий готовности:

- при успешном OSRM маршрут возвращается с `provider="osrm"`, `is_fallback=false`, `geometry_type="full"`;
- при падении OSRM маршрут возвращается с `provider="haversine"`, `is_fallback=true`, `geometry_type="straight"`;
- `POST /routes/base` и `POST /routes/optimize` не падают при недоступном OSRM;
- frontend получает fallback warning через поле `is_fallback=true`.

Подсказка по файлам:

- `backend/services/routing_providers/factory.py`;
- `backend/services/routing_router.py`;
- `backend/services/routing_providers/base.py`;
- `backend/services/routing_providers/haversine_provider.py`.

### BE-FINAL-02 `[BACKEND][CRITICAL][DONE]` - зелёные тесты без реальной сети

Убрать зависимость route-service/API тестов от публичного OSRM.

Критерий готовности:

```shell
python3 -m pytest tests/ -q
```

должен проходить с `0 failed` без `ROUTING_PROVIDER=haversine`.

Что проверить:

- service/API тесты не делают настоящий `requests.get` к `router.project-osrm.org`;
- OSRM unit-тесты мокают `requests.get`;
- fallback-тесты проверяют актуальный `build_route`, а не старый `calculate_route`;
- CI workflow сможет пройти без доступа к внешнему routing API.

### BE-FINAL-03 `[BACKEND][HIGH][TODO]` - 2-opt или честный limitation

Решить судьбу 2-opt.

Вариант A: реализовать.

- добавить `two_opt_improve(points: list[Point]) -> list[Point]`;
- в `optimize_route` делать `Nearest Neighbor -> 2-opt`;
- добавить тесты на неухудшение, пересечения, короткие маршруты, идемпотентность.

Вариант B: если времени нет, явно зафиксировать как limitation.

- README: “реализован Nearest Neighbor, 2-opt запланирован”;
- презентация: не говорить, что 2-opt уже есть;
- QA checklist: не требовать 2-opt как обязательный результат.

Критерий готовности:

- либо есть код и тесты 2-opt;
- либо limitation зафиксирован в README и презентации.

## Команды проверки

```shell
python3 -m pytest tests/unit/test_osrm_provider.py -q
```

```shell
python3 -m pytest tests/unit/test_fallback_logic.py -q
```

```shell
python3 -m pytest tests/unit/test_route_services.py tests/integration/test_routes_api.py -q
```

```shell
python3 -m pytest tests/ -q
```
