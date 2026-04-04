#!/bin/sh
set -e
alembic upgrade head
# Docker Compose uses IPv4 bridge → default 0.0.0.0. Fly sets UVICORN_HOST=:: for 6PN / .internal.
UVICORN_HOST="${UVICORN_HOST:-0.0.0.0}"
exec uvicorn app.main:app --host "$UVICORN_HOST" --port 8000
