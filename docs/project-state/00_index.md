# Текущее состояние проекта

Эта папка описывает проект `route_optimization` в его текущем виде: не как идеальную целевую архитектуру, а как живой продукт с уже работающими частями, ограничениями и техническими долгами.

Проект - веб-приложение для генерации точек доставки на карте, построения маршрута между ними и сравнения базового маршрута с оптимизированным. Backend написан на FastAPI, данные хранятся в SQLite, frontend работает как статическое Leaflet-приложение через nginx, а весь проект поднимается через Docker Compose.

## Документы

- [01_project_soul.md](01_project_soul.md) - смысл проекта, аудитория, продуктовая идея и честные ограничения.
- [02_roles.md](02_roles.md) - роли пользователей, компонентов и тестов внутри системы.
- [03_architecture.md](03_architecture.md) - архитектурная карта, слои, Docker-схема и основные модули.
- [04_user_flows.md](04_user_flows.md) - пользовательские сценарии: генерация, маршруты, оптимизация, сброс.
- [05_backend_state.md](05_backend_state.md) - текущее состояние backend, API, БД, сервисов и routing providers.
- [06_frontend_state.md](06_frontend_state.md) - текущее состояние frontend, UI, store, карты и метрик.
- [07_quality_and_risks.md](07_quality_and_risks.md) - качество, тесты, текущие падения и риски.
- [08_glossary.md](08_glossary.md) - словарь терминов проекта.

## Связанные материалы

- [README.md](../../README.md) - основной документ запуска, проверки и деплоя.
- [PROJECT_SUMMARY.md](../../PROJECT_SUMMARY.md) - обзорная сводка по проекту.
- [docs/final-defense/](../final-defense/) - task-board и материалы перед защитой.
- [docs/api.md](../api.md) - отдельное описание API-контракта.
- [tests/e2e/regression_checklist.md](../../tests/e2e/regression_checklist.md) - ручной demo-checklist.

## Быстрый статус

| Область | Текущее состояние |
| --- | --- |
| Backend API | FastAPI, эндпоинты точек, маршрутов и system-информации |
| Frontend | Статический HTML/CSS/JS, Leaflet, OpenStreetMap tiles |
| База данных | SQLite через SQLAlchemy, файл в `data/database.db` |
| Маршрутизация | `osrm` в env-шаблонах, `haversine` как fallback |
| OSRM | Реализован через `build_route`, возвращает полную GeoJSON geometry |
| Оптимизация | Nearest Neighbor heuristic |
| Docker | `backend` + `frontend` через `docker-compose.yml` |
| Тесты | `50 passed` при `python3 -m pytest tests/ -q` |
