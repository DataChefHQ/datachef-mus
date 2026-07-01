---
title: Express / Fastify / Hono
description: Wire MUS server handlers into an Express, Fastify, or Hono app.
---

The MUS handlers use the Web Request/Response API (same as `fetch`). Use a small adapter function to translate from your framework's native request/response types.

## Express

```ts
import express from 'express'
import { POST, POSTStandalone, POSTSupportChannel } from '@datachef/mus/server'

function toWebHandler(fn: (req: Request) => Promise<Response>) {
  return async (req: express.Request, res: express.Response) => {
    const chunks: Buffer[] = []
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

const app = express()
app.post('/api/mus/voice-upload',      toWebHandler(POST))
app.post('/api/mus/standalone-upload', toWebHandler(POSTStandalone))
app.post('/api/mus/support-channel',   toWebHandler(POSTSupportChannel))
```

```bash
SLACK_BOT_TOKEN=xoxb-your-bot-token
```

---

## Fastify

```ts
import Fastify from 'fastify'
import { POST, POSTSupportChannel } from '@datachef/mus/server'

const app = Fastify()

app.post('/api/mus/voice-upload', async (request, reply) => {
  const webReq = new Request('http://localhost/api/mus/voice-upload', {
    method: 'POST',
    headers: { 'content-type': request.headers['content-type'] ?? '' },
    body: request.rawBody as Buffer,
    // @ts-expect-error duplex needed for streaming body
    duplex: 'half',
  })
  const webRes = await POST(webReq)
  return reply.status(webRes.status).send(await webRes.json())
})
```

:::note
Fastify requires `addContentTypeParser` or `rawBody` plugin to get the raw buffer. Configure `fastify-raw-body` or `content-type-parser` accordingly.
:::

---

## Hono

```ts
import { Hono } from 'hono'
import { POST, POSTSupportChannel } from '@datachef/mus/server'

const app = new Hono()

app.post('/api/mus/voice-upload', async (c) => {
  const webRes = await POST(c.req.raw)
  return webRes
})

app.post('/api/mus/support-channel', async (c) => {
  const webRes = await POSTSupportChannel(c.req.raw)
  return webRes
})
```

Hono's `c.req.raw` is already a Web `Request`, so no adapter is needed.

---

## With a custom adapter

```ts
import { createMusHandlers } from '@datachef/mus/server'
import { discordAdapter } from '@datachef/mus/adapters/discord'

const { POST, POSTSupportChannel } = createMusHandlers({
  adapter: discordAdapter({ webhookUrl: process.env.DISCORD_WEBHOOK_URL! }),
})
```

See [Adapters](/adapters/overview) for all options.
