# @datachef/mus

Feedback & support widget for DataChef internal applications. Wrap any section of your app with `<FeedbackTarget>` and users can hover to leave feedback, record voice messages, request support, or rate sections — all sent directly to Slack.

## Installation

```bash
npm install @datachef/mus
```

## Quick Start

```tsx
import { MusProvider, FeedbackTarget } from '@datachef/mus'
import '@datachef/mus/styles.css'

function App() {
  return (
    <MusProvider
      config={{
        projectName: 'My App',
        slack: {
          proxyUrl: '/api/slack-proxy',
          supportTeamEmails: ['alireza.e@datachef.co'],
          feedbackChannelId: 'C0AFBB4HL7K',
        },
        user: {
          name: 'Jane Doe',
          email: 'jane@datachef.co',
        },
      }}
    >
      <FeedbackTarget sectionId="dashboard" sectionName="Dashboard">
        <DashboardContent />
      </FeedbackTarget>
    </MusProvider>
  )
}
```

## How It Works

1. User **hovers** over a `<FeedbackTarget>` section for 500ms
2. A **lightbulb icon** appears at the top-right corner of the section
3. Clicking the lightbulb **expands a toolbar** with action icons
4. Clicking an action opens the corresponding **dialog** or fires a quick action

### Actions

| Action | Icon | Behavior |
|--------|------|----------|
| `support` | Headset | Opens dialog → creates a dedicated Slack channel |
| `video` | Youtube | Opens dialog → shows an overview video |
| `voice` | Mic | Opens dialog → voice feedback form |
| `thumbs-down` | ThumbsDown | Fire-and-forget → posts to Slack |
| `thumbs-up` | ThumbsUp | Fire-and-forget → posts to Slack |

## Configuration

### MusProvider

Wrap your app (or a subtree) with `<MusProvider>`:

```tsx
<MusProvider
  config={{
    // Required: project name (shown in Slack messages)
    projectName: 'My App',

    // Required: Slack integration
    slack: {
      proxyUrl: '/api/slack-proxy',
      supportTeamEmails: ['alireza.e@datachef.co'],
      feedbackChannelId: 'C0AFBB4HL7K',
      channelNamePrefix: 'support', // optional, default: "support"
    },

    // Optional: pre-fill user info in forms
    user: {
      name: 'Jane Doe',
      email: 'jane@datachef.co',
    },

    // Optional: customize behavior
    hoverDelay: 500,            // ms before trigger appears (default: 500)
    triggerPosition: 'top-right', // where the lightbulb appears (default: "top-right")

    // Optional: customize which actions appear (order matters)
    actions: [
      { type: 'support' },
      { type: 'video' },
      { type: 'voice' },
      { type: 'thumbs-down' },
      { type: 'thumbs-up' },
    ],

    // Optional: callbacks
    onThumbsUp: (sectionId, sectionName) => {},
    onThumbsDown: (sectionId, sectionName) => {},
    onFeedbackSubmitted: (type, sectionId, sectionName) => {},
  }}
>
  {children}
</MusProvider>
```

### FeedbackTarget

Wrap any section you want to make feedback-able:

```tsx
<FeedbackTarget
  sectionId="unique-id"       // Used in Slack messages
  sectionName="Dashboard"     // Human-readable name shown in dialogs
  videoUrl="/videos/intro.mp4" // Optional: video for the overview dialog
  className="custom-class"    // Optional: additional CSS classes
  actions={[                  // Optional: override actions for this section
    { type: 'thumbs-up' },
    { type: 'thumbs-down' },
  ]}
>
  <YourContent />
</FeedbackTarget>
```

### SlackConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `proxyUrl` | `string` | Yes | Chefbot proxy URL |
| `supportTeamEmails` | `string[]` | Yes | Emails to invite to support channels |
| `feedbackChannelId` | `string` | Yes | Slack channel for feedback messages |
| `channelNamePrefix` | `string` | No | Prefix for support channels (default: `"support"`) |
| `voiceUploadUrl` | `string` | No | Voice upload endpoint (default: `"/api/mus/voice-upload"`). Override if your app uses a different path. |

