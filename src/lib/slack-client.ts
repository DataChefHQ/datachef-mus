import type { SlackConfig } from '@/types'

/**
 * Client-side Slack service that calls the Chefbot proxy directly.
 * No server needed — all calls happen from the browser.
 */

/** Map of email → channelId for idempotent support channel creation */
const channelCache = new Map<string, string>()

async function callProxy<T>(
  proxyUrl: string,
  func: string,
  data: Record<string, unknown>
): Promise<T> {
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ func, ...data }),
  })

  if (!response.ok) {
    throw new Error(`Slack proxy error: ${response.status}`)
  }

  return (await response.json()) as T
}

function sendMessage(proxyUrl: string, channelId: string, message: string) {
  return callProxy(proxyUrl, 'send_message', { channel_id: channelId, message })
}

/* ── Public API ──────────────────────────────────────────── */

export async function sendTextFeedback(
  slack: SlackConfig,
  params: {
    name: string
    email: string
    message: string
    sectionId: string
    sectionName: string
  }
) {
  const message = [
    `:speech_balloon: *Text Feedback*`,
    `*Name:* ${params.name}`,
    `*Email:* ${params.email}`,
    `*Section:* ${params.sectionName} (\`${params.sectionId}\`)`,
    `*Message:*\n${params.message}`,
  ].join('\n')

  await sendMessage(slack.proxyUrl, slack.feedbackChannelId, message)
}

export async function sendVoiceFeedback(
  slack: SlackConfig,
  params: {
    name: string
    email: string
    sectionId: string
    sectionName: string
    audioBlob: Blob
  }
) {
  // Post notification message to channel
  const message = [
    `:studio_microphone: *Voice Feedback*`,
    `*Name:* ${params.name}`,
    `*Email:* ${params.email}`,
    `*Section:* ${params.sectionName} (\`${params.sectionId}\`)`,
    `*Submitted:* ${new Date().toLocaleString()}`,
  ].join('\n')

  await sendMessage(slack.proxyUrl, slack.feedbackChannelId, message)
  // Note: audio file upload requires bot token (server-side).
  // For now the notification is sent; file upload can be added later.
}

export async function sendThumbsFeedback(
  slack: SlackConfig,
  params: {
    type: 'thumbs-up' | 'thumbs-down'
    sectionId: string
    sectionName: string
    email?: string
  }
) {
  const emoji = params.type === 'thumbs-up' ? ':+1:' : ':-1:'
  const message = [
    `${emoji} *${params.type === 'thumbs-up' ? 'Thumbs Up' : 'Thumbs Down'}*`,
    `*Section:* ${params.sectionName} (\`${params.sectionId}\`)`,
    params.email ? `*Email:* ${params.email}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  await sendMessage(slack.proxyUrl, slack.feedbackChannelId, message)
}

export async function createSupportChannel(
  slack: SlackConfig,
  params: {
    name: string
    email: string
    topic: string
    sectionId: string
    sectionName: string
  }
): Promise<{ channelId: string; existing: boolean }> {
  const normalizedEmail = params.email.trim().toLowerCase()
  const prefix = slack.channelNamePrefix ?? 'support'

  // Idempotent — return existing channel for this email
  const existingChannelId = channelCache.get(normalizedEmail)
  if (existingChannelId) {
    const followUp = [
      `:headphones: *Follow-up Support Request*`,
      `*Name:* ${params.name}`,
      `*Section:* ${params.sectionName} (\`${params.sectionId}\`)`,
      `*Topic:*\n${params.topic}`,
    ].join('\n')

    await sendMessage(slack.proxyUrl, existingChannelId, followUp)
    return { channelId: existingChannelId, existing: true }
  }

  // Generate channel name
  const sanitizedName = params.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
  const timestamp = Math.floor(Date.now() / 1000)
  const channelName = `${prefix}-${sanitizedName}-${timestamp}`

  // Create channel with support team + user
  const allEmails = [
    ...new Set([...slack.supportTeamEmails, normalizedEmail]),
  ]

  const res = await callProxy<{ success: boolean; channel: string }>(
    slack.proxyUrl,
    'create_tha_channel',
    {
      channel_name: channelName,
      user_emails: allEmails.join(', '),
    }
  )

  const channelId = res.channel
  channelCache.set(normalizedEmail, channelId)

  // Post info message
  const infoMessage = [
    `:headphones: *New Support Request*`,
    `*Name:* ${params.name}`,
    `*Email:* ${params.email}`,
    `*Section:* ${params.sectionName} (\`${params.sectionId}\`)`,
    `*Topic:*\n${params.topic}`,
    `*Created:* ${new Date().toISOString()}`,
  ].join('\n')

  await sendMessage(slack.proxyUrl, channelId, infoMessage)

  // Notify feedback channel
  await sendMessage(
    slack.proxyUrl,
    slack.feedbackChannelId,
    `:headphones: New support channel created: <#${channelId}> for *${params.name}* (${params.email}).`
  )

  return { channelId, existing: false }
}
