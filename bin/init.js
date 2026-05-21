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

function findEntryPoint() {
  const candidates = [
    'src/main.tsx', 'src/main.jsx',
    'src/index.tsx', 'src/index.jsx',
    'app/layout.tsx', 'app/layout.jsx',
    'pages/_app.tsx', 'pages/_app.jsx',
  ]
  return candidates.find((f) => existsSync(join(cwd, f))) ?? null
}

async function main() {
  console.log('\n🤩 MUS init\n')

  const framework = detectFramework()
  const pm = detectPackageManager()
  const isTs = detectTypeScript()
  const entry = findEntryPoint()
  const ext = isTs ? 'ts' : 'js'

  console.log(`Detected: ${framework === 'next' ? 'Next.js' : framework === 'vite' ? 'Vite' : 'React'} · ${pm} · ${isTs ? 'TypeScript' : 'JavaScript'}`)
  if (entry) console.log(`Entry point: ${entry}`)
  console.log('')

  const projectName = await ask('Project name (shown in Slack messages): ')
  const projectSlug = await ask('Project slug (short lowercase id): ')
  const email = await ask('Support team email: ')
  const channelId = await ask('Slack feedback channel ID (e.g. C0XXXXXXXXX): ')
  const proxyUrl = await ask('Slack proxy URL (e.g. https://your-proxy.example.com, or leave blank): ')

  rl.close()

  // 1. Create mus.config file
  const configDir = join(cwd, 'src', 'lib')
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true })
  const configPath = join(configDir, `mus.config.${ext}`)

  const configContent = isTs
    ? `import type { MusConfig } from '@datachefhq/mus'

export const musConfig: MusConfig = {
  projectName: '${projectName}',
  projectSlug: '${projectSlug}',
  enabled: true,

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
  projectName: '${projectName}',
  projectSlug: '${projectSlug}',
  enabled: true,

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

  // 2. Create mus/docker-compose.yml
  const musDir = join(cwd, 'mus')
  if (!existsSync(musDir)) mkdirSync(musDir, { recursive: true })
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

  // 3. Patch vite.config / next.config
  const slackTarget = proxyUrl || 'https://your-slack-proxy.example.com'

  const viteConfig = join(cwd, 'vite.config.ts') || join(cwd, 'vite.config.js')
  const hasViteConfig = existsSync(join(cwd, 'vite.config.ts')) || existsSync(join(cwd, 'vite.config.js'))

  if (framework === 'vite' && hasViteConfig) {
    console.log(`\n⚠️  Add this proxy config to your vite.config.${isTs ? 'ts' : 'js'}:`)
    console.log(`
    server: {
      proxy: {
        '/api/mus/': { target: 'http://localhost:3001', changeOrigin: true },
        '/api/slack-proxy': {
          target: '${slackTarget}',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\\/api\\/slack-proxy/, ''),
        },
      },
    },`)
  }

  if (framework === 'next') {
    console.log(`\n⚠️  Add this to next.config.${isTs ? 'ts' : 'js'}:`)
    console.log(`
    async rewrites() {
      return [
        { source: '/api/mus/:path*', destination: 'http://localhost:3001/api/mus/:path*' },
        { source: '/api/slack-proxy', destination: '${slackTarget}' },
      ]
    },`)
  }

  // 4. Print MusProvider instructions
  const configImportPath = `./lib/mus.config`
  console.log(`\n⚠️  Wrap your app in ${entry ?? 'your entry point'}:`)
  console.log(`
    import { MusProvider } from '@datachefhq/mus'
    import { musConfig } from '${configImportPath}'
    import '@datachefhq/mus/styles.css'

    // Wrap your root component:
    <MusProvider config={musConfig}>
      <App />
    </MusProvider>`)

  // 5. Print next steps
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next steps:

1. Add SLACK_BOT_TOKEN to your .env:
   SLACK_BOT_TOKEN=xoxb-your-token

2. Start mus-server:
   docker-compose -f mus/docker-compose.yml up -d

3. Apply the proxy config shown above

4. Wrap your app with <MusProvider>

Full guide: https://www.notion.so/datachef/MUS-Integration-3661627952688086b38fe2f316f880c6
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

main().catch((e) => { console.error(e); process.exit(1) })
