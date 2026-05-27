---
title: Adapters — Overview
description: Route MUS feedback to Slack, Discord, Teams, webhooks, or any custom destination.
---

MUS is notification-agnostic. An **adapter** tells MUS where to send feedback. You configure it once in `createMusHandlers` and every event — voice, thumbs, support requests, standalone — flows through it.

## Quick setup

```ts
import { createMusHandlers } from '@datachefhq/mus/server'
import { slackAdapter } from '@datachefhq/mus/adapters/slack'

export const { POST, POSTStandalone, POSTSupportChannel } = createMusHandlers({
  adapter: slackAdapter({ token: process.env.SLACK_BOT_TOKEN! }),
})
```

## Available adapters

| Adapter | Import | Use case |
|---------|--------|----------|
| [Slack](/adapters/slack) | `@datachefhq/mus/adapters/slack` | Full Slack integration — threads, channels, file uploads |
| [Discord](/adapters/discord) | `@datachefhq/mus/adapters/discord` | Discord channel via incoming webhook |
| [Microsoft Teams](/adapters/teams) | `@datachefhq/mus/adapters/teams` | Teams channel via incoming webhook |
| [Webhook](/adapters/webhook) | `@datachefhq/mus/adapters/webhook` | Any HTTP endpoint — Zapier, n8n, custom API |
| [Custom](/adapters/custom) | — | Implement `MusAdapter` for any destination |

## Multiple adapters

Pass an array to fan out to multiple destinations simultaneously. All adapters run in parallel — a failure in one doesn't block the others.

```ts
createMusHandlers({
  adapter: [
    slackAdapter({ token: process.env.SLACK_BOT_TOKEN! }),
    discordAdapter({ webhookUrl: process.env.DISCORD_WEBHOOK_URL! }),
  ],
})
```

Conditionally include adapters:

```ts
createMusHandlers({
  adapter: [
    slackAdapter({ token: process.env.SLACK_BOT_TOKEN! }),
    process.env.DISCORD_WEBHOOK_URL
      ? discordAdapter({ webhookUrl: process.env.DISCORD_WEBHOOK_URL })
      : null,
  ].filter(Boolean),
})
```

## The MusAdapter interface

Every adapter implements this interface. Only the methods you define are called — unimplemented methods are silently skipped.

```ts
interface MusAdapter {
  onFeedback?(event: ThumbsEvent | TextEvent): Promise<void>
  onVoiceUpload?(event: VoiceEvent): Promise<void>
  onSupportRequest?(event: SupportEvent): Promise<void>
  onStandaloneFeedback?(event: StandaloneEvent): Promise<void>
}
```

See [Event Types](/reference/events) for the full event shapes.
