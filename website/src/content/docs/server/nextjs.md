---
title: Next.js App Router
description: Set up MUS server handlers in a Next.js App Router project.
---

Create three route files. That's the entire backend setup.

```ts
// app/api/mus/voice-upload/route.ts
export { POST } from '@datachef/mus/server'

// app/api/mus/standalone-upload/route.ts
export { POSTStandalone as POST } from '@datachef/mus/server'

// app/api/mus/support-channel/route.ts
export { POSTSupportChannel as POST } from '@datachef/mus/server'
```

```bash
# .env.local
SLACK_BOT_TOKEN=xoxb-your-bot-token
```

That's it. The handlers read `SLACK_BOT_TOKEN` from `process.env` and handle multipart uploads, ffmpeg conversion, and Slack delivery.

---

## With a custom adapter

If you want to route feedback to Discord, Teams, or a custom destination, use `createMusHandlers`:

```ts
// app/api/mus/voice-upload/route.ts
import { createMusHandlers } from '@datachef/mus/server'
import { slackAdapter } from '@datachef/mus/adapters/slack'

const { POST } = createMusHandlers({
  adapter: slackAdapter({ token: process.env.SLACK_BOT_TOKEN! }),
})

export { POST }
```

See [Adapters](/adapters/overview) for all built-in and custom adapter options.

---

## Pages Router

For the Pages Router (`pages/api/`), wrap the handlers manually since they use the Web Request/Response API:

```ts
// pages/api/mus/voice-upload.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { POST } from '@datachef/mus/server'

export const config = { api: { bodyParser: false } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk)

  const webReq = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: { 'content-type': req.headers['content-type'] ?? '' },
    ...(chunks.length ? { body: Buffer.concat(chunks), duplex: 'half' } : {}),
  })

  const webRes = await POST(webReq)
  const data = await webRes.json()
  res.status(webRes.status).json(data)
}
```

Repeat for `standalone-upload` and `support-channel`.
