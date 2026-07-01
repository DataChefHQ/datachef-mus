// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { MusAdapter, VoiceEvent, SupportEvent, StandaloneEvent } from '@/adapters/types'
import { createMusHandlers } from '@/server/index'

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
vi.mock('ffmpeg-static', () => ({ default: '/usr/bin/ffmpeg' }))

function makeAudioFile(size = 10): File {
  return new File([new Uint8Array(size)], 'audio.webm', { type: 'audio/webm' })
}

function makeImageFile(size = 10): File {
  return new File([new Uint8Array(size)], 'screenshot.png', { type: 'image/png' })
}

describe('MusAdapter interface', () => {
  it('MusAdapter is a valid interface — an object with optional handler methods', () => {
    const adapter: MusAdapter = {
      onVoiceUpload: vi.fn().mockResolvedValue(undefined),
      onSupportRequest: vi.fn().mockResolvedValue({ channelId: 'C123' }),
      onStandaloneFeedback: vi.fn().mockResolvedValue(undefined),
    }
    expect(typeof adapter.onVoiceUpload).toBe('function')
    expect(typeof adapter.onSupportRequest).toBe('function')
    expect(typeof adapter.onStandaloneFeedback).toBe('function')
  })

  it('partial MusAdapter (only onVoiceUpload) is valid', () => {
    const adapter: MusAdapter = {
      onVoiceUpload: vi.fn().mockResolvedValue(undefined),
    }
    expect(adapter.onSupportRequest).toBeUndefined()
    expect(adapter.onStandaloneFeedback).toBeUndefined()
  })

  it('createMusHandlers returns POST, POSTStandalone, POSTSupportChannel functions', () => {
    const adapter: MusAdapter = {}
    const handlers = createMusHandlers({ adapter })
    expect(typeof handlers.POST).toBe('function')
    expect(typeof handlers.POSTStandalone).toBe('function')
    expect(typeof handlers.POSTSupportChannel).toBe('function')
  })

  it('createMusHandlers accepts an array of adapters', () => {
    const adapterA: MusAdapter = {}
    const adapterB: MusAdapter = {}
    const handlers = createMusHandlers({ adapter: [adapterA, adapterB] })
    expect(typeof handlers.POST).toBe('function')
  })
})

describe('createMusHandlers — onVoiceUpload adapter', () => {
  let onVoiceUpload: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onVoiceUpload = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, upload_url: 'https://upload.example.com', file_id: 'F123' }),
      text: async () => '{"ok":true}',
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls onVoiceUpload with correct fields when form data is valid', async () => {
    const handlers = createMusHandlers({ adapter: { onVoiceUpload } })

    const formData = new FormData()
    formData.append('audioFile', makeAudioFile())
    formData.append('sectionId', 'hero')
    formData.append('sectionName', 'Hero Section')
    formData.append('channelId', 'C123')
    formData.append('name', 'Alice')
    formData.append('email', 'alice@example.com')
    formData.append('projectName', 'TestProject')

    const req = new Request('http://localhost/api/mus/voice-upload', {
      method: 'POST',
      body: formData,
    })

    const res = await handlers.POST(req)
    expect(res.status).toBe(200)
    expect(onVoiceUpload).toHaveBeenCalledOnce()

    const event: VoiceEvent = onVoiceUpload.mock.calls[0][0]
    expect(event.sectionId).toBe('hero')
    expect(event.sectionName).toBe('Hero Section')
    expect(event.channelId).toBe('C123')
    expect(event.name).toBe('Alice')
    expect(event.email).toBe('alice@example.com')
    expect(event.projectName).toBe('TestProject')
    expect(Buffer.isBuffer(event.mp3Buffer)).toBe(true)
  })

  it('returns 400 when audioFile is missing', async () => {
    const handlers = createMusHandlers({ adapter: { onVoiceUpload } })
    const formData = new FormData()
    formData.append('sectionId', 'hero')
    formData.append('sectionName', 'Hero')
    formData.append('channelId', 'C123')
    const req = new Request('http://localhost/api/mus/voice-upload', {
      method: 'POST',
      body: formData,
    })
    const res = await handlers.POST(req)
    expect(res.status).toBe(400)
    expect(onVoiceUpload).not.toHaveBeenCalled()
  })
})

