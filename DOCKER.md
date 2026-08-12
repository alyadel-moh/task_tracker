# Running TaskTrack with Docker

## Prerequisites
- Docker and Docker Compose installed
- Copy `.env.example` to `.env` and fill in real values (never commit `.env`)

```bash
cp .env.example .env
```

## Start the complete application

```bash
docker compose up --build
```

This builds and starts three services: `postgres`, `backend`, `frontend`.
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API docs (Swagger): http://localhost:3000/api-docs
- Postgres: localhost:5432 (reachable from your host machine, e.g. via psql or a GUI client)

Run in the background instead of holding your terminal:
```bash
docker compose up --build -d
```

## Apply database migrations

The database starts empty - migrations must be run explicitly, once the
`postgres` service is healthy:

```bash
docker compose exec backend npm run migrate
```

To roll back the most recent migration:
```bash
docker compose exec backend npm run migrate:undo
```

## View logs

```bash
docker compose logs -f
```

Follow just one service:
```bash
docker compose logs -f backend
```

## Stop the application

```bash
docker compose down
```

This stops and removes the containers, but **preserves your database data**
(stored in the `pgdata` named volume, not deleted by a normal `down`).

To also wipe the database entirely (start completely fresh):
```bash
docker compose down -v
```

## Rebuilding after code changes

Compose caches image layers - if you change backend or frontend source code,
rebuild before starting again:
```bash
docker compose up --build
```

If dependencies changed (`package.json`) and the build still looks stale,
force a clean rebuild:
```bash
docker compose build --no-cache
docker compose up
```

## Troubleshooting

**Backend can't connect to the database / `ECONNREFUSED`:**
Postgres may not have finished starting yet. Check its health:
```bash
docker compose ps
```
The `postgres` service should show `healthy`. If it's stuck starting, check its logs:
```bash
docker compose logs postgres
```

**Frontend loads but API calls fail (CORS or network errors in the browser console):**
Confirm `VITE_API_URL` in `docker-compose.yml` points at `http://localhost:3000`
(the *published host port*), not `http://backend:3000` (the internal Docker
service name) - the frontend's JavaScript runs in your browser, not inside a
container, so it can't resolve Docker's internal service names.

**Changed a `.env` value but the app still behaves like the old one:**
Environment variables are read when containers start, not live. Restart:
```bash
docker compose up -d --force-recreate
```

**Port already in use (`5432`, `3000`, or `5173` already bound):**
Something else on your machine is using that port. Either stop it, or change
the *left-hand* side of the port mapping in `docker-compose.yml`
(e.g. `"5433:5432"` to expose Postgres on 5433 instead) - the right-hand side
must stay matched to what the service inside the container actually listens on.

**Need a shell inside a running container to debug directly:**
```bash
docker compose exec backend sh
```
