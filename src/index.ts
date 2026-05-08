/* ── Components ───────────────────────────────────────────── */
export { FeedbackTarget } from './components/FeedbackTarget'
export { FeedbackToolbar } from './components/FeedbackToolbar'
export { FeedbackTrigger } from './components/FeedbackTrigger'
export { SupportDialog } from './components/dialogs/SupportDialog'
export { FeedbackDialog } from './components/dialogs/FeedbackDialog'
export { VideoDialog } from './components/dialogs/VideoDialog'
export { DialogShell } from './components/dialogs/DialogShell'
export { WelcomeDialog } from './components/dialogs/WelcomeDialog'
export { StandaloneWidget } from './components/StandaloneWidget'
export { StandaloneFeedbackDialog } from './components/dialogs/StandaloneFeedbackDialog'

/* ── Context / Provider ──────────────────────────────────── */
export { MusProvider, useMusConfig } from './context/MusContext'

/* ── Hooks ───────────────────────────────────────────────── */
export { useFeedbackActions } from './hooks/useFeedbackActions'
export { useMusUser } from './hooks/useMusUser'
export { useThumbsStore } from './hooks/useThumbsStore'

/* ── Types ───────────────────────────────────────────────── */
export type {
  MusConfig,
  SlackConfig,
  StandaloneConfig,
  FeedbackAction,
  FeedbackActionType,
} from './types'

/* ── Styles (imported separately: import '@datachef/mus/styles.css') ── */
import './styles/index.css'
