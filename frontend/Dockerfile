# syntax=docker/dockerfile:1.7
#
# Dawnlit storefront + admin SPA: Vite build → nginx (static files + same-origin proxy to the API).
#   docker build -t dawnlit-frontend --build-arg VITE_SITE_URL=https://www.example.in ./frontend
# VITE_* values are baked into the JS bundle at build time (they are public — never put secrets here).

# Base images are written out in FROM (not via ARG) so Dependabot can bump them.

# ---------------------------------------------------------------------------------------------
# Stage 1: build
# ---------------------------------------------------------------------------------------------
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

COPY . .

# MSW is only for local mock mode; production images talk to the real API.
ARG VITE_API_MOCK=false
ARG VITE_SITE_URL=http://localhost:8080
ARG VITE_ENABLE_3D=false
ARG VITE_GA_ID=
ARG VITE_META_PIXEL_ID=
ENV VITE_API_MOCK=${VITE_API_MOCK} \
    VITE_SITE_URL=${VITE_SITE_URL} \
    VITE_ENABLE_3D=${VITE_ENABLE_3D} \
    VITE_GA_ID=${VITE_GA_ID} \
    VITE_META_PIXEL_ID=${VITE_META_PIXEL_ID}

RUN npm run build \
 && if [ "${VITE_API_MOCK}" != "true" ]; then rm -f dist/mockServiceWorker.js; fi

# ---------------------------------------------------------------------------------------------
# Stage 2: serve
# ---------------------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="dawnlit-frontend" \
      org.opencontainers.image.description="Dawnlit SPA served by nginx with /api proxy" \
      org.opencontainers.image.source="https://github.com/OWNER/REPO"

# Replace the stock server block; the main nginx.conf (http{} + include conf.d/*.conf) is kept.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/dawnlit.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

# nginx:alpine already runs `nginx -g 'daemon off;'` via its own entrypoint (workers run as `nginx`).
