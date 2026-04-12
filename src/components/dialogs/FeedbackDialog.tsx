import { useState, useRef, useCallback, useEffect } from 'react'
import { useMusConfig } from '@/context/MusContext'
import { sendTextFeedback, sendVoiceFeedback } from '@/lib/slack-client'
import { Mic, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DialogShell,
  DialogFormSection,
  DialogInput,
  DialogTextarea,
  CancelButton,
  SubmitButton,
} from './DialogShell'

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

  const [name, setName] = useState(config.user?.name ?? '')
  const [email, setEmail] = useState(config.user?.email ?? '')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Voice recording state
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Enumerate microphones on mount
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((all) => {
      const mics = all.filter((d) => d.kind === 'audioinput')
      setDevices(mics)
      if (mics.length > 0 && !selectedDevice) {
        setSelectedDevice(mics[0].deviceId)
      }
    }).catch(() => {
      // Permission not granted yet — will enumerate after recording starts
    })
  }, [selectedDevice])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
      })

      // Re-enumerate after permission granted
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
          if (prev >= 59) {
            stopRecording()
            return 60
          }
          return prev + 1
        })
      }, 1000)
    } catch {
      // Microphone access denied
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

  const toggleRecording = () => {
    if (recording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0')
    const secs = (s % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const canSubmit = name.trim() && email.trim() && (message.trim() || audioBlob)

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)

    try {
      if (audioBlob) {
        await sendVoiceFeedback(config.slack, {
          name: name.trim(),
          email: email.trim(),
          sectionId,
          sectionName,
          audioBlob,
        })
        config.onFeedbackSubmitted?.('voice', sectionId, sectionName)
      } else {
        await sendTextFeedback(config.slack, {
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          sectionId,
          sectionName,
        })
        config.onFeedbackSubmitted?.('text', sectionId, sectionName)
      }
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
      footer={
        <>
          <CancelButton onClick={onClose} />
          <SubmitButton onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? 'Sending...' : 'Submit feedback'}
          </SubmitButton>
        </>
      }
    >
      <DialogFormSection>
        <DialogInput label="Full Name" value={name} onChange={setName} placeholder="John Doe" />
        <DialogInput label="Email address" value={email} onChange={setEmail} placeholder="johndoe@mail.com" type="email" />
        <DialogTextarea
          label="Message Your feedback"
          value={message}
          onChange={setMessage}
          placeholder="Send text message or tap the mic to start recording"
        />

        {/* Microphone select */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium leading-none text-foreground">
            Microphone
          </label>
          <div className="relative">
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className={cn(
                'h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-8',
                'text-sm text-muted-foreground shadow-xs',
                'focus:outline-none focus:ring-2 focus:ring-ring'
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
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Voice recorder */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg text-foreground">{formatTime(seconds)}</p>
          <button
            onClick={toggleRecording}
            className={cn(
              'flex size-9 items-center justify-center rounded-md shadow-xs transition-colors',
              recording
                ? 'bg-destructive text-primary-foreground animate-pulse'
                : 'bg-primary text-primary-foreground'
            )}
            aria-label={recording ? 'Stop recording' : 'Start recording'}
          >
            <Mic className="size-4" />
          </button>
          <p className="text-xs text-muted-foreground">
            {audioBlob
              ? `Recorded ${formatTime(seconds)}`
              : recording
                ? 'Recording... tap to stop'
                : 'tap the mic to start recording (Max 60 seconds)'}
          </p>
        </div>
      </DialogFormSection>
    </DialogShell>
  )
}
