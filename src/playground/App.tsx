import { useState } from 'react'
import { toPng } from 'html-to-image'
import { MusProvider } from '@/context/MusContext'
import { FeedbackTarget } from '@/components/FeedbackTarget'
import {
  BarChart3,
  Shield,
  Zap,
  Settings,
  Users,
  Globe,
  Camera,
  Layers,
} from 'lucide-react'
import type { MusConfig, FeedbackAction } from '@/types'
import { version } from '../../package.json'
import logo from './logo.png'

/* ── Playground screenshot ────────────────────────────────── */
// Uses html-to-image: no permission prompt, no sharing bar, best-effort render.
// In a Chrome extension, pass chrome.tabs.captureVisibleTab as onCaptureScreenshot —
// it's silent, pixel-perfect, and captures any content-script overlays on the page.

// Prefetch Google Fonts as base64 so html-to-image can embed them (CORS blocks direct fetch).
const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto+Mono&display=swap'

let _fontEmbedCSS: Promise<string> | null = null

function prefetchFonts(): Promise<string> {
  if (_fontEmbedCSS) return _fontEmbedCSS
  _fontEmbedCSS = (async () => {
    try {
      const cssRes = await fetch(GOOGLE_FONTS_URL)
      let css = await cssRes.text()
      const urls = [...css.matchAll(/url\((https?[^)]+)\)/g)].map((m) => m[1])
      await Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch(url)
            const buf = await res.arrayBuffer()
            let bin = ''
            const bytes = new Uint8Array(buf)
            for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
            const b64 = btoa(bin)
            const mime = url.includes('.woff2') ? 'font/woff2' : 'font/woff'
            css = css.replace(url, `data:${mime};base64,${b64}`)
          } catch { /* skip */ }
        })
      )
      return css
    } catch {
      return ''
    }
  })()
  return _fontEmbedCSS
}

// Kick off font prefetch immediately so it's ready by the time user clicks
prefetchFonts()

async function capturePageScreenshot(): Promise<string> {
  const dpr = window.devicePixelRatio || 1
  const scrollX = window.scrollX
  const scrollY = window.scrollY
  const vw = window.innerWidth
  const vh = window.innerHeight

  const fontEmbedCSS = await prefetchFonts()

  // Capture full document then crop to the visible viewport
  const fullDataUrl = await toPng(document.documentElement, {
    pixelRatio: dpr,
    cacheBust: true,
    ...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }),
  })

  const img = new Image()
  img.src = fullDataUrl
  await new Promise<void>((r) => { img.onload = () => r() })

  const canvas = document.createElement('canvas')
  canvas.width = vw * dpr
  canvas.height = vh * dpr
  canvas.getContext('2d')!.drawImage(img, scrollX * dpr, scrollY * dpr, vw * dpr, vh * dpr, 0, 0, vw * dpr, vh * dpr)
  return canvas.toDataURL('image/png')
}

/* ── Shared config base ───────────────────────────────────── */
const BASE_SLACK = {
  proxyUrl: '/api/slack-proxy',
  supportTeamEmails: ['your-email@example.com'],
  feedbackChannelId: 'YOUR_CHANNEL_ID',
}

const defaultConfig: Omit<MusConfig, 'actions'> = {
  projectName: 'Mus Playground',
  slack: BASE_SLACK,
  hoverDelay: 500,
  triggerPosition: 'top-right',
  onThumbsUp: (id) => console.log('👍', id),
  onThumbsDown: (id) => console.log('👎', id),
  onFeedbackSubmitted: (type, id) => console.log('Feedback:', type, id),
}

const standaloneConfig: MusConfig = {
  mode: 'standalone',
  projectName: 'Mus Playground',
  slack: BASE_SLACK,
  actions: [],
  user: { name: 'Playground User', email: 'playground@example.com' },
  standalone: {
    position: 'bottom-right',
    uploadUrl: '/api/mus/standalone-upload',
    onCaptureScreenshot: capturePageScreenshot,
  },
}

