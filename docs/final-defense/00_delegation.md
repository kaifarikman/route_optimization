# Делегирование задач перед финальной защитой

Этот файл - диспетчерская инструкция для финального рывка. Используйте task ID и теги при постановке задач в чатах, issue, Сфера.Задачи или комментариях.

## Как тегать

- `[BACKEND]` - backend API, routing providers, fallback, алгоритмы, server-side tests.
- `[FRONTEND]` - карта, UI, состояния кнопок, метрики, frontend config, smoke-проверка в браузере.
- `[QA]` - автотесты, regression checklist, ручной прогон, browser matrix, фиксация результатов.
- `[TL]` - README, деплой, публичные ссылки, презентация, демо-сценарий, финальная упаковка.
- `[CRITICAL]` - без этого защита рискованная или автопроверка красная.
- `[HIGH]` - важно для оценки и уверенного демо, но не всегда блокирует запуск MVP.
- `[TODO]` - задача ещё не закрыта.
- `[DONE]` - задача закрыта и проверена по критерию готовности.

## Порядок запуска

1. `[BACKEND]` закрывает fallback и обычный pytest без env override.
2. `[FRONTEND]` проверяет карту, OSRM geometry, fallback UI и production URL backend.
3. `[QA]` выполняет автопрогон и ручной regression checklist на локальной или задеплоенной версии.
4. `[TL]` собирает README, деплой, публичные ссылки, презентацию и демо-сценарий.

## Единая таблица задач

| ID | Теги | Роль | Статус | Файл роли | Критерий готовности |
| --- | --- | --- | --- | --- | --- |
| BE-FINAL-01 | `[BACKEND][CRITICAL]` | Backend | `[DONE]` | [backend.md](backend.md) | При недоступном OSRM API возвращается маршрут `provider=haversine`, `is_fallback=true`, `geometry_type=straight`. |
| BE-FINAL-02 | `[BACKEND][CRITICAL]` | Backend | `[DONE]` | [backend.md](backend.md) | `python3 -m pytest tests/ -q` проходит без env override и без реального сетевого вызова OSRM в тестах. |
| BE-FINAL-03 | `[BACKEND][HIGH]` | Backend | `[TODO]` | [backend.md](backend.md) | 2-opt реализован и покрыт тестами или честно зафиксирован как limitation в README/презентации. |
| FE-FINAL-01 | `[FRONTEND][HIGH]` | Frontend | `[TODO]` | [frontend.md](frontend.md) | OSRM route с `geometry_type=full` рисуется по дорожной geometry, карта делает `fitBounds`. |
| FE-FINAL-02 | `[FRONTEND][HIGH]` | Frontend | `[TODO]` | [frontend.md](frontend.md) | Fallback route рисуется пунктиром, warning виден, метрики показывают понятные labels. |
| QA-FINAL-01 | `[QA][CRITICAL]` | QA / Tester | `[DONE]` | [tester.md](tester.md) | Полный автопрогон зелёный: `0 failed`. |
| QA-FINAL-02 | `[QA][HIGH]` | QA / Tester | `[TODO]` | [tester.md](tester.md) | Regression checklist содержит 15+ пунктов, отметки `✅`/`❌`, Chrome/Firefox/Safari и итог. |
| TL-FINAL-01 | `[TL][CRITICAL]` | Team Lead | `[DONE]` | [team-lead.md](team-lead.md) | README соответствует ТЗ: стек, архитектура, запуск, env, алгоритмы, ограничения, ссылки. |
| TL-FINAL-02 | `[TL][CRITICAL]` | Team Lead | `[TODO]` | [team-lead.md](team-lead.md) | Публичный frontend открывается, backend `/health` отвечает, ссылки внесены в README/презентацию. |
| TL-FINAL-03 | `[TL][HIGH]` | Team Lead | `[TODO]` | [team-lead.md](team-lead.md) | Финальная презентация 10-15 слайдов готова и содержит демо, архитектуру, алгоритмы, тесты, ссылки. |

## Быстрые команды контроля

```shell
python3 -m pytest tests/ -q
```

```shell
docker compose up --build -d
```

```shell
curl http://localhost:8000/health
```

## Что нельзя потерять

- На защите показывать стабильный happy path: генерация 10-20 точек, базовый маршрут, оптимизация, сравнение, порядок посещения.
- Если 2-opt не успевает команда, не утверждать, что он реализован: честно сказать “Nearest Neighbor, 2-opt в плане развития”.
- Если OSRM недоступен во время демо, fallback должен сохранить сценарий через haversine.
