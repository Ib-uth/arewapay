# ArewaPay

Fintech payment and invoice management for **Nigerian SMEs**: clients, invoices (NGN), payment tracking, and a simple dashboard.

**Live demo:** _Add your deployed URL here (e.g. Vercel + Railway)._

## Why I built this

Many Nigerian small businesses still juggle invoices in spreadsheets and WhatsApp, which makes it hard to see who owes what or to present a professional bill. ArewaPay is a focused MVP that gives owners and accountants a single place to manage clients, issue clear invoices with tax lines, record partial payments, and spot overdue work—without enterprise complexity.

## Architecture

```mermaid
flowchart LR
  subgraph client [Browser]
    FE[React Vite]
  end
  subgraph server [Backend]
    API[FastAPI]
    DB[(PostgreSQL)]
    RD[(Redis)]
  end
  FE -->|REST JSON + cookies| API
  API --> DB
  API -. optional .-> RD
```

For a hand-drawn diagram, export a PNG from Excalidraw or draw.io and save it as `docs/architecture.png` (optional).

## Technical decisions

- **FastAPI over Django:** Small, typed API surface with automatic OpenAPI docs; async-ready and easy to test. Django would be heavier for a JSON API–first MVP.
- **PostgreSQL over MongoDB:** Invoices, payments, and reporting fit relational constraints (sums, joins, uniqueness on invoice numbers) and ACID expectations for money-like data.
- **JWT in httpOnly cookies:** Reduces XSS exposure versus `localStorage`; refresh rotation on `/auth/refresh`.
- **React Query:** Server state, caching, and simple optimistic updates when recording payments.
- **Monorepo:** `apps/frontend`, `apps/backend`, and `packages/shared-types` for clear boundaries.

## Local development

### Docker (full stack)

```bash
cp .env.example .env   # edit secrets
docker compose up --build
```

The frontend image is built from the **repository root** so `npm ci` can use the root `package-lock.json` (npm workspaces). Commit `package-lock.json` when dependencies change.

- **Frontend:** http://localhost:8080 (nginx → API at `/api`)
- **API:** http://localhost:8000 — OpenAPI docs at http://localhost:8000/docs
- **PostgreSQL:** localhost:5432 (user/password/db: `arewapay`)

### Frontend + backend separately

1. Start Postgres and Redis (or use Docker only for DB/Redis).
2. Backend:

   ```bash
   cd apps/backend
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   export DATABASE_URL=postgresql+psycopg2://arewapay:arewapay@localhost:5432/arewapay
   alembic upgrade head
   uvicorn app.main:app --reload --port 8000
   ```

3. Frontend (Vite proxies `/api` to the backend):

   ```bash
   cd apps/frontend
   npm install
   npm run dev
   ```

Open http://localhost:5173 — register, then use the app under `/app`.

### Environment variables

See [.env.example](.env.example). **Never commit real secrets.** Use Railway/Vercel dashboards in production.

## Scripts

| Area     | Command        |
|----------|----------------|
| Backend  | `pytest`, `ruff check app tests` |
| Frontend | `npm run lint`, `npm run test`, `npm run build` |

## CI

GitHub Actions runs Ruff, pytest, ESLint, Vitest, builds, and non-blocking `pip-audit` / `npm audit` on PRs and pushes to `main`. Extend the workflow to build/push Docker images and deploy to Railway/Vercel when you are ready.

## License

Proprietary / MIT — choose and update this file as you prefer.
