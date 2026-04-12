/* ── Action types ─────────────────────────────────────────── */

export type FeedbackActionType =
  | 'support'
  | 'voice'
  | 'video'
  | 'thumbs-up'
  | 'thumbs-down'

export interface FeedbackAction {
  type: FeedbackActionType
  /** Override the default icon label */
  label?: string
  /** Whether this action is enabled (default: true) */
  enabled?: boolean
}

/* ── User context ────────────────────────────────────────── */

export interface MusUser {
  name?: string
  email?: string
}

/* ── Slack configuration ─────────────────────────────────── */

export interface SlackConfig {
  /** Chefbot proxy URL (e.g. "https://chefbot.services.datachef.co/") */
  proxyUrl: string

  /** Emails of team members to add to support channels */
  supportTeamEmails: string[]

  /** Channel ID for feedback messages (text, voice, thumbs, support notifications) */
  feedbackChannelId: string

  /** Prefix for support channel names (default: "support") */
  channelNamePrefix?: string
}

/* ── Configuration ───────────────────────────────────────── */

export interface MusConfig {
  /** Project name — included in all Slack messages to identify the source app */
  projectName: string

  /** Slack integration config — calls Chefbot proxy directly from the browser */
  slack: SlackConfig

  /** Actions to show in the toolbar (order matters) */
  actions: FeedbackAction[]

  /** Pre-filled user context — if provided, forms auto-fill and may hide fields */
  user?: MusUser

  /** Delay in ms before showing the trigger icon on hover (default: 500) */
  hoverDelay?: number

  /** Position of the trigger relative to the target (default: "top-right") */
  triggerPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

  /** Callbacks */
  onThumbsUp?: (sectionId: string, sectionName: string) => void
  onThumbsDown?: (sectionId: string, sectionName: string) => void
  onFeedbackSubmitted?: (
    type: FeedbackActionType,
    sectionId: string,
    sectionName: string
  ) => void
}
