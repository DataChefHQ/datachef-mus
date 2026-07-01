#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { createInterface } from 'readline'
import { join } from 'path'

const cwd = process.cwd()
const args = process.argv.slice(2)

if (args[0] !== 'init') {
  console.log('Usage: npx @datachefhq/mus init')
  process.exit(0)
}

const rl = createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise((r) => rl.question(q, r))

function detectFramework() {
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    if (deps['next']) return 'next'
    if (deps['vite']) return 'vite'
    return 'other'
  } catch {
    return 'other'
  }
}

function detectPackageManager() {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn'
  return 'npm'
}

function detectTypeScript() {
  return existsSync(join(cwd, 'tsconfig.json'))
}

function detectNextRouter() {
  // App Router: has app/ directory with layout.tsx/jsx
  if (
    existsSync(join(cwd, 'app/layout.tsx')) ||
    existsSync(join(cwd, 'app/layout.jsx')) ||
    existsSync(join(cwd, 'src/app/layout.tsx')) ||
    existsSync(join(cwd, 'src/app/layout.jsx'))
  ) return 'app'
  return 'pages'
}

function findEntryPoint() {
  const candidates = [
    'src/main.tsx', 'src/main.jsx',
    'src/index.tsx', 'src/index.jsx',
    'app/layout.tsx', 'app/layout.jsx',
    'src/app/layout.tsx', 'src/app/layout.jsx',
    'pages/_app.tsx', 'pages/_app.jsx',
  ]
  return candidates.find((f) => existsSync(join(cwd, f))) ?? null
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

async function main() {
  console.log('\n🤩 MUS init\n')

  const framework = detectFramework()
  const pm = detectPackageManager()
  const isTs = detectTypeScript()
  const entry = findEntryPoint()
  const ext = isTs ? 'ts' : 'js'

  const frameworkLabel =
    framework === 'next' ? 'Next.js' : framework === 'vite' ? 'Vite' : 'React'
  console.log(`Detected: ${frameworkLabel} · ${pm} · ${isTs ? 'TypeScript' : 'JavaScript'}`)
  if (entry) console.log(`Entry point: ${entry}`)
  console.log('')

  const projectName = await ask('Project name (shown in Slack messages): ')
  const projectSlugInput = await ask('Project slug — short lowercase id (press Enter to skip): ')
  const email = await ask('Support team email: ')
  const channelId = await ask('Slack feedback channel ID (e.g. C0XXXXXXXXX): ')

  rl.close()

  const projectSlug = projectSlugInput.trim() || null

  // ── 1. Create src/lib/mus.config ─────────────────────────

  const configDir = join(cwd, 'src', 'lib')
  ensureDir(configDir)
  const configPath = join(configDir, `mus.config.${ext}`)

  const slugLine = projectSlug ? `\n  projectSlug: '${projectSlug}',` : ''

  const configContent = isTs
    ? `import type { MusConfig } from '@datachefhq/mus'

export const musConfig: MusConfig = {
  projectName: '${projectName}',${slugLine}

  slack: {
    proxyUrl: '/api/slack-proxy',
    supportTeamEmails: ['${email}'],
    feedbackChannelId: '${channelId}',
  },

  theme: 'dark',
  hoverDelay: 200,
  triggerPosition: 'top-right',

  actions: [
    { type: 'support' },
    { type: 'thumbs-down' },
    { type: 'thumbs-up' },
    { type: 'voice' },
  ],
}
`
    : `/** @type {import('@datachefhq/mus').MusConfig} */
export const musConfig = {
  projectName: '${projectName}',${slugLine}

  slack: {
    proxyUrl: '/api/slack-proxy',
    supportTeamEmails: ['${email}'],
    feedbackChannelId: '${channelId}',
  },

  theme: 'dark',
  hoverDelay: 200,
  triggerPosition: 'top-right',

  actions: [
    { type: 'support' },
    { type: 'thumbs-down' },
    { type: 'thumbs-up' },
    { type: 'voice' },
  ],
}
`

  writeFileSync(configPath, configContent)
  console.log(`\n✅ Created ${configPath.replace(cwd + '/', '')}`)

  // ── 2. Framework-specific setup ──────────────────────────

  if (framework === 'next') {
    const router = detectNextRouter()
    const appDir = router === 'app'
      ? (existsSync(join(cwd, 'src/app')) ? 'src/app' : 'app')
      : (existsSync(join(cwd, 'src/pages')) ? 'src/pages' : 'pages')

    if (router === 'app') {
      // App Router — generate route.ts files
      const routes = [
        {
          dir: join(cwd, appDir, 'api/mus/voice-upload'),
          file: `route.${ext}`,
          content: `export { POST } from '@datachefhq/mus/server'\n`,
        },
        {
          dir: join(cwd, appDir, 'api/mus/standalone-upload'),
          file: `route.${ext}`,
          content: `export { POSTStandalone as POST } from '@datachefhq/mus/server'\n`,
        },
        {
          dir: join(cwd, appDir, 'api/mus/support-channel'),
          file: `route.${ext}`,
          content: `export { POSTSupportChannel as POST } from '@datachefhq/mus/server'\n`,
        },
        {
          dir: join(cwd, appDir, 'api/slack-proxy'),
          file: `route.${ext}`,
          content: isTs
            ? `export async function POST(request: Request): Promise<Response> {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) return Response.json({ ok: false, error: 'Missing SLACK_BOT_TOKEN' }, { status: 500 })

  const { func, channel_id, message } = await request.json()
  if (func !== 'send_message') return Response.json({ ok: false, error: 'Unsupported func' }, { status: 400 })

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { Authorization: \`Bearer \${token}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: channel_id, text: message }),
  })
  return Response.json(await res.json())
}
`
            : `export async function POST(request) {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) return Response.json({ ok: false, error: 'Missing SLACK_BOT_TOKEN' }, { status: 500 })

  const { func, channel_id, message } = await request.json()
  if (func !== 'send_message') return Response.json({ ok: false, error: 'Unsupported func' }, { status: 400 })

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { Authorization: \`Bearer \${token}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: channel_id, text: message }),
  })
  return Response.json(await res.json())
}
`,
        },
      ]

      for (const route of routes) {
        ensureDir(route.dir)
        const filePath = join(route.dir, route.file)
        if (!existsSync(filePath)) {
          writeFileSync(filePath, route.content)
          console.log(`✅ Created ${filePath.replace(cwd + '/', '')}`)
        } else {
          console.log(`⚠️  Skipped (already exists): ${filePath.replace(cwd + '/', '')}`)
        }
      }
    } else {
      // Pages Router — show instructions
      console.log(`\n⚠️  Add these API routes to your ${appDir}/api/ directory:`)
      console.log(`
  // ${appDir}/api/mus/voice-upload.${ext}
  export { POST as default } from '@datachefhq/mus/server'

  // ${appDir}/api/mus/standalone-upload.${ext}
  export { POSTStandalone as default } from '@datachefhq/mus/server'

  // ${appDir}/api/mus/support-channel.${ext}
  export { POSTSupportChannel as default } from '@datachefhq/mus/server'`)
    }

    console.log(`\n⚠️  Add to your .env.local:
  SLACK_BOT_TOKEN=xoxb-your-token`)

  } else if (framework === 'vite') {
    // Vite — create Docker compose + show proxy config
    const musDir = join(cwd, 'mus')
    ensureDir(musDir)
    const composePath = join(musDir, 'docker-compose.yml')
    writeFileSync(composePath, `services:
  mus-server:
    image: ghcr.io/datachefhq/mus-server:latest
    ports:
      - "3001:3001"
    environment:
      - SLACK_BOT_TOKEN=\${SLACK_BOT_TOKEN}
`)
    console.log(`✅ Created mus/docker-compose.yml`)

    console.log(`\n⚠️  Add this server block to your vite.config.${ext}:
    server: {
      proxy: {
        '/api/mus/': { target: 'http://localhost:3001', changeOrigin: true },
        '/api/slack-proxy': { target: 'http://localhost:3001', changeOrigin: true },
      },
    },`)

    console.log(`\n⚠️  Add to your .env:
  SLACK_BOT_TOKEN=xoxb-your-token`)
  }

  // ── 3. MusProvider wrap instructions ─────────────────────

  console.log(`\n⚠️  Wrap your app in ${entry ?? 'your entry point'}:
    import { MusProvider } from '@datachefhq/mus'
    import { musConfig } from './lib/mus.config'
    import '@datachefhq/mus/styles.css'

    <MusProvider config={musConfig}>
      <App />
    </MusProvider>`)

  // ── 4. Next steps ─────────────────────────────────────────

  const nextSteps = framework === 'next'
    ? `1. Add SLACK_BOT_TOKEN to your .env.local
2. Wrap your app with <MusProvider> (see above)
3. Deploy — the API routes are ready`
    : framework === 'vite'
    ? `1. Add SLACK_BOT_TOKEN to your .env
2. Start mus-server:
   docker-compose -f mus/docker-compose.yml up -d
3. Apply the proxy config shown above
4. Wrap your app with <MusProvider> (see above)`
    : `1. Add SLACK_BOT_TOKEN to your server environment
2. Set up a /api/slack-proxy endpoint on your backend
3. Set up /api/mus/voice-upload and /api/mus/support-channel endpoints
4. Wrap your app with <MusProvider> (see above)`

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next steps:

${nextSteps}

Full guide: https://mus.datachef.co
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

main().catch((e) => { console.error(e); process.exit(1) })
