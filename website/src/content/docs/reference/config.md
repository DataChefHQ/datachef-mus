---
title: MusConfig Reference
description: Complete reference for all MusProvider configuration options.
---

```ts
interface MusConfig {
  // Required
  projectName: string          // Shown in Slack messages and support channel names
  projectSlug?: string         // URL-safe identifier (auto-derived from projectName if omitted)

  // Required: notification destination
  slack: SlackConfig

  // Optional: user identity
  user?: {
    name?: string
    email?: string
  }
  // A React hook returning { name, email }. Use built-in resolver factories from
  // @datachefhq/mus/resolvers/* or write your own. See User Resolvers.
  userResolver?: UserResolver

  // Optional: action bar
  actions?: FeedbackAction[]   // Default: [support, thumbs-down, thumbs-up, voice]

  // Optional: behaviour
  hoverDelay?: number          // ms before trigger appears (default: 500)
  triggerPosition?: TriggerPosition  // default: "top-right"
  theme?: 'light' | 'dark' | 'auto'
  enabled?: boolean            // set false to disable (default: true)
  showWelcomeDialog?: boolean  // show onboarding dialog on first visit (default: true)

  // Optional: mode
  mode?: 'default' | 'standalone'
  standalone?: StandaloneConfig

  // Optional: callbacks
  onThumbsUp?: (sectionId: string, sectionName: string) => void
  onThumbsDown?: (sectionId: string, sectionName: string) => void
  onFeedbackSubmitted?: (type: FeedbackActionType, sectionId: string, sectionName: string) => void
}
```

## SlackConfig

```ts
interface SlackConfig {
  proxyUrl: string               // Required: e.g. "/api/slack-proxy"
  supportTeamEmails: string[]    // Required: invited to support channels
  feedbackChannelId: string      // Required: Slack channel for feedback

  channelNamePrefix?: string     // Prefix for support channels (default: "support")
  voiceUploadUrl?: string        // Override voice endpoint (default: "/api/mus/voice-upload")
  supportChannelUrl?: string     // Override support-channel endpoint (default: "/api/mus/support-channel")
}
```

## FeedbackAction

```ts
interface FeedbackAction {
  type: FeedbackActionType   // 'support' | 'voice' | 'thumbs-up' | 'thumbs-down' | 'video'
  label?: string             // Override the tooltip label
  enabled?: boolean          // Set false to hide the action from the toolbar (default: true)
}
```

## TriggerPosition

```ts
type TriggerPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
```

## Default actions

When `actions` is omitted, MUS uses:

```ts
[
  { type: 'support' },
  { type: 'thumbs-down' },
  { type: 'thumbs-up' },
  { type: 'voice' },
]
```

Actions render left-to-right in the toolbar. The rightmost action is closest to the trigger button.

## FeedbackTarget props

```ts
interface FeedbackTargetProps {
  sectionId: string          // Required: identifier used in Slack messages
  sectionName: string        // Required: human-readable name shown in dialogs
  videoUrl?: string          // Required for 'video' action
  className?: string         // Additional CSS class names
  actions?: FeedbackAction[] // Override provider-level actions for this section
  inset?: boolean            // When true, trigger sits fully inside the corner (default: false, straddles edge)
  children: React.ReactNode
}
```
