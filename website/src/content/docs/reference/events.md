---
title: Event Types
description: TypeScript interfaces for all MUS adapter events.
---

All events extend `BaseEvent`:

```ts
interface BaseEvent {
  type: 'voice' | 'thumbs-up' | 'thumbs-down' | 'support' | 'standalone'
  projectName: string
  projectSlug: string
  user: {
    name: string
    email: string
  }
  section: {
    id: string
    name: string
  }
  timestamp: string   // ISO 8601, e.g. "2026-05-21T10:00:00.000Z"
  note?: string       // Optional message from the user
}
```

## VoiceEvent

Fired when a user submits a voice recording.

```ts
interface VoiceEvent extends BaseEvent {
  type: 'voice'
  audioBuffer: Buffer   // MP3 — converted from WebM by ffmpeg
}
```

## ThumbsEvent

Fired when a user clicks thumbs up or thumbs down.

```ts
interface ThumbsEvent extends BaseEvent {
  type: 'thumbs-up' | 'thumbs-down'
}
```

## SupportEvent

Fired when a user submits the support dialog.

```ts
interface SupportEvent extends BaseEvent {
  type: 'support'
  topic: string                // User's explanation text
  supportTeamEmails: string[]  // From SlackConfig
  feedbackChannelId: string    // From SlackConfig
  channelNamePrefix?: string   // From SlackConfig
}
```

## StandaloneEvent

Fired in standalone mode — screenshot with optional voice.

```ts
interface StandaloneEvent extends BaseEvent {
  type: 'standalone'
  audioBuffer?: Buffer       // MP3, if voice was recorded
  screenshotBuffer?: Buffer  // PNG, if screenshot was captured
}
```

## Mapping events to adapter methods

| Event | Adapter method |
|-------|----------------|
| `ThumbsEvent` | `onFeedback` |
| `VoiceEvent` | `onVoiceUpload` |
| `SupportEvent` | `onSupportRequest` |
| `StandaloneEvent` | `onStandaloneFeedback` |
