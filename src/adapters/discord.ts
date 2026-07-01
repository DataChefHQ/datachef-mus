import type { MusAdapter, VoiceEvent, SupportEvent, StandaloneEvent } from './types'

interface DiscordEmbed {
  title: string
  color: number
  fields: { name: string; value: string; inline?: boolean }[]
  footer?: { text: string }
  timestamp?: string
}

async function postEmbed(webhookUrl: string, embeds: DiscordEmbed[]): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Discord webhook POST failed: ${res.status} ${body}`)
  }
}

/**
 * Creates a MUS adapter that posts feedback events to a Discord channel
 * via an incoming webhook.
 *
 * Note: Discord cannot play audio inline. Voice feedback sends metadata only.
 *
 * @example
 * ```ts
 * import { discordAdapter } from '@datachefhq/mus/adapters'
 *
 * const adapter = discordAdapter({ webhookUrl: process.env.DISCORD_WEBHOOK_URL! })
 * ```
 */
export function discordAdapter(config: { webhookUrl: string }): MusAdapter {
  const { webhookUrl } = config

  return {
    async onVoiceUpload(event: VoiceEvent): Promise<void> {
      const fields: DiscordEmbed['fields'] = [
        { name: 'Project', value: event.projectName || '—', inline: true },
        { name: 'Section', value: event.sectionName ? `${event.sectionName} (\`${event.sectionId}\`)` : event.sectionId || '—', inline: true },
        { name: 'Submitted by', value: event.email ? `${event.name} (${event.email})` : event.name, inline: false },
      ]
      if (event.note) {
        fields.push({ name: 'Note', value: event.note, inline: false })
      }
      fields.push({ name: 'File', value: event.filename, inline: false })

      await postEmbed(webhookUrl, [
        {
          title: 'Voice Feedback',
          color: 0x5865f2, // Discord blurple
          fields,
          footer: { text: 'Note: audio file cannot be attached via webhook' },
          timestamp: new Date().toISOString(),
        },
      ])
    },

    async onSupportRequest(event: SupportEvent): Promise<{ channelId?: string }> {
      const fields: DiscordEmbed['fields'] = [
        { name: 'Project', value: event.projectName || '—', inline: true },
        { name: 'Section', value: event.sectionName ? `${event.sectionName} (\`${event.sectionId}\`)` : event.sectionId || '—', inline: true },
        { name: 'Submitted by', value: event.email ? `${event.name} (${event.email})` : event.name, inline: false },
        { name: 'Topic', value: event.topic || '—', inline: false },
      ]

      await postEmbed(webhookUrl, [
        {
          title: event.isAuthenticated ? 'Support Request' : 'Anonymous Support Request',
          color: 0xed4245, // Discord red
          fields,
          timestamp: new Date().toISOString(),
        },
      ])

      return {}
    },

    async onStandaloneFeedback(event: StandaloneEvent): Promise<void> {
      const fields: DiscordEmbed['fields'] = [
        { name: 'Project', value: event.projectName || '—', inline: true },
        { name: 'Section', value: event.sectionName ? `${event.sectionName} (\`${event.sectionId}\`)` : event.sectionId || '—', inline: true },
        { name: 'Submitted by', value: event.email ? `${event.name} (${event.email})` : event.name, inline: false },
      ]
      if (event.note) {
        fields.push({ name: 'Note', value: event.note, inline: false })
      }

      const attachments: string[] = []
      if (event.screenshotFilename) attachments.push(`Screenshot: ${event.screenshotFilename}`)
      if (event.audioFilename) attachments.push(`Audio: ${event.audioFilename}`)
      if (attachments.length > 0) {
        fields.push({ name: 'Attachments', value: attachments.join('\n'), inline: false })
      }

      await postEmbed(webhookUrl, [
        {
          title: 'Standalone Feedback',
          color: 0x57f287, // Discord green
          fields,
          footer: { text: 'Note: files cannot be attached via webhook' },
          timestamp: new Date().toISOString(),
        },
      ])
    },
  }
}
