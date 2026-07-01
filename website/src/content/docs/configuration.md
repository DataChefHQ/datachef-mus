---
title: Configuration
description: Full reference for MusProvider and FeedbackTarget configuration.
---

## MusProvider

Wrap your app (or any subtree) with `<MusProvider>`. All `FeedbackTarget` components inside it inherit the config.

```tsx
<MusProvider
  config={{
    // Required
    projectName: 'My App',
    slack: {
      proxyUrl: '/api/slack-proxy',
      supportTeamEmails: ['you@company.com'],
      feedbackChannelId: 'C0XXXXXXXXX',
    },

    // Optional user info — pre-fills forms
    user: {
      name: 'Jane Doe',
      email: 'jane@example.com',
    },

    // Optional behaviour
    hoverDelay: 500,               // ms before trigger appears (default: 500)
    triggerPosition: 'top-right',  // default: "top-right"
    theme: 'dark',                 // 'light' | 'dark' | 'auto'
    enabled: true,                 // set false to disable entirely
    showWelcomeDialog: true,       // show onboarding dialog on first visit (default: true)

    // Optional: override default actions (order determines toolbar order)
    actions: [
      { type: 'support' },
      { type: 'thumbs-down' },
      { type: 'thumbs-up' },
      { type: 'voice' },
    ],

    // Optional: lifecycle callbacks
    onThumbsUp: (sectionId, sectionName) => {},
    onThumbsDown: (sectionId, sectionName) => {},
    onFeedbackSubmitted: (type, sectionId, sectionName) => {},
  }}
>
  {children}
</MusProvider>
```

### SlackConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `proxyUrl` | `string` | Yes | URL your backend proxies to Slack (e.g. `/api/slack-proxy`) |
| `supportTeamEmails` | `string[]` | Yes | Emails invited to new support channels |
| `feedbackChannelId` | `string` | Yes | Slack channel ID for feedback messages |
| `channelNamePrefix` | `string` | No | Prefix for support channel names (default: `"support"`) |
| `voiceUploadUrl` | `string` | No | Override voice upload endpoint (default: `"/api/mus/voice-upload"`) |
| `supportChannelUrl` | `string` | No | Override support-channel endpoint URL (default: `"/api/mus/support-channel"`) |

### Actions

| `type` | Icon | Behaviour |
|--------|------|-----------|
| `support` | Headset | Opens dialog → creates a dedicated Slack channel |
| `voice` | Mic | Opens dialog → voice feedback form |
| `thumbs-up` | ThumbsUp | Fire-and-forget → posts to Slack |
| `thumbs-down` | ThumbsDown | Fire-and-forget → posts to Slack |
| `video` | Play | Opens dialog → shows a video (requires `videoUrl` on `FeedbackTarget`) |

Each action accepts an optional `enabled?: boolean` field. Set it to `false` to hide that action from the toolbar without removing it from the array:

```tsx
actions: [
  { type: 'support' },
  { type: 'voice', enabled: false }, // hidden
  { type: 'thumbs-up' },
  { type: 'thumbs-down' },
]
```

### Trigger positions

```tsx
triggerPosition: 'top-right'    // default
triggerPosition: 'top-left'
triggerPosition: 'bottom-right'
triggerPosition: 'bottom-left'
```

The lightbulb trigger straddles the edge of the section — half inside, half outside.

### `inset` prop

`FeedbackTarget` accepts an `inset` prop. When `true`, the trigger sits fully inside the corner of the section rather than straddling the edge:

```tsx
<FeedbackTarget sectionId="hero" sectionName="Hero" inset>
  <Hero />
</FeedbackTarget>
```

Default is `false` (straddles edge).

---

## FeedbackTarget

Wrap any element you want to make feedback-able:

```tsx
<FeedbackTarget
  sectionId="dashboard"        // Required: used in Slack messages and support channel names
  sectionName="Dashboard"      // Required: human-readable name shown in dialogs
  videoUrl="/videos/intro.mp4" // Optional: shown by the 'video' action
  className="custom-class"     // Optional: additional CSS classes
  actions={[                   // Optional: override default actions for this section only
    { type: 'thumbs-up' },
    { type: 'thumbs-down' },
  ]}
>
  <YourContent />
</FeedbackTarget>
```

### Per-section action override

`actions` on `FeedbackTarget` replaces the provider-level default for that section:

```tsx
<FeedbackTarget
  sectionId="hero"
  sectionName="Hero Banner"
  actions={[
    { type: 'thumbs-up', label: 'Love it' },
    { type: 'thumbs-down', label: 'Not my thing' },
  ]}
>
  <Hero />
</FeedbackTarget>
```

---

## Styling

Import the stylesheet once (typically in your root layout or entry file):

```tsx
import '@datachefhq/mus/styles.css'
```

The package uses CSS custom properties. Dark mode is enabled by adding `class="dark"` to `<html>` or any parent element.

### Theming

Override the accent colour with CSS variables:

```css
:root {
  --mus-accent: #2d6a4f;
}
```
