## 0.3.1 (2026-05-12)

### Features
- feat(mus-server): add standalone server image and publish on release

## 0.3.0 (2026-05-11)

### Features
- feat: export musVitePlugins() for zero-config Vite dev server setup Adds @datachefhq/mus/vite entry that exports musVitePlugins() — a single Vite plugin registering all three mus server handlers (voice-upload, standalone-upload, support-channel). Consuming apps replace boilerplate middleware code with:   import { musVitePlugins } from '@datachefhq/mus/vite'   plugins: [...musVitePlugins()] Also reverts anonymous-user dedicated channel: unauthenticated support requests now post directly to feedbackChannelId without channel creation.
- feat: server-side support channel with idempotent find-or-create Authenticated users get a private per-user channel named {prefix}-{projectSlug}-{emailSlug} — same channel every time across sessions. Unauthenticated users route to {projectSlug}-general-support, auto-created on first use. Channel creation calls Slack API directly (SLACK_BOT_TOKEN) via the new POSTSupportChannel server handler, bypassing chefbot for full control over privacy, membership, and idempotent lookup. Support team is invited via users.lookupByEmail + conversations.invite; bot is already a member as channel creator. Adds projectSlug? to MusConfig, supportChannelUrl? to SlackConfig.
- feat: add enabled flag to MusConfig for global on/off control

### Other Changes
- revert: restore original SupportDialog description text

## 0.2.3 (2026-05-11)

### Bug Fixes
- fix: feedback target component position style

## 0.2.2 (2026-05-11)

### Features
- feat: add inset prop to FeedbackTarget for page-level positioning

## 0.2.1 (2026-05-09)

### Features
- feat: add captureExtensionAndTab helper and built-in default screenshot

# Changelog

## 0.2.0 (2026-05-08)

### Features
- feat: add standalone mode with screenshot capture, voice feedback, and release script
