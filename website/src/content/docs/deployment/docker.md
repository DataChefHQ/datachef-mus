---
title: Docker Compose
description: Run mus-server alongside your frontend with Docker Compose.
---

Add `mus-server` as a service in your `docker-compose.yml`. Your frontend's nginx reaches it by service name over Docker's internal network — no exposed port needed.

```yaml
services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - MUS_SERVER_ADDR=mus-server:3001
    depends_on:
      - mus-server

  mus-server:
    image: ghcr.io/datachefhq/mus-server:latest
    environment:
      - SLACK_BOT_TOKEN=${SLACK_BOT_TOKEN}
```

```bash
# .env
SLACK_BOT_TOKEN=xoxb-your-token
```

```bash
docker compose up -d
```

---

## Using a different adapter

The server picks up whichever env vars you set. Swap Slack for Discord, Teams, or a generic webhook — or run several at once:

```yaml
mus-server:
  image: ghcr.io/datachefhq/mus-server:latest
  environment:
    # Slack
    - SLACK_BOT_TOKEN=${SLACK_BOT_TOKEN}
    # Discord (optional — remove if not needed)
    - DISCORD_WEBHOOK_URL=${DISCORD_WEBHOOK_URL}
    # Teams (optional)
    - TEAMS_WEBHOOK_URL=${TEAMS_WEBHOOK_URL}
    # Generic webhook (optional)
    - WEBHOOK_URL=${WEBHOOK_URL}
```

Every adapter you configure runs in parallel. A voice note goes to Slack and Discord at the same time if both are set. The server logs which adapters it started with on boot.

---

## Local development override

Use `docker-compose.override.yml` to swap the frontend container for the Vite dev server during local development. The Vite proxy handles `/api/mus/` forwarding, so nginx is bypassed entirely.

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

With this override, `docker compose up` runs `vite dev` for the frontend and `mus-server` for the backend.

---

## Checking things are running

```bash
# Logs from mus-server (shows which adapters loaded)
docker compose logs mus-server

# Health check
curl http://localhost:3001/healthz
# → ok
```

If you see `No adapter configured` in the logs, at least one of `SLACK_BOT_TOKEN`, `DISCORD_WEBHOOK_URL`, `TEAMS_WEBHOOK_URL`, or `WEBHOOK_URL` needs to be set.

---

## Next step

See [nginx](/deployment/nginx) for proxying `/api/mus/` from your frontend container to `mus-server`.
