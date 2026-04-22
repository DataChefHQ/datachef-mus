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
  Pause,
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
    // Query permission status via Permissions API
    navigator.permissions?.query({ name: 'microphone' as PermissionName }).then((status) => {
      if (status.state === 'prompt') {
        setShowPermissionAlert(true)
      }
    }).catch(() => {
      // Permissions API not supported — fall back to device label check
    })

    navigator.mediaDevices?.enumerateDevices().then((all) => {
      const mics = all.filter((d) => d.kind === 'audioinput')
      setDevices(mics)
      if (mics.length > 0 && !selectedDevice) {
        setSelectedDevice(mics[0].deviceId)
      }
      // Labeled devices = permission already granted
      if (mics.some((d) => d.label)) {
        setShowPermissionAlert(false)
      }
    }).catch(() => {
      // Permission not granted yet — will enumerate after recording starts
    })
  }, [selectedDevice])

  const startRecording = useCallback(async () => {
    // Stop any active playback
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

      // Permission granted — hide alert and re-enumerate
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
      // Microphone access denied
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
    startRecording()
  }, [startRecording])

  const togglePlayback = useCallback(() => {
    if (!audioBlob) return

    if (playing && audioRef.current) {
      audioRef.current.pause()
      setPlaying(false)
      return
    }

    // Create audio element if needed
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
      })
      config.onFeedbackSubmitted?.('voice', sectionId, sectionName)
      onClose()
    } catch {
      // TODO: error handling
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DialogShell
      title="Feedback"
      description="Let us know what you think about this section"
      onClose={onClose}
    >
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
              'h-10 w-full appearance-none rounded-mus-md border border-mus-input bg-mus-background px-3 pr-8',
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

      {/* Voice recorder */}
      <div className="flex flex-col items-center gap-2 px-8">
        {/* Timer */}
        <p className="text-lg text-mus-foreground">
          {audioBlob && !recording
            ? formatTime(playing ? playbackTime : seconds)
            : formatTime(seconds)}
        </p>

        {/* Controls */}
        {recording ? (
          /* ── Recording: red stop button ── */
          <button
            onClick={stopRecording}
            className="flex size-9 items-center justify-center rounded-mus-md bg-mus-destructive text-white shadow-xs"
            aria-label="Stop recording"
          >
            <CircleStop className="size-4" />
          </button>
        ) : audioBlob ? (
          /* ── Recorded: re-record + play + submit inline ── */
          <div className="flex items-center gap-2">
            <button
              onClick={reRecord}
              className={cn(
                'flex size-9 items-center justify-center rounded-mus-md shadow-xs',
                'border border-mus-input bg-mus-background text-mus-foreground',
                'hover:bg-mus-accent hover:text-mus-accent-foreground transition-colors'
              )}
              aria-label="Re-record"
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              onClick={togglePlayback}
              className="flex size-9 items-center justify-center rounded-mus-md bg-[#63a0e5] text-white shadow-xs"
              aria-label={playing ? 'Pause playback' : 'Play recording'}
            >
              {playing ? (
                <Pause className="size-4" />
              ) : (
                <CirclePlay className="size-4" />
              )}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={cn(
                'h-9 rounded-mus-md bg-mus-primary px-4',
                'text-sm font-medium text-mus-primary-foreground shadow-xs',
                'hover:opacity-90 transition-opacity',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {submitting ? 'Sending...' : 'Submit'}
            </button>
          </div>
        ) : (
          /* ── Idle: green mic button ── */
          <button
            onClick={startRecording}
            className="flex size-9 items-center justify-center rounded-mus-md bg-[#4bb052] text-white shadow-xs"
            aria-label="Start recording"
          >
            <Mic className="size-4" />
          </button>
        )}

        {/* Helper text */}
        <p className="text-xs text-mus-muted-foreground">
          {recording
            ? 'Recording... tap the square to stop recording'
            : 'tap the mic to start recording (Max 3 mins)'}
        </p>

        {/* Progress bar — visible during recording or when a recording exists */}
        {(recording || audioBlob) && (
          <div
            className={cn(
              'h-2 w-full overflow-hidden rounded-full bg-black/80',
              audioBlob && !recording && 'cursor-pointer'
            )}
            onClick={audioBlob && !recording ? handleProgressClick : undefined}
          >
            <div
              className="h-full bg-mus-foreground transition-[width] duration-200"
              style={{
                width: `${(recording ? recordingProgress : playbackProgress) * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Permission alert — shown before first recording */}
      {showPermissionAlert && !recording && !audioBlob && (
        <div className="rounded-mus-lg border border-mus-border bg-mus-card px-4 py-3">
          <div className="flex items-start gap-3">
            <Mic className="mt-0.5 size-4 shrink-0 text-mus-foreground" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-mus-foreground">
                Microphone permission
              </p>
              <p className="text-sm text-mus-muted-foreground">
                Your browser will ask for permission. please allow it to continue
              </p>
            </div>
          </div>
        </div>
      )}
    </DialogShell>
  )
}
