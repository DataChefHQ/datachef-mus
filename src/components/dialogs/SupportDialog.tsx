import { useState } from 'react'
import { useMusConfig } from '@/context/MusContext'
import { useMusUser } from '@/hooks/useMusUser'
import { createSupportChannel } from '@/lib/slack-client'
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
      await createSupportChannel(config.slack, config.projectName, {
        name,
        email,
        topic: message.trim(),
        sectionId,
        sectionName,
        projectSlug: config.projectSlug,
      })

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
      description="Describe your issue and our support team will follow up with you shortly."
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 px-0">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What you need help with?"
          rows={4}
          className={cn(
            'min-h-[60px] w-full resize-none rounded-mus-md border border-mus-input bg-white/5 px-3 py-2',
            'text-sm leading-[20px] text-mus-foreground shadow-xs',
            'placeholder:text-mus-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-mus-ring'
          )}
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={cn(
            'h-9 w-full rounded-mus-md bg-mus-primary',
            'text-sm font-medium text-mus-primary-foreground shadow-xs',
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
