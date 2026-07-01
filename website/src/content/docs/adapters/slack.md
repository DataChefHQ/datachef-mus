---
title: Slack Adapter
description: Send MUS feedback directly to Slack via bot token.
---

The Slack adapter posts feedback messages, uploads voice recordings, creates support channels, and invites users, all via the Slack API using a bot token.

## Setup

```ts
import { createMusHandlers } from '@datachef/mus/server'
import { slackAdapter } from '@datachef/mus/adapters/slack'

export const { POST, POSTStandalone, POSTSupportChannel } = createMusHandlers({
  adapter: slackAdapter({
    token: process.env.SLACK_BOT_TOKEN!,
  }),
})
```

```bash
SLACK_BOT_TOKEN=xoxb-your-token
```

## Required bot scopes

| Scope | Used for |
|-------|----------|
| `chat:write` | Post messages and threads |
| `files:write` | Upload voice recordings |
| `channels:manage` or `groups:write` | Create private support channels |
| `users:read.email` | Look up users by email for channel invites |

## Message formatting

Override the default message format per event type or globally:

### Per-event override

```ts
slackAdapter({
  token: process.env.SLACK_BOT_TOKEN!,
  format: {
    voice: (event) => ({
      text: `🎤 ${event.user.name} recorded feedback on "${event.section.name}"`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${event.user.name}* (${event.user.email}) left a voice note\n*Section:* ${event.section.name}\n*Note:* ${event.note ?? '—'}`,
          },
        },
      ],
    }),
    // all other event types use the default format
  },
})
```

### Global override

```ts
slackAdapter({
  token: process.env.SLACK_BOT_TOKEN!,
  format: (event) => ({
    text: `[${event.projectName}] ${event.type} from ${event.user.email} on "${event.section.name}"`,
  }),
})
```

## Getting your Slack bot token

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Under **OAuth & Permissions** → **Bot Token Scopes**, add the scopes listed above
3. Install the app to your workspace
4. Copy the **Bot User OAuth Token** (`xoxb-...`)
5. Invite the bot to your feedback channel: `/invite @your-bot-name`

## Getting the feedback channel ID

1. Open Slack → right-click the channel → **View channel details**
2. The channel ID is at the bottom (e.g. `C0XXXXXXXXX`)

Or from the channel URL: `https://app.slack.com/client/T.../C0XXXXXXXXX`. The channel ID is the `C0XXXXXXXXX` part.
