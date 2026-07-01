---
title: Discord Adapter
description: Send MUS feedback to a Discord channel via incoming webhook.
---

The Discord adapter posts feedback to a Discord channel using an incoming webhook. Voice files are uploaded as attachments.

## Setup

```ts
import { createMusHandlers } from '@datachef/mus/server'
import { discordAdapter } from '@datachef/mus/adapters/discord'

export const { POST, POSTStandalone, POSTSupportChannel } = createMusHandlers({
  adapter: discordAdapter({
    webhookUrl: process.env.DISCORD_WEBHOOK_URL!,
  }),
})
```

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

## How to get a webhook URL

1. Open Discord → Server Settings → Integrations → Webhooks
2. Click **New Webhook**
3. Choose the channel and give it a name
4. Copy the webhook URL

## Message formatting

```ts
discordAdapter({
  webhookUrl: process.env.DISCORD_WEBHOOK_URL!,
  format: (event) => ({
    embeds: [{
      title: `${event.type} — ${event.section.name}`,
      description: event.note,
      color: event.type === 'thumbs-up' ? 0x41a148 : 0xdc2626,
      fields: [
        { name: 'User', value: event.user.name, inline: true },
        { name: 'Email', value: event.user.email, inline: true },
      ],
      timestamp: event.timestamp,
    }],
  }),
})
```

## Limitations

:::note
Discord webhooks don't support creating channels or threads. The `support` action posts to the same channel as other feedback. If you need dedicated support threads per user, use the [Slack adapter](/adapters/slack) or a [custom adapter](/adapters/custom).
:::
