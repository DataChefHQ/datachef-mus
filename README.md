# @datachefhq/mus

Feedback & support widget for DataChef internal applications. Wrap any section of your app with `<FeedbackTarget>` and users can hover to leave feedback, record voice messages, request support, or rate sections — all sent directly to Slack.

## Documentation

Full integration guide (install → Docker Compose → nginx → Kubernetes):
📖 [MUS Integration Guide](https://www.notion.so/datachef/MUS-Integration-3661627952688086b38fe2f316f880c6)

Want Claude to integrate MUS into your project automatically?
🤖 [Claude Prompt — Integrate MUS into My App](https://www.notion.so/datachef/36616279526880c6b389ecc0aef32a56)

## Installation

```bash
npm install @datachefhq/mus
```

## Quick Start

```tsx
import { MusProvider, FeedbackTarget } from '@datachefhq/mus'
import '@datachefhq/mus/styles.css'

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

## Server Setup

The package includes server-side handlers for voice upload, standalone feedback, and support channel creation. These handlers keep `SLACK_BOT_TOKEN` on the server — never in the browser.

Pick the path that matches your stack:

---

### Next.js (App Router)

Create three route files — that's the entire backend setup:

```ts
// app/api/mus/voice-upload/route.ts
export { POST } from '@datachefhq/mus/server'

// app/api/mus/standalone-upload/route.ts
export { POSTStandalone as POST } from '@datachefhq/mus/server'

// app/api/mus/support-channel/route.ts
export { POSTSupportChannel as POST } from '@datachefhq/mus/server'
```

```env
# .env.local
SLACK_BOT_TOKEN=xoxb-your-bot-token
```

---

### Express / Fastify / Hono

Wire the handlers into your existing server:

```ts
import express from 'express'
import { POST, POSTStandalone, POSTSupportChannel } from '@datachefhq/mus/server'

// helper — adapts express req/res to the Web Request/Response API
function handler(fn) {
  return async (req, res) => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const webReq = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: { 'content-type': req.headers['content-type'] ?? '' },
      ...(chunks.length ? { body: Buffer.concat(chunks), duplex: 'half' } : {}),
    })
    const webRes = await fn(webReq)
    res.status(webRes.status).json(await webRes.json())
  }
}

app.post('/api/mus/voice-upload',     handler(POST))
app.post('/api/mus/standalone-upload', handler(POSTStandalone))
app.post('/api/mus/support-channel',  handler(POSTSupportChannel))
```

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
```

---

### Vite SPA (React, no backend)

**Development** — add the Vite plugin and set the token in `.env`:

```ts
// vite.config.ts
import { musVitePlugins } from '@datachefhq/mus/vite'

export default defineConfig({
  plugins: [react(), ...musVitePlugins()],
})
```

```env
# .env
SLACK_BOT_TOKEN=xoxb-your-bot-token
```

**Production** — add the pre-built `mus-server` image alongside your app. No build step, no auth token needed:

```yaml
# docker-compose.yml
services:
  mus-server:
    image: ghcr.io/datachefhq/mus-server:latest
    environment:
      - SLACK_BOT_TOKEN=${SLACK_BOT_TOKEN}
```

Then proxy `/api/mus/` to `mus-server:3001` in nginx:

```nginx
location /api/mus/ {
    set $mus http://mus-server:3001;
    proxy_pass $mus;
    client_max_body_size 15m;
}
```

For Kubernetes, `mus-server` runs as a sidecar in the same pod — nginx reaches it at `127.0.0.1:3001`.

---

### Available server exports

```ts
import {
  POST,               // voice upload → Slack
  POSTStandalone,     // screenshot + voice → Slack
  POSTSupportChannel, // create/find private support channel
} from '@datachefhq/mus/server'
```

All handlers read `SLACK_BOT_TOKEN` from `process.env`. The voice handlers convert WebM to MP3 using system `ffmpeg` (or `ffmpeg-static` if installed).

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
import '@datachefhq/mus/styles.css'
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
} from '@datachefhq/mus'

// Context
import { MusProvider, useMusConfig } from '@datachefhq/mus'

// Hooks
import { useFeedbackActions } from '@datachefhq/mus'

// Types
import type {
  MusConfig,
  MusUser,
  SlackConfig,
  FeedbackAction,
  FeedbackActionType,
} from '@datachefhq/mus'

// Styles
import '@datachefhq/mus/styles.css'
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
@datachefhq/mus
├── MusProvider          — Config context (Slack, user, actions)
├── FeedbackTarget       — Wraps a section, manages hover/trigger/toolbar
│   ├── FeedbackTrigger  — Lightbulb icon (appears on hover)
│   ├── FeedbackToolbar  — Row of action icons (expands on click)
│   └── Dialogs          — Support, Feedback, Video (opened by actions)
├── server/              — Voice upload handler (exported as @datachefhq/mus/server)
└── slack-client         — Calls Chefbot proxy directly from browser
```

Text feedback, thumbs, and support channels work client-side through the Chefbot proxy. Voice upload requires the server handler (`@datachefhq/mus/server`) for converting WebM to MP3 and uploading to Slack.

## Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/AlirezaEbrahimkhani">
        <img src="https://github.com/AlirezaEbrahimkhani.png" width="80px" style="border-radius:50%" alt="Alireza Ebrahimkhani"/><br/>
        <sub><b>Alireza Ebrahimkhani</b></sub>
      </a><br/>
      <sub>Creator & maintainer</sub>
    </td>
  </tr>
</table>

Want to contribute? Read [CONTRIBUTING.md](./CONTRIBUTING.md) and open a PR.

## License

MIT © [DataChef HQ](https://github.com/DataChefHQ)
