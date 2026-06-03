# Локальная разработка

Здесь собрано всё для обычного рабочего цикла: поднять проект, проверить, что он жив, разобраться, если что-то сломалось, и при необходимости сбросить данные.

## Подготовка

Скопируйте шаблон переменных окружения:

```shell
cp .env.example .env
```

Для стандартного запуска менять там ничего не нужно. По умолчанию:

- бэкенд слушает `8000`, фронтенд — `8080`;
- фронтенд ходит в API через `/api`;
- база лежит в `data/database.db`;
- маршруты строятся через OSRM, при сбое — резервный расчёт по прямой;
- адреса ищутся через Nominatim-совместимый геокодер с кэшем и лимитом один запрос в секунду.

## Запуск

```shell
docker compose up --build -d
```

После запуска доступно:

- фронтенд: <http://localhost:8080>
- бэкенд: <http://localhost:8000>
- Swagger: <http://localhost:8000/docs>
- health через прокси: <http://localhost:8080/api/health>

Остановить:

```shell
docker compose down
```

## Тесты

Весь набор:

```shell
python3 -m pytest tests/ -q
```

В тестах маршрутизация подменяется на расчёт по прямой, чтобы они не зависели от сети и публичного OSRM.

## Проверка запущенного приложения

Минимальный набор после запуска:

```shell
docker compose ps
curl -fsS http://localhost:8000/health
curl -fsS http://localhost:8080/api/health
curl -fsS http://localhost:8080/js/env.js
curl -fsS http://localhost:8000/points
curl -fsS -X POST http://localhost:8000/geocode \
  -H 'Content-Type: application/json' \
  -d '{"query":"Москва, Красная площадь","limit":1}'
```

Эти команды проверяют статус сервисов, health бэкенда, конфиг фронтенда, прокси API, список точек и геокодинг.

## Диагностика

Если приложение не открывается или API молчит, обычно хватает посмотреть состояние контейнеров и свежие логи:

```shell
docker compose ps
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
```

Проверить, не заняты ли локальные порты:

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

Полная пересборка без кэша:

```shell
docker compose down --remove-orphans
docker compose build --no-cache
docker compose up -d
```

## Сброс базы

Если нужно начать с чистого листа, остановите контейнеры, сохраните копию базы и удалите текущий файл:

```shell
docker compose down
test ! -f data/database.db || cp data/database.db "data/database.db.bak_$(date +%Y%m%d_%H%M%S)"
rm -f data/database.db
docker compose up --build -d
```

## Частые проблемы

### Занят порт

Если `8000` или `8080` уже заняты, поменяйте `BACKEND_PORT` или `FRONTEND_PORT` в `.env` и перезапустите compose.

### Фронтенд открылся, а API молчит

Сначала проверьте прокси:

```shell
curl -fsS http://localhost:8080/api/health
```

Если напрямую бэкенд отвечает, а через прокси нет — смотрите логи фронтенда:

```shell
docker compose logs --tail=100 frontend
```

### OSRM недоступен

Это не должно ломать сценарий: бэкенд переключится на расчёт по прямой и пометит маршрут как резервный. Какой провайдер активен сейчас:

```shell
curl -fsS http://localhost:8000/config
```

### Геокодинг отвечает 429

Публичный Nominatim нельзя использовать как автодополнение или для пакетного геокодинга. Бэкенд ограничивает исходящие запросы одним в секунду на всё приложение и отдаёт `429`, если запросы идут чаще. Повтор того же адреса берётся из кэша в SQLite. Проверить настройки:

```shell
grep GEOCODING .env
```

### Нужно начать с чистых данных

См. раздел «Сброс базы» выше — команда с `cp` сначала делает резервную копию базы, если файл уже есть, и только потом удаляет его.
