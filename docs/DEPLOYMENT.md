# Deploying ArewaPay (free-tier friendly)

This guide explains how to run ArewaPay in production **without paid hosting**, using common free allowances. “Free” usually means **limits** (cold starts, sleep after idle, storage caps, or trial credits)—plan to upgrade when you outgrow them.

---

## How this app expects to be served

- The **browser** loads the SPA (static files).
- API calls use a **relative** base path: `/api` (see `apps/frontend/src/api/client.ts`). Cookies are sent with `credentials: "include"`.
- **Best fit for zero frontend changes:** one public origin (one hostname) where something (nginx, Caddy, Traefik, or your PaaS) routes:
  - `/` → static frontend
  - `/api` → FastAPI

Splitting **frontend** and **API** onto **different domains** works only if you add a configurable API base URL and handle CORS + cookies carefully; the snippets below assume **same-origin `/api`** unless noted.

---

## Environment variables (production checklist)

Set these in your API host (not in the repo):

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | PostgreSQL connection string (SSL usually required on managed DBs). |
| `REDIS_URL` | Redis URL for rate limiting / usage. |
| `JWT_SECRET` | Long random string; **never** reuse dev secrets. |
| `CORS_ORIGINS` | Comma-separated **exact** frontend origins, e.g. `https://app.example.com`. |
| `COOKIE_SECURE` | `true` when served over **HTTPS**. |
| `PUBLIC_APP_URL` | Public URL of the SPA (email links, redirects). |
| `API_PUBLIC_URL` | Public URL of the API (if used for links/docs). |
| `REVENUECAT_*` | Only if you use billing webhooks; set webhook secret in RevenueCat. |

Frontend **build-time** (Vite):

| Variable | Notes |
|----------|--------|
| `VITE_REVENUECAT_API_KEY` | Public RevenueCat SDK key; embed at **build** time. |

Run DB migrations before or on deploy:

```bash
cd apps/backend && alembic upgrade head
```

---

## Option 1 — One VPS + Docker Compose (simplest for this repo)

Use an **always-free** or **cheap** VM and run the same stack as locally.

**Examples of free/low-cost VMs**

- **Oracle Cloud “Always Free”** (ARM or AMD; quotas apply): full VM, you install Docker.
- **Google Cloud e2-micro** (free tier within limits; not “unlimited”).
- **Fly.io**: free resource allowances; good for small Docker apps.
- **Hetzner / DigitalOcean**: not free, but cheap single VPS if you outgrow free tiers.

**Steps (high level)**

1. Install Docker + Docker Compose on the VM.
2. Copy the project; set `.env` next to `docker-compose.yml` with production values (see above). For the frontend image build, set `VITE_REVENUECAT_API_KEY` in `.env` if you use RevenueCat.
3. Put a **reverse proxy with TLS** in front (Caddy or nginx on the host, or **Cloudflare** in front of the VM) so users hit `https://yourdomain.com` with valid HTTPS (`COOKIE_SECURE=true`).
4. Point DNS to the VM; ensure `CORS_ORIGINS` and `PUBLIC_APP_URL` match the real site URL.
5. Run `docker compose up -d` (or use a `systemd` unit). Run Alembic migrations once per deploy (exec into the API container or a one-off job).

**Why this matches the code:** nginx in the frontend container already proxies `/api` to the API service—same pattern as local Docker.

---

## Option 2 — Managed Postgres + Redis (free tiers) + app on a PaaS

Use free database layers and run only the API + build the SPA elsewhere.

**PostgreSQL (free tiers; limits apply)**

- **Neon** — serverless Postgres, generous free tier.
- **Supabase** — Postgres + extras; free tier.
- **ElephantSQL** — small free plans (legacy; check current limits).

**Redis**

- **Upstash** — serverless Redis; free tier with daily/request limits.

**API hosting (examples)**

- **Render** — free web service tier (spins down when idle; cold starts).
- **Railway** — historically had free credits; check current pricing.
- **Fly.io** — free allowance for small machines.

Configure `DATABASE_URL` and `REDIS_URL` from the provider’s dashboard. Deploy the FastAPI app with `uvicorn` (or Dockerfile from `apps/backend`). You still need to serve the SPA and `/api` on **one origin** unless you change the frontend (see intro).

**Typical pattern:** run **API** on Render/Fly, run **static files** on **Cloudflare Pages / Netlify / Vercel**, and put **Cloudflare** (or similar) in front with a **Worker** or **reverse proxy rule** so `https://app.example.com/api/*` proxies to the API and `/*` serves the SPA. That preserves `/api` on the same hostname.

---

## Option 3 — Static frontend (Cloudflare Pages / Vercel / Netlify) + API subdomain

If you serve the SPA at `https://app.example.com` and the API at `https://api.example.com`, **the current frontend will not work as-is** because `fetch("/api/...")` targets the wrong host.

You must either:

- Use a **reverse proxy** on `app.example.com` that forwards `/api` to `api.example.com`, **or**
- Change the client to use something like `import.meta.env.VITE_API_ORIGIN` (feature work—not in this doc’s default path).

---

## HTTPS and cookies

- Use **HTTPS** in production.
- Set `COOKIE_SECURE=true` so session cookies are only sent over TLS.
- `CORS_ORIGINS` must include the exact scheme + host + port of the SPA (no trailing slash mismatch).

---

## CI/CD (GitHub Actions)

The repo already runs tests and `docker compose build` on push/PR. To **deploy on push to `main`**:

1. Add secrets to the GitHub repo: `SSH_PRIVATE_KEY`, `HOST`, `USER`, or use a PaaS **deploy hook** / **API token**.
2. Extend `.github/workflows/ci.yml` (or add `deploy.yml`) with a final job that SSHs to the VM and runs `git pull && docker compose up -d --build` **or** triggers Render/Fly deploy.

Keep secrets out of the workflow logs.

---

## RevenueCat (optional)

- **Frontend:** `VITE_REVENUECAT_API_KEY` at **build** time.
- **Backend:** webhook path is **`POST /webhooks/revenuecat`** on the FastAPI app. If the browser uses `https://yourdomain.com/api/...` via a reverse proxy, the webhook URL is typically **`https://yourdomain.com/api/webhooks/revenuecat`**. Set `REVENUECAT_WEBHOOK_SECRET` and product ID lists in env; configure the same URL + auth in the RevenueCat dashboard.

---

## Quick sanity checks after deploy

1. Open `https://<your-site>/` — marketing loads.
2. Register / login — cookies set; `/app` loads.
3. `https://<your-site>/docs` — FastAPI OpenAPI (if exposed).
4. Create a client and invoice — DB writes succeed.

---

## Summary

| Approach | Cost | Fits this repo out of the box |
|----------|------|--------------------------------|
| Single VM + Docker Compose + TLS | Often free (with limits) | **Yes** (same `/api` proxy) |
| PaaS API + static host + reverse proxy | Free tiers | **Yes**, if `/api` is proxied to same host as SPA |
| API on subdomain, SPA elsewhere, no proxy | Free tiers | **No** (needs client URL change) |

When your free tier is exhausted or you need SLAs, move the same Docker images and env to a paid host without changing the architecture much.
