import { useRef, useState, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DialogShell, CancelButton } from './DialogShell'

interface VideoDialogProps {
  sectionId: string
  sectionName: string
  onClose: () => void
  videoUrl?: string
}

export function VideoDialog({
  sectionName,
  onClose,
  videoUrl,
}: VideoDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = Math.floor(s % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }, [])

  const toggleFullscreen = useCallback(() => {
    videoRef.current?.requestFullscreen?.()
  }, [])

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)
    setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0)
  }

  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (video) setDuration(video.duration)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    video.currentTime = ratio * video.duration
  }

  const handleEnded = () => setPlaying(false)

  return (
    <DialogShell
      title="Overview"
      description="This video provides an overview of this section and its purpose."
      onClose={onClose}
      className="max-w-2xl"
      footer={<CancelButton onClick={onClose} />}
    >
      <div className="flex flex-col gap-2 rounded-mus-md overflow-hidden">
        {videoUrl ? (
          <div className="relative aspect-video w-full rounded-mus-md overflow-hidden bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
              className="size-full object-cover"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              onClick={togglePlay}
            />

            {/* Controls overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
                    {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>
                  <span className="text-xs">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <button onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
                    {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                  </button>
                  <button onClick={toggleFullscreen} aria-label="Fullscreen">
                    <Maximize className="size-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div
                className="mt-2 h-1 w-full cursor-pointer rounded-full bg-white/30"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-mus-md bg-mus-card">
            <p className="text-sm text-mus-muted-foreground">
              No video available for &ldquo;{sectionName}&rdquo;
            </p>
          </div>
        )}
      </div>
    </DialogShell>
  )
}
