# Deployment overview

- **Local / Docker Compose:** root [`docker-compose.yml`](../docker-compose.yml), env from [`.env.example`](../.env.example) (copy to `.env`). Set `RESEND_API_KEY` and `EMAIL_FROM` for real OTP email.
- **Production (Fly.io):** see [FLY.md](./FLY.md) for two-app setup (API + static web), secrets, and `fly deploy` commands.

CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) on push and pull requests.
