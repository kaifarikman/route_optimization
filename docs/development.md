# Локальная разработка

Документ описывает обычный локальный цикл: поднять проект, проверить, диагностировать и сбросить данные.

## Подготовка

Скопируйте env-шаблон:

```shell
cp .env.example .env
```

Для стандартного запуска менять значения не нужно. По умолчанию:

- backend слушает `8000`;
- frontend слушает `8080`;
- frontend ходит в API через `/api`;
- база лежит в `data/database.db`;
- маршруты строятся через OSRM с haversine fallback.

## Запуск

```shell
docker compose up --build -d
```

Адреса после запуска:

- frontend: <http://localhost:8080>
- backend: <http://localhost:8000>
- Swagger: <http://localhost:8000/docs>
- health через proxy: <http://localhost:8080/api/health>

Остановить:

```shell
docker compose down
```

## Тесты

Запустить весь набор тестов:

```shell
python3 -m pytest tests/ -q
```

В тестах маршрутизация подменяется на haversine, чтобы тесты не зависели от сети и публичного OSRM.

## Проверка запущенного приложения

Минимальная проверка после запуска:

```shell
docker compose ps
curl -fsS http://localhost:8000/health
curl -fsS http://localhost:8080/api/health
curl -fsS http://localhost:8080/js/env.js
curl -fsS http://localhost:8000/points
```

Эти команды проверяют, что:

- статус compose-сервисов;
- backend `/health`;
- runtime config frontend;
- API proxy через frontend;
- backend `/points`.

## Диагностика

Если приложение не открывается или API не отвечает, обычно достаточно посмотреть состояние контейнеров и последние логи.

```shell
docker compose ps
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
```

Если нужно проверить, заняты ли локальные порты:

```shell
lsof -nP -iTCP:8000 -sTCP:LISTEN
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

## Перезапуск и пересборка

Обычный перезапуск:

```shell
docker compose down
docker compose up --build -d
```

Полная пересборка без cache:

```shell
docker compose down --remove-orphans
docker compose build --no-cache
docker compose up -d
```

## Сброс базы

Если нужно начать с чистых данных, остановите контейнеры, сохраните backup базы и удалите текущий файл:

```shell
docker compose down
test ! -f data/database.db || cp data/database.db "data/database.db.bak_$(date +%Y%m%d_%H%M%S)"
rm -f data/database.db
docker compose up --build -d
```

## Частые проблемы

### Занят порт

Если `8000` или `8080` заняты, поменяйте `BACKEND_PORT` или `FRONTEND_PORT` в `.env`, затем перезапустите compose.

### Frontend открылся, но API не отвечает

Проверьте proxy:

```shell
curl -fsS http://localhost:8080/api/health
```

Если прямой backend работает, а proxy нет, смотрите nginx/frontend logs:

```shell
docker compose logs --tail=100 frontend
```

### OSRM недоступен

Это не должно ломать пользовательский сценарий. Backend переключится на haversine, а маршрут будет помечен как fallback.

Для проверки текущего routing provider:

```shell
curl -fsS http://localhost:8000/config
```

### Нужно начать с чистых данных

Используйте:

```shell
docker compose down
test ! -f data/database.db || cp data/database.db "data/database.db.bak_$(date +%Y%m%d_%H%M%S)"
rm -f data/database.db
docker compose up --build -d
```

Команда с `cp` оставляет backup базы перед удалением, если файл базы уже существует.
