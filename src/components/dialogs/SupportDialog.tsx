import { useState } from 'react'
import { useMusConfig } from '@/context/MusContext'
import { createSupportChannel } from '@/lib/slack-client'
import {
  DialogShell,
  DialogFormSection,
  DialogInput,
  DialogTextarea,
  CancelButton,
  SubmitButton,
} from './DialogShell'

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

  const [name, setName] = useState(config.user?.name ?? '')
  const [email, setEmail] = useState(config.user?.email ?? '')
  const [explanation, setExplanation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = name.trim() && email.trim() && explanation.trim()

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)

    try {
      await createSupportChannel(config.slack, config.projectName, {
        name: name.trim(),
        email: email.trim(),
        topic: explanation.trim(),
        sectionId,
        sectionName,
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
      description="Need help? We'll create a dedicated Slack channel and invite you to chat directly with our support team."
      onClose={onClose}
      footer={
        <>
          <CancelButton onClick={onClose} />
          <SubmitButton onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? 'Creating...' : 'Start chat with support'}
          </SubmitButton>
        </>
      }
    >
      <DialogFormSection>
        <DialogInput label="Full Name" value={name} onChange={setName} placeholder="John Doe" />
        <DialogInput label="Email address" value={email} onChange={setEmail} placeholder="johndoe@mail.com" type="email" />
        <DialogTextarea label="Explanation" value={explanation} onChange={setExplanation} placeholder="What you need help with?" />
      </DialogFormSection>
    </DialogShell>
  )
}
