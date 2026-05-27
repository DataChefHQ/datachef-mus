---
title: CLI — mus init
description: Use the mus init wizard to scaffold MUS configuration in your project.
---

The `mus init` command walks you through a quick setup and generates config files for your project.

## Usage

```bash
npx @datachefhq/mus init
```

## What it does

The wizard asks four questions:

1. **Project name** — used in Slack messages and support channel names
2. **Slack feedback channel ID** — the channel where feedback posts land
3. **Support team email(s)** — invited to new support channels
4. **Slack proxy URL** — your backend endpoint that forwards to Slack (e.g. `/api/slack-proxy`)

Then it:

- Creates `src/lib/mus.config.js` (or `.ts`) with your settings
- Creates `mus/docker-compose.yml` for running `mus-server` locally
- Detects your framework (Vite / Next.js), package manager, and TypeScript usage
- Prints the Vite proxy config or Next.js route setup to copy-paste

## Generated files

### `src/lib/mus.config.js`

```js
/** @type {import('@datachefhq/mus').MusConfig} */
export const musConfig = {
  projectName: 'Your App',
  projectSlug: 'your-app',
  enabled: true,

  slack: {
    proxyUrl: '/api/slack-proxy',
    supportTeamEmails: ['you@company.com'],
    feedbackChannelId: 'C0XXXXXXXXX',
  },

  theme: 'dark',
  hoverDelay: 200,
  triggerPosition: 'top-right',

  actions: [
    { type: 'support' },
    { type: 'thumbs-down' },
    { type: 'thumbs-up' },
    { type: 'voice' },
  ],
}
```

### `mus/docker-compose.yml`

```yaml
services:
  mus-server:
    image: ghcr.io/datachefhq/mus-server:latest
    ports:
      - "3001:3001"
    environment:
      - SLACK_BOT_TOKEN=${SLACK_BOT_TOKEN}
```

Start it with:

```bash
cd mus && docker compose up -d
```

## Skipping the wizard

You can also copy the config above and edit it manually — there's nothing magic about the init command. It's just a convenience.
