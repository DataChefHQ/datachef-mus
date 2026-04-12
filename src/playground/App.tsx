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
import type { MusConfig } from '@/types'

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

const SECTIONS = [
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
  },
  {
    id: 'performance-monitor',
    name: 'Performance Monitor',
    icon: Zap,
    description:
      'Monitor response times, throughput, and error rates across all services and endpoints.',
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
      <div className="min-h-screen bg-background font-sans">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                M
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  @datachef/mus
                </h1>
                <p className="text-xs text-muted-foreground">
                  Playground
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-mono">
                v0.1.0
              </span>
            </div>
          </div>
        </header>

        {/* Instructions */}
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">How it works:</span>{' '}
              Hover over any card below for 500ms. A{' '}
              <span className="font-medium text-primary">lightbulb icon</span>{' '}
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
              >
                <div className="group h-full rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <section.icon className="size-5 text-primary" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-card-foreground">
                    {section.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {section.description}
                  </p>

                  {/* Fake content to make cards feel real */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary/60"
                        style={{
                          width: `${Math.floor(40 + Math.random() * 55)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Active
                    </span>
                  </div>
                </div>
              </FeedbackTarget>
            ))}
          </div>
        </main>

        {/* Full-width section example */}
        <div className="border-t border-border bg-card">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <FeedbackTarget
              sectionId="assessments-table"
              sectionName="Assessments"
            >
              <div className="rounded-xl border border-border bg-background p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">
                    Assessments
                  </h2>
                  <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
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
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                    >
                      <div className="flex items-center gap-6">
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Assessor
                          </span>
                          <p className="text-sm font-medium text-foreground">
                            {row.assessor}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Date
                          </span>
                          <p className="text-sm text-foreground">{row.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-medium ${
                            row.status === 'Completed'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-yellow-500/10 text-yellow-500'
                          }`}
                        >
                          {row.status}
                        </span>
                        <button className="text-sm text-muted-foreground hover:text-foreground">
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
