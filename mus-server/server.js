import { createServer } from 'node:http'
import { POST, POSTStandalone, POSTSupportChannel } from './dist/server.js'

const ROUTES = {
  '/api/mus/voice-upload': POST,
  '/api/mus/standalone-upload': POSTStandalone,
  '/api/mus/support-channel': POSTSupportChannel,
}

async function toWebRequest(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = Buffer.concat(chunks)
  const headers = new Headers({
    'content-type': req.headers['content-type'] ?? 'application/octet-stream',
  })
  return new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers,
    ...(body.length > 0 ? { body, duplex: 'half' } : {}),
  })
}

const server = createServer(async (req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('ok')
    return
  }

  const handler = ROUTES[req.url]
  if (!handler || req.method !== 'POST') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: false, error: 'Not found' }))
    return
  }

  try {
    const webReq = await toWebRequest(req)
    const webRes = await handler(webReq)
    res.writeHead(webRes.status, { 'Content-Type': 'application/json' })
    res.end(await webRes.text())
  } catch (err) {
    console.error('[mus-server]', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: false, error: err?.message ?? String(err) }))
  }
})

server.listen(3001, () => console.log('[mus-server] listening on :3001'))
