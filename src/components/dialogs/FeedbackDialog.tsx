import { useState, useRef, useCallback, useEffect } from 'react'
import { useMusConfig } from '@/context/MusContext'
import { useMusUser } from '@/hooks/useMusUser'
import { sendVoiceFeedback } from '@/lib/slack-client'
import {
  Mic,
  ChevronDown,
  CircleStop,
  CirclePlay,
  RotateCcw,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DialogShell } from './DialogShell'

const MAX_SECONDS = 180 // 3 minutes

interface FeedbackDialogProps {
  sectionId: string
  sectionName: string
  onClose: () => void
}

export function FeedbackDialog({
  sectionId,
  sectionName,
  onClose,
}: FeedbackDialogProps) {
  const config = useMusConfig()
  const { name, email } = useMusUser()

  const [submitting, setSubmitting] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')

  // Voice recording state
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [showPermissionAlert, setShowPermissionAlert] = useState(false)

  // Playback state
  const [playing, setPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  // Check mic permission and enumerate devices on mount
  useEffect(() => {
    navigator.permissions?.query({ name: 'microphone' as PermissionName }).then((status) => {
      if (status.state === 'prompt') {
        setShowPermissionAlert(true)
      }
    }).catch(() => {})

    navigator.mediaDevices?.enumerateDevices().then((all) => {
      const mics = all.filter((d) => d.kind === 'audioinput')
      setDevices(mics)
      if (mics.length > 0 && !selectedDevice) {
        setSelectedDevice(mics[0].deviceId)
      }
      if (mics.some((d) => d.label)) {
        setShowPermissionAlert(false)
      }
    }).catch(() => {})
  }, [selectedDevice])

  const startRecording = useCallback(async () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    setPlaying(false)
    setPlaybackTime(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
      })

      setShowPermissionAlert(false)
      const all = await navigator.mediaDevices.enumerateDevices()
      const mics = all.filter((d) => d.kind === 'audioinput')
      setDevices(mics)

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      setRecording(true)
      setSeconds(0)
      setAudioBlob(null)

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= MAX_SECONDS - 1) {
            stopRecording()
            return MAX_SECONDS
          }
          return prev + 1
        })
      }, 1000)
    } catch {
      setShowPermissionAlert(false)
    }
  }, [selectedDevice])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRecording(false)
  }, [])

  const reRecord = useCallback(() => {
    setAudioBlob(null)
    setSeconds(0)
    setPlaybackTime(0)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    setPlaying(false)
  }, [])

  const togglePlayback = useCallback(() => {
    if (!audioBlob) return

    if (playing && audioRef.current) {
      audioRef.current.pause()
      setPlaying(false)
      return
    }

    if (!audioRef.current) {
      const url = URL.createObjectURL(audioBlob)
      audioUrlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio

      audio.addEventListener('timeupdate', () => {
        setPlaybackTime(audio.currentTime)
      })

      audio.addEventListener('ended', () => {
        setPlaying(false)
        setPlaybackTime(0)
      })
    }

    audioRef.current.play()
    setPlaying(true)
  }, [audioBlob, playing])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || !audioBlob) return
      const rect = e.currentTarget.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const newTime = ratio * audioRef.current.duration
      audioRef.current.currentTime = newTime
      setPlaybackTime(newTime)
    },
    [audioBlob]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0')
    const secs = Math.floor(s % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const recordingProgress = seconds / MAX_SECONDS
  const playbackProgress =
    audioRef.current?.duration ? playbackTime / audioRef.current.duration : 0

  const handleSubmit = async () => {
    if (!audioBlob || submitting) return
    setSubmitting(true)

    try {
      await sendVoiceFeedback(config.slack, config.projectName, {
        name,
        email,
        sectionId,
        sectionName,
        audioBlob,
        note: note.trim() || undefined,
      })
      config.onFeedbackSubmitted?.('voice', sectionId, sectionName)
      onClose()
    } catch {
      // TODO: error handling
    } finally {
      setSubmitting(false)
    }
  }

  const hasRecording = !!audioBlob && !recording

  return (
    <DialogShell
      title="Feedback"
      description="Let us know what you think about this section"
      onClose={onClose}
      className="!max-w-[500px]"
    >
      {/* Record or Add a note toggle */}
      {!showNote && (
        <div className="flex items-center justify-between px-0">
          <span className="pr-2 text-sm text-mus-muted-foreground whitespace-nowrap">
            Record your message or
          </span>
          <div className="h-px flex-1 bg-mus-border" />
          <button
            onClick={() => setShowNote(true)}
            className="flex h-8 items-center gap-2 rounded-mus-md px-3 py-2 text-xs font-medium text-mus-foreground whitespace-nowrap"
          >
            <Plus className="size-4" />
            Add a note
          </button>
        </div>
      )}

      {/* Note textarea */}
      {showNote && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium leading-none text-mus-foreground">
            Note for your feedback
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your note here..."
            className={cn(
              'min-h-[60px] w-full rounded-mus-md border border-mus-input bg-white/5 px-3 py-2',
              'text-sm text-mus-foreground shadow-xs placeholder:text-mus-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-mus-ring resize-none'
            )}
          />
        </div>
      )}

      {/* Bottom section */}
      <div className="flex flex-col gap-5 rounded-mus-lg border border-[#272d38] bg-[#121b2b] p-4">
        {/* Permission alert */}
        {showPermissionAlert && !recording && !audioBlob && (
          <div className="rounded-mus-lg border border-red-400/60 bg-mus-card px-4 py-3">
            <div className="flex items-start gap-3">
              <Mic className="mt-0.5 size-4 shrink-0 text-mus-foreground" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-mus-foreground">
                  Microphone permission asked
                </p>
                <p className="text-sm text-mus-muted-foreground">
                  Your browser will ask for permission. please allow it to continue
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Microphone select */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium leading-none text-mus-foreground">
            Microphone
          </label>
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
              {devices.length === 0 && (
                <option value="">Default</option>
              )}
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-mus-muted-foreground" />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-start gap-3">
          {recording ? (
            /* Recording: red stop button */
            <button
              onClick={stopRecording}
              className="flex size-9 shrink-0 items-center justify-center rounded-mus-md bg-mus-destructive text-white shadow-xs"
              aria-label="Stop recording"
            >
              <CircleStop className="size-4" />
            </button>
          ) : hasRecording ? (
            /* Recorded: play + re-record */
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={togglePlayback}
                className="flex size-9 items-center justify-center rounded-mus-md bg-[#63a0e5] text-white shadow-xs"
                aria-label={playing ? 'Pause playback' : 'Play recording'}
              >
                <CirclePlay className="size-4" />
              </button>
              <button
                onClick={reRecord}
                className={cn(
                  'flex size-9 items-center justify-center rounded-mus-md shadow-xs',
                  'border border-mus-input bg-white/5 text-mus-foreground'
                )}
                aria-label="Re-record"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>
          ) : (
            /* Idle: green mic button */
            <button
              onClick={startRecording}
              className="flex size-9 shrink-0 items-center justify-center rounded-mus-md bg-[#4bb052] text-white shadow-xs"
              aria-label="Start recording"
            >
              <Mic className="size-4" />
            </button>
          )}

          {/* Timer + progress or helper text */}
          {recording || hasRecording ? (
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-base font-light text-mus-foreground">
                {hasRecording
                  ? formatTime(playing ? playbackTime : seconds)
                  : formatTime(seconds)}
              </p>
              <div
                className={cn(
                  'h-2 w-full overflow-hidden rounded-full bg-black/80',
                  hasRecording && 'cursor-pointer'
                )}
                onClick={hasRecording ? handleProgressClick : undefined}
              >
                <div
                  className="h-full bg-mus-foreground transition-[width] duration-200"
                  style={{
                    width: `${(recording ? recordingProgress : playbackProgress) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="flex-1 self-center text-sm text-mus-muted-foreground">
              tap the mic to start recording (Max 3 mins)
            </p>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!hasRecording || submitting}
            className={cn(
              'h-9 shrink-0 rounded-mus-md bg-mus-primary px-4',
              'text-sm font-medium text-mus-primary-foreground shadow-xs',
              'hover:opacity-90 transition-opacity',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'w-[101px]'
            )}
          >
            {submitting ? 'Sending...' : 'Submit'}
          </button>
        </div>
      </div>
    </DialogShell>
  )
}
