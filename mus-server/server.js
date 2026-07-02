import { createServer } from 'node:http'
import { createMusHandlers } from './dist/server.js'
import { slackAdapter } from './dist/adapters/slack.js'
import { discordAdapter } from './dist/adapters/discord.js'
import { teamsAdapter } from './dist/adapters/teams.js'
import { webhookAdapter } from './dist/adapters/webhook.js'

// Build the adapter list from whatever env vars are present.
// Every configured adapter runs in parallel on each incoming event.
const adapters = [
  process.env.SLACK_BOT_TOKEN     && slackAdapter({ token: process.env.SLACK_BOT_TOKEN }),
  process.env.DISCORD_WEBHOOK_URL && discordAdapter({ webhookUrl: process.env.DISCORD_WEBHOOK_URL }),
  process.env.TEAMS_WEBHOOK_URL   && teamsAdapter({ webhookUrl: process.env.TEAMS_WEBHOOK_URL }),
  process.env.WEBHOOK_URL         && webhookAdapter({ url: process.env.WEBHOOK_URL }),
].filter(Boolean)

if (adapters.length === 0) {
  console.error(
    '[mus-server] No adapter configured.\n' +
    'Set at least one of: SLACK_BOT_TOKEN, DISCORD_WEBHOOK_URL, TEAMS_WEBHOOK_URL, WEBHOOK_URL'
  )
  process.exit(1)
}

console.log(`[mus-server] Starting with ${adapters.length} adapter(s)`)

const { POST, POSTStandalone, POSTSupportChannel } = createMusHandlers({ adapter: adapters })

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
