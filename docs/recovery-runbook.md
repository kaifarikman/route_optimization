# Recovery Runbook

Этот runbook нужен для локального запуска и для сервера, когда приложение "ничего не грузит" и надо быстро локализовать, где рвется цепочка.

## Что проверять первым

Критическая цепочка сейчас такая:

```text
browser -> frontend:8080 -> /js/env.js -> API_BASE_URL -> backend:8000 -> SQLite
```

Важно:

- frontend не ходит напрямую через nginx `/api` только по коду proxy, а использует `window.APP_CONFIG.API_BASE_URL`;
- в репозитории это значение переведено на `"/api"`, чтобы одинаково работать локально и на сервере;
- если в окружении сервера осталось старое `FRONTEND_API_BASE_URL=http://localhost:8000`, браузер пользователя будет бить в свой localhost, а не в сервер.
- дефолтный `ROUTING_PROVIDER` переведен на `haversine`, чтобы запуск и smoke-check не зависели от внешнего OSRM; для OSRM его нужно включать явно через env.

## Быстрые команды

Диагностика:

```bash
./scripts/diagnose.sh
```

Мягкий рестарт:

```bash
./scripts/restart-soft.sh
```

Полный пересбор:

```bash
./scripts/rebuild-hard.sh
```

Сброс данных с backup:

```bash
./scripts/reset-data.sh
```

Отдельный smoke-check:

```bash
./scripts/smoke-check.sh
```

Проверка публичного домена против локального Docker frontend:

```bash
./scripts/check-domain.sh https://your-domain.example
```

## Локальный сценарий

1. Убедиться, что Docker Desktop запущен.
2. Выполнить `./scripts/diagnose.sh`.
3. Если backend/frontend не healthy или logs с ошибками:
   выполнить `./scripts/restart-soft.sh`.
4. Если не помогло:
   выполнить `./scripts/rebuild-hard.sh`.
5. Если есть подозрение на битую БД:
   выполнить `./scripts/reset-data.sh`.

## Серверный сценарий

1. Выполнить `./scripts/diagnose.sh` прямо на сервере.
2. Проверить `curl http://127.0.0.1:8000/health`.
3. Проверить `curl http://127.0.0.1:8080/js/env.js`.
4. Если там не `API_BASE_URL: "/api"` или внешний корректный URL backend:
   исправить `.env` и переподнять compose.
5. Если backend healthy локально, но frontend снаружи не работает:
   проверить reverse proxy / firewall / security group.
6. После изменения env выполнить `./scripts/restart-soft.sh`.

## Если домен пишет Page not found

Это обычно не ошибка frontend-кода: в `frontend/nginx/default.conf.template` для `/` настроен fallback на `index.html`.

Сначала проверить, отдает ли Docker frontend HTML локально на сервере:

```bash
curl -i http://127.0.0.1:8080/
```

Если локально HTML есть, а домен отдает `Page not found`, запрос с домена идет мимо контейнера. Нужно чинить внешний reverse proxy / DNS / firewall / панель хостинга. Домен должен проксироваться на:

```text
http://127.0.0.1:8080
```

Для быстрой проверки:

```bash
./scripts/check-domain.sh https://your-domain.example
```

## Что должно работать после smoke-check

- `GET /health`
- `GET /points`
- `GET /js/env.js`
- открытие frontend root

После этого вручную в браузере проверяется:

1. генерация точек;
2. построение базового маршрута;
3. оптимизация маршрута;
4. отсутствие CORS и failed network requests.