/* ── Section cards ────────────────────────────────────────── */
const SECTIONS: {
  id: string
  name: string
  icon: typeof BarChart3
  description: string
  actions?: FeedbackAction[]
}[] = [
  {
    id: 'dashboard-overview',
    name: 'Dashboard Overview',
    icon: BarChart3,
    description:
      'Real-time analytics and KPIs at a glance. Track system health, user activity, and performance metrics.',
  },
  {
    id: 'security-settings',
    name: 'Security Settings',
    icon: Shield,
    description:
      'Manage access controls, API keys, and audit logs. Configure SSO and role-based permissions.',
    actions: [{ type: 'support' }, { type: 'thumbs-up' }, { type: 'thumbs-down' }],
  },
  {
    id: 'performance-monitor',
    name: 'Performance Monitor',
    icon: Zap,
    description:
      'Monitor response times, throughput, and error rates across all services and endpoints.',
    actions: [{ type: 'thumbs-up' }, { type: 'thumbs-down' }],
  },
  {
    id: 'system-config',
    name: 'System Configuration',
    icon: Settings,
    description:
      'Global settings for integrations, notifications, and environment variables.',
  },
  {
    id: 'team-management',
    name: 'Team Management',
    icon: Users,
    description:
      'Invite team members, assign roles, and manage workspace access across projects.',
    actions: [{ type: 'voice' }, { type: 'support' }],
  },
  {
    id: 'deployment-status',
    name: 'Deployment Status',
    icon: Globe,
    description:
      'View active deployments, rollback history, and environment health across regions.',
  },
]

/* ── App ──────────────────────────────────────────────────── */
type PlaygroundMode = 'default' | 'standalone'

