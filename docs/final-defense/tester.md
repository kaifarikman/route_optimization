# QA / Tester задачи перед финальной защитой

Цель роли: подтвердить, что проект стабилен для финального демо: автотесты зелёные, ручной сценарий проходит, ошибки и fallback проверены.

## Текущее состояние

После backend-фикса обычный автопрогон с OSRM-дефолтом проходит без зависимости от реального OSRM: route-service/API тесты используют network-free override, OSRM unit-тесты мокают HTTP.

## Задачи

### QA-FINAL-01 `[QA][CRITICAL][DONE]` - полный автопрогон без env override

Запустить полный pytest без подмены `ROUTING_PROVIDER`.

Критерий готовности:

```shell
python3 -m pytest tests/ -q
```

Результат должен быть:

```text
0 failed
```

Что зафиксировать:

- общее число passed;
- если есть failed, ID тестов и краткая причина;
- отдельно проверить, что тесты не требуют доступа к `router.project-osrm.org`.

### QA-FINAL-02 `[QA][HIGH][TODO]` - regression checklist 15+ пунктов

Обновить ручной чеклист перед защитой.

Критерий готовности:

- чеклист содержит минимум 15 пунктов;
- у каждого пункта есть `✅` или `❌`;
- есть результат автопрогона pytest;
- есть browser matrix: Chrome, Firefox, Safari;
- проверены критичные сценарии:
  - генерация корректных точек;
  - ошибки валидации;
  - базовый маршрут;
  - оптимизированный маршрут;
  - сравнение метрик;
  - порядок посещения;
  - OSRM route по дорогам;
  - fallback route;
  - сброс точек;
  - loading/disabled кнопки.

Рекомендуемый файл:

- `tests/e2e/regression_checklist.md` или отдельный финальный checklist в `docs/final-defense/`.

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
- результат построения базового маршрута записан;
- результат оптимизации записан;
- улучшение в км/мин/% записано;
- известен план B на случай недоступного OSRM.

## Команды проверки

```shell
python3 -m pytest tests/ -q
```

```shell
python3 -m pytest tests/ -v
```

```shell
docker compose up --build -d
```

```shell
curl http://localhost:8000/health
```

```shell
curl http://localhost:8000/config
```
