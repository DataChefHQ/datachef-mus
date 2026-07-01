import type { MusAdapter, VoiceEvent, SupportEvent, StandaloneEvent } from './types'

interface TeamsSection {
  activityTitle?: string
  activityText?: string
  facts?: { name: string; value: string }[]
  markdown?: boolean
}

interface TeamsMessageCard {
  '@type': 'MessageCard'
  '@context': 'http://schema.org/extensions'
  themeColor: string
  summary: string
  title: string
  sections: TeamsSection[]
}

async function postCard(webhookUrl: string, card: TeamsMessageCard): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Teams webhook POST failed: ${res.status} ${body}`)
  }
}

/**
 * Creates a MUS adapter that posts feedback events to a Microsoft Teams channel
 * via an incoming webhook (MessageCard format).
 *
 * @example
 * ```ts
 * import { teamsAdapter } from '@datachef/mus/adapters'
 *
 * const adapter = teamsAdapter({ webhookUrl: process.env.TEAMS_WEBHOOK_URL! })
 * ```
 */
export function teamsAdapter(config: { webhookUrl: string }): MusAdapter {
  const { webhookUrl } = config

  return {
    async onVoiceUpload(event: VoiceEvent): Promise<void> {
      const facts: TeamsSection['facts'] = [
        { name: 'Project', value: event.projectName || '—' },
        { name: 'Section', value: event.sectionName ? `${event.sectionName} (${event.sectionId})` : event.sectionId || '—' },
        { name: 'Submitted by', value: event.email ? `${event.name} (${event.email})` : event.name },
        { name: 'File', value: event.filename },
        { name: 'Submitted', value: new Date().toISOString() },
      ]
      if (event.note) {
        facts.push({ name: 'Note', value: event.note })
      }

      await postCard(webhookUrl, {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: '0078D4',
        summary: `Voice Feedback — ${event.projectName}`,
        title: 'Voice Feedback',
        sections: [
          {
            facts,
            markdown: true,
          },
        ],
      })
    },

    async onSupportRequest(event: SupportEvent): Promise<{ channelId?: string }> {
      const facts: TeamsSection['facts'] = [
        { name: 'Project', value: event.projectName || '—' },
        { name: 'Section', value: event.sectionName ? `${event.sectionName} (${event.sectionId})` : event.sectionId || '—' },
        { name: 'Submitted by', value: event.email ? `${event.name} (${event.email})` : event.name },
        { name: 'Topic', value: event.topic || '—' },
        { name: 'Submitted', value: new Date().toISOString() },
      ]

      const title = event.isAuthenticated ? 'Support Request' : 'Anonymous Support Request'

      await postCard(webhookUrl, {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: 'D13438',
        summary: `${title} — ${event.projectName}`,
        title,
        sections: [
          {
            facts,
            markdown: true,
          },
        ],
      })

      return {}
    },

    async onStandaloneFeedback(event: StandaloneEvent): Promise<void> {
      const facts: TeamsSection['facts'] = [
        { name: 'Project', value: event.projectName || '—' },
        { name: 'Section', value: event.sectionName ? `${event.sectionName} (${event.sectionId})` : event.sectionId || '—' },
        { name: 'Submitted by', value: event.email ? `${event.name} (${event.email})` : event.name },
        { name: 'Submitted', value: new Date().toISOString() },
      ]
      if (event.note) {
        facts.push({ name: 'Note', value: event.note })
      }

      const attachments: string[] = []
      if (event.screenshotFilename) attachments.push(`Screenshot: ${event.screenshotFilename}`)
      if (event.audioFilename) attachments.push(`Audio: ${event.audioFilename}`)
      if (attachments.length > 0) {
        facts.push({ name: 'Attachments', value: attachments.join(', ') })
      }

      await postCard(webhookUrl, {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: '107C10',
        summary: `Standalone Feedback — ${event.projectName}`,
        title: 'Standalone Feedback',
        sections: [
          {
            facts,
            markdown: true,
          },
        ],
      })
    },
  }
}
