import { useState, useRef, useCallback, useEffect } from 'react'
import { useMusConfig } from '@/context/MusContext'
import { useMusUser } from '@/hooks/useMusUser'
import { sendVoiceFeedback } from '@/lib/slack-client'
import { simulateFeedback } from '@/lib/demo-mode'
import {
  Mic,
  ChevronDown,
  CircleStop,
  CirclePlay,
  CirclePause,
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
    } catch (err) {
      if ((err as Error)?.name === 'NotAllowedError') {
        setShowPermissionAlert(true)
      }
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
      if (config.demoMode) {
        await simulateFeedback('voice', {
          projectName: config.projectName,
          name,
          email,
          sectionId,
          sectionName,
          audioBlobSize: audioBlob.size,
          note: note.trim() || undefined,
        })
      } else {
        await sendVoiceFeedback(config.slack, config.projectName, {
          name,
          email,
          sectionId,
          sectionName,
          audioBlob,
          note: note.trim() || undefined,
        })
      }
      config.onFeedbackSubmitted?.('voice', sectionId, sectionName)
      onClose()
    } catch {
      // TODO: error handling
    } finally {
      setSubmitting(false)
    }
  }

  const hasRecording = !!audioBlob && !recording

  const canSubmit = hasRecording || (showNote && note.trim().length > 0)
  const isInteracting = recording || hasRecording
  const showAlert = showPermissionAlert && !recording && !audioBlob && !hasRecording

  return (
    <DialogShell
      title="Feedback"
      description="Let us know what you think about this section"
      onClose={onClose}
      className="!max-w-[449px]"
    >
      {/* Top — note toggle OR note textarea */}
      {!showNote ? (
        <div className="flex w-full items-center justify-between">
          <span className="pr-[8px] text-[14px] leading-[20px] text-mus-muted-foreground whitespace-nowrap">
            Record your message or
          </span>
          <div className="h-px flex-1 bg-mus-border" />
          <button
            onClick={() => setShowNote(true)}
            className={cn(
              'flex h-[32px] items-center gap-[8px] rounded-mus-md px-[12px] py-[8px]',
              'text-[12px] leading-[16px] font-medium text-mus-foreground',
              'hover:bg-white/5 transition-colors whitespace-nowrap'
            )}
          >
            <Plus className="size-4" />
            Add a note
          </button>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-[8px]">
          <label className="text-[14px] leading-none font-medium text-mus-foreground">
            Your feedback
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your note here..."
            className={cn(
              'min-h-[72px] w-full rounded-mus-md border border-mus-input bg-white/5 px-[12px] py-[8px]',
              'text-[14px] leading-[20px] text-mus-foreground placeholder:text-mus-muted-foreground',
              'shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
              'focus:outline-none focus:ring-2 focus:ring-mus-ring resize-none'
            )}
          />
        </div>
      )}

      {/* Microphone + recording surface — Figma "Flex Vertical" (422:4952) gap-16 */}
      <div className="flex w-full flex-col gap-[16px]">
      {/* Microphone selector — h-40, rounded-md (12), input border */}
      <div className="flex w-full flex-col gap-[8px]">
        <label className="text-[14px] leading-none font-medium text-mus-foreground">
          Microphone
        </label>
        <div className="relative">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className={cn(
              'h-[40px] w-full appearance-none rounded-mus-md border border-mus-input bg-white/5',
              'px-[12px] pr-[36px] text-[14px] leading-[20px] text-mus-muted-foreground',
              'shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
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
          <ChevronDown className="pointer-events-none absolute right-[12px] top-1/2 size-4 -translate-y-1/2 text-mus-muted-foreground" />
        </div>
      </div>

      {/* Recording surface — timer, optional progress bar, control buttons */}
      <div className="flex flex-col items-center gap-[16px] w-full">
        <p className="text-[18px] leading-[28px] text-mus-foreground tabular-nums">
          {formatTime(
            hasRecording ? (playing ? playbackTime : seconds) : seconds
          )}
        </p>

        {isInteracting && (
          <div
            className={cn(
              'h-[8px] w-full overflow-hidden rounded-full bg-black/80',
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
        )}

        {recording ? (
          <button
            onClick={stopRecording}
            className={cn(
              'flex size-[48px] items-center justify-center rounded-mus-md',
              'bg-mus-destructive text-white',
              'shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
              'hover:opacity-90 transition-opacity'
            )}
            aria-label="Stop recording"
          >
            <CircleStop className="size-6" />
          </button>
        ) : hasRecording ? (
          <div className="flex items-center gap-[8px]">
            <button
              onClick={togglePlayback}
              className={cn(
                'flex size-[40px] items-center justify-center rounded-mus-md',
                'bg-[#63a0e5] text-white',
                'shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
                'hover:opacity-90 transition-opacity'
              )}
              aria-label={playing ? 'Pause playback' : 'Play recording'}
            >
              {playing ? <CirclePause className="size-4" /> : <CirclePlay className="size-4" />}
            </button>
            <button
              onClick={reRecord}
              className={cn(
                'flex size-[40px] items-center justify-center rounded-mus-md',
                'border border-mus-input bg-white/[0.043] text-mus-foreground',
                'shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
                'hover:bg-white/[0.08] transition-colors'
              )}
              aria-label="Re-record"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={startRecording}
            className={cn(
              'flex size-[48px] items-center justify-center rounded-mus-md',
              'bg-[#4bb052] text-white',
              'shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
              'hover:opacity-90 transition-opacity'
            )}
            aria-label="Start recording"
          >
            <Mic className="size-6" />
          </button>
        )}

        <p className="text-[12px] leading-[16px] font-light text-mus-muted-foreground whitespace-nowrap">
          tap the mic to start recording (Max 3 mins)
        </p>
      </div>
      </div>

      {/* Bottom: permission alert OR submit button */}
      {showAlert ? (
        <div className="rounded-mus-lg border border-[#f8717199] bg-mus-card px-[16px] py-[12px] w-full">
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center gap-[8px]">
              <Mic className="size-4 shrink-0 text-mus-foreground" />
              <p className="text-[14px] leading-[20px] font-medium text-mus-foreground">
                Microphone permission asked
              </p>
            </div>
            {/* pl = icon (16px) + gap (8px) = 24px, aligns description under title */}
            <p className="pl-[24px] text-[14px] leading-[20px] text-mus-muted-foreground">
              Your browser will ask for permission. please allow it to continue
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={cn(
            'h-[40px] w-full rounded-mus-md px-[32px] text-[14px] leading-[20px] font-medium transition-all',
            'shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
            canSubmit
              ? 'bg-mus-primary text-mus-primary-foreground hover:opacity-90'
              : 'border border-mus-input bg-transparent text-mus-muted-foreground cursor-not-allowed'
          )}
        >
          {submitting ? 'Sending...' : 'Submit'}
        </button>
      )}
    </DialogShell>
  )
}
