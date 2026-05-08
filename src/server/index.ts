/**
 * Server-side voice upload handler for @datachef/mus.
 *
 * Usage in Next.js App Router:
 *   // app/api/mus/voice-upload/route.ts
 *   export { POST } from '@datachef/mus/server'
 *
 * Requires:
 *   - SLACK_BOT_TOKEN environment variable
 *   - ffmpeg-static package: npm install ffmpeg-static
 */

import { execFile } from 'child_process'
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

async function convertToMp3(inputBuffer: ArrayBuffer): Promise<Buffer> {
  // Try to resolve ffmpeg-static, fall back to system ffmpeg
  let ffmpegPath = 'ffmpeg'
  try {
    ffmpegPath = (await import('ffmpeg-static')).default as string
  } catch {
    // ffmpeg-static not installed — use system ffmpeg
  }

  const timestamp = Date.now()
  const inputPath = join(tmpdir(), `mus-voice-in-${timestamp}.webm`)
  const outputPath = join(tmpdir(), `mus-voice-out-${timestamp}.mp3`)

  await writeFile(inputPath, Buffer.from(inputBuffer))

  await new Promise<void>((resolve, reject) => {
    execFile(
      ffmpegPath,
      ['-i', inputPath, '-codec:a', 'libmp3lame', '-qscale:a', '4', '-y', outputPath],
      (error) => {
        if (error) reject(error)
        else resolve()
      }
    )
  })

  const mp3Buffer = await readFile(outputPath)

  // Cleanup temp files
  await Promise.all([unlink(inputPath), unlink(outputPath)]).catch(() => {})

  return mp3Buffer
}

async function uploadToSlack(
  token: string,
  channelId: string,
  fileBuffer: Buffer,
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

/**
 * Next.js App Router POST handler for standalone feedback.
 *
 * Usage:
 *   // app/api/mus/standalone-upload/route.ts
 *   export { POSTStandalone as POST } from '@datachef/mus/server'
 *
 * Accepts multipart/form-data with:
 *   - screenshotFile  (optional, image/png or image/jpeg)
 *   - audioFile       (optional, audio/webm)
 *   - channelId, projectName, name, email, note
 */
export async function POSTStandalone(request: Request): Promise<Response> {
  try {
    const token = process.env.SLACK_BOT_TOKEN
    if (!token) {
      return Response.json(
        { success: false, error: 'SLACK_BOT_TOKEN is not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const screenshotFile = formData.get('screenshotFile') as File | null
    const audioFile = formData.get('audioFile') as File | null
    const channelId = formData.get('channelId') as string | null
    const name = (formData.get('name') as string) || 'Anonymous'
    const email = (formData.get('email') as string) || ''
    const projectName = (formData.get('projectName') as string) || ''
    const note = (formData.get('note') as string) || ''
    const sectionId = (formData.get('sectionId') as string) || ''
    const sectionName = (formData.get('sectionName') as string) || ''

    if (!channelId) {
      return Response.json({ success: false, error: 'Missing channelId' }, { status: 400 })
    }

    if (!screenshotFile && !audioFile) {
      return Response.json({ success: false, error: 'No files provided' }, { status: 400 })
    }

    const metaComment = [
      `:camera: *Standalone Feedback*`,
      projectName ? `*Project:* ${projectName}` : '',
      `*Name:* ${name}`,
      email ? `*Email:* ${email}` : '',
      sectionName ? `*Section:* ${sectionName}${sectionId ? ` (\`${sectionId}\`)` : ''}` : '',
      note ? `*Note:*\n${note}` : '',
      `*Submitted:* ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join('\n')

    if (screenshotFile) {
      const buffer = Buffer.from(await screenshotFile.arrayBuffer())
      await uploadToSlack(token, channelId, buffer, screenshotFile.name || `screenshot-${Date.now()}.png`, metaComment)
    }

    if (audioFile) {
      const arrayBuffer = await audioFile.arrayBuffer()
      const mp3Buffer = await convertToMp3(arrayBuffer)
      const audioComment = screenshotFile
        ? `:studio_microphone: *Voice recording for the above screenshot*`
        : metaComment
      await uploadToSlack(token, channelId, mp3Buffer, `voice-${Date.now()}.mp3`, audioComment)
    }

    return Response.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Standalone upload error:', message)
    return Response.json({ success: false, error: message }, { status: 500 })
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
    const note = (formData.get('note') as string) || ''

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

    // Convert WebM → MP3 for Slack inline audio player
    const arrayBuffer = await audioFile.arrayBuffer()
    const mp3Buffer = await convertToMp3(arrayBuffer)
    const filename = `voice-feedback-${sectionId}-${Date.now()}.mp3`

    const comment = [
      `:studio_microphone: *Voice Feedback*`,
      projectName ? `*Project:* ${projectName}` : '',
      `*Name:* ${name}`,
      email ? `*Email:* ${email}` : '',
      `*Section:* ${sectionName} (\`${sectionId}\`)`,
      note ? `*Note:*\n${note}` : '',
      `*Submitted:* ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join('\n')

    await uploadToSlack(token, channelId, mp3Buffer, filename, comment)

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
