/* ── Standalone mode ─────────────────────────────────────── */

export interface StandaloneConfig {
  /** Async callback that captures the current page screenshot.
   *  Should return a base64 data URL (e.g. "data:image/png;base64,…") or a Blob.
   *  If omitted, the dialog opens without a screenshot. */
  onCaptureScreenshot?: () => Promise<string | Blob>

  /** Where the floating button appears on the page (default: 'bottom-right') */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

  /** Upload endpoint for screenshot + voice (default: '/api/mus/standalone-upload').
   *  The package provides a ready-made handler — see `@datachefhq/mus/server` (POSTStandalone). */
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
   *  The package provides a ready-made handler — see `@datachefhq/mus/server`. */
  voiceUploadUrl?: string

  /** URL for the support channel endpoint (default: "/api/mus/support-channel").
   *  The package provides a ready-made handler — see `@datachefhq/mus/server` (POSTSupportChannel). */
  supportChannelUrl?: string
}

/* ── Icon overrides ──────────────────────────────────────── */

import type { ReactNode } from 'react'

export interface MusIcons {
  /** Trigger button icon (default: Lightbulb) */
  trigger?: ReactNode
  /** Support action icon (default: Slack) */
  support?: ReactNode
  /** Voice action icon (default: Mic) */
  voice?: ReactNode
  /** Video action icon (default: Youtube) */
  video?: ReactNode
  /** Thumbs up action icon (default: ThumbsUp) */
  thumbsUp?: ReactNode
  /** Thumbs down action icon (default: ThumbsDown) */
  thumbsDown?: ReactNode
  /** Standalone FAB icon (default: MessageCircle) */
  standalone?: ReactNode
}

/* ── User resolver ───────────────────────────────────────── */

/** Shape returned by useMusUser() and user resolvers. */
export type MusUser = { name: string; email: string }

/** A React hook that returns the current user's name and email.
 *  Pass to MusProvider via config.userResolver.
 *  Use a built-in resolver (stytchResolver, clerkResolver, etc.) or write your own. */
export type UserResolver = () => MusUser

/** Position of the FeedbackTarget trigger icon relative to the section. */
export type TriggerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/* ── Configuration ───────────────────────────────────────── */

export interface MusConfig {
  /** Master switch — set to false to disable all mus widgets globally (default: true) */
  enabled?: boolean

  /** Show the welcome/onboarding dialog on first visit (default: true) */
  showWelcomeDialog?: boolean

  /** Demo mode — when true, feedback actions are simulated locally (no network calls
   *  are made to Slack or the server). The `slack` config can use placeholder values.
   *  Useful for live playground demos on docs sites. */
  demoMode?: boolean

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

  /** Pluggable auth resolver hook — see @datachefhq/mus/resolvers/* for built-ins.
   *  Takes priority over automatic Stytch detection; config.user always wins. */
  userResolver?: UserResolver

  /** Color theme for mus widgets: 'light' | 'dark' | 'auto' (default: 'auto') */
  theme?: 'light' | 'dark' | 'auto'

  /** Override default icons with any React node */
  icons?: MusIcons

  /** Delay in ms before showing the trigger icon on hover (default: 500) */
  hoverDelay?: number

  /** Position of the trigger relative to the target (default: "top-right") */
  triggerPosition?: TriggerPosition

  /** Callbacks */
  onThumbsUp?: (sectionId: string, sectionName: string) => void
  onThumbsDown?: (sectionId: string, sectionName: string) => void
  onFeedbackSubmitted?: (
    type: FeedbackActionType,
    sectionId: string,
    sectionName: string
  ) => void
}
