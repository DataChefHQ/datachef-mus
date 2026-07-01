---
title: Vite SPA + Docker
description: Run mus-server as a Docker container alongside a Vite React app.
---

If your app has no backend (pure Vite SPA), run `mus-server` as a pre-built Docker container. The image handles everything with no Node.js server to write.

## Development

Add a Vite proxy so browser requests reach the local `mus-server`:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { musVitePlugins } from '@datachef/mus/vite'

export default defineConfig({
  plugins: [react(), ...musVitePlugins()],
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

```bash
# .env
SLACK_BOT_TOKEN=xoxb-your-bot-token
```

The `musVitePlugins()` helper starts a local development server that reads `SLACK_BOT_TOKEN` from the environment. You can also skip the plugin and just run `mus-server` manually with Docker.

Run `mus-server` locally:

```bash
docker run -d \
  -p 3001:3001 \
  -e SLACK_BOT_TOKEN=xoxb-your-token \
  ghcr.io/datachefhq/mus-server:latest
```

## Production

See [Docker Compose](/deployment/docker) for adding `mus-server` as a service, and [nginx](/deployment/nginx) for proxying `/api/mus/` to it.

## Checking the health endpoint

```bash
curl http://localhost:3001/healthz
# → ok
```
