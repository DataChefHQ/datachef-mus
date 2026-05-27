---
title: Webhook Adapter
description: Post MUS feedback as JSON to any HTTP endpoint.
---

The webhook adapter posts a JSON payload to any URL — useful for custom backends, Zapier, Make, n8n, or any service that accepts HTTP webhooks.

## Setup

```ts
import { createMusHandlers } from '@datachefhq/mus/server'
import { webhookAdapter } from '@datachefhq/mus/adapters/webhook'

export const { POST, POSTStandalone, POSTSupportChannel } = createMusHandlers({
  adapter: webhookAdapter({
    url: process.env.WEBHOOK_URL!,
  }),
})
```

```bash
WEBHOOK_URL=https://your-service.example.com/mus-events
```

## Options

```ts
webhookAdapter({
  url: process.env.WEBHOOK_URL!,

  // Optional: add custom headers (e.g. auth token)
  headers: {
    Authorization: `Bearer ${process.env.WEBHOOK_SECRET}`,
    'X-Source': 'mus',
  },

  // Optional: attach audio/screenshot blobs to the request as multipart/form-data
  includeFiles: true,
})
```

## Payload shape

By default, payloads are sent as `application/json`:

```json
{
  "type": "voice",
  "projectName": "My App",
  "projectSlug": "my-app",
  "user": { "name": "Jane Doe", "email": "jane@example.com" },
  "section": { "id": "dashboard", "name": "Dashboard" },
  "timestamp": "2026-05-21T10:00:00.000Z",
  "note": "The chart on this page is confusing"
}
```

With `includeFiles: true`, the request is `multipart/form-data` with `audio` and `screenshot` file fields.

## Custom format

Override the payload shape:

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

## Use cases

- **Zapier / Make** — trigger a Zap or scenario from any MUS event
- **n8n** — route feedback to any workflow
- **Linear / Jira** — create issues from support requests
- **Analytics** — log feedback events to your own data pipeline
- **Custom notification service** — fan out to multiple channels with your own logic
