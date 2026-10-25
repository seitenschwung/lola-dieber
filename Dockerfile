# Statische Seite auf unprivilegiertem nginx. Vertrag laut CLAUDE.md: Port 8080, GET /healthz,
# GET /version.txt (= APP_VERSION), nicht-root USER.

# Beiträge aus inhalte/beitraege/*.md zu HTML bauen
FROM node:22-alpine AS build
WORKDIR /app
COPY scripts/ scripts/
COPY inhalte/ inhalte/
COPY public/ public/
RUN node scripts/beitraege.mjs

# Die CI baut diese Stufe zuerst: prüft, dass alle Beiträge gültig sind
FROM build AS test
RUN node scripts/beitraege.mjs --pruefen

FROM nginxinc/nginx-unprivileged:1.29-alpine
ARG APP_VERSION=dev
USER root
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/public/ /usr/share/nginx/html/
RUN printf '%s' "$APP_VERSION" > /usr/share/nginx/html/version.txt
USER 101
