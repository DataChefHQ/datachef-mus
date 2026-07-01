import type { MusAdapter, VoiceEvent, SupportEvent, StandaloneEvent } from './types'

/* ── Internal helpers ─────────────────────────────────────── */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

async function slackApi<T>(
  token: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = body
    ? await fetch(`https://slack.com/api/${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    : await fetch(`https://slack.com/api/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
  return res.json() as Promise<T>
}

async function findChannelByName(token: string, name: string): Promise<string | null> {
  let cursor: string | undefined
  do {
    const params = new URLSearchParams({ types: 'private_channel', limit: '200', exclude_archived: 'true' })
    if (cursor) params.set('cursor', cursor)
    const data = await slackApi<{
      ok: boolean
      channels: { id: string; name: string }[]
      response_metadata?: { next_cursor?: string }
      error?: string
    }>(token, `conversations.list?${params}`)
    if (!data.ok) throw new Error(`conversations.list failed: ${data.error}`)
    const found = data.channels.find((c) => c.name === name)
    if (found) return found.id
    cursor = data.response_metadata?.next_cursor || undefined
  } while (cursor)
  return null
}

async function inviteUsersToChannel(token: string, channelId: string, emails: string[]): Promise<void> {
  const userIds: string[] = []
  for (const email of emails) {
    try {
      const data = await slackApi<{ ok: boolean; user?: { id: string } }>(
        token,
        `users.lookupByEmail?email=${encodeURIComponent(email)}`
      )
      if (data.ok && data.user) userIds.push(data.user.id)
    } catch { /* skip users not in workspace */ }
  }
  if (userIds.length === 0) return
  await slackApi(token, 'conversations.invite', { channel: channelId, users: userIds.join(',') })
}

async function postMessage(token: string, channelId: string, text: string): Promise<void> {
  const data = await slackApi<{ ok: boolean; error?: string }>(token, 'chat.postMessage', {
    channel: channelId,
    text,
  })
  if (!data.ok) throw new Error(`chat.postMessage failed: ${data.error}`)
}

async function uploadToSlack(
  token: string,
  channelId: string,
  fileBuffer: Buffer,
  filename: string,
  comment: string
): Promise<void> {
  // Get upload URL from Slack
  const getUrlRes = await fetch('https://slack.com/api/files.getUploadURLExternal', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      filename,
      length: fileBuffer.byteLength.toString(),
    }),
  })

  const getUrlData = (await getUrlRes.json()) as {
    ok: boolean
    upload_url: string
    file_id: string
    error?: string
  }

  if (!getUrlData.ok) {
    throw new Error(`Slack getUploadURLExternal failed: ${getUrlData.error}`)
  }

  // Upload file content
  const uploadRes = await fetch(getUrlData.upload_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: new Uint8Array(fileBuffer),
  })

  if (!uploadRes.ok) {
    throw new Error(`Slack file upload failed: ${uploadRes.status}`)
  }

  // Complete the upload and share to channel
  const completeRes = await fetch('https://slack.com/api/files.completeUploadExternal', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: [{ id: getUrlData.file_id, title: filename }],
      channel_id: channelId,
      initial_comment: comment,
    }),
  })

  const completeData = (await completeRes.json()) as { ok: boolean; error?: string }

  if (!completeData.ok) {
    throw new Error(`Slack completeUploadExternal failed: ${completeData.error}`)
  }
}

/* ── Adapter factory ──────────────────────────────────────── */

/**
 * Creates a MUS adapter that posts feedback events to Slack.
 *
 * @example
 * ```ts
 * import { slackAdapter } from '@datachefhq/mus/adapters'
 *
 * const adapter = slackAdapter({ token: process.env.SLACK_BOT_TOKEN! })
 * ```
 */
export function slackAdapter(config: { token: string }): MusAdapter {
  const { token } = config

  return {
    async onVoiceUpload(event: VoiceEvent): Promise<void> {
      await uploadToSlack(token, event.channelId, event.mp3Buffer, event.filename, event.comment)
    },

    async onSupportRequest(event: SupportEvent): Promise<{ channelId?: string }> {
      if (!event.isAuthenticated) {
        // No email — post directly to feedback channel without a dedicated channel
        if (!event.feedbackChannelId) {
          throw new Error('feedbackChannelId required for anonymous support')
        }
        const messageLines = [
          `:headphones: *Anonymous Support Request*`,
          event.projectName ? `*Project:* ${event.projectName}` : '',
          `*Name:* ${event.name}`,
          event.sectionName
            ? `*Section:* ${event.sectionName}${event.sectionId ? ` (\`${event.sectionId}\`)` : ''}`
            : '',
          `*Topic:*\n${event.topic}`,
          `*Submitted:* ${new Date().toISOString()}`,
        ]
          .filter(Boolean)
          .join('\n')
        await postMessage(token, event.feedbackChannelId, messageLines)
        return {}
      }

      // Authenticated — deterministic private channel per user per project
      const projectSlug = slugify(event.projectSlug ?? event.projectName)
      const emailSlug = slugify(event.email.trim())
      const channelName = `${event.channelNamePrefix}-${projectSlug}-${emailSlug}`.slice(0, 80)

      // Find or create channel
      let channelId: string
      let isNewChannel = false

      const createData = await slackApi<{
        ok: boolean
        channel?: { id: string }
        error?: string
      }>(token, 'conversations.create', { name: channelName, is_private: true })

      if (createData.ok && createData.channel) {
        channelId = createData.channel.id
        isNewChannel = true
        // Invite support team (bot is already a member as creator)
        if (event.supportTeamEmails.length > 0) {
          await inviteUsersToChannel(token, channelId, event.supportTeamEmails)
        }
      } else if (createData.error === 'name_taken') {
        const existing = await findChannelByName(token, channelName)
        if (!existing) throw new Error(`Channel "${channelName}" not found after name_taken`)
        channelId = existing
      } else {
        throw new Error(`conversations.create failed: ${createData.error}`)
      }

      // Post support message to channel
      const messageLines = [
        isNewChannel ? `:headphones: *New Support Request*` : `:headphones: *Follow-up Support Request*`,
        event.projectName ? `*Project:* ${event.projectName}` : '',
        `*Name:* ${event.name}`,
        `*Email:* ${event.email}`,
        event.sectionName
          ? `*Section:* ${event.sectionName}${event.sectionId ? ` (\`${event.sectionId}\`)` : ''}`
          : '',
        `*Topic:*\n${event.topic}`,
        `*Submitted:* ${new Date().toISOString()}`,
      ]
        .filter(Boolean)
        .join('\n')

      await postMessage(token, channelId, messageLines)

      // Notify feedback channel on new channel creation
      if (isNewChannel && event.feedbackChannelId) {
        await postMessage(
          token,
          event.feedbackChannelId,
          `:headphones: New support channel created: <#${channelId}> for *${event.name}* (${event.email}) from *${event.projectName}*.`
        )
      }

      return { channelId }
    },

    async onStandaloneFeedback(event: StandaloneEvent): Promise<void> {
      if (event.screenshotBuffer) {
        await uploadToSlack(
          token,
          event.channelId,
          event.screenshotBuffer,
          event.screenshotFilename || `screenshot-${Date.now()}.png`,
          event.metaComment
        )
      }

      if (event.mp3Buffer) {
        const audioComment = event.screenshotBuffer
          ? `:studio_microphone: *Voice recording for the above screenshot*`
          : event.metaComment
        await uploadToSlack(
          token,
          event.channelId,
          event.mp3Buffer,
          event.audioFilename || `voice-${Date.now()}.mp3`,
          audioComment
        )
      }
    },
  }
}
