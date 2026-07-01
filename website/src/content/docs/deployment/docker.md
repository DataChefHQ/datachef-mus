---
title: Docker Compose
description: Run mus-server alongside your frontend with Docker Compose.
---

Add `mus-server` as a service in `docker-compose.yml`. Your frontend's nginx reaches it by service name over the internal Docker network with no exposed port needed.

```yaml
services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - MUS_SERVER_ADDR=mus-server:3001   # nginx reads this to proxy /api/mus/
    depends_on:
      - mus-server

  mus-server:
    image: ghcr.io/datachefhq/mus-server:latest
    environment:
      - SLACK_BOT_TOKEN=${SLACK_BOT_TOKEN}
    # No ports needed — only the frontend nginx reaches it internally
```

```bash
# .env
SLACK_BOT_TOKEN=xoxb-your-token
```

Start both services:

```bash
docker compose up -d
```

## Local override

Use `docker-compose.override.yml` to swap the frontend container for the Vite dev server during local development. The Vite proxy config handles `/api/mus/` forwarding, so nginx is bypassed entirely.

```yaml
# docker-compose.override.yml
services:
  frontend:
    build: null
    image: node:20-alpine
    command: npm run dev
    volumes:
      - .:/app
    working_dir: /app
    ports:
      - "5173:5173"
    environment: {}
```

With this override, `docker compose up` runs `vite dev` for the frontend and `mus-server` for the backend. Voice, thumbs, and support all work via the Vite proxy.

## Verifying mus-server

```bash
# Check logs
docker compose logs mus-server

# Health check
curl http://localhost:3001/healthz
# → ok
```

## Next step

Once your app is containerised, see [nginx](/deployment/nginx) for proxying `/api/mus/` to `mus-server`.
