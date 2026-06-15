# Mantis AI

Mantis AI is a production-oriented product support platform for AI diagnostics, searchable manuals, product uploads, support chat, dashboards, notifications, and analytics.

## Architecture

- `src/`: Express + TypeScript API with MongoDB, Redis-compatible cache fallback, JWT auth, file upload, RAG-style diagnostic services, analytics, notifications, and OpenAPI docs.
- `frontend/`: Next.js app with authenticated dashboard, 3D product inspection, AI chat, knowledge uploads, search, analytics beacon, and production security headers.
- `docker-compose.yml`: Full local production stack with API, frontend, MongoDB, and Redis.

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- API health: `http://localhost:5000/api/v1/health`
- API docs: `http://localhost:5000/api/v1/docs`
- OpenAPI JSON: `http://localhost:5000/api/v1/openapi.json`

## Docker

```bash
docker compose up --build
```

The stack exposes frontend on `3000` and API on `5000`.

## Testing

```bash
npm test
cd frontend
npm run lint
npm run build
```

## Production Readiness

See:

- [Environment Setup](docs/ENVIRONMENT.md)
- [Installation Guide](docs/INSTALLATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Production Checklist](docs/PRODUCTION_CHECKLIST.md)
- [Future Scalability Plan](docs/SCALABILITY.md)
