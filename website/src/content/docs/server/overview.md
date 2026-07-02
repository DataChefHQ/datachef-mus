---
title: Server Setup
description: Why MUS needs a server, what it does, and which setup path fits your stack.
---

The browser can't talk to Slack, Discord, or Teams directly — it would expose your credentials. MUS routes those calls through a server-side handler that keeps your tokens safe.

There are two ways to provide that handler:

| Path | Best for |
|------|----------|
| **`mus-server` Docker image** | Vite SPAs and any app without a backend |
| **`@datachefhq/mus/server` handlers** | Next.js, Express, Fastify, Hono — wire into your existing server |

Both paths support every adapter: Slack, Discord, Teams, and generic webhooks.

---

## What the server handles

- **Voice upload** — receives a WebM recording from the browser, converts it to MP3 using ffmpeg, and forwards it to your configured adapter
- **Support channel** — creates (or finds) a per-user support channel and notifies your team
- **Standalone feedback** — receives a screenshot and optional voice note together

All three are mounted under `/api/mus/`:

| Endpoint | Handler |
|----------|---------|
| `POST /api/mus/voice-upload` | `POST` |
| `POST /api/mus/standalone-upload` | `POSTStandalone` |
| `POST /api/mus/support-channel` | `POSTSupportChannel` |

---

## Pick your path

- **[Next.js App Router](/server/nextjs)** — three route files, done in five minutes
- **[Express / Fastify / Hono](/server/express)** — wrap the handlers in your framework adapter
- **[Vite SPA + Docker](/server/vite)** — run `mus-server` alongside your app, proxy `/api/mus/` in Vite config

---

## Environment variables

Configure adapters by setting the env vars for whichever destinations you want. You can mix and match — all configured adapters run in parallel.

| Adapter | Env var |
|---------|---------|
| Slack | `SLACK_BOT_TOKEN` |
| Discord | `DISCORD_WEBHOOK_URL` |
| Microsoft Teams | `TEAMS_WEBHOOK_URL` |
| Generic webhook | `WEBHOOK_URL` |

The Slack bot token needs these scopes: `chat:write`, `files:write`, `channels:manage` or `groups:write`, `users:read.email`.
