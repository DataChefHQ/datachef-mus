/* ── Components ───────────────────────────────────────────── */
export { FeedbackTarget } from './components/FeedbackTarget'
export { FeedbackToolbar } from './components/FeedbackToolbar'
export { FeedbackTrigger } from './components/FeedbackTrigger'
export { SupportDialog } from './components/dialogs/SupportDialog'
export { FeedbackDialog } from './components/dialogs/FeedbackDialog'
export { VideoDialog } from './components/dialogs/VideoDialog'
export { DialogShell } from './components/dialogs/DialogShell'

/* ── Context / Provider ──────────────────────────────────── */
export { MusProvider, useMusConfig } from './context/MusContext'

/* ── Hooks ───────────────────────────────────────────────── */
export { useFeedbackActions } from './hooks/useFeedbackActions'

/* ── Types ───────────────────────────────────────────────── */
export type {
  MusConfig,
  MusUser,
  SlackConfig,
  FeedbackAction,
  FeedbackActionType,
} from './types'

/* ── Styles (imported separately: import '@datachef/mus/styles.css') ── */
import './styles/index.css'
