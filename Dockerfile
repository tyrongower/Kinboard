FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-build
WORKDIR /src
COPY backend/Kinboard.Api/*.csproj ./
RUN dotnet restore
COPY backend/Kinboard.Api/. ./
RUN dotnet publish -c Release -o /app/backend

FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/. ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache dotnet9-runtime aspnetcore9-runtime

COPY --from=backend-build /app/backend /app/backend
# Content root is /app, so static files are served from /app/wwwroot - not the
# published copy at /app/backend/wwwroot. Seeds the kinboard-media volume.
COPY --from=backend-build /app/backend/wwwroot /app/wwwroot
COPY backend/Kinboard.Api/appsettings.json /app/appsettings.json
COPY --from=frontend-build /app/.next /app/.next
COPY --from=frontend-build /app/public /app/public
COPY --from=frontend-build /app/package*.json /app/
COPY --from=frontend-build /app/next.config.ts /app/

RUN npm ci --omit=dev

EXPOSE 6565

ENV NODE_ENV=production
ENV BACKEND_PORT=5000
ENV Cors__AllowedOrigins__0=http://localhost:6565

ARG VERSION=dev
ARG REVISION=unknown
ARG CREATED=unknown

LABEL org.opencontainers.image.title="Kinboard" \
      org.opencontainers.image.description="Family household dashboard with chores, calendar, shopping lists, and kiosk display" \
      org.opencontainers.image.source="https://github.com/tyrongower/Kinboard" \
      org.opencontainers.image.licenses="GPL-3.0-or-later" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${REVISION}" \
      org.opencontainers.image.created="${CREATED}"

CMD ["sh", "-c", "export ASPNETCORE_URLS=http://+:${BACKEND_PORT} && dotnet /app/backend/Kinboard.Api.dll & npm start -- -p 6565"]
