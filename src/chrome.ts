import { toPng } from 'html-to-image'

declare const chrome: {
  tabs: {
    query: (q: { active: boolean; currentWindow: boolean }) => Promise<Array<{ windowId?: number }>>
    captureVisibleTab: (
      windowId: number,
      options: { format: 'png' | 'jpeg' },
      cb: (dataUrl: string) => void
    ) => void
  }
  runtime: { lastError?: { message: string } }
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

async function captureExtensionUI(): Promise<string> {
  const fontEmbedCSS = await prefetchFonts()
  return toPng(document.documentElement, {
    pixelRatio: window.devicePixelRatio || 1,
    cacheBust: true,
    ...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }),
  })
}

async function captureActiveTab(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.windowId) throw new Error('No active tab found')
  return new Promise<string>((resolve, reject) => {
    chrome.tabs.captureVisibleTab(tab.windowId!, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
      else resolve(dataUrl)
    })
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

/**
 * Captures both the active browser tab (the webpage) and the extension UI
 * (popup or side panel DOM) and composites them into a single image:
 * the page as the background with the extension overlaid in the top-right
 * corner — matching what the user actually sees on screen.
 *
 * Use as `standalone.onCaptureScreenshot` from a Chrome MV3 extension that has
 * `activeTab` and `tabs` permissions.
 */
export async function captureExtensionAndTab(): Promise<string> {
  const [tabUrl, extUrl] = await Promise.all([captureActiveTab(), captureExtensionUI()])
  const [tabImg, extImg] = await Promise.all([loadImage(tabUrl), loadImage(extUrl)])

  const canvas = document.createElement('canvas')
  canvas.width = tabImg.naturalWidth
  canvas.height = tabImg.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context not available')

  ctx.drawImage(tabImg, 0, 0)

  const padding = Math.round(tabImg.naturalWidth * 0.012)
  const maxExtWidth = Math.round(tabImg.naturalWidth * 0.4)
  const maxExtHeight = Math.round(tabImg.naturalHeight * 0.85)
  const scale = Math.min(1, maxExtWidth / extImg.naturalWidth, maxExtHeight / extImg.naturalHeight)
  const extW = Math.round(extImg.naturalWidth * scale)
  const extH = Math.round(extImg.naturalHeight * scale)
  const extX = canvas.width - extW - padding
  const extY = padding

  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 6
  ctx.drawImage(extImg, extX, extY, extW, extH)
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0

  return canvas.toDataURL('image/png')
}