export function App() {
  const [playgroundMode, setPlaygroundMode] = useState<PlaygroundMode>('default')

  return (
    <div className="min-h-screen bg-mus-background font-mus-sans">
      {/* Header */}
      <header className="border-b border-mus-border bg-mus-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="DataChef" className="size-8 rounded-full" />
            <div>
              <h1 className="text-lg font-semibold text-mus-foreground">@datachefhq/mus</h1>
              <p className="text-xs text-mus-muted-foreground">Playground</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-mus-muted-foreground">
            <span className="rounded-mus-md bg-mus-muted px-2 py-1 text-xs font-mus-mono">
              v{version}
            </span>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="mx-auto max-w-6xl px-6 pb-0">
          <div className="flex gap-1">
            <button
              onClick={() => setPlaygroundMode('default')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                playgroundMode === 'default'
                  ? 'border-mus-primary text-mus-primary'
                  : 'border-transparent text-mus-muted-foreground hover:text-mus-foreground'
              }`}
            >
              <Layers className="size-4" />
              Default mode
            </button>
            <button
              onClick={() => setPlaygroundMode('standalone')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                playgroundMode === 'standalone'
                  ? 'border-mus-primary text-mus-primary'
                  : 'border-transparent text-mus-muted-foreground hover:text-mus-foreground'
              }`}
            >
              <Camera className="size-4" />
              Standalone mode
            </button>
          </div>
        </div>
      </header>

      {/* Default mode */}
      {playgroundMode === 'default' && (
        <MusProvider config={defaultConfig}>
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="rounded-mus-xl border border-mus-border bg-mus-card p-4">
              <p className="text-sm text-mus-muted-foreground">
                <span className="font-medium text-mus-foreground">How it works:</span>{' '}
                Hover over any card below for 500 ms. A{' '}
                <span className="font-medium text-mus-primary">lightbulb icon</span> will appear.
                Click it to expand the feedback toolbar with actions: support, voice, video, thumbs up/down.
              </p>
            </div>
          </div>

          <main className="mx-auto max-w-6xl px-6 pb-12">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {SECTIONS.map((section) => (
                <FeedbackTarget
                  key={section.id}
                  sectionId={section.id}
                  sectionName={section.name}
                  actions={section.actions}
                >
                  <div className="group h-full rounded-mus-xl border border-mus-border bg-mus-card p-6 transition-colors hover:border-mus-primary/30">
                    <div className="mb-4 flex size-10 items-center justify-center rounded-mus-lg bg-mus-primary/10">
                      <section.icon className="size-5 text-mus-primary" />
                    </div>
                    <h3 className="mb-2 text-sm font-semibold text-mus-card-foreground">
                      {section.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-mus-muted-foreground">
                      {section.description}
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-mus-muted">
                        <div
                          className="h-2 rounded-full bg-mus-primary/60"
                          style={{ width: `${40 + (section.id.length * 7) % 55}%` }}
                        />
                      </div>
                      <span className="text-xs text-mus-muted-foreground">Active</span>
                    </div>
                  </div>
                </FeedbackTarget>
              ))}
            </div>
          </main>

          <div className="border-t border-mus-border bg-mus-card">
            <div className="mx-auto max-w-6xl px-6 py-8">
              <FeedbackTarget sectionId="assessments-table" sectionName="Assessments">
                <div className="rounded-mus-xl border border-mus-border bg-mus-background p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-mus-foreground">Assessments</h2>
                    <button className="rounded-mus-lg bg-mus-primary px-4 py-2 text-sm font-medium text-mus-primary-foreground transition-colors hover:opacity-90">
                      + Start New Assessment
                    </button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { assessor: 'Artin', date: '-', status: 'In Progress' },
                      { assessor: 'Bram', date: '2 Dec 2025', status: 'Completed' },
                      { assessor: 'Soheil', date: '15 Nov 2025', status: 'Completed' },
                    ].map((row) => (
                      <div
                        key={row.assessor}
                        className="flex items-center justify-between rounded-mus-lg border border-mus-border bg-mus-card px-4 py-3"
                      >
                        <div className="flex items-center gap-6">
                          <div>
                            <span className="text-xs text-mus-muted-foreground">Assessor</span>
                            <p className="text-sm font-medium text-mus-foreground">{row.assessor}</p>
                          </div>
                          <div>
                            <span className="text-xs text-mus-muted-foreground">Date</span>
                            <p className="text-sm text-mus-foreground">{row.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-mus-md px-2 py-1 text-xs font-medium ${
                              row.status === 'Completed'
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-yellow-500/10 text-yellow-500'
                            }`}
                          >
                            {row.status}
                          </span>
                          <button className="text-sm text-mus-muted-foreground hover:text-mus-foreground">
                            Show Details →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </FeedbackTarget>
            </div>
          </div>
        </MusProvider>
      )}

      {/* Standalone mode */}
      {playgroundMode === 'standalone' && (
        <MusProvider config={standaloneConfig}>
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-mus-muted-foreground">
                <span className="font-medium text-mus-foreground">How it works:</span>{' '}
                Hover over any card. A{' '}
                <span className="font-medium text-mus-primary">lightbulb icon</span> appears — click
                it to capture a screenshot and open the feedback dialog directly. Attach a voice
                recording or note, then submit to Slack.
              </p>
              <p className="text-xs text-mus-muted-foreground">
                <span className="font-medium text-mus-foreground">Playground:</span> uses{' '}
                <code className="rounded px-1 bg-mus-muted text-mus-foreground">html-to-image</code>{' '}
                — no permission needed, best-effort render. In a Chrome extension, pass{' '}
                <code className="rounded px-1 bg-mus-muted text-mus-foreground">chrome.tabs.captureVisibleTab</code>{' '}
                as <code className="rounded px-1 bg-mus-muted text-mus-foreground">onCaptureScreenshot</code>{' '}
                for a silent, pixel-perfect native screenshot.
              </p>
            </div>
          </div>

          <main className="mx-auto max-w-6xl px-6 pb-12">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {SECTIONS.map((section) => (
                <FeedbackTarget
                  key={section.id}
                  sectionId={section.id}
                  sectionName={section.name}
                >
                  <div className="group h-full rounded-mus-xl border border-mus-border bg-mus-card p-6 transition-colors hover:border-mus-primary/30">
                    <div className="mb-4 flex size-10 items-center justify-center rounded-mus-lg bg-mus-primary/10">
                      <section.icon className="size-5 text-mus-primary" />
                    </div>
                    <h3 className="mb-2 text-sm font-semibold text-mus-card-foreground">
                      {section.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-mus-muted-foreground">
                      {section.description}
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-mus-muted">
                        <div
                          className="h-2 rounded-full bg-mus-primary/60"
                          style={{ width: `${40 + (section.id.length * 7) % 55}%` }}
                        />
                      </div>
                      <span className="text-xs text-mus-muted-foreground">Active</span>
                    </div>
                  </div>
                </FeedbackTarget>
              ))}
            </div>
          </main>
        </MusProvider>
      )}
    </div>
  )
}
