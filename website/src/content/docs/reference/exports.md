---
title: Package Exports
description: All exports from @datachefhq/mus and its sub-paths.
---

## Main package — `@datachefhq/mus`

```ts
// Components
import {
  MusProvider,
  FeedbackTarget,
  FeedbackToolbar,
  FeedbackTrigger,
  SupportDialog,
  FeedbackDialog,
  VideoDialog,
  DialogShell,
  WelcomeDialog,
  StandaloneWidget,
} from '@datachefhq/mus'

// Context & hooks
import {
  useMusConfig,
  useFeedbackActions,
  useMusUser,
  useThumbsStore,
} from '@datachefhq/mus'

// Types
import type {
  MusConfig,
  MusUser,
  MusIcons,
  SlackConfig,
  FeedbackAction,
  FeedbackActionType,
  StandaloneConfig,
  UserResolver,
  TriggerPosition,
} from '@datachefhq/mus'

// Styles
import '@datachefhq/mus/styles.css'
```

## Server — `@datachefhq/mus/server`

```ts
import {
  POST,               // POST /api/mus/voice-upload
  POSTStandalone,     // POST /api/mus/standalone-upload
  POSTSupportChannel, // POST /api/mus/support-channel
  createMusHandlers,  // Factory for adapter-based handlers
} from '@datachefhq/mus/server'

import type { MusAdapter } from '@datachefhq/mus/server'
```

## Adapters — `@datachefhq/mus/adapters/*`

Each adapter is a separate sub-path import:

```ts
import { slackAdapter }   from '@datachefhq/mus/adapters/slack'
import { discordAdapter } from '@datachefhq/mus/adapters/discord'
import { teamsAdapter }   from '@datachefhq/mus/adapters/teams'
import { webhookAdapter } from '@datachefhq/mus/adapters/webhook'
```

The `MusAdapter` interface (also re-exported from `@datachefhq/mus/server`):

```ts
import type { MusAdapter, VoiceEvent, SupportEvent, StandaloneEvent } from '@datachefhq/mus/server'
```

## User resolvers — `@datachefhq/mus/resolvers/*`

```ts
import { stytchResolver }   from '@datachefhq/mus/resolvers/stytch'
import { clerkResolver }    from '@datachefhq/mus/resolvers/clerk'
import { auth0Resolver }    from '@datachefhq/mus/resolvers/auth0'
import { nextAuthResolver } from '@datachefhq/mus/resolvers/next-auth'
```

## Vite plugin — `@datachefhq/mus/vite`

```ts
import { musVitePlugins } from '@datachefhq/mus/vite'
```

Used in `vite.config.ts` to start a local development server with `SLACK_BOT_TOKEN` from the environment.

## Chrome extension — `@datachefhq/mus/chrome`

```ts
import { ... } from '@datachefhq/mus/chrome'
```

Used internally for the browser extension build. Not intended for direct use in applications.
