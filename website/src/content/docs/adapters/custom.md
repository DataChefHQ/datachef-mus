---
title: Custom Adapters
description: Implement the MusAdapter interface to send feedback anywhere.
---

If none of the built-in adapters fit your stack, implement `MusAdapter` directly. You only handle the event types you care about — unimplemented methods are silently skipped.

## Minimal example

```ts
import type { MusAdapter } from '@datachef/mus/adapters'

const myAdapter: MusAdapter = {
  async onFeedback(event) {
    await fetch('https://my-api.example.com/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: event.user.email,
        section: event.section.name,
        type: event.type,
        note: event.note,
      }),
    })
  },

  async onVoiceUpload(event) {
    // event.audioBuffer is a Node.js Buffer containing the MP3
    await myStorage.upload(`voice/${Date.now()}.mp3`, event.audioBuffer)
    await myNotifier.send(`${event.user.name} left a voice note on "${event.section.name}"`)
  },

  async onSupportRequest(event) {
    await myTicketSystem.createTicket({
      title: `Support: ${event.user.name} — ${event.section.name}`,
      description: event.topic,
      requester: event.user.email,
    })
  },

  async onStandaloneFeedback(event) {
    if (event.screenshotBuffer) {
      await myStorage.upload(`screenshots/${Date.now()}.png`, event.screenshotBuffer)
    }
  },
}

export const { POST, POSTStandalone, POSTSupportChannel } = createMusHandlers({
  adapter: myAdapter,
})
```

## Adapter factory pattern

When your adapter needs configuration, export a factory function — the same pattern as the built-in adapters:

```ts
import type { MusAdapter } from '@datachef/mus/adapters'
import { createMusHandlers } from '@datachef/mus/server'

interface LinearAdapterOptions {
  apiKey: string
  teamId: string
}

function linearAdapter(options: LinearAdapterOptions): MusAdapter {
  return {
    async onSupportRequest(event) {
      await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          Authorization: options.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation {
              issueCreate(input: {
                title: "Support: ${event.user.name} — ${event.section.name}",
                description: "${event.topic}",
                teamId: "${options.teamId}"
              }) { issue { id } }
            }
          `,
        }),
      })
    },
  }
}

// Usage
export const { POST, POSTSupportChannel } = createMusHandlers({
  adapter: linearAdapter({
    apiKey: process.env.LINEAR_API_KEY!,
    teamId: process.env.LINEAR_TEAM_ID!,
  }),
})
```

## Combining with built-in adapters

Custom adapters can run alongside built-in ones:

```ts
createMusHandlers({
  adapter: [
    slackAdapter({ token: process.env.SLACK_BOT_TOKEN! }),
    linearAdapter({ apiKey: process.env.LINEAR_API_KEY!, teamId: 'TEAM' }),
  ],
})
```

## TypeScript reference

```ts
interface MusAdapter {
  // thumbs-up, thumbs-down, text feedback
  onFeedback?(event: ThumbsEvent | TextEvent): Promise<void>

  // voice recording submitted
  onVoiceUpload?(event: VoiceEvent): Promise<void>

  // support button clicked
  onSupportRequest?(event: SupportEvent): Promise<void>

  // standalone mode: screenshot + optional voice
  onStandaloneFeedback?(event: StandaloneEvent): Promise<void>
}
```

See [Event Types](/reference/events) for the full event shapes.
