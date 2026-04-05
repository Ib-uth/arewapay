#!/bin/sh
set -e
mkdir -p uploads/logos
alembic upgrade head
exec python -m app.serve
