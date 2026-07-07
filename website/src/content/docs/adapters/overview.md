---
title: Adapters
description: Route MUS feedback to Slack, Discord, Teams, a webhook, or anywhere else.
---

MUS doesn't care where feedback goes. An adapter is the thing that decides. You configure it once — either as an env var for the Docker image, or as code in your own server — and every event flows through it automatically.

---

## Choosing an adapter

| Adapter | Env var (Docker) | Code import |
|---------|-----------------|-------------|
| [Slack](/adapters/slack) | `SLACK_BOT_TOKEN` | `slackAdapter` |
| [Discord](/adapters/discord) | `DISCORD_WEBHOOK_URL` | `discordAdapter` |
| [Microsoft Teams](/adapters/teams) | `TEAMS_WEBHOOK_URL` | `teamsAdapter` |
| [Webhook](/adapters/webhook) | `WEBHOOK_URL` | `webhookAdapter` |
| [Custom](/adapters/custom) | — | implement `MusAdapter` |

---

## Docker image

If you're using the `mus-server` Docker image, just set the env var. No code needed.

```bash
docker run -d -p 3001:3001 \
  -e SLACK_BOT_TOKEN=xoxb-your-token \
  ghcr.io/datachefhq/mus-server:latest
```

Set multiple env vars to fan out to several destinations at once:

```bash
docker run -d -p 3001:3001 \
  -e SLACK_BOT_TOKEN=xoxb-your-token \
  -e DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/... \
  ghcr.io/datachefhq/mus-server:latest
```

---

## Framework handlers (Next.js, Express, Fastify, Hono)

Import `createMusHandlers` and pass whichever adapters you want:

```ts
import { createMusHandlers } from '@datachef/mus/server'
import { slackAdapter } from '@datachef/mus/adapters/slack'

export const { POST, POSTStandalone, POSTSupportChannel } = createMusHandlers({
  adapter: slackAdapter({ token: process.env.SLACK_BOT_TOKEN! }),
})
```

Pass an array to run multiple adapters in parallel. A failure in one won't block the others:

```ts
import { slackAdapter } from '@datachef/mus/adapters/slack'
import { discordAdapter } from '@datachef/mus/adapters/discord'

createMusHandlers({
  adapter: [
    slackAdapter({ token: process.env.SLACK_BOT_TOKEN! }),
    discordAdapter({ webhookUrl: process.env.DISCORD_WEBHOOK_URL! }),
  ],
})
```

---

## The MusAdapter interface

Every adapter implements this interface. Only the methods you define are called — unimplemented ones are silently skipped.

```ts
interface MusAdapter {
  onVoiceUpload?(event: VoiceEvent): Promise<void>
  onSupportRequest?(event: SupportEvent): Promise<{ channelId?: string }>
  onStandaloneFeedback?(event: StandaloneEvent): Promise<void>
}
```

See [Event Types](/reference/events) for the full shape of each event.
