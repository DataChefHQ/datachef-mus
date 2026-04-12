import { useMusConfig } from '@/context/MusContext'
import { sendThumbsFeedback } from '@/lib/slack-client'
import type { FeedbackActionType } from '@/types'

export function useFeedbackActions(sectionId: string, sectionName: string) {
  const config = useMusConfig()

  const handleAction = (actionType: FeedbackActionType): 'dialog' | 'done' => {
    switch (actionType) {
      case 'thumbs-up':
      case 'thumbs-down':
        // Fire-and-forget — call Chefbot directly
        sendThumbsFeedback(config.slack, {
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
        return 'done'

      default:
        return 'dialog'
    }
  }

  return { handleAction, config }
}
