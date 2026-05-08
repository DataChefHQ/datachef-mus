import { cn } from '@/lib/utils'
import { Lightbulb, Loader2 } from 'lucide-react'
import type { CSSProperties } from 'react'

interface FeedbackTriggerProps {
  onClick: () => void
  isActive: boolean
  loading?: boolean
  className?: string
  style?: CSSProperties
}

export function FeedbackTrigger({
  onClick,
  isActive,
  loading = false,
  className,
  style,
}: FeedbackTriggerProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex size-9 items-center justify-center rounded-[12px] transition-shadow duration-200',
        'bg-mus-accent-foreground text-mus-accent',
        'shadow-xs',
        isActive && 'shadow-[0_0_0_3px_rgba(163,163,163,0.5)]',
        'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(163,163,163,0.5)]',
        loading ? 'opacity-70 cursor-not-allowed' : 'mus-grow',
        className
      )}
      style={style}
      aria-label="Open feedback actions"
      title="Give feedback"
    >
      {loading
        ? <Loader2 className="size-4 animate-spin pointer-events-none" />
        : <Lightbulb className="size-4 pointer-events-none" />
      }
    </button>
  )
}
