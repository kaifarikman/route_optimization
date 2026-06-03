# Деплой

Боевой деплой собран на GitHub Actions и Docker Compose на сервере. Ниже — что происходит при пуше, как устроен сервер и как откатиться, если что-то пошло не так.

## Что происходит при push в main

Workflow `.github/workflows/deploy.yml` срабатывает на каждый push в `main` и идёт по порядку:

```text
тесты
  -> сборка образа бэкенда
  -> сборка образа фронтенда
  -> пуш образов в Docker Hub
  -> загрузка deploy/compose.yaml на сервер
  -> docker compose pull
  -> docker compose up -d --remove-orphans
  -> health-проверки
```

Образы:

- `kaifarikmann/route-optimization-backend`
- `kaifarikmann/route-optimization-frontend`

Каждый деплой пушит образы с тегом по SHA коммита и заодно обновляет `latest`.

## Сервер

На сервере всё лежит в `~/route_optimization`. Там должны быть:

- `compose.yaml` — боевой compose;
- `.env` — серверные переменные окружения;
- `data/` — каталог под базу SQLite.

Серверный `.env` в git не хранится; за основу можно взять `deploy/server.env.example`.

## Боевой compose

`deploy/compose.yaml` ничего не собирает на сервере — он берёт готовые образы из Docker Hub. Сервисы те же два:

- `backend` — FastAPI, том `./data:/app/data`, health-проверка по `/health`;
- `frontend` — nginx, поднимается после здорового бэкенда, отдаёт интерфейс и проксирует `/api`.

Наружу всё смотрит через системный Caddy на `80/443` с TLS от Let's Encrypt. Контейнер фронтенда слушает только `127.0.0.1:8080` и напрямую наружу не публикуется.

Боевой адрес: <https://route-optimization.ru/>

## Reverse proxy (Caddy)

Caddy — это серверная инфраструктура вне Docker Compose, конфиг лежит в `/etc/caddy/Caddyfile`:

```text
route-optimization.ru {
    reverse_proxy 127.0.0.1:8080
}
```

Caddy сам получает и обновляет TLS-сертификат, редиректит HTTP на HTTPS и проксирует запросы в контейнер фронтенда. После `docker compose pull && docker compose up -d` его перенастраивать не нужно.

## Health-проверки

После деплоя workflow проверяет:

- health бэкенда: `http://127.0.0.1:${BACKEND_PORT}/health`;
- конфиг фронтенда: `http://127.0.0.1:${FRONTEND_PORT}/js/env.js`;
- прокси API через фронтенд: `http://127.0.0.1:${FRONTEND_PORT}/api/health`.

Если хоть одна не прошла, деплой считается неуспешным.

## Откат

Перед загрузкой нового compose workflow сохраняет старый файл как `compose.yaml.prev`. Если деплой падает, SSH-скрипт:

- печатает состояние compose;
- печатает свежие логи бэкенда и фронтенда;
- возвращает `compose.yaml.prev`, если он есть;
- пытается поднять предыдущую версию.

Это откат на уровне compose-файла и образов — база при этом не трогается.

## Ручная проверка на сервере

Обычными командами:

```shell
cd ~/route_optimization
docker compose -f compose.yaml ps
curl -fsS "http://127.0.0.1:${BACKEND_PORT:-8000}/health"
curl -fsS "http://127.0.0.1:${FRONTEND_PORT:-8080}/api/health"
docker compose -f compose.yaml logs --tail=100 backend
docker compose -f compose.yaml logs --tail=100 frontend
```

Проверить публичный домен:

```shell
curl -fsSI http://route-optimization.ru
curl -fsS https://route-optimization.ru/api/health
```
