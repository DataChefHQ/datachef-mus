// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>()
  return {
    ...actual,
    execFile: vi.fn((_cmd: string, _args: string[], cb: (err: null) => void) => cb(null)),
  }
})

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>()
  return {
    ...actual,
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from('mp3data')),
    unlink: vi.fn().mockResolvedValue(undefined),
  }
})

// Mock ffmpeg-static so convertToMp3 uses the mocked execFile path without errors
vi.mock('ffmpeg-static', () => ({ default: '/usr/bin/ffmpeg' }))

const ORIGINAL_TOKEN = process.env.SLACK_BOT_TOKEN

function makeAudioFile(size = 10): File {
  const bytes = new Uint8Array(size)
  return new File([bytes], 'audio.webm', { type: 'audio/webm' })
}

function makeImageFile(size = 10): File {
  const bytes = new Uint8Array(size)
  return new File([bytes], 'screenshot.png', { type: 'image/png' })
}

function makeVoiceUploadRequest(fields: Record<string, string | File | null> = {}): Request {
  const formData = new FormData()
  const defaults: Record<string, string | File> = {
    audioFile: makeAudioFile(),
    sectionId: 'hero',
    sectionName: 'Hero Section',
    channelId: 'C123',
    name: 'Test User',
    email: 'test@example.com',
    projectName: 'TestProject',
  }
  const merged = { ...defaults, ...fields }
  for (const [key, value] of Object.entries(merged)) {
    if (value !== null && value !== undefined) {
      formData.append(key, value as string | File)
    }
  }
  return new Request('http://localhost/api/mus/voice-upload', {
    method: 'POST',
    body: formData,
  })
}

function makeSupportRequest(body: Record<string, unknown> = {}): Request {
  const defaults = {
    name: 'Test User',
    email: 'test@example.com',
    projectName: 'TestProject',
    topic: 'Need help',
    sectionId: 'hero',
    sectionName: 'Hero',
    supportTeamEmails: [],
    feedbackChannelId: 'C123',
  }
  return new Request('http://localhost/api/mus/support-channel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...defaults, ...body }),
  })
}

function makeStandaloneRequest(fields: Record<string, string | File | null> = {}): Request {
  const formData = new FormData()
  const defaults: Record<string, string | File> = {
    screenshotFile: makeImageFile(),
    channelId: 'C123',
    name: 'Test User',
    email: 'test@example.com',
    projectName: 'TestProject',
  }
  const merged = { ...defaults, ...fields }
  for (const [key, value] of Object.entries(merged)) {
    if (value !== null && value !== undefined) {
      formData.append(key, value as string | File)
    }
  }
  return new Request('http://localhost/api/mus/standalone-upload', {
    method: 'POST',
    body: formData,
  })
}

describe('POST (voice upload)', () => {
  beforeEach(() => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test-token'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, upload_url: 'https://upload.example.com', file_id: 'F123' }),
        text: async () => '{"ok":true}',
      })
    )
  })

  afterEach(() => {
    if (ORIGINAL_TOKEN === undefined) {
      delete process.env.SLACK_BOT_TOKEN
    } else {
      process.env.SLACK_BOT_TOKEN = ORIGINAL_TOKEN
    }
    vi.unstubAllGlobals()
  })

  it('returns 500 when SLACK_BOT_TOKEN is not set', async () => {
    delete process.env.SLACK_BOT_TOKEN
    const { POST } = await import('@/server/index')
    const res = await POST(makeVoiceUploadRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('returns 400 when audioFile is missing', async () => {
    const { POST } = await import('@/server/index')
    const formData = new FormData()
    formData.append('sectionId', 'hero')
    formData.append('sectionName', 'Hero')
    formData.append('channelId', 'C123')
    const req = new Request('http://localhost/api/mus/voice-upload', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when sectionId is missing', async () => {
    const { POST } = await import('@/server/index')
    const formData = new FormData()
    formData.append('audioFile', makeAudioFile())
    formData.append('sectionName', 'Hero')
    formData.append('channelId', 'C123')
    const req = new Request('http://localhost/api/mus/voice-upload', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when channelId is missing', async () => {
    const { POST } = await import('@/server/index')
    const formData = new FormData()
    formData.append('audioFile', makeAudioFile())
    formData.append('sectionId', 'hero')
    formData.append('sectionName', 'Hero')
    const req = new Request('http://localhost/api/mus/voice-upload', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 with valid form data', async () => {
    const { POST } = await import('@/server/index')
    const res = await POST(makeVoiceUploadRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})

describe('POSTSupportChannel', () => {
  beforeEach(() => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test-token'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          channel: { id: 'C_NEW' },
          channels: [],
          response_metadata: { next_cursor: '' },
        }),
        text: async () => '{"ok":true}',
      })
    )
  })

  afterEach(() => {
    if (ORIGINAL_TOKEN === undefined) {
      delete process.env.SLACK_BOT_TOKEN
    } else {
      process.env.SLACK_BOT_TOKEN = ORIGINAL_TOKEN
    }
    vi.unstubAllGlobals()
  })

  it('returns 500 when SLACK_BOT_TOKEN is not set', async () => {
    delete process.env.SLACK_BOT_TOKEN
    const { POSTSupportChannel } = await import('@/server/index')
    const res = await POSTSupportChannel(makeSupportRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('returns 400 when feedbackChannelId missing and email is empty (anonymous with no channel)', async () => {
    const { POSTSupportChannel } = await import('@/server/index')
    const res = await POSTSupportChannel(
      makeSupportRequest({ email: '', feedbackChannelId: undefined })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('returns 200 with valid JSON body', async () => {
    const { POSTSupportChannel } = await import('@/server/index')
    const res = await POSTSupportChannel(makeSupportRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})

describe('POSTStandalone', () => {
  beforeEach(() => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test-token'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, upload_url: 'https://upload.example.com', file_id: 'F123' }),
        text: async () => '{"ok":true}',
      })
    )
  })

  afterEach(() => {
    if (ORIGINAL_TOKEN === undefined) {
      delete process.env.SLACK_BOT_TOKEN
    } else {
      process.env.SLACK_BOT_TOKEN = ORIGINAL_TOKEN
    }
    vi.unstubAllGlobals()
  })

  it('returns 500 when SLACK_BOT_TOKEN is not set', async () => {
    delete process.env.SLACK_BOT_TOKEN
    const { POSTStandalone } = await import('@/server/index')
    const res = await POSTStandalone(makeStandaloneRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('returns 400 when channelId is missing', async () => {
    const { POSTStandalone } = await import('@/server/index')
    const formData = new FormData()
    formData.append('screenshotFile', makeImageFile())
    const req = new Request('http://localhost/api/mus/standalone-upload', {
      method: 'POST',
      body: formData,
    })
    const res = await POSTStandalone(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when no files provided (no screenshotFile and no audioFile)', async () => {
    const { POSTStandalone } = await import('@/server/index')
    const formData = new FormData()
    formData.append('channelId', 'C123')
    const req = new Request('http://localhost/api/mus/standalone-upload', {
      method: 'POST',
      body: formData,
    })
    const res = await POSTStandalone(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 with valid form data', async () => {
    const { POSTStandalone } = await import('@/server/index')
    const res = await POSTStandalone(makeStandaloneRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
