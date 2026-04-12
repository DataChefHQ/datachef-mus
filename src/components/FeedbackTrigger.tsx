import { cn } from '@/lib/utils'
import { Lightbulb } from 'lucide-react'
import type { CSSProperties } from 'react'

interface FeedbackTriggerProps {
  onClick: () => void
  isActive: boolean
  className?: string
  style?: CSSProperties
}

export function FeedbackTrigger({
  onClick,
  isActive,
  className,
  style,
}: FeedbackTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex size-9 items-center justify-center rounded-[12px] transition-shadow duration-200',
        'bg-accent-foreground text-accent',
        'shadow-xs',
        isActive && 'shadow-[0_0_0_3px_rgba(163,163,163,0.5)]',
        'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(163,163,163,0.5)]',
        'mus-grow',
        className
      )}
      style={style}
      aria-label="Open feedback actions"
      title="Give feedback"
    >
      <Lightbulb className="size-4 pointer-events-none" />
    </button>
  )
}
