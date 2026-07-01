---
title: Server Setup Overview
description: How the MUS server works and which setup path to follow for your stack.
---

## Why a server is needed

The browser can't call the Slack API directly because it would expose your bot token. MUS routes all Slack communication through a server-side handler that reads `SLACK_BOT_TOKEN` from the environment.

There are two ways to provide this handler:

| Path | Best for |
|------|----------|
| **`mus-server` Docker image** | Vite SPAs, any app without a backend |
| **`@datachef/mus/server` handlers** | Next.js, Express, Fastify, Hono, Remix |

---

## What the server handles

- **Voice upload:** receives WebM audio from the browser, converts to MP3 with ffmpeg, uploads to Slack
- **Standalone upload:** receives screenshot PNG + optional voice, posts both to Slack
- **Support channel:** creates (or finds existing) private Slack channel, invites user + support team

All three endpoints are under `/api/mus/`:

| Endpoint | Handler |
|----------|---------|
| `POST /api/mus/voice-upload` | `POST` |
| `POST /api/mus/standalone-upload` | `POSTStandalone` |
| `POST /api/mus/support-channel` | `POSTSupportChannel` |

---

## Pick your path

- **[Next.js App Router](/server/nextjs):** three route files, done
- **[Express / Fastify / Hono](/server/express):** wrap the handlers in your framework adapter
- **[Vite SPA + Docker](/server/vite):** run `mus-server` alongside your app, proxy `/api/mus/` in Vite config

---

## Environment variable

All paths require one environment variable:

```bash
SLACK_BOT_TOKEN=xoxb-your-token
```

The token needs these Slack bot scopes:
- `chat:write`: post messages
- `files:write`: upload voice recordings
- `channels:manage` or `groups:write`: create support channels
- `users:read.email`: look up users by email for channel invites
