import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { POST, POSTStandalone, POSTSupportChannel } from './server/index'

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const buf = Buffer.concat(chunks)
  const headers = new Headers({
    'content-type': req.headers['content-type'] ?? 'application/octet-stream',
  })
  return new Request(`http://localhost${req.url ?? '/'}`, {
    method: req.method,
    headers,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(buf.length > 0 ? { body: buf, duplex: 'half' } : {}),
  } as RequestInit)
}

function makeHandler(
  getToken: () => string,
  handler: (req: Request) => Promise<Response>
) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const reply = (status: number, body: unknown) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(body))
    }

    if (req.method !== 'POST') return reply(405, { success: false, error: 'Method not allowed' })

    const token = getToken()
    if (!token) return reply(500, { success: false, error: 'SLACK_BOT_TOKEN not configured' })

    try {
      process.env.SLACK_BOT_TOKEN = token
      const webReq = await toWebRequest(req)
      const response = await handler(webReq)
      res.statusCode = response.status
      res.setHeader('Content-Type', 'application/json')
      res.end(await response.text())
    } catch (err) {
      console.error('[mus]', err)
      reply(500, { success: false, error: String((err as Error)?.message ?? err) })
    }
  }
}

/**
 * Vite dev-server plugin that wires up the mus server handlers:
 *   POST /api/mus/voice-upload
 *   POST /api/mus/standalone-upload
 *   POST /api/mus/support-channel
 *
 * Usage in vite.config.ts / vite.config.js:
 *   import { musVitePlugins } from '@datachef/mus/vite'
 *   export default defineConfig({ plugins: [react(), ...musVitePlugins()] })
 *
 * Requires SLACK_BOT_TOKEN in your .env / .env.local file.
 */
export function musVitePlugins(): Plugin[] {
  let token = ''

  return [
    {
      name: 'mus-server-handlers',
      configResolved({ mode, root }) {
        const env = loadEnv(mode, root, '')
        token = env.SLACK_BOT_TOKEN ?? ''
      },
      configureServer(server) {
        const get = () => token
        server.middlewares.use('/api/mus/voice-upload', makeHandler(get, POST))
        server.middlewares.use('/api/mus/standalone-upload', makeHandler(get, POSTStandalone))
        server.middlewares.use('/api/mus/support-channel', makeHandler(get, POSTSupportChannel))
      },
    },
  ]
}
