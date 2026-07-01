---
title: Package Exports
description: All exports from @datachef/mus and its sub-paths.
---

## Main package: `@datachef/mus`

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
} from '@datachef/mus'

// Context & hooks
import {
  useMusConfig,
  useFeedbackActions,
  useMusUser,
  useThumbsStore,
} from '@datachef/mus'

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
} from '@datachef/mus'

// Styles
import '@datachef/mus/styles.css'
```

## Server: `@datachef/mus/server`

```ts
import {
  POST,               // POST /api/mus/voice-upload
  POSTStandalone,     // POST /api/mus/standalone-upload
  POSTSupportChannel, // POST /api/mus/support-channel
  createMusHandlers,  // Factory for adapter-based handlers
} from '@datachef/mus/server'

import type { MusAdapter } from '@datachef/mus/server'
```

## Adapters: `@datachef/mus/adapters/*`

Each adapter is a separate sub-path import:

```ts
import { slackAdapter }   from '@datachef/mus/adapters/slack'
import { discordAdapter } from '@datachef/mus/adapters/discord'
import { teamsAdapter }   from '@datachef/mus/adapters/teams'
import { webhookAdapter } from '@datachef/mus/adapters/webhook'
```

The `MusAdapter` interface (also re-exported from `@datachef/mus/server`):

```ts
import type { MusAdapter, VoiceEvent, SupportEvent, StandaloneEvent } from '@datachef/mus/server'
```

## User resolvers: `@datachef/mus/resolvers/*`

```ts
import { stytchResolver }   from '@datachef/mus/resolvers/stytch'
import { clerkResolver }    from '@datachef/mus/resolvers/clerk'
import { auth0Resolver }    from '@datachef/mus/resolvers/auth0'
import { nextAuthResolver } from '@datachef/mus/resolvers/next-auth'
```

## Vite plugin: `@datachef/mus/vite`

```ts
import { musVitePlugins } from '@datachef/mus/vite'
```

Used in `vite.config.ts` to start a local development server with `SLACK_BOT_TOKEN` from the environment.

## Chrome extension: `@datachef/mus/chrome`

```ts
import { ... } from '@datachef/mus/chrome'
```

Used internally for the browser extension build. Not intended for direct use in applications.
