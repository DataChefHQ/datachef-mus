import { useMusConfig } from '@/context/MusContext'
import { sendThumbsFeedback } from '@/lib/slack-client'
import type { FeedbackActionType } from '@/types'
import { useThumbsStore } from './useThumbsStore'

export function useFeedbackActions(sectionId: string, sectionName: string) {
  const config = useMusConfig()
  const { vote: activeThumb, setVote: setActiveThumb } = useThumbsStore(sectionId)

  const handleAction = (actionType: FeedbackActionType): 'dialog' | 'done' => {
    switch (actionType) {
      case 'thumbs-up':
      case 'thumbs-down': {
        // Toggle: clicking the same thumb again removes the vote
        const isToggleOff = activeThumb === actionType
        setActiveThumb(isToggleOff ? null : actionType)

        if (!isToggleOff) {
          // Fire-and-forget — call Chefbot directly
          sendThumbsFeedback(config.slack, config.projectName, {
            type: actionType,
            sectionId,
            sectionName,
            email: config.user?.email,
          }).catch(() => {
            // Thumbs feedback is fire-and-forget
          })

          if (actionType === 'thumbs-up') {
            config.onThumbsUp?.(sectionId, sectionName)
          } else {
            config.onThumbsDown?.(sectionId, sectionName)
          }
          config.onFeedbackSubmitted?.(actionType, sectionId, sectionName)
        }
        return 'done'
      }

      default:
        return 'dialog'
    }
  }

  return { handleAction, config, activeThumb }
}
