# Deploy Runbook

Production deploy uses Docker Hub images and the production compose file from this repository.

## What Updates On Push

On every push to `main`, `.github/workflows/deploy.yml`:

1. runs the Python test suite;
2. builds backend and frontend Docker images;
3. pushes both images to Docker Hub with the commit SHA and `latest` tags;
4. copies `deploy/compose.yaml` to `~/route_optimization/compose.yaml` on the server;
5. replaces image tags in server `compose.yaml` with the current commit SHA;
6. runs `docker compose pull` and `docker compose up -d --remove-orphans`;
7. checks backend health, frontend config, and frontend nginx `/api` proxy.

## What Does Not Update Automatically

The workflow does not overwrite server runtime state:

- `~/route_optimization/.env`;
- `~/route_optimization/data/database.db`;
- files created manually on the server.

Keep the server `.env` aligned with `deploy/server.env.example`.

## Required Server Files

The server directory is expected to be:

```text
~/route_optimization/
├── .env
├── compose.yaml
└── data/
```

The deploy workflow creates `~/route_optimization` and `~/route_optimization/data` if they are missing, but `.env` must exist before the app can run correctly.

## Important Defaults

Use same-origin API routing in production:

```env
FRONTEND_API_BASE_URL=/api
NGINX_BACKEND_UPSTREAM=backend:8000
```

Use the network-independent routing provider by default:

```env
ROUTING_PROVIDER=haversine
```

Enable OSRM explicitly only after verifying server network access to `OSRM_BASE_URL`.

## Manual Smoke Check

Run these commands on the server after a deploy:

```bash
cd ~/route_optimization
docker compose ps
curl -fsS http://127.0.0.1:8000/health
curl -fsS http://127.0.0.1:8080/js/env.js
curl -fsS http://127.0.0.1:8080/api/health
```

The browser should load the frontend and complete:

```text
generate points -> build base route -> optimize route
```

## Rollback Behavior

Before replacing `compose.yaml`, the workflow saves `compose.yaml.prev`.

If `docker compose up` or smoke checks fail, the workflow restores `compose.yaml.prev`, runs `docker compose up -d --remove-orphans`, and fails the GitHub Actions job.
