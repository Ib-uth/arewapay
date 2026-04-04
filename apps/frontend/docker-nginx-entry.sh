#!/bin/sh
set -e
UP="${API_UPSTREAM:-api:8000}"
sed "s|@@@API_UPSTREAM@@@|${UP}|g" /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"
