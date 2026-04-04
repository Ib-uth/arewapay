# Deploy on Fly.io

This repo includes **`apps/backend/fly.toml`** (API) and **`fly.web.toml`** at the root (nginx + static SPA). The frontend proxies `/api` to the API using **Fly private networking** (`<api-app>.internal:8000`).

---

## Prerequisites

1. [Install `flyctl`](https://fly.io/docs/hands-on/install-flyctl/) and run `fly auth login`.
2. Replace app names if you don’t want `arewapay-api` / `arewapay-web`: edit `apps/backend/fly.toml` (`app = "..."`) and **`fly.web.toml`**:
   - `app = "..."`
   - `[env] API_UPSTREAM = "<your-api-app-name>.internal:8000"`

Web and API **must use the same Fly organization** so `.internal` DNS works.

---

## 1. Postgres

```bash
fly postgres create --name arewapay-db --region lhr
```

Create the API app (first deploy or explicit create):

```bash
cd apps/backend
fly apps create arewapay-api
fly postgres attach --app arewapay-api arewapay-db
```

`fly postgres attach` sets `DATABASE_URL` on the API app.

---

## 2. Redis

Fly doesn’t bundle Redis in this setup. Use **[Upstash](https://upstash.com/)** (or similar), create a Redis database, copy the **TLS** URL (`rediss://...`), then:

```bash
fly secrets set -a arewapay-api REDIS_URL="rediss://..."
```

---

## 3. Deploy the API

```bash
cd apps/backend

fly secrets set -a arewapay-api \
  JWT_SECRET="$(openssl rand -hex 32)" \
  CORS_ORIGINS="https://arewapay-web.fly.dev" \
  COOKIE_SECURE="true" \
  PUBLIC_APP_URL="https://arewapay-web.fly.dev" \
  API_PUBLIC_URL="https://arewapay-api.fly.dev"
```

After you have a **custom domain** on the web app, update `CORS_ORIGINS` and `PUBLIC_APP_URL` to that URL.

Optional (billing):

```bash
fly secrets set -a arewapay-api \
  REVENUECAT_WEBHOOK_SECRET="..." \
  REVENUECAT_PREMIUM_PRODUCT_IDS="premium_monthly,premium_yearly" \
  REVENUECAT_UNLIMITED_PRODUCT_IDS="lifetime"
```

Deploy:

```bash
fly deploy -a arewapay-api
```

Smoke tests:

- `https://arewapay-api.fly.dev/health`
- `https://arewapay-api.fly.dev/docs`

The API image runs **`alembic upgrade head`** on each container start (`docker-entrypoint.sh`), then **uvicorn**.

---

## 4. Create the web app and deploy

From the **repository root**:

```bash
fly apps create arewapay-web
```

Build-time RevenueCat key (optional):

```bash
fly deploy --config fly.web.toml --build-arg VITE_REVENUECAT_API_KEY="your_public_sdk_key"
```

Or omit the arg if you don’t use billing in the browser.

```bash
fly deploy --config fly.web.toml
```

Open **`https://arewapay-web.fly.dev`**. The SPA calls **`/api`** on the same host; nginx forwards to **`arewapay-api.internal:8000`**.

---

## 5. RevenueCat webhook

If you use server webhooks, point RevenueCat at:

`https://arewapay-web.fly.dev/api/webhooks/revenuecat`

(nginx strips the `/api` prefix when proxying to the API, same as local Docker.)

---

## 6. Custom domain (optional)

```bash
fly certs add -a arewapay-web app.example.com
```

Add the DNS records `fly certs show` prints. Then:

```bash
fly secrets set -a arewapay-api \
  CORS_ORIGINS="https://app.example.com" \
  PUBLIC_APP_URL="https://app.example.com"
```

Redeploy API (and web if needed).

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| 502 / empty API from browser | `API_UPSTREAM` in `fly.web.toml` must match the **API app name** exactly: `<name>.internal:8000`. Same org. |
| CORS errors | `CORS_ORIGINS` must be the **web** URL (scheme + host, no trailing slash), comma-separated if several. |
| Cookies not sticking | `COOKIE_SECURE=true` and HTTPS on the web app. |
| DB errors | `DATABASE_URL` after attach; use SSL if your provider requires it. |

---

## Files touched in-repo

| File | Role |
|------|------|
| `apps/backend/fly.toml` | API Machine, port 8000, `/health` check |
| `fly.web.toml` | Web Machine, root Dockerfile context, `API_UPSTREAM` |
| `apps/frontend/nginx/default.conf.template` | nginx config with `@@@API_UPSTREAM@@@` placeholder |
| `apps/frontend/docker-nginx-entry.sh` | Substitutes placeholder, starts nginx |

Local **Docker Compose** is unchanged in behavior: default `API_UPSTREAM=api:8000`.
