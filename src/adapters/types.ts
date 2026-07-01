/* ── Adapter event types ──────────────────────────────────── */

/** Emitted when a user submits a voice feedback recording. */
export interface VoiceEvent {
  /** MP3 buffer of the converted voice recording */
  mp3Buffer: Buffer
  /** Filename for the audio file (e.g. "voice-feedback-hero-1234567890.mp3") */
  filename: string
  /** Slack channel ID to post to */
  channelId: string
  /** Human-readable section name */
  sectionName: string
  /** Machine-readable section identifier */
  sectionId: string
  /** User display name (defaults to "Anonymous") */
  name: string
  /** User email (empty string if unauthenticated) */
  email: string
  /** Project name */
  projectName: string
  /** Optional note submitted with the recording */
  note: string
  /** Formatted comment string for display in the destination */
  comment: string
}

/** Emitted when a user submits a support request. */
export interface SupportEvent {
  /** User display name (defaults to "Anonymous") */
  name: string
  /** User email (empty string if unauthenticated) */
  email: string
  /** Project name */
  projectName: string
  /** URL-safe project slug */
  projectSlug: string
  /** Support topic / message body */
  topic: string
  /** Machine-readable section identifier */
  sectionId: string
  /** Human-readable section name */
  sectionName: string
  /** Emails of support team members to invite to the created channel */
  supportTeamEmails: string[]
  /** Slack channel ID for feedback notifications (used for anonymous requests) */
  feedbackChannelId?: string
  /** Prefix for support channel names (default: "support") */
  channelNamePrefix: string
  /** Whether the user is authenticated (has a non-empty email) */
  isAuthenticated: boolean
}

/** Emitted when a user submits standalone feedback (screenshot and/or voice). */
export interface StandaloneEvent {
  /** Optional PNG/JPEG screenshot buffer */
  screenshotBuffer?: Buffer
  /** Filename for the screenshot file */
  screenshotFilename?: string
  /** Optional MP3 buffer of a voice recording */
  mp3Buffer?: Buffer
  /** Filename for the audio file */
  audioFilename?: string
  /** Slack channel ID to post to */
  channelId: string
  /** User display name (defaults to "Anonymous") */
  name: string
  /** User email (empty string if unauthenticated) */
  email: string
  /** Project name */
  projectName: string
  /** Optional note submitted with the feedback */
  note: string
  /** Machine-readable section identifier */
  sectionId: string
  /** Human-readable section name */
  sectionName: string
  /** Formatted meta comment string for display in the destination */
  metaComment: string
}

/* ── Adapter interface ────────────────────────────────────── */

/**
 * An adapter tells MUS where to send feedback events.
 * Implement only the methods you need — unimplemented methods are silently skipped.
 */
export interface MusAdapter {
  /**
   * Called when a user submits a voice feedback recording.
   * Receives a converted MP3 buffer ready to upload.
   */
  onVoiceUpload?(event: VoiceEvent): Promise<void>

  /**
   * Called when a user submits a support request.
   * Should return the channel ID (or equivalent) of the created/found channel,
   * used to send back `{ success: true, channelId }` to the client.
   */
  onSupportRequest?(event: SupportEvent): Promise<{ channelId?: string }>

  /**
   * Called when a user submits standalone feedback (screenshot and/or voice).
   */
  onStandaloneFeedback?(event: StandaloneEvent): Promise<void>
}