describe('createMusHandlers — onSupportRequest adapter', () => {
  let onSupportRequest: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onSupportRequest = vi.fn().mockResolvedValue({ channelId: 'C_NEW' })
  })

  it('calls onSupportRequest with correct fields', async () => {
    const handlers = createMusHandlers({ adapter: { onSupportRequest } })

    const req = new Request('http://localhost/api/mus/support-channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob',
        email: 'bob@example.com',
        projectName: 'TestProject',
        topic: 'Need help',
        sectionId: 'hero',
        sectionName: 'Hero',
        supportTeamEmails: ['admin@example.com'],
        feedbackChannelId: 'C123',
      }),
    })

    const res = await handlers.POSTSupportChannel(req)
    expect(res.status).toBe(200)
    expect(onSupportRequest).toHaveBeenCalledOnce()

    const event: SupportEvent = onSupportRequest.mock.calls[0][0]
    expect(event.name).toBe('Bob')
    expect(event.email).toBe('bob@example.com')
    expect(event.isAuthenticated).toBe(true)
    expect(event.topic).toBe('Need help')
  })

  it('returns channelId from adapter in response', async () => {
    const handlers = createMusHandlers({ adapter: { onSupportRequest } })

    const req = new Request('http://localhost/api/mus/support-channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob',
        email: 'bob@example.com',
        projectName: 'TestProject',
        topic: 'Need help',
      }),
    })

    const res = await handlers.POSTSupportChannel(req)
    const body = await res.json()
    expect(body.channelId).toBe('C_NEW')
  })
})

describe('createMusHandlers — onStandaloneFeedback adapter', () => {
  let onStandaloneFeedback: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onStandaloneFeedback = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, upload_url: 'https://upload.example.com', file_id: 'F123' }),
      text: async () => '{"ok":true}',
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls onStandaloneFeedback with screenshot buffer when screenshotFile provided', async () => {
    const handlers = createMusHandlers({ adapter: { onStandaloneFeedback } })

    const formData = new FormData()
    formData.append('screenshotFile', makeImageFile())
    formData.append('channelId', 'C123')
    formData.append('name', 'Carol')
    formData.append('email', 'carol@example.com')
    formData.append('projectName', 'TestProject')

    const req = new Request('http://localhost/api/mus/standalone-upload', {
      method: 'POST',
      body: formData,
    })

    const res = await handlers.POSTStandalone(req)
    expect(res.status).toBe(200)
    expect(onStandaloneFeedback).toHaveBeenCalledOnce()

    const event: StandaloneEvent = onStandaloneFeedback.mock.calls[0][0]
    expect(event.channelId).toBe('C123')
    expect(Buffer.isBuffer(event.screenshotBuffer)).toBe(true)
    expect(event.mp3Buffer).toBeUndefined()
  })

  it('returns 400 when no files are provided', async () => {
    const handlers = createMusHandlers({ adapter: { onStandaloneFeedback } })

    const formData = new FormData()
    formData.append('channelId', 'C123')
    const req = new Request('http://localhost/api/mus/standalone-upload', {
      method: 'POST',
      body: formData,
    })
    const res = await handlers.POSTStandalone(req)
    expect(res.status).toBe(400)
    expect(onStandaloneFeedback).not.toHaveBeenCalled()
  })

  it('multiple adapters — both onStandaloneFeedback callbacks are called', async () => {
    const adapterA = { onStandaloneFeedback: vi.fn().mockResolvedValue(undefined) }
    const adapterB = { onStandaloneFeedback: vi.fn().mockResolvedValue(undefined) }
    const handlers = createMusHandlers({ adapter: [adapterA, adapterB] })

    const formData = new FormData()
    formData.append('screenshotFile', makeImageFile())
    formData.append('channelId', 'C123')
    const req = new Request('http://localhost/api/mus/standalone-upload', {
      method: 'POST',
      body: formData,
    })

    await handlers.POSTStandalone(req)
    expect(adapterA.onStandaloneFeedback).toHaveBeenCalledOnce()
    expect(adapterB.onStandaloneFeedback).toHaveBeenCalledOnce()
  })
})
