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

Production defaults are:

```env
FRONTEND_PORT=80
ROUTING_PROVIDER=osrm
ROUTING_TIMEOUT_SECONDS=10
```

If OSRM is unavailable during a request, backend should fall back to haversine and return `is_fallback=true`.

## Manual Smoke Check

Run these commands on the server after a deploy:

```bash
cd ~/route_optimization
docker compose -f compose.yaml ps
curl -fsS http://127.0.0.1:8000/health
curl -fsSI http://127.0.0.1/
curl -fsS http://127.0.0.1/js/env.js
curl -fsS http://127.0.0.1/api/health
```

The browser should load the frontend and complete:

```text
generate points -> build base route -> optimize route
```

## Rollback Behavior

Before replacing `compose.yaml`, the workflow saves `compose.yaml.prev`.

If `docker compose up` or smoke checks fail, the workflow restores `compose.yaml.prev`, runs `docker compose up -d --remove-orphans`, and fails the GitHub Actions job.

## Public Domain Shows "Page not found"

The frontend container should not return `Page not found` for `/`. Its nginx config falls back to `index.html`:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

If the public domain shows `Page not found`, first prove whether the request reaches the Docker frontend:

```bash
cd ~/route_optimization
./scripts/check-domain.sh https://your-domain.example
```

If this script is not present on the server, run the equivalent checks manually:

```bash
cd ~/route_optimization
docker compose -f compose.yaml ps
curl -i http://127.0.0.1:8000/health
curl -i http://127.0.0.1/
curl -i http://127.0.0.1/js/env.js
curl -i http://127.0.0.1/api/health
```

Interpretation:

- If `http://127.0.0.1/` returns frontend HTML but the domain returns `Page not found`, Docker and GitHub Actions are not the root cause. Fix the external reverse proxy, DNS, firewall, or hosting panel route.
- If `http://127.0.0.1/` also fails, inspect `docker compose -f compose.yaml logs --tail=150 frontend`.
- If `/` works but `/api/health` fails, check server `.env`: `FRONTEND_API_BASE_URL=/api` and `NGINX_BACKEND_UPSTREAM=backend:8000`.

Minimal external nginx proxy:

```nginx
server {
    listen 80;
    server_name your-domain.example www.your-domain.example;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
