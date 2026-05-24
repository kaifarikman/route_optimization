# Инструкция для LLM-агента: локальная настройка деплоя

> **Контекст:** репозиторий `route_optimization` — сервис оптимизации маршрутов доставки (FastAPI + nginx frontend).  
> **Цель:** подготовить репозиторий так, чтобы каждый `git push` в `main` автоматически собирал Docker-образы и выкатывал их на прод-сервер по SSH.  
> **Где выполнять:** только на **локальной машине разработчика** (не на прод-сервере).  
> **После выполнения:** пользователь делает `git push origin main`, затем переходит на сервер и запускает [`docs/agent-server-setup.md`](agent-server-setup.md).

---

## Жёсткие ограничения

- **НЕ** подключаться к прод-серверу и **НЕ** менять файлы на ВМ.
- **НЕ** коммитить `.env` (онServers secrets) — только `.env.example` и `deploy/server.env.example`.
- **НЕ** откатывать workflow деплоя к старой версии без `deploy/compose.yaml` и SCP.
- **НЕ** править `compose.yaml` в корне репо — production compose живёт в `deploy/compose.yaml` и копируется на сервер через CI.
- Локальная разработка использует [`docker-compose.yml`](../docker-compose.yml) (`build:`), прод — [`deploy/compose.yaml`](../deploy/compose.yaml) (`image:`).

---

## Текущая проблема (диагностика)

| Симптом | Причина |
|---------|---------|
| Сайт `http://111.88.157.91` не открывается | На проде фронт слушает **8080**, пользователь заходит на **80** |
| После push ничего не обновляется | Локальная ветка отстаёт от `origin/main` или push не в `main` |
| Локально OSRM/дороги работают, на проде нет | В prod `.env` на сервере `ROUTING_PROVIDER=haversine` (чинится шаблоном + серверным `.env`) |

**Production URL:** `http://111.88.157.91/` (порт **80** после настройки).  
**Local dev URL:** `http://localhost:8080`.

---

## Шаг 0. Синхронизация с GitHub (обязательно первым)

```bash
git fetch origin
git checkout main
git pull origin main
```

Проверить:

```bash
git log -1 --oneline   # должен быть ≥ коммита с deploy/ (dad2b00 / 2e941db или новее)
test -f deploy/compose.yaml && test -f deploy/server.env.example
grep -q "scp-action" .github/workflows/deploy.yml && echo "workflow OK"
```

Если `deploy/` отсутствует — **остановиться**: сначала нужен `git pull`, не создавать файлы с нуля поверх устаревшей ветки.

---

## Шаг 1. Production-шаблон окружения

Файл: [`deploy/server.env.example`](../deploy/server.env.example)

Привести к содержимому (IP прод-сервера — `111.88.157.91`):

```env
APP_ENV=production
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
BACKEND_RELOAD=false
FRONTEND_PORT=80
FRONTEND_API_BASE_URL=/api
CORS_ALLOW_ORIGINS=http://111.88.157.91,http://111.88.157.91:80,http://localhost:8080
DATABASE_URL=sqlite:///./data/database.db
NGINX_BACKEND_UPSTREAM=backend:8000
ROUTING_PROVIDER=osrm
OSRM_BASE_URL=https://router.project-osrm.org
ROUTING_TIMEOUT_SECONDS=10
DEFAULT_TRANSPORT_TYPE=driving
```

Ключевые отличия от dev:
- `FRONTEND_PORT=80` — сайт без `:8080` в URL
- `ROUTING_PROVIDER=osrm` — маршруты по дорогам, как локально
- `FRONTEND_API_BASE_URL=/api` — same-origin через nginx в frontend-контейнере

---

## Шаг 2. Dev-шаблон (локальная разработка)

Файл: [`.env.example`](../.env.example)

```env
APP_ENV=development
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
BACKEND_RELOAD=false
FRONTEND_PORT=8080
FRONTEND_API_BASE_URL=/api
CORS_ALLOW_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
DATABASE_URL=sqlite:///./data/database.db
NGINX_BACKEND_UPSTREAM=backend:8000
ROUTING_PROVIDER=osrm
OSRM_BASE_URL=https://router.project-osrm.org
ROUTING_TIMEOUT_SECONDS=10
DEFAULT_TRANSPORT_TYPE=driving
```

---

## Шаг 3. Production compose

Файл: [`deploy/compose.yaml`](../deploy/compose.yaml)

Убедиться, что файл использует **готовые образы** Docker Hub (не `build:`):

