---
title: Vite SPA + Docker
description: Run mus-server as a sidecar alongside a Vite React app — no backend required.
---

If your app is a pure Vite SPA with no backend, `mus-server` is the easiest path. Pull the Docker image, set your adapter env vars, and proxy `/api/mus/` to it. No Node.js server to write or maintain.

---

## Development

Add a Vite proxy so browser requests reach the local `mus-server`:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/mus/': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

Start `mus-server` locally with whichever adapter you're using:

```bash
# Slack
docker run -d -p 3001:3001 \
  -e SLACK_BOT_TOKEN=xoxb-your-token \
  ghcr.io/datachefhq/mus-server:latest

# Discord
docker run -d -p 3001:3001 \
  -e DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/... \
  ghcr.io/datachefhq/mus-server:latest

# Multiple at once
docker run -d -p 3001:3001 \
  -e SLACK_BOT_TOKEN=xoxb-your-token \
  -e DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/... \
  ghcr.io/datachefhq/mus-server:latest
```

The server logs which adapters it detected at startup, and exits immediately with a clear error if none are configured.

---

## Checking the health endpoint

```bash
curl http://localhost:3001/healthz
# → ok
```

---

## Production

See [Docker Compose](/deployment/docker) for running `mus-server` as a service alongside your app, and [nginx](/deployment/nginx) for proxying `/api/mus/` to it in production.
