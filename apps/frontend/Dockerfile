# Build from monorepo root so `npm ci` can use the root package-lock.json (npm workspaces).
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN npm ci
COPY apps/frontend ./apps/frontend
COPY packages/shared-types ./packages/shared-types
WORKDIR /repo/apps/frontend
# Baked into the static bundle at build time (pass from docker-compose `build.args` or `docker build --build-arg`).
ARG VITE_REVENUECAT_API_KEY=
ENV VITE_REVENUECAT_API_KEY=$VITE_REVENUECAT_API_KEY
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /repo/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
