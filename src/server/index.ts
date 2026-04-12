/**
 * Server-side voice upload handler for @datachef/mus.
 *
 * Usage in Next.js App Router:
 *   // app/api/mus/voice-upload/route.ts
 *   export { POST } from '@datachef/mus/server'
 *
 * Requires SLACK_BOT_TOKEN environment variable.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

async function uploadToSlack(
  token: string,
  channelId: string,
  fileBuffer: ArrayBuffer,
  filename: string,
  comment: string
) {
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
    body: fileBuffer,
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

/** Next.js App Router POST handler */
export async function POST(request: Request): Promise<Response> {
  try {
    const token = process.env.SLACK_BOT_TOKEN
    if (!token) {
      return Response.json(
        { success: false, error: 'SLACK_BOT_TOKEN is not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()

    const audioFile = formData.get('audioFile') as File | null
    const sectionId = formData.get('sectionId') as string | null
    const sectionName = formData.get('sectionName') as string | null
    const channelId = formData.get('channelId') as string | null
    const name = (formData.get('name') as string) || 'Anonymous'
    const email = (formData.get('email') as string) || ''
    const projectName = (formData.get('projectName') as string) || ''

    if (!audioFile || !sectionId || !sectionName || !channelId) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (audioFile.size > MAX_FILE_SIZE) {
      return Response.json(
        { success: false, error: 'File must be under 10 MB' },
        { status: 400 }
      )
    }

    const arrayBuffer = await audioFile.arrayBuffer()
    const filename = `voice-feedback-${sectionId}-${Date.now()}.webm`

    const comment = [
      `:studio_microphone: *Voice Feedback*`,
      projectName ? `*Project:* ${projectName}` : '',
      `*Name:* ${name}`,
      email ? `*Email:* ${email}` : '',
      `*Section:* ${sectionName} (\`${sectionId}\`)`,
      `*Submitted:* ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join('\n')

    await uploadToSlack(token, channelId, arrayBuffer, filename, comment)

    return Response.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Voice upload error:', message)
    return Response.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
