# route_optimization

Сервис для генерации и оптимизации городских маршрутов доставки.

## Инструкция по запуску

```shell
docker compose up --build -d
```

Frontend `http://localhost:8080`

Backend `http://localhost:8000`.

## Диагностика и восстановление

Быстрые команды:

```shell
./scripts/diagnose.sh
./scripts/restart-soft.sh
./scripts/rebuild-hard.sh
./scripts/reset-data.sh
```

Подробный runbook:

- `docs/recovery-runbook.md`
