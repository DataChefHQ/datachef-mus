import { useState, useCallback } from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMusConfig } from '@/context/MusContext'
import { StandaloneFeedbackDialog } from './dialogs/StandaloneFeedbackDialog'

const POSITION_CLASSES: Record<string, string> = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
}

export function StandaloneWidget() {
  const config = useMusConfig()
  const standalone = config.standalone ?? {}

  const position = standalone.position ?? 'bottom-right'
  const positionClass = POSITION_CLASSES[position]

  const [capturing, setCapturing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)

  const handleClick = useCallback(async () => {
    if (capturing || dialogOpen) return
    setCapturing(true)

    try {
      if (standalone.onCaptureScreenshot) {
        const result = await standalone.onCaptureScreenshot()

        if (typeof result === 'string') {
          setScreenshot(result)
        } else {
          // Convert Blob to data URL
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(result)
          })
          setScreenshot(dataUrl)
        }
      } else {
        setScreenshot(null)
      }
    } catch {
      setScreenshot(null)
    } finally {
      setCapturing(false)
      setDialogOpen(true)
    }
  }, [capturing, dialogOpen, standalone])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
    setScreenshot(null)
  }, [])

  return (
    <>
      <button
        onClick={handleClick}
        disabled={capturing}
        aria-label="Open feedback"
        className={cn(
          'fixed z-[2147483646] flex size-14 items-center justify-center',
          'rounded-full bg-mus-primary text-mus-primary-foreground shadow-lg',
          'hover:opacity-90 active:scale-95 transition-all duration-150',
          'disabled:opacity-70 disabled:cursor-not-allowed',
          positionClass
        )}
      >
        {capturing ? (
          <Loader2 className="size-6 animate-spin" />
        ) : (
          <MessageCircle className="size-6" />
        )}
      </button>

      {dialogOpen && (
        <StandaloneFeedbackDialog
          screenshot={screenshot}
          onClose={handleClose}
        />
      )}
    </>
  )
}
