---
title: Message Formatting
description: Customise how MUS messages look in Slack, Discord, Teams, or any adapter.
---

Every built-in adapter has an opinionated default message format. Override it globally or per event type.

## Slack: per event type

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
            text: `*${event.user.name}* (${event.user.email})\n*Section:* ${event.section.name}\n*Note:* ${event.note ?? '—'}`,
          },
        },
      ],
    }),
    'thumbs-up': (event) => ({
      text: `👍 ${event.user.name} liked "${event.section.name}"`,
    }),
    'thumbs-down': (event) => ({
      text: `👎 ${event.user.name} flagged an issue with "${event.section.name}"`,
    }),
  },
})
```

## Slack: global override

A single function receives every event:

```ts
slackAdapter({
  token: process.env.SLACK_BOT_TOKEN!,
  format: (event) => ({
    text: `[${event.projectName}] ${event.type} from ${event.user.email} on "${event.section.name}"`,
  }),
})
```

## Discord embeds

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

## Webhook: custom payload shape

```ts
webhookAdapter({
  url: process.env.WEBHOOK_URL!,
  format: (event) => ({
    source: 'mus',
    eventType: event.type,
    from: event.user.email,
    page: event.section.name,
    message: event.note,
    ts: event.timestamp,
  }),
})
```

## Available fields

All format functions receive a `BaseEvent` (plus event-specific fields). The fields you can use:

| Field | Type | Description |
|-------|------|-------------|
| `event.type` | string | `voice`, `thumbs-up`, `thumbs-down`, `support`, `standalone` |
| `event.projectName` | string | From `MusConfig.projectName` |
| `event.projectSlug` | string | URL-safe project identifier |
| `event.user.name` | string | Resolved from user config or auth |
| `event.user.email` | string | Resolved from user config or auth |
| `event.section.id` | string | From `FeedbackTarget.sectionId` |
| `event.section.name` | string | From `FeedbackTarget.sectionName` |
| `event.timestamp` | string | ISO 8601 |
| `event.note` | string? | User's optional text note |
| `event.audioBuffer` | Buffer? | MP3 (voice events only) |
| `event.screenshotBuffer` | Buffer? | PNG (standalone events only) |
