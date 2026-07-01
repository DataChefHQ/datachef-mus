import { useState } from 'react'
import { useMusConfig } from '@/context/MusContext'
import { useMusUser } from '@/hooks/useMusUser'
import { createSupportChannel } from '@/lib/slack-client'
import { simulateFeedback } from '@/lib/demo-mode'
import { cn } from '@/lib/utils'
import { DialogShell } from './DialogShell'

interface SupportDialogProps {
  sectionId: string
  sectionName: string
  onClose: () => void
}

export function SupportDialog({
  sectionId,
  sectionName,
  onClose,
}: SupportDialogProps) {
  const config = useMusConfig()
  const { name, email } = useMusUser()

  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = message.trim().length > 0

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)

    try {
      if (config.demoMode) {
        await simulateFeedback('support', {
          projectName: config.projectName,
          name,
          email,
          topic: message.trim(),
          sectionId,
          sectionName,
          projectSlug: config.projectSlug,
        })
      } else {
        await createSupportChannel(config.slack, config.projectName, {
          name,
          email,
          topic: message.trim(),
          sectionId,
          sectionName,
          projectSlug: config.projectSlug,
        })
      }

      config.onFeedbackSubmitted?.('support', sectionId, sectionName)
      onClose()
    } catch {
      // TODO: error handling
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DialogShell
      title="Get Support"
      description="Need help? We'll create a dedicated Slack channel and invite you to chat directly with our support team."
      onClose={onClose}
    >
      <div className="flex w-full flex-col gap-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What you need help with?"
          rows={5}
          className={cn(
            'w-full resize-none rounded-mus-md border border-mus-input bg-white/5 px-[12px] py-[10px]',
            'text-[14px] leading-[20px] text-mus-foreground',
            'placeholder:text-mus-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-mus-ring'
          )}
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={cn(
            'flex h-[40px] w-full items-center justify-center rounded-mus-md bg-mus-primary px-4',
            'text-[14px] font-medium text-mus-primary-foreground',
            'hover:opacity-90 transition-opacity',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {submitting ? 'Creating...' : 'Start chat with support'}
        </button>
      </div>
    </DialogShell>
  )
}
