---
title: Installation
description: Install MUS and add the feedback toolbar to your React app in minutes.
---

## Install

```bash
# npm
npm install @datachef/mus

# pnpm
pnpm add @datachef/mus

# yarn
yarn add @datachef/mus
```

## Quick start

### 1. Import styles

Add the CSS import once — usually in your entry file or root layout:

```tsx
import '@datachef/mus/styles.css'
```

### 2. Wrap your app with `MusProvider`

`MusProvider` provides configuration to all `FeedbackTarget` components in the tree. Put it high up — above your router.

```tsx
import { MusProvider } from '@datachef/mus'
import '@datachef/mus/styles.css'

function App() {
  return (
    <MusProvider
      config={{
        projectName: 'My App',
        slack: {
          proxyUrl: '/api/slack-proxy',
          supportTeamEmails: ['you@company.com'],
          feedbackChannelId: 'C0XXXXXXXXX',
        },
      }}
    >
      <Router />
    </MusProvider>
  )
}
```

### 3. Add `FeedbackTarget` to any section

Wrap any part of your UI to make it feedback-able. Users hover for 500 ms and the lightbulb icon appears.

```tsx
import { FeedbackTarget } from '@datachef/mus'

function Dashboard() {
  return (
    <FeedbackTarget sectionId="dashboard" sectionName="Dashboard">
      <DashboardContent />
    </FeedbackTarget>
  )
}
```

### 4. Run the server

The MUS server handles voice upload and Slack delivery. Run it locally with Docker:

```bash
docker run -d \
  -p 3001:3001 \
  -e SLACK_BOT_TOKEN=xoxb-your-token \
  ghcr.io/datachefhq/mus-server:latest
```

Verify it's running:

```bash
curl http://localhost:3001/healthz
# → ok
```

Add a Vite proxy so browser requests reach it:

```js
// vite.config.js
server: {
  proxy: {
    '/api/mus/': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
},
```

## Using the CLI

Run the init wizard to get an interactive setup:

```bash
npx @datachef/mus init
```

The CLI detects your framework (Vite / Next.js), package manager, and TypeScript usage, then:

- Creates `src/lib/mus.config.js` with your project settings
- Creates `mus/docker-compose.yml` for running `mus-server`
- Prints the Vite proxy config and `MusProvider` snippet to paste in

## Next steps

- [Configuration reference](/configuration) — full `MusConfig` options
- [Server setup](/server/overview) — Next.js, Express, Vite+Docker
- [Deployment](/deployment/docker) — Docker Compose, nginx, Kubernetes
