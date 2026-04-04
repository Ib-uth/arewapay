# Fly.io deployment (ArewaPay)

Two Fly apps (same organization):

| App | Config | Purpose |
|-----|--------|---------|
| **API** | [`apps/backend/fly.toml`](../apps/backend/fly.toml) | FastAPI + Alembic migrations on boot |
| **Web** | [`fly.web.toml`](../fly.web.toml) (repo root) | Static SPA + nginx proxy `/api` → API over 6PN |

Deploy API from `apps/backend`. Deploy web from **repository root** so the frontend Dockerfile can see the monorepo `package-lock.json`.

## Prerequisites

- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed and `fly auth login`
- GitHub: push this repo to your remote (e.g. `origin` on `main`)

## 1. Postgres (API)

```bash
cd apps/backend
fly postgres create   # or attach an existing cluster
fly postgres attach <postgres-cluster-name> -a arewapay-api
```

This sets `DATABASE_URL` on the API app.

## 2. API secrets (required + new mail vars)

Set **all** of these on the API app (`arewapay-api`). Replace URLs with your real **HTTPS** web app URL (e.g. `https://arewapay.fly.dev`).

```bash
cd apps/backend

fly secrets set -a arewapay-api \
  JWT_SECRET="$(openssl rand -hex 32)" \
  CORS_ORIGINS="https://arewapay.fly.dev,https://www.yourdomain.com" \
  PUBLIC_APP_URL="https://arewapay.fly.dev" \
  API_PUBLIC_URL="https://arewapay-api.fly.dev" \
  COOKIE_SECURE="true" \
  RESEND_API_KEY="re_..." \
  EMAIL_FROM='noreply@arewapay.africa <noreply@quodel.com>'
```

Notes:

- **`CORS_ORIGINS`**: comma-separated, no spaces (or match how your app parses). Must include every browser origin that calls the API (usually your **web** app URL only, because `/api` is same-origin when proxied through nginx — if you ever call the API hostname directly from the browser, add that too).
- **`PUBLIC_APP_URL`**: used in emails/links; must match where users open the SPA.
- **`API_PUBLIC_URL`**: external URL of the API (for absolute links if needed).
- **`COOKIE_SECURE`**: `true` in production (HTTPS only).
- **`RESEND_API_KEY` / `EMAIL_FROM`**: required for signup OTP. `EMAIL_FROM` must use a domain verified in [Resend](https://resend.com). Display-name masking is supported (see [`.env.example`](../.env.example)).

Optional (RevenueCat webhooks):

```bash
fly secrets set -a arewapay-api \
  REVENUECAT_WEBHOOK_SECRET="..." \
  REVENUECAT_PREMIUM_PRODUCT_IDS="premium_monthly,premium_yearly" \
  REVENUECAT_UNLIMITED_PRODUCT_IDS="lifetime"
```

Redis: add a Fly Redis (Upstash) URL if you later wire the app to it:

```bash
fly secrets set -a arewapay-api REDIS_URL="redis://..."
```

## 3. Deploy API

```bash
cd apps/backend
fly deploy
```

Entrypoint runs `alembic upgrade head` before Uvicorn (migrations including OTP / onboarding columns apply automatically).

## 4. Web app build args (optional)

The SPA build can receive `VITE_REVENUECAT_API_KEY` at **image build** time (optional).

```bash
cd /path/to/arewapay   # monorepo root
fly deploy --config fly.web.toml --build-arg VITE_REVENUECAT_API_KEY=""
```

If you omit it, the build uses an empty key (RevenueCat UI is already removed from the product surface).

Ensure [`fly.web.toml`](../fly.web.toml) has `API_UPSTREAM = "arewapay-api.internal:8000"` matching your **API app name**.

## 5. Deploy web

```bash
cd /path/to/arewapay   # monorepo root
fly deploy --config fly.web.toml
```

## 6. GitHub

Push `main` (or your default branch) to GitHub; CI runs [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

To deploy from GitHub Actions, add repo secrets `FLY_API_TOKEN` (and optionally split deploy jobs) — not configured by default in this repo.

## Environment variable reference (API)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Set by `fly postgres attach` |
| `JWT_SECRET` | Yes | Auth token signing |
| `CORS_ORIGINS` | Yes | Allowed browser origins |
| `PUBLIC_APP_URL` | Yes | Public SPA base URL |
| `API_PUBLIC_URL` | Yes | Public API base URL |
| `COOKIE_SECURE` | Prod: `true` | httpOnly cookies |
| `RESEND_API_KEY` | For OTP | Transactional email |
| `EMAIL_FROM` | For OTP | Verified Resend sender |
| `REDIS_URL` | Optional | Rate limits / future jobs |
| `REVENUECAT_*` | Optional | Webhook tier mapping |
| `COOKIE_DOMAIN` | Optional | Only if you use a shared parent domain |

See also [`.env.example`](../.env.example).
