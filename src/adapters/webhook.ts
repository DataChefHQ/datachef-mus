import type { MusAdapter, VoiceEvent, SupportEvent, StandaloneEvent } from './types'

async function postJson(
  url: string,
  headers: Record<string, string>,
  payload: Record<string, unknown>
): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Webhook POST failed: ${res.status} ${body}`)
  }
}

/**
 * Creates a MUS adapter that POSTs JSON payloads to a generic HTTP endpoint
 * for each feedback event type.
 *
 * @example
 * ```ts
 * import { webhookAdapter } from '@datachef/mus/adapters'
 *
 * const adapter = webhookAdapter({
 *   url: process.env.WEBHOOK_URL!,
 *   headers: { 'X-Api-Key': process.env.WEBHOOK_SECRET! },
 * })
 * ```
 */
export function webhookAdapter(config: {
  url: string
  headers?: Record<string, string>
}): MusAdapter {
  const { url, headers = {} } = config

  return {
    async onVoiceUpload(event: VoiceEvent): Promise<void> {
      await postJson(url, headers, {
        type: 'voice_upload',
        projectName: event.projectName,
        sectionId: event.sectionId,
        sectionName: event.sectionName,
        name: event.name,
        email: event.email,
        note: event.note,
        filename: event.filename,
        timestamp: new Date().toISOString(),
      })
    },

    async onSupportRequest(event: SupportEvent): Promise<{ channelId?: string }> {
      await postJson(url, headers, {
        type: 'support_request',
        projectName: event.projectName,
        projectSlug: event.projectSlug,
        sectionId: event.sectionId,
        sectionName: event.sectionName,
        name: event.name,
        email: event.email,
        isAuthenticated: event.isAuthenticated,
        topic: event.topic,
        channelNamePrefix: event.channelNamePrefix,
        timestamp: new Date().toISOString(),
      })
      return {}
    },

    async onStandaloneFeedback(event: StandaloneEvent): Promise<void> {
      await postJson(url, headers, {
        type: 'standalone_feedback',
        projectName: event.projectName,
        sectionId: event.sectionId,
        sectionName: event.sectionName,
        name: event.name,
        email: event.email,
        note: event.note,
        screenshotFilename: event.screenshotFilename,
        audioFilename: event.audioFilename,
        timestamp: new Date().toISOString(),
      })
    },
  }
}
