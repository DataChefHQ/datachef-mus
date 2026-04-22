import { createContext, useContext, type ReactNode } from 'react'
import type { MusConfig, FeedbackAction } from '@/types'
import { WelcomeDialog } from '@/components/dialogs/WelcomeDialog'

const DEFAULT_ACTIONS: FeedbackAction[] = [
  { type: 'support' },
  { type: 'video' },
  { type: 'voice' },
  { type: 'thumbs-down' },
  { type: 'thumbs-up' },
]

const MusContext = createContext<MusConfig | null>(null)

export interface MusProviderProps {
  config: Omit<MusConfig, 'actions'> & { actions?: FeedbackAction[] }
  children: ReactNode
}

export function MusProvider({ config, children }: MusProviderProps) {
  const fullConfig: MusConfig = {
    hoverDelay: 500,
    triggerPosition: 'top-right',
    actions: DEFAULT_ACTIONS,
    ...config,
  }

  return (
    <MusContext.Provider value={fullConfig}>
      {children}
      <WelcomeDialog />
    </MusContext.Provider>
  )
}

export function useMusConfig(): MusConfig {
  const ctx = useContext(MusContext)
  if (!ctx) {
    throw new Error('useMusConfig must be used within a <MusProvider>')
  }
  return ctx
}
