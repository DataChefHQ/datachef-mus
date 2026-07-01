import { cn } from '@/lib/utils'
import {
  Slack,
  Youtube,
  Mic,
  ThumbsDown,
  ThumbsUp,
  type LucideIcon,
} from 'lucide-react'
import { useMusConfig } from '@/context/MusContext'
import type { FeedbackAction, FeedbackActionType, MusIcons } from '@/types'
import type { ReactNode } from 'react'

const DEFAULT_ICONS: Record<FeedbackActionType, LucideIcon> = {
  support: Slack,
  voice: Mic,
  video: Youtube,
  'thumbs-down': ThumbsDown,
  'thumbs-up': ThumbsUp,
}

const ICONS_KEY_MAP: Record<FeedbackActionType, keyof MusIcons> = {
  support: 'support',
  voice: 'voice',
  video: 'video',
  'thumbs-up': 'thumbsUp',
  'thumbs-down': 'thumbsDown',
}

const ACTION_LABELS: Record<FeedbackActionType, string> = {
  support: 'Teleport me to Slack',
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
  /** Currently active thumb vote for this section */
  activeThumb?: 'thumbs-up' | 'thumbs-down' | null
}

export function FeedbackToolbar({
  actions,
  onAction,
  className,
  growOrigin = 'right center',
  activeThumb,
}: FeedbackToolbarProps) {
  const config = useMusConfig()
  // Video is rendered separately by FeedbackTarget — filter it out
  const enabledActions = actions.filter(
    (a) => a.enabled !== false && a.type !== 'video'
  )

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        className
      )}
    >
      {enabledActions.map((action, index) => {
        const iconsKey = ICONS_KEY_MAP[action.type]
        const customIcon: ReactNode | undefined = config.icons?.[iconsKey] as ReactNode | undefined
        const DefaultIcon = DEFAULT_ICONS[action.type]
        const label = action.label ?? ACTION_LABELS[action.type]
        const isActiveThumbsDown =
          action.type === 'thumbs-down' && activeThumb === 'thumbs-down'
        const isActiveThumbsUp =
          action.type === 'thumbs-up' && activeThumb === 'thumbs-up'
        // Per Figma 212:2977 — mic uses p-2.5 (36px outer); others use p-1.5 (28px outer)
        const isVoice = action.type === 'voice'

        return (
          <button
            key={action.type}
            onClick={() => onAction(action.type)}
            className={cn(
              'flex items-center justify-center rounded-full',
              'shadow-[0_1px_2px_0_rgba(0,0,0,0.15)] transition-all duration-150',
              'hover:opacity-80',
              'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(163,163,163,0.5)]',
              'mus-grow',
              isVoice ? 'size-9' : 'size-7',
              isActiveThumbsDown
                ? 'bg-[#b91c1c] text-white shadow-[0_0_0_3px_rgba(248,113,113,0.4)]'
                : isActiveThumbsUp
                  ? 'bg-[#4bb052] text-white shadow-[0_0_0_3px_rgba(115,115,115,0.5)]'
                  : 'bg-mus-accent-foreground text-mus-secondary-foreground'
            )}
            style={{
              transformOrigin: growOrigin,
              animationDelay: `${index * 50}ms`,
            }}
            aria-label={label}
            title={label}
          >
            {customIcon ?? <DefaultIcon className="size-4 pointer-events-none" />}
          </button>
        )
      })}
    </div>
  )
}
