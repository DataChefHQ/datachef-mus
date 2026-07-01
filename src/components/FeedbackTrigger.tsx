import { cn } from '@/lib/utils'
import { Lightbulb, Loader2, X } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

interface FeedbackTriggerProps {
  onClick: () => void
  isActive: boolean
  loading?: boolean
  className?: string
  style?: CSSProperties
  /** Custom icon to show when the trigger is idle (not active, not loading) */
  icon?: ReactNode
}

export function FeedbackTrigger({
  onClick,
  isActive,
  loading = false,
  className,
  style,
  icon,
}: FeedbackTriggerProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex size-9 items-center justify-center rounded-[12px] transition-shadow duration-200',
        'bg-mus-accent-foreground text-mus-secondary-foreground',
        'shadow-[0_3px_3px_0_rgba(0,0,0,0.12)]',
        isActive && 'shadow-[0_0_0_3px_rgba(115,115,115,0.5)]',
        'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(115,115,115,0.5)]',
        loading ? 'opacity-70 cursor-not-allowed' : 'mus-grow',
        className
      )}
      style={style}
      aria-label={isActive ? 'Close feedback actions' : 'Open feedback actions'}
      title={isActive ? 'Close' : 'Give feedback'}
    >
      {loading
        ? <Loader2 className="size-4 animate-spin pointer-events-none" />
        : isActive
          ? <X className="size-4 pointer-events-none" />
          : (icon ?? <Lightbulb className="size-4 pointer-events-none" />)
      }
    </button>
  )
}
