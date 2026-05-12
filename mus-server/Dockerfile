# syntax=docker/dockerfile:1.7
# Build stage: compile the TypeScript package from source
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage: minimal image — only dist/ + system ffmpeg
FROM node:20-alpine AS runtime

# ffmpeg for WebM → MP3 conversion (voice upload)
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY mus-server/server.js ./server.js

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/healthz || exit 1

CMD ["node", "server.js"]
