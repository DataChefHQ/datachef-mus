---
title: Migration (v0.x → v1.0)
description: What changed in v1.0 and how to update your integration.
---

v1.0 introduces the adapter pattern, user resolvers, and unifies all Slack communication through a single server. The old API still works — backward compatibility is maintained.

## What changed

| Area | v0.x | v1.0 |
|------|------|------|
| Slack token | Stored in external proxy (Chefbot) | Stored in your own server via `SLACK_BOT_TOKEN` |
| Text / thumbs | Went through `proxyUrl` → external proxy | Goes through `mus-server` via `/api/mus/message` |
| Voice / support | Went through `/api/mus/*` → `mus-server` | Same, no change |
| Notification target | Slack only, hardcoded | Any via adapter: Slack, Discord, Teams, Webhook, custom |
| User identity | Hardcoded Stytch import | Pluggable via `userResolver` |

## Backward compatibility

The old exports still work. No changes required:

```ts
// still works in v1.0
export { POST, POSTStandalone, POSTSupportChannel } from '@datachefhq/mus/server'
```

The `proxyUrl` field is deprecated but still accepted. It logs a warning in development.

## Recommended upgrade

### Server handlers

**Before (v0.x):**

```ts
export { POST } from '@datachefhq/mus/server'
export { POSTStandalone as POST } from '@datachefhq/mus/server'
export { POSTSupportChannel as POST } from '@datachefhq/mus/server'
```

**After (v1.0):**

```ts
import { createMusHandlers } from '@datachefhq/mus/server'
import { slackAdapter } from '@datachefhq/mus/adapters/slack'

export const { POST, POSTStandalone, POSTSupportChannel } = createMusHandlers({
  adapter: slackAdapter({ token: process.env.SLACK_BOT_TOKEN! }),
})
```

### MusProvider config

**Before (v0.x):**

```tsx
<MusProvider config={{
  slack: {
    proxyUrl: '/api/slack-proxy',   // pointed to external proxy
    supportTeamEmails: [...],
    feedbackChannelId: 'C0XXXXXX',
  },
}}>
```

**After (v1.0):**

```tsx
<MusProvider config={{
  slack: {
    // proxyUrl no longer needed — mus-server handles everything
    supportTeamEmails: [...],
    feedbackChannelId: 'C0XXXXXX',
  },
}}>
```

### User resolver (if using Stytch)

**Before (v0.x):** Stytch was always imported internally.

**After (v1.0):** Import the resolver explicitly:

```ts
import { stytchResolver } from '@datachefhq/mus/resolvers/stytch'

<MusProvider config={{
  ...
  userResolver: stytchResolver(),
}}>
```

`@stytch/react` is now an optional peer dependency — install it only if you use Stytch.

## Environment variable

All server-side communication now uses `SLACK_BOT_TOKEN` directly in your environment:

```bash
SLACK_BOT_TOKEN=xoxb-your-bot-token
```

Remove any dependency on an external Slack proxy service for new integrations.
