---
title: Event Types
description: TypeScript interfaces for all MUS adapter events.
---

These are the event objects passed to adapter methods. All types are importable from `@datachef/mus/server`.

```ts
import type { VoiceEvent, SupportEvent, StandaloneEvent } from '@datachef/mus/server'
```

## VoiceEvent

Passed to `onVoiceUpload` when a user submits a voice recording.

```ts
interface VoiceEvent {
  mp3Buffer: Buffer       // Converted MP3 ready to upload
  filename: string        // e.g. "voice-feedback-hero-1234567890.mp3"
  channelId: string       // Slack channel ID from config
  sectionName: string     // Human-readable section label
  sectionId: string       // Machine-readable section identifier
  name: string            // User display name (defaults to "Anonymous")
  email: string           // User email (empty string if unauthenticated)
  projectName: string
  note: string            // Optional note submitted with the recording
  comment: string         // Pre-formatted message string for display
}
```

## SupportEvent

Passed to `onSupportRequest` when a user submits the support dialog.

```ts
interface SupportEvent {
  name: string
  email: string
  projectName: string
  projectSlug: string
  topic: string                 // User's message / explanation
  sectionId: string
  sectionName: string
  supportTeamEmails: string[]   // From SlackConfig — team members to invite
  feedbackChannelId?: string    // Fallback channel for anonymous requests
  channelNamePrefix: string     // Default: "support"
  isAuthenticated: boolean      // true if email is non-empty
}
```

`onSupportRequest` should return `{ channelId?: string }` — the channel ID is sent back to the client to open the support link.

## StandaloneEvent

Passed to `onStandaloneFeedback` in standalone mode (screenshot + optional voice).

```ts
interface StandaloneEvent {
  screenshotBuffer?: Buffer   // PNG/JPEG screenshot, if captured
  screenshotFilename?: string
  mp3Buffer?: Buffer          // Converted MP3, if voice was recorded
  audioFilename?: string
  channelId: string
  name: string
  email: string
  projectName: string
  note: string
  sectionId: string
  sectionName: string
  metaComment: string         // Pre-formatted meta string for display
}
```

## Mapping events to adapter methods

| Event | Adapter method |
|-------|----------------|
| `VoiceEvent` | `onVoiceUpload` |
| `SupportEvent` | `onSupportRequest` |
| `StandaloneEvent` | `onStandaloneFeedback` |

Thumbs up/down feedback is sent directly to your Slack proxy URL — it does not go through the adapter system.
