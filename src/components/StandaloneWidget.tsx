import { useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
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

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto+Mono&display=swap'

let _fontEmbedCSS: Promise<string> | null = null

function prefetchFonts(): Promise<string> {
  if (_fontEmbedCSS) return _fontEmbedCSS
  _fontEmbedCSS = (async () => {
    try {
      const cssRes = await fetch(GOOGLE_FONTS_URL)
      let css = await cssRes.text()
      const urls = [...css.matchAll(/url\((https?[^)]+)\)/g)].map((m) => m[1])
      await Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch(url)
            const buf = await res.arrayBuffer()
            let bin = ''
            const bytes = new Uint8Array(buf)
            for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
            const mime = url.includes('.woff2') ? 'font/woff2' : 'font/woff'
            css = css.replace(url, `data:${mime};base64,${btoa(bin)}`)
          } catch { /* skip */ }
        })
      )
      return css
    } catch {
      return ''
    }
  })()
  return _fontEmbedCSS
}

prefetchFonts()

async function defaultCaptureScreenshot(): Promise<string> {
  const fontEmbedCSS = await prefetchFonts()
  const dpr = window.devicePixelRatio || 1
  const scrollX = window.scrollX
  const scrollY = window.scrollY
  const vw = window.innerWidth
  const vh = window.innerHeight
  const fullDataUrl = await toPng(document.documentElement, {
    pixelRatio: dpr,
    cacheBust: true,
    ...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }),
  })
  const img = new Image()
  img.src = fullDataUrl
  await new Promise<void>((r) => { img.onload = () => r() })
  const canvas = document.createElement('canvas')
  canvas.width = vw * dpr
  canvas.height = vh * dpr
  canvas.getContext('2d')!.drawImage(img, scrollX * dpr, scrollY * dpr, vw * dpr, vh * dpr, 0, 0, vw * dpr, vh * dpr)
  return canvas.toDataURL('image/png')
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
      const capture = standalone.onCaptureScreenshot ?? defaultCaptureScreenshot
      const result = await capture()

      if (typeof result === 'string') {
        setScreenshot(result)
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(result)
        })
        setScreenshot(dataUrl)
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
