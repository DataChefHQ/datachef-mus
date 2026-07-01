---
title: Upgrade Guide
description: How to adopt new MUS features while keeping existing integrations working.
---

All existing `POST`, `POSTStandalone`, and `POSTSupportChannel` exports continue to work unchanged. Nothing is removed or deprecated — you can adopt new features incrementally.

## Server handlers

### Old way (still fully supported)

Export the handlers directly. They read `SLACK_BOT_TOKEN` from `process.env` and call Slack directly:

```ts
// app/api/mus/voice-upload/route.ts
export { POST } from '@datachefhq/mus/server'

// app/api/mus/standalone-upload/route.ts
export { POSTStandalone as POST } from '@datachefhq/mus/server'

// app/api/mus/support-channel/route.ts
export { POSTSupportChannel as POST } from '@datachefhq/mus/server'
```

### New way: adapter pattern

Use `createMusHandlers` when you want to route feedback to a non-Slack destination, fan out to multiple destinations, or inject custom logic:

```ts
// app/api/mus/[...mus]/route.ts  (or individual route files)
import { createMusHandlers } from '@datachefhq/mus/server'
import { slackAdapter } from '@datachefhq/mus/adapters/slack'

export const { POST, POSTStandalone, POSTSupportChannel } = createMusHandlers({
  adapter: slackAdapter({ token: process.env.SLACK_BOT_TOKEN! }),
})
```

Multiple adapters run in parallel:

```ts
import { createMusHandlers } from '@datachefhq/mus/server'
import { slackAdapter } from '@datachefhq/mus/adapters/slack'
import { discordAdapter } from '@datachefhq/mus/adapters/discord'

export const { POST, POSTStandalone, POSTSupportChannel } = createMusHandlers({
  adapter: [
    slackAdapter({ token: process.env.SLACK_BOT_TOKEN! }),
    discordAdapter({ webhookUrl: process.env.DISCORD_WEBHOOK_URL! }),
  ],
})
```

See [Adapters](/adapters/overview) for all built-in adapters and how to write a custom one.

---

## Upgrading to v0.4.0

### Stytch auto-detection removed — action required for Stytch users

Prior to v0.4.0, MUS automatically detected a Stytch session if `@stytch/react` was installed. This has been removed. If your app uses Stytch, add `userResolver` explicitly:

```tsx
import { stytchResolver } from '@datachefhq/mus/resolvers/stytch'

<MusProvider config={{
  projectName: 'My App',
  slack: { ... },
  userResolver: stytchResolver(), // add this
}}>
```

If you were relying on auto-detection and don't add this, users will appear as "Anonymous". Nothing else breaks.

### `ffmpeg-static` is now optional

v0.4.0 moves `ffmpeg-static` to `optionalDependencies`. If voice upload stops working, install it manually:

```bash
npm install ffmpeg-static
```

---

## User resolvers

### Explicit resolver

Import the resolver for your auth system and pass it to `MusProvider`. This works for Stytch, Clerk, Auth0, NextAuth, or any custom source:

```tsx
import { stytchResolver } from '@datachefhq/mus/resolvers/stytch'

<MusProvider config={{
  projectName: 'My App',
  slack: { ... },
  userResolver: stytchResolver(),
}}>
```

Available built-in resolvers:

```ts
import { stytchResolver }   from '@datachefhq/mus/resolvers/stytch'
import { clerkResolver }    from '@datachefhq/mus/resolvers/clerk'
import { auth0Resolver }    from '@datachefhq/mus/resolvers/auth0'
import { nextAuthResolver } from '@datachefhq/mus/resolvers/next-auth'
```

You can also write your own — see [Custom Resolvers](/resolvers/custom).

---

## Environment variable

All server handlers (both old and new) use `SLACK_BOT_TOKEN` from your environment:

```bash
# .env.local
SLACK_BOT_TOKEN=xoxb-your-bot-token
```
