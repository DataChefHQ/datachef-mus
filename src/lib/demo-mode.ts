/* Demo-mode helpers — used when MusConfig.demoMode is true.
 *
 * Instead of making real network calls to Slack or the mus-server, this module
 * logs the payload to the console (in a styled group) and dispatches a custom
 * DOM event so playground UIs can show a "feedback received" toast.
 */

export type DemoEventType =
  | 'text'
  | 'voice'
  | 'thumbs-up'
  | 'thumbs-down'
  | 'support'
  | 'standalone'

export interface DemoEvent {
  type: DemoEventType
  payload: Record<string, unknown>
  timestamp: string
}

const EVENT_NAME = 'mus:demo-feedback'

export async function simulateFeedback(
  type: DemoEventType,
  payload: Record<string, unknown>
): Promise<void> {
  const event: DemoEvent = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  }

  if (typeof console !== 'undefined' && console.groupCollapsed) {
    console.groupCollapsed(
      `%c[MUS demo] %c${type}`,
      'color: #52b788; font-weight: 600;',
      'color: inherit;'
    )
    console.log(payload)
    console.groupEnd()
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<DemoEvent>(EVENT_NAME, { detail: event }))
  }

  // Simulate a small network delay so the UI feels realistic.
  await new Promise((resolve) => setTimeout(resolve, 300))
}

export function onDemoFeedback(
  listener: (event: DemoEvent) => void
): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => listener((e as CustomEvent<DemoEvent>).detail)
  window.addEventListener(EVENT_NAME, handler)
  return () => window.removeEventListener(EVENT_NAME, handler)
}