```yaml
services:
  backend:
    image: kaifarikmann/route-optimization-backend:latest
    env_file:
      - .env
    ports:
      - "${BACKEND_PORT:-8000}:${BACKEND_PORT:-8000}"
    volumes:
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: unless-stopped

  frontend:
    image: kaifarikmann/route-optimization-frontend:latest
    env_file:
      - .env
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "${FRONTEND_PORT:-8080}:80"
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1/js/env.js >/dev/null 2>&1 || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: unless-stopped
```

Менять только если расходится с этим шаблоном. Порт хоста берётся из `.env` на сервере (`FRONTEND_PORT`).

---

## Шаг 4. GitHub Actions workflow

Файл: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

На `origin/main` (коммит `2e941db`) workflow уже содержит:
1. pytest
2. build + push в Docker Hub (`kaifarikmann/route-optimization-backend/frontend`)
3. SSH: backup `compose.yaml.prev`
4. **SCP** `deploy/compose.yaml` → `~/route_optimization/compose.yaml`
5. `sed` image tags по `GITHUB_SHA`
6. `docker compose pull && up -d`
7. health-check с учётом `BACKEND_PORT` / `FRONTEND_PORT` из серверного `.env`
8. rollback при ошибке

**Если локальный `deploy.yml` старее** (только `sed` без SCP) — взять версию с `origin/main`:

```bash
git show origin/main:.github/workflows/deploy.yml > .github/workflows/deploy.yml
# затем внести правки из шагов 1–3, если менялись порты/health-check
```

**Не удалять** шаги SCP и rollback.

---

## Шаг 5. Документация

### [`README.md`](../README.md)

Добавить/обновить секции:

```markdown
## Локальный запуск

\`\`\`shell
cp .env.example .env
docker compose up --build -d
\`\`\`

Frontend: http://localhost:8080  
Backend: http://localhost:8000

## Production

URL: http://111.88.157.91/

Деплой: push в `main` → GitHub Actions → Docker Hub → SSH на сервер.

- Код и `deploy/compose.yaml` — в репозитории (коммит + push).
- Серверный `.env` — настраивается один раз вручную, см. `docs/agent-server-setup.md`.

## Инструкции для агентов

- Локально: `docs/agent-local-setup.md`
- На сервере: `docs/agent-server-setup.md`
```

### [`docs/deploy-runbook.md`](deploy-runbook.md)

Обновить smoke-check под порт **80**:

```bash
curl -fsS http://127.0.0.1:8000/health
curl -fsS http://127.0.0.1/js/env.js          # FRONTEND_PORT=80
curl -fsS http://127.0.0.1/api/health
```

Указать prod defaults: `FRONTEND_PORT=80`, `ROUTING_PROVIDER=osrm`.

---

## Шаг 6. Локальная проверка перед push

```bash
pip install -r requirements.txt
pytest tests/ -v
```

Опционально — проверить сборку как в CI:

```bash
docker compose -f docker-compose.yml up --build -d
curl -fsS http://localhost:8080/api/config
docker compose down
```

---

## Шаг 7. Commit и push

```bash
git add deploy/ .github/workflows/deploy.yml .env.example README.md docs/
git status   # убедиться: нет .env, data/database.db, compose.yaml в корне
git commit -m "fix: production deploy defaults (port 80, OSRM, agent runbooks)"
git push origin main
```

---

## Шаг 8. Проверка CI (после push)

1. GitHub → **Actions** → workflow **Deploy** → последний run = **success**.
2. Если **failure** на SSH — secrets репозитория: `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.
3. Если **failure** на deploy из-за missing `.env` на сервере — ожидаемо до выполнения [`docs/agent-server-setup.md`](agent-server-setup.md).

---

## Чеклист готовности

- [ ] `git pull origin main` выполнен, есть `deploy/`
- [ ] `deploy/server.env.example` — port 80, osrm, prod CORS
- [ ] `.env.example` — port 8080, dev
- [ ] `deploy/compose.yaml` — image tags, не build
- [ ] `.github/workflows/deploy.yml` — с SCP и health-check
- [ ] `pytest` проходит локально
- [ ] `git push origin main` выполнен
- [ ] GitHub Actions Deploy = success (или понятна причина failure)

---

## Что передать пользователю

После успешного push сообщить:

> Push выполнен. Зайди на сервер и дай агенту файл `docs/agent-server-setup.md` — там одноразовая настройка `.env` и firewall.

---

## HTTPS (не делать сейчас)

Отложить до стабильного HTTP. Потребуется домен, Caddy/nginx на хосте, порт 443. См. конец [`docs/agent-server-setup.md`](agent-server-setup.md).
