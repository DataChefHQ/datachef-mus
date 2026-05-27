---
title: Microsoft Teams Adapter
description: Send MUS feedback to a Teams channel via incoming webhook.
---

The Teams adapter posts adaptive card messages to a Microsoft Teams channel using an incoming webhook.

## Setup

```ts
import { createMusHandlers } from '@datachefhq/mus/server'
import { teamsAdapter } from '@datachefhq/mus/adapters/teams'

export const { POST, POSTStandalone, POSTSupportChannel } = createMusHandlers({
  adapter: teamsAdapter({
    webhookUrl: process.env.TEAMS_WEBHOOK_URL!,
  }),
})
```

```bash
TEAMS_WEBHOOK_URL=https://your-org.webhook.office.com/...
```

## How to get a webhook URL

1. In Teams, open the target channel
2. Click **...** (More options) → **Connectors**
3. Find **Incoming Webhook** → **Configure**
4. Give it a name and click **Create**
5. Copy the webhook URL

## Message formatting

```ts
teamsAdapter({
  webhookUrl: process.env.TEAMS_WEBHOOK_URL!,
  format: (event) => ({
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    summary: `${event.type} from ${event.user.name}`,
    themeColor: event.type === 'thumbs-up' ? '41a148' : 'dc2626',
    sections: [{
      activityTitle: `**${event.user.name}** left ${event.type}`,
      activitySubtitle: event.section.name,
      facts: [
        { name: 'Email', value: event.user.email },
        { name: 'Section', value: event.section.name },
        { name: 'Project', value: event.projectName },
      ],
      text: event.note,
    }],
  }),
})
```
