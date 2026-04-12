import { cn } from '@/lib/utils'
import {
  Headset,
  Youtube,
  Mic,
  ThumbsDown,
  ThumbsUp,
  type LucideIcon,
} from 'lucide-react'
import type { FeedbackAction, FeedbackActionType } from '@/types'

const ACTION_ICONS: Record<FeedbackActionType, LucideIcon> = {
  support: Headset,
  voice: Mic,
  video: Youtube,
  'thumbs-down': ThumbsDown,
  'thumbs-up': ThumbsUp,
}

const ACTION_LABELS: Record<FeedbackActionType, string> = {
  support: 'Get support',
  voice: 'Voice feedback',
  video: 'Introduction video',
  'thumbs-down': 'Not helpful',
  'thumbs-up': 'Helpful',
}

interface FeedbackToolbarProps {
  actions: FeedbackAction[]
  onAction: (type: FeedbackActionType) => void
  className?: string
  /** Transform origin for the grow animation */
  growOrigin?: string
}

export function FeedbackToolbar({
  actions,
  onAction,
  className,
  growOrigin = 'right center',
}: FeedbackToolbarProps) {
  const enabledActions = actions.filter((a) => a.enabled !== false)

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        className
      )}
    >
      {enabledActions.map((action, index) => {
        const Icon = ACTION_ICONS[action.type]
        const label = action.label ?? ACTION_LABELS[action.type]

        return (
          <button
            key={action.type}
            onClick={() => onAction(action.type)}
            className={cn(
              'flex size-7 items-center justify-center rounded-full',
              'bg-accent-foreground text-accent',
              'shadow-xs transition-shadow duration-150',
              'hover:opacity-80',
              'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(163,163,163,0.5)]',
              'mus-grow'
            )}
            style={{
              transformOrigin: growOrigin,
              animationDelay: `${index * 50}ms`,
            }}
            aria-label={label}
            title={label}
          >
            <Icon className="size-4 pointer-events-none" />
          </button>
        )
      })}
    </div>
  )
}
