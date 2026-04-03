# ArewaPay

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,ts,vite,tailwind,py,docker,postgres,redis,nginx&perline=9" alt="Core stack" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" alt="TanStack Query" />
  <img src="https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions" />
</p>

**Invoicing and payment tracking for African SMEs** — one workspace for clients, NGN-first invoices, partial payments, overdue visibility, and subscription plans.

**Live demo:** _Add your deployed URL (e.g. Railway + static host)._

**Deploy for free (tiers & caveats):** see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Stack overview

| Layer | Technologies |
|--------|----------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, React Router, React Hook Form + Zod, Recharts, `@react-pdf/renderer` |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2, Alembic, Pydantic, JWT + httpOnly cookies, bcrypt, slowapi |
| **Data** | PostgreSQL 16, Redis 7 |
| **Infra** | Docker Compose, nginx (frontend image), GitHub Actions CI |
| **Billing** | RevenueCat (web SDK + server webhooks mapping products to tiers) |

---

## What’s in the product

- **Auth & session:** Registration and login, JWT access + refresh in httpOnly cookies, `/auth/me`, logout.
- **Onboarding:** First-run flow before the main app.
- **Dashboard:** Revenue summary, monthly chart, top clients, plan usage.
- **Clients:** Table view, CSV export, structured address fields; **Add client** on a dedicated page.
- **Invoices:** Table + export, create flow with line items, tax, due date; **bill-to** snapshot from the client address; PDF download; payments and status (draft → paid / overdue).
- **Settings:** Full-width **Profile** and **Account** (display name, country, currency, theme). Theme (light / dark / system) applies **inside the signed-in app** only; marketing and auth pages stay light.
- **Plans & limits:** Tier-based caps on clients and rolling invoice volume; upgrade entry points and a billing modal (configure `VITE_REVENUECAT_API_KEY` for live offerings).
- **Marketing:** Landing, features, pricing, about; nav shows an **avatar menu** when you’re logged in (dashboard, profile, logout).

---

## Architecture

```mermaid
flowchart LR
  subgraph client [Browser]
    FE[React + Vite]
  end
  subgraph server [Backend]
    API[FastAPI]
    DB[(PostgreSQL)]
    RD[(Redis)]
  end
  FE -->|REST JSON + cookies| API
  API --> DB
  API -. rate limits / jobs .-> RD
```

Monorepo layout: **`apps/frontend`**, **`apps/backend`**, **`packages/shared-types`**. Root **`package-lock.json`** with npm workspaces.

---

## Technical notes

- **FastAPI:** Typed routes, automatic OpenAPI at `/docs`.
- **PostgreSQL:** Relational model for invoices, payments, and uniqueness constraints.
- **JWT in httpOnly cookies** with refresh rotation on `/auth/refresh`.
- **React Query** for server state and cache invalidation after mutations.
- **CI:** Ruff + pytest (backend); ESLint + Vitest + production build (frontend); non-blocking audits; **Docker Compose build** to verify images; **Dependabot** for npm and pip.

---

## Local development

### Docker (full stack)

```bash
cp .env.example .env   # edit secrets; for frontend build in Docker add VITE_REVENUECAT_API_KEY to .env if needed
docker compose up --build
```

The frontend image builds from the **repository root** so `npm ci` uses the root **`package-lock.json`**. Vite reads env from the **monorepo root** (`apps/frontend/vite.config.ts` → `envDir`).

- **Frontend:** http://localhost:8080 (nginx → `/api` proxied to API)
- **API:** http://localhost:8000 — Swagger at http://localhost:8000/docs
- **PostgreSQL:** `localhost:5432` (default user/db: `arewapay`)

### Frontend + API without Docker for the app containers

1. Start Postgres and Redis (or only DB/Redis via Compose).
2. **Backend:**

   ```bash
   cd apps/backend
   python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   export DATABASE_URL=postgresql+psycopg2://arewapay:arewapay@localhost:5432/arewapay
   alembic upgrade head
   uvicorn app.main:app --reload --port 8000
   ```

3. **Frontend** (Vite dev server proxies `/api`):

   ```bash
   cd apps/frontend
   npm install
   npm run dev
   ```

Open http://localhost:5173 — register, complete onboarding if prompted, then use **`/app`**.

### Environment variables

See [.env.example](.env.example). **Do not commit secrets.** `VITE_*` keys are embedded at **build time** for the SPA; backend secrets belong in the API environment only.

---

## Scripts (from repo root)

| Area | Commands |
|------|-----------|
| Backend | `cd apps/backend && pytest` · `ruff check app tests` |
| Frontend | `npm run lint -w frontend` · `npm run test -w frontend` · `npm run build -w frontend` |
| All workspaces (lint/test) | `npm run lint` · `npm run test` |

---

## CI

On **push** and **pull requests** to `main`, GitHub Actions runs backend Ruff + pytest, frontend lint/test/build, optional security audits, and **`docker compose build`**. **Dependabot** opens weekly update PRs for npm and pip.

---

## License

Proprietary — or choose MIT/Apache-2.0 and update this section when you publish.
