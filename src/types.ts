/* ── Standalone mode ─────────────────────────────────────── */

export interface StandaloneConfig {
  /** Async callback that captures the current page screenshot.
   *  Should return a base64 data URL (e.g. "data:image/png;base64,…") or a Blob.
   *  If omitted, the dialog opens without a screenshot. */
  onCaptureScreenshot?: () => Promise<string | Blob>

  /** Where the floating button appears on the page (default: 'bottom-right') */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

  /** Upload endpoint for screenshot + voice (default: '/api/mus/standalone-upload').
   *  The package provides a ready-made handler — see `@datachef/mus/server` (POSTStandalone). */
  uploadUrl?: string
}

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

/* ── Slack configuration ─────────────────────────────────── */

export interface SlackConfig {
  /** Server-side proxy URL that forwards to your Slack delivery service (e.g. "/api/slack-proxy") */
  proxyUrl: string

  /** Emails of team members to add to support channels */
  supportTeamEmails: string[]

  /** Channel ID for feedback messages (text, voice, thumbs, support notifications) */
  feedbackChannelId: string

  /** Prefix for support channel names (default: "support") */
  channelNamePrefix?: string

  /** URL for the voice upload endpoint (default: "/api/mus/voice-upload").
   *  The package provides a ready-made handler — see `@datachef/mus/server`. */
  voiceUploadUrl?: string

  /** URL for the support channel endpoint (default: "/api/mus/support-channel").
   *  The package provides a ready-made handler — see `@datachef/mus/server` (POSTSupportChannel). */
  supportChannelUrl?: string
}

/* ── Configuration ───────────────────────────────────────── */

export interface MusConfig {
  /** Master switch — set to false to disable all mus widgets globally (default: true) */
  enabled?: boolean

  /** 'default' — embedded section widgets (existing behaviour).
   *  'standalone' — floating FAB button with screenshot + voice feedback. */
  mode?: 'default' | 'standalone'

  /** Configuration for standalone mode — only used when mode is 'standalone'. */
  standalone?: StandaloneConfig

  /** Project name — included in all Slack messages to identify the source app */
  projectName: string

  /** URL-safe slug used in support channel names (e.g. "impevia").
   *  Falls back to a slugified version of projectName if omitted. */
  projectSlug?: string

  /** Slack integration config — calls Chefbot proxy directly from the browser */
  slack: SlackConfig

  /** Actions to show in the toolbar (order matters) */
  actions: FeedbackAction[]

  /** Override user info — if not provided, falls back to Stytch session */
  user?: { name?: string; email?: string }

  /** Color theme for mus widgets: 'light' | 'dark' | 'auto' (default: 'auto') */
  theme?: 'light' | 'dark' | 'auto'

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
