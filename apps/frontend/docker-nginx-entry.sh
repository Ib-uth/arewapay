#!/bin/sh
set -e
UP="${API_UPSTREAM:-api:8000}"
# Fly: runtime DNS for .internal; Docker Compose: embedded DNS
if [ -n "${FLY_APP_NAME:-}" ]; then
  RESOLVER="[fdaa::3]:53 ipv6=on valid=10s"
else
  RESOLVER="127.0.0.11 valid=10s"
fi
sed -e "s|@@@API_UPSTREAM@@@|${UP}|g" -e "s|@@@NGINX_RESOLVER@@@|${RESOLVER}|g" \
  /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"