## Voice Upload (Server)

Voice recordings are uploaded to Slack as playable audio files. The package includes a ready-made server handler — just re-export it:

```ts
// app/api/mus/voice-upload/route.ts (Next.js App Router)
export { POST } from '@datachef/mus/server'
```

Set the `SLACK_BOT_TOKEN` environment variable:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
```

The handler converts WebM to MP3 (via `ffmpeg-static`) and uploads it to Slack as a playable audio file.

Requires `ffmpeg-static` in your project:

```bash
npm install ffmpeg-static
```

## Dialogs

### Feedback Dialog (voice)

Opened by the `voice` action. Includes:
- Full Name and Email inputs (pre-filled from `user` config)
- Message textarea
- Microphone selector and voice recorder (max 60 seconds)
- Submit sends voice feedback to Slack

### Support Dialog

Opened by the `support` action. Includes:
- Full Name and Email inputs
- Explanation textarea
- Creates a dedicated Slack channel and invites the user + support team
- Idempotent: same email reuses the existing channel

### Video Dialog

Opened by the `video` action. Shows a video player with:
- Play/pause, volume, fullscreen controls
- Seekable progress bar
- Requires `videoUrl` prop on `<FeedbackTarget>`

## Customizing Actions

Disable or reorder actions:

```tsx
<MusProvider
  config={{
    projectName: 'My App',
    slack: { ... },
    actions: [
      { type: 'voice' },
      { type: 'thumbs-up' },
      { type: 'thumbs-down' },
      // support and video omitted — won't appear
    ],
  }}
>
```

Override labels:

```tsx
actions: [
  { type: 'voice', label: 'Record feedback' },
  { type: 'support', label: 'Contact us' },
]
```

## Trigger Position

The lightbulb trigger straddles the edge of the section (half inside, half outside). Available positions:

```tsx
triggerPosition: 'top-right'    // default
triggerPosition: 'top-left'
triggerPosition: 'bottom-right'
triggerPosition: 'bottom-left'
```

## Styling

The package uses DataChef's design system with CSS custom properties. Import the styles:

```tsx
import '@datachef/mus/styles.css'
```

The styles include light and dark mode support. Add `class="dark"` to your `<html>` or a parent element to enable dark mode.

## Exports

```tsx
// Components
import {
  FeedbackTarget,
  FeedbackToolbar,
  FeedbackTrigger,
  SupportDialog,
  FeedbackDialog,
  VideoDialog,
  DialogShell,
} from '@datachef/mus'

// Context
import { MusProvider, useMusConfig } from '@datachef/mus'

// Hooks
import { useFeedbackActions } from '@datachef/mus'

// Types
import type {
  MusConfig,
  MusUser,
  SlackConfig,
  FeedbackAction,
  FeedbackActionType,
} from '@datachef/mus'

// Styles
import '@datachef/mus/styles.css'
```

## Development

```bash
# Install dependencies
npm install

# Run playground
npm run dev

# Build library
npm run build

# Type check
npx tsc --noEmit
```

## Architecture

```
@datachef/mus
├── MusProvider          — Config context (Slack, user, actions)
├── FeedbackTarget       — Wraps a section, manages hover/trigger/toolbar
│   ├── FeedbackTrigger  — Lightbulb icon (appears on hover)
│   ├── FeedbackToolbar  — Row of action icons (expands on click)
│   └── Dialogs          — Support, Feedback, Video (opened by actions)
├── server/              — Voice upload handler (exported as @datachef/mus/server)
└── slack-client         — Calls Chefbot proxy directly from browser
```

Text feedback, thumbs, and support channels work client-side through the Chefbot proxy. Voice upload requires the server handler (`@datachef/mus/server`) for converting WebM to MP3 and uploading to Slack.
