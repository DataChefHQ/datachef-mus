import { MusProvider } from '@/context/MusContext'
import { FeedbackTarget } from '@/components/FeedbackTarget'
import {
  BarChart3,
  Shield,
  Zap,
  Settings,
  Users,
  Globe,
} from 'lucide-react'
import type { MusConfig, FeedbackAction } from '@/types'
import { version } from '../../package.json'
import logo from './logo.png'

const config: Omit<MusConfig, 'actions'> = {
  projectName: 'Mus Playground',
  slack: {
    proxyUrl: '/api/slack-proxy',
    supportTeamEmails: ['alireza.e@datachef.co'],
    feedbackChannelId: 'C0AFBB4HL7K',
  },
  hoverDelay: 500,
  triggerPosition: 'top-right',
  user: {
    name: '',
    email: '',
  },
  onThumbsUp: (sectionId) => console.log('👍', sectionId),
  onThumbsDown: (sectionId) => console.log('👎', sectionId),
  onFeedbackSubmitted: (type, sectionId) =>
    console.log('Feedback:', type, sectionId),
}

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

export function App() {
  return (
    <MusProvider config={config}>
      <div className="min-h-screen bg-mus-background font-mus-sans">
        {/* Header */}
        <header className="border-b border-mus-border bg-mus-card">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="DataChef" className="size-8 rounded-full" />
              <div>
                <h1 className="text-lg font-semibold text-mus-foreground">
                  @datachef/mus
                </h1>
                <p className="text-xs text-mus-muted-foreground">
                  Playground
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-mus-muted-foreground">
              <span className="rounded-mus-md bg-mus-muted px-2 py-1 text-xs font-mus-mono">
                v{version}
              </span>
            </div>
          </div>
        </header>

        {/* Instructions */}
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="rounded-mus-xl border border-mus-border bg-mus-card p-4">
            <p className="text-sm text-mus-muted-foreground">
              <span className="font-medium text-mus-foreground">How it works:</span>{' '}
              Hover over any card below for 500ms. A{' '}
              <span className="font-medium text-mus-primary">lightbulb icon</span>{' '}
              will appear. Click it to expand the feedback toolbar with actions:
              support, voice, video, text feedback, thumbs up/down.
            </p>
          </div>
        </div>

        {/* Cards grid */}
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

                  {/* Fake content to make cards feel real */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-mus-muted">
                      <div
                        className="h-2 rounded-full bg-mus-primary/60"
                        style={{
                          width: `${Math.floor(40 + Math.random() * 55)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-mus-muted-foreground">
                      Active
                    </span>
                  </div>
                </div>
              </FeedbackTarget>
            ))}
          </div>
        </main>

        {/* Full-width section example */}
        <div className="border-t border-mus-border bg-mus-card">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <FeedbackTarget
              sectionId="assessments-table"
              sectionName="Assessments"
            >
              <div className="rounded-mus-xl border border-mus-border bg-mus-background p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-mus-foreground">
                    Assessments
                  </h2>
                  <button className="rounded-mus-lg bg-mus-primary px-4 py-2 text-sm font-medium text-mus-primary-foreground transition-colors hover:opacity-90">
                    + Start New Assessment
                  </button>
                </div>

                {/* Fake table */}
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
                          <span className="text-xs text-mus-muted-foreground">
                            Assessor
                          </span>
                          <p className="text-sm font-medium text-mus-foreground">
                            {row.assessor}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-mus-muted-foreground">
                            Date
                          </span>
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
      </div>
    </MusProvider>
  )
}
