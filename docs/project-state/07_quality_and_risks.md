# Качество и риски

Этот документ фиксирует проверяемое состояние проекта, а не желаемую картину.

## Автотесты

Текущий прогон:

```shell
python3 -m pytest tests/ -q
```

Результат:

```text
50 passed
```

OSRM unit-тесты мокают внешний HTTP-вызов, а route-service/API тесты используют network-free provider override, чтобы автопрогон не зависел от `router.project-osrm.org`.

## Что покрыто тестами

Тесты проверяют:

- алгоритм Nearest Neighbor;
- генерацию точек;
- расчёт route-метрик;
- haversine provider;
- fallback-логику в отдельном `RoutingRouter`;
- API endpoints точек;
- API endpoints маршрутов;
- system endpoints;
- SQLite repositories.

Это даёт полезную защиту для основного haversine-сценария и API-обвязки.

## Основной риск: внешний OSRM

OSRM и полная дорожная geometry реализованы, но публичный внешний API может быть недоступен или медленным. Поэтому основной product-риск теперь не интерфейс provider, а зависимость от внешней сети.

- `OSRMRoutingProvider` запрашивает `geometries=geojson&overview=full`;
- factory для `ROUTING_PROVIDER=osrm` возвращает `RoutingRouter`;
- при ошибке OSRM backend возвращает haversine route с `is_fallback=true`.

## Конфигурационные риски

- Локальный frontend использует `FRONTEND_PORT=8080`.
- Production frontend использует `FRONTEND_PORT=80`.
- Серверный `.env` должен соответствовать `deploy/server.env.example`.

## Документационные риски

В репозитории есть несколько источников описания проекта:

- `README.md` - очень краткий;
- `PROJECT_SUMMARY.md` - подробная сводка, но файл сейчас не отслеживается git;
- `docs/final-defense/` - task-board и материалы перед защитой;
- `docs/api.md` - API contract, местами короче фактического route-ответа.

Новая папка `docs/project-state/` должна быть актуальной картой состояния, но при изменениях кода её нужно обновлять отдельно.

## Что стоит исправить следующим

- Проверить production `.env` на сервере по `deploy/server.env.example`.
- Обновить `docs/api.md`, чтобы route-схемы полностью отражали текущие поля.
- После deploy выполнить smoke-check из `docs/deploy-runbook.md`.
