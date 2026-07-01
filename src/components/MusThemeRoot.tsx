import type { ReactNode } from 'react'
import { useMusTheme } from '@/context/MusThemeContext'

interface MusThemeRootProps {
  children: ReactNode
}

/**
 * Wraps mus UI with a data-mus-theme attribute so dark-mode CSS variables apply.
 * Renders in the light DOM so positioning and mouse events work reliably.
 * Style isolation relies on @layer mus having higher cascade priority than
 * the host app's layers (mus stylesheet is imported after host styles).
 *
 * Must be rendered inside <MusProvider>.
 */
export function MusThemeRoot({ children }: MusThemeRootProps) {
  const theme = useMusTheme()

  return (
    <div data-mus-theme={theme}>
      {children}
    </div>
  )
}
