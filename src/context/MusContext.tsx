import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { MusConfig, FeedbackAction } from '@/types'
import { WelcomeDialog } from '@/components/dialogs/WelcomeDialog'
import { MusThemeContext } from '@/context/MusThemeContext'
import { MusThemeRoot } from '@/components/MusThemeRoot'

const DEFAULT_ACTIONS: FeedbackAction[] = [
  { type: 'support' },
  { type: 'thumbs-down' },
  { type: 'thumbs-up' },
  { type: 'voice' },
  { type: 'video' },
]

const MusContext = createContext<MusConfig | null>(null)

export interface MusProviderProps {
  config: Omit<MusConfig, 'actions'> & { actions?: FeedbackAction[] }
  children: ReactNode
}

function useResolvedTheme(theme: 'light' | 'dark' | 'auto' | undefined): 'light' | 'dark' {
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => {
    if (theme === 'light' || theme === 'dark') return theme
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    if (theme === 'light' || theme === 'dark') {
      setResolved(theme)
      return
    }
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolved(mq.matches ? 'dark' : 'light')
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  return resolved
}

export function MusProvider({ config, children }: MusProviderProps) {
  const fullConfig: MusConfig = {
    hoverDelay: 500,
    triggerPosition: 'top-right',
    actions: DEFAULT_ACTIONS,
    ...config,
  }

  const resolvedTheme = useResolvedTheme(fullConfig.theme)

  return (
    <MusThemeContext.Provider value={resolvedTheme}>
      <MusContext.Provider value={fullConfig}>
        {/* .dark class keeps the playground (light-DOM) styled correctly */}
        <div className={resolvedTheme === 'dark' ? 'dark' : ''} style={{ display: 'contents' }}>
          {children}
          {fullConfig.enabled !== false && fullConfig.mode !== 'standalone' && fullConfig.showWelcomeDialog !== false && (
            <MusThemeRoot>
              <WelcomeDialog />
            </MusThemeRoot>
          )}
        </div>
      </MusContext.Provider>
    </MusThemeContext.Provider>
  )
}

export function useMusConfig(): MusConfig {
  const ctx = useContext(MusContext)
  if (!ctx) {
    throw new Error('useMusConfig must be used within a <MusProvider>')
  }
  return ctx
}
