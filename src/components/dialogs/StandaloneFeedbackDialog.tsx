import { useState, useRef, useCallback, useEffect } from 'react'
import { useMusConfig } from '@/context/MusContext'
import { useMusUser } from '@/hooks/useMusUser'
import { sendStandaloneFeedback } from '@/lib/slack-client'
import { simulateFeedback } from '@/lib/demo-mode'
import {
  Mic,
  ChevronDown,
  CircleStop,
  CirclePlay,
  CirclePause,
  RotateCcw,
  ImageOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DialogShell } from './DialogShell'

const MAX_SECONDS = 180

interface StandaloneFeedbackDialogProps {
  screenshot: string | null
  sectionId?: string
  sectionName?: string
  onClose: () => void
}

export function StandaloneFeedbackDialog({
  screenshot,
  sectionId,
  sectionName,
  onClose,
}: StandaloneFeedbackDialogProps) {
  const config = useMusConfig()
  const { name, email } = useMusUser()

  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState('')

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [showPermissionAlert, setShowPermissionAlert] = useState(false)

  const [playing, setPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  useEffect(() => {
    navigator.permissions?.query({ name: 'microphone' as PermissionName }).then((status) => {
      if (status.state === 'prompt') setShowPermissionAlert(true)
    }).catch(() => {})

    navigator.mediaDevices?.enumerateDevices().then((all) => {
      const mics = all.filter((d) => d.kind === 'audioinput')
      setDevices(mics)
      if (mics.length > 0 && !selectedDevice) setSelectedDevice(mics[0].deviceId)
      if (mics.some((d) => d.label)) setShowPermissionAlert(false)
    }).catch(() => {})
  }, [selectedDevice])

  const startRecording = useCallback(async () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null }
    setPlaying(false)
    setPlaybackTime(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
      })
      setShowPermissionAlert(false)

      const all = await navigator.mediaDevices.enumerateDevices()
      setDevices(all.filter((d) => d.kind === 'audioinput'))

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        setAudioBlob(new Blob(chunksRef.current, { type: 'audio/webm' }))
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      setRecording(true)
      setSeconds(0)
      setAudioBlob(null)

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= MAX_SECONDS - 1) { stopRecording(); return MAX_SECONDS }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      if ((err as Error)?.name === 'NotAllowedError') {
        setShowPermissionAlert(true)
      }
    }
  }, [selectedDevice])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setRecording(false)
  }, [])

  const reRecord = useCallback(() => {
    setAudioBlob(null)
    setSeconds(0)
    setPlaybackTime(0)
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null }
    setPlaying(false)
  }, [])

  const togglePlayback = useCallback(() => {
    if (!audioBlob) return
    if (playing && audioRef.current) { audioRef.current.pause(); setPlaying(false); return }

    if (!audioRef.current) {
      const url = URL.createObjectURL(audioBlob)
      audioUrlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      audio.addEventListener('timeupdate', () => setPlaybackTime(audio.currentTime))
      audio.addEventListener('ended', () => { setPlaying(false); setPlaybackTime(0) })
    }

    audioRef.current.play()
    setPlaying(true)
  }, [audioBlob, playing])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || !audioBlob) return
      const rect = e.currentTarget.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      audioRef.current.currentTime = ratio * audioRef.current.duration
      setPlaybackTime(ratio * audioRef.current.duration)
    },
    [audioBlob]
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
      if (audioRef.current) audioRef.current.pause()
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    }
  }, [])

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0')
    const secs = Math.floor(s % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const recordingProgress = seconds / MAX_SECONDS
  const playbackProgress = audioRef.current?.duration ? playbackTime / audioRef.current.duration : 0
  const hasRecording = !!audioBlob && !recording

  const handleSubmit = async () => {
    if ((!audioBlob && !note.trim()) || submitting) return
    setSubmitting(true)

    try {
      if (config.demoMode) {
        await simulateFeedback('standalone', {
          projectName: config.projectName,
          name,
          email,
          audioBlobSize: audioBlob?.size,
          hasScreenshot: !!screenshot,
          note: note.trim() || undefined,
          sectionId,
          sectionName,
        })
      } else {
        await sendStandaloneFeedback(config.slack, config.projectName, {
          name,
          email,
          audioBlob: audioBlob ?? undefined,
          screenshotDataUrl: screenshot ?? undefined,
          note: note.trim() || undefined,
          uploadUrl: config.standalone?.uploadUrl,
          sectionId,
          sectionName,
        })
      }
      onClose()
    } catch {
      // TODO: surface error
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = (hasRecording || note.trim().length > 0) && !submitting

  return (
    <DialogShell
      title="Page Feedback"
      description="Record your voice feedback and attach a screenshot"
      onClose={onClose}
      className="!max-w-[520px]"
    >
      {/* Screenshot preview */}
      <div className="overflow-hidden rounded-mus-lg border border-mus-border bg-mus-card">
        {screenshot ? (
          <img
            src={screenshot}
            alt="Page screenshot"
            className="max-h-48 w-full object-contain"
          />
        ) : (
          <div className="flex h-24 items-center justify-center gap-2 text-mus-muted-foreground">
            <ImageOff className="size-4" />
            <span className="text-sm">No screenshot captured</span>
          </div>
        )}
      </div>

      {/* Note textarea */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium leading-none text-mus-foreground">
          Note <span className="font-normal text-mus-muted-foreground">(optional)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe what you see or what went wrong…"
          className={cn(
            'min-h-[60px] w-full rounded-mus-md border border-mus-input bg-white/5 px-3 py-2',
            'text-sm text-mus-foreground shadow-xs placeholder:text-mus-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-mus-ring resize-none'
          )}
        />
      </div>

      {/* Voice recording section */}
      <div className="flex flex-col gap-5 rounded-mus-lg border border-[#272d38] bg-[#121b2b] p-4">
        {showPermissionAlert && !recording && !audioBlob && (
          <div className="rounded-mus-lg border border-red-400/60 bg-mus-card px-4 py-3">
            <div className="flex items-start gap-3">
              <Mic className="mt-0.5 size-4 shrink-0 text-mus-foreground" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-mus-foreground">Microphone permission asked</p>
                <p className="text-sm text-mus-muted-foreground">
                  Your browser will ask for permission — please allow it to continue
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium leading-none text-mus-foreground">Microphone</label>
          <div className="relative">
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className={cn(
                'h-10 w-full appearance-none rounded-mus-md border border-mus-input bg-white/5 px-3 pr-8',
                'text-sm text-mus-muted-foreground shadow-xs',
                'focus:outline-none focus:ring-2 focus:ring-mus-ring'
              )}
            >
              {devices.length === 0 && <option value="">Default</option>}
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-mus-muted-foreground" />
          </div>
        </div>

        <div className="flex items-start gap-3">
          {recording ? (
            <button
              onClick={stopRecording}
              className="flex size-9 shrink-0 items-center justify-center rounded-mus-md bg-mus-destructive text-white shadow-xs"
              aria-label="Stop recording"
            >
              <CircleStop className="size-4" />
            </button>
          ) : hasRecording ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={togglePlayback}
                className="flex size-9 items-center justify-center rounded-mus-md bg-[#63a0e5] text-white shadow-xs"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <CirclePause className="size-4" /> : <CirclePlay className="size-4" />}
              </button>
              <button
                onClick={reRecord}
                className="flex size-9 items-center justify-center rounded-mus-md border border-mus-input bg-white/5 text-mus-foreground shadow-xs"
                aria-label="Re-record"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={startRecording}
              className="flex size-9 shrink-0 items-center justify-center rounded-mus-md bg-[#4bb052] text-white shadow-xs"
              aria-label="Start recording"
            >
              <Mic className="size-4" />
            </button>
          )}

          {recording || hasRecording ? (
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-base font-light text-mus-foreground">
                {hasRecording ? formatTime(playing ? playbackTime : seconds) : formatTime(seconds)}
              </p>
              <div
                className={cn('h-2 w-full overflow-hidden rounded-full bg-black/80', hasRecording && 'cursor-pointer')}
                onClick={hasRecording ? handleProgressClick : undefined}
              >
                <div
                  className="h-full bg-mus-foreground transition-[width] duration-200"
                  style={{ width: `${(recording ? recordingProgress : playbackProgress) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="flex-1 self-center text-sm text-mus-muted-foreground">
              tap the mic to record (optional, max 3 min)
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'h-9 shrink-0 rounded-mus-md bg-mus-primary px-4',
              'text-sm font-medium text-mus-primary-foreground shadow-xs',
              'hover:opacity-90 transition-opacity',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'w-[101px]'
            )}
          >
            {submitting ? 'Sending…' : 'Submit'}
          </button>
        </div>
      </div>
    </DialogShell>
  )
}
