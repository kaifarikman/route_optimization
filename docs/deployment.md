# Деплой

Production deploy настроен через GitHub Actions и Docker Compose на сервере.

## Что происходит при push в main

Workflow `.github/workflows/deploy.yml` запускается на каждый push в `main`.

Порядок такой:

```text
tests
  -> build backend image
  -> build frontend image
  -> push images to Docker Hub
  -> upload deploy/compose.yaml to server
  -> docker compose pull
  -> docker compose up -d --remove-orphans
  -> health checks
```

Docker images:

- `kaifarikmann/route-optimization-backend`
- `kaifarikmann/route-optimization-frontend`

Каждый deploy пушит images с тегом commit SHA и обновляет `latest`.

## Сервер

На сервере используется директория:

```text
~/route_optimization
```

Там должны быть:

- `compose.yaml` - production compose;
- `.env` - серверные переменные окружения;
- `data/` - директория для SQLite базы;

Серверный `.env` не хранится в git. За основу можно взять `deploy/server.env.example`.

## Production compose

Файл `deploy/compose.yaml` не собирает images на сервере. Он использует готовые images из Docker Hub.

Сервисы:

- `backend` - FastAPI, volume `./data:/app/data`, healthcheck `/health`.
- `frontend` - nginx, зависит от healthy backend, отдает UI и проксирует `/api`.

Публичный доступ идет через системный Caddy на `80/443` с TLS (Let's Encrypt). Frontend-контейнер слушает только `127.0.0.1:8080`, наружу он не публикуется.

Production URL: <https://route-optimization.ru/>

## Reverse proxy (Caddy)

Caddy - серверная инфраструктура вне Docker Compose. Конфиг: `/etc/caddy/Caddyfile`.

```text
route-optimization.ru {
    reverse_proxy 127.0.0.1:8080
}
```

Caddy автоматически получает и обновляет TLS-сертификат, редиректит HTTP на HTTPS и проксирует запросы в frontend-контейнер. После `docker compose pull && docker compose up -d` Caddy перенастраивать не нужно.

## Health checks

После запуска deploy проверяет:

- backend health: `http://127.0.0.1:${BACKEND_PORT}/health`;
- frontend env: `http://127.0.0.1:${FRONTEND_PORT}/js/env.js`;
- frontend API proxy: `http://127.0.0.1:${FRONTEND_PORT}/api/health`.

Если один из checks не проходит, workflow считает deploy неуспешным.

## Rollback

Перед загрузкой нового compose workflow сохраняет старый файл как `compose.yaml.prev`.

Если deploy падает, SSH-скрипт:

- печатает состояние compose;
- печатает последние логи backend и frontend;
- возвращает `compose.yaml.prev`, если он есть;
- пытается поднять предыдущую версию через Docker Compose.

Это rollback на уровне compose-файла и Docker images. База данных при этом не удаляется.

## Ручная проверка на сервере

На сервере можно проверить сервисы обычными командами:

```shell
cd ~/route_optimization
docker compose -f compose.yaml ps
curl -fsS "http://127.0.0.1:${BACKEND_PORT:-8000}/health"
curl -fsS "http://127.0.0.1:${FRONTEND_PORT:-8080}/api/health"
docker compose -f compose.yaml logs --tail=100 backend
docker compose -f compose.yaml logs --tail=100 frontend
```

Для проверки публичного домена:

```shell
curl -fsSI http://route-optimization.ru
curl -fsS https://route-optimization.ru/api/health
```
