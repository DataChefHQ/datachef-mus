# MUS Integration Guide

MUS is a feedback toolbar widget that embeds into any React app. It gives users a floating trigger button on every page. Hovering reveals a toolbar with voice recording, thumbs up/down, and Slack support actions. All feedback is routed through a lightweight sidecar server (`mus-server`) that handles audio processing and Slack delivery.

This guide walks through a full integration from install to production Kubernetes deployment. **Impevia** — a compliance management webapp built on Vite + React, nginx, and Kubernetes — is used as the running example throughout.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Install the Package](#install-the-package)
3. [Configure MUS](#configure-mus)
4. [Wrap Your App](#wrap-your-app)
5. [Run the Server](#run-the-server)
6. [Local Development (Vite Proxy)](#local-development-vite-proxy)
7. [Docker Compose](#docker-compose)
8. [Production: nginx](#production-nginx)
9. [Production: Kubernetes Sidecar](#production-kubernetes-sidecar)
10. [Slack Integration](#slack-integration)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- React 18+
- Node.js 18+
- Docker (for running mus-server)
- A Slack bot token with `chat:write` and `users:read` scopes

---

## Install the Package

```sh
# npm
npm install @datachefhq/mus

# pnpm
pnpm add @datachefhq/mus
```

> **GitHub Packages auth** — until the package moves to the public npm registry, you need a GitHub PAT with `read:packages` scope.
>
> Add the registry to your project `.npmrc` (registry line only — never commit a token):
> ```
> @datachefhq:registry=https://npm.pkg.github.com
> ```
>
> Add the token to your **global** `~/.npmrc`:
> ```
> //npm.pkg.github.com/:_authToken=YOUR_PAT
> ```
>
> In CI, store the PAT as a repo secret (e.g. `PACKAGES_READ_TOKEN`) and inject it as a Docker build secret. The automatic `GITHUB_TOKEN` cannot read packages from other repos.

---

## Configure MUS

Create `src/lib/mus.config.js` (or `.ts`) in your project. This is the single file that controls all MUS behaviour.

```js
/** @type {import('@datachefhq/mus').MusConfig} */
export const musConfig = {
  projectName: 'Your App Name',
  projectSlug: 'your-app',
  enabled: true,

  slack: {
    proxyUrl: '/api/slack-proxy',           // your backend proxies this to Slack
    supportTeamEmails: ['you@company.com'],
    feedbackChannelId: 'YOUR_CHANNEL_ID',
  },

  theme: 'dark',        // 'light' | 'dark'
  hoverDelay: 200,      // ms before toolbar appears on hover
  triggerPosition: 'top-right',

  // Action order renders left-to-right in the toolbar.
  // Impevia uses: Slack | thumbs-down | thumbs-up | voice
  // (voice is rightmost — closest to the trigger button)
  actions: [
    { type: 'support' },
    { type: 'thumbs-down' },
    { type: 'thumbs-up' },
    { type: 'voice' },
  ],
}
```

**Available action types:**

| type | Icon | What it does |
|------|------|--------------|
| `voice` | Microphone | Records audio, uploads to mus-server for processing |
| `support` | Slack | Opens a Slack thread via your Slack proxy |
| `thumbs-up` | 👍 | Sends a positive signal |
| `thumbs-down` | 👎 | Sends a negative signal |
| `video` | Play | Embeds an intro/onboarding video |

**Impevia's config** lives at `src/lib/mus-config.js` and uses a DataChef-hosted Slack proxy (Chefbot) at `/api/slack-proxy` — see [Slack Integration](#slack-integration) for how that proxy is wired up.

---

## Wrap Your App

In your entry point (`main.jsx` / `main.tsx`):

```jsx
import { MusProvider } from '@datachefhq/mus'
import { musConfig } from './lib/mus.config'
import '@datachefhq/mus/styles'

createRoot(document.getElementById('root')).render(
  <MusProvider config={musConfig}>
    <App />
  </MusProvider>
)
```

`MusProvider` renders the trigger button and toolbar on every page automatically — no per-page setup needed. In **Impevia**, this is in `src/main.jsx` wrapping the full React Router tree.

---

## Run the Server

`mus-server` is a pre-built Docker image that handles voice upload processing (ffmpeg), screenshot uploads, and Slack delivery. It exposes a single port (`3001`) and a `/healthz` endpoint.

```sh
docker run -d \
  -p 3001:3001 \
  -e SLACK_BOT_TOKEN=xoxb-your-token \
  ghcr.io/datachefhq/mus-server:latest
```

Verify:
```sh
curl http://localhost:3001/healthz
# → ok
```

The image is built and published automatically from the `datachef-mus` repo on every release tag.

---

## Local Development (Vite Proxy)

Add proxy entries to `vite.config.js` so browser requests reach the local mus-server and your Slack proxy:

```js
export default defineConfig({
  plugins: [react(), ...musVitePlugins()],
  server: {
    proxy: {
      '/api/mus/': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/slack-proxy': {
        target: 'https://your-slack-proxy.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/slack-proxy/, ''),
      },
    },
  },
})
```

In **Impevia**, the Slack proxy target is `https://chefbot.services.datachef.co` — DataChef's internal Chefbot service. Replace this with your own Slack proxy endpoint.

With both proxy entries in place, the full MUS toolbar (voice, thumbs, Slack) works in `vite dev` with no additional config.

---

## Docker Compose

Add `mus-server` as a service alongside your frontend container. The frontend nginx reaches it by service name.

```yaml
services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - MUS_SERVER_ADDR=mus-server:3001   # tells nginx where to proxy /api/mus/
    depends_on:
      - mus-server

  mus-server:
    image: ghcr.io/datachefhq/mus-server:latest
    environment:
      - SLACK_BOT_TOKEN=${SLACK_BOT_TOKEN}
    # No port mapping needed — only the frontend nginx reaches it internally
```

In your `.env`:
```
SLACK_BOT_TOKEN=xoxb-your-token
```

**Impevia** uses this exact pattern in `docker-compose.yml`, with `docker-compose.override.yml` swapping the frontend container for the Vite dev server during local development (which bypasses nginx entirely and uses the Vite proxy config above instead).

---

## Production: nginx

### The variable proxy pattern

nginx resolves `proxy_pass` hostnames **at startup**. If mus-server isn't ready yet (race condition, or it's a K8s sidecar that starts a few seconds later), nginx will fail to start with:

```
host not found in upstream "mus-server"
```

The fix is to store the upstream in a variable — nginx then defers DNS resolution to request time:

```nginx
# DNS resolver — substituted at container start by entrypoint.sh
resolver __DNS_RESOLVER__ valid=10s ipv6=off;

location /api/mus/ {
    set $mus_server http://__MUS_SERVER_ADDR__;
    proxy_pass $mus_server;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    client_max_body_size 15m;   # voice recordings + screenshots
}
```

`__DNS_RESOLVER__` and `__MUS_SERVER_ADDR__` are placeholders substituted at container start (see entrypoint below).

### Entrypoint script

```sh
#!/bin/sh
set -e

# Extract DNS resolver IP from /etc/resolv.conf
DNS_RESOLVER=$(awk '/^nameserver/{print $2; exit}' /etc/resolv.conf)
DNS_RESOLVER=${DNS_RESOLVER:-127.0.0.11}    # fallback: Docker's embedded DNS

# Docker Compose: mus-server:3001  |  Kubernetes sidecar: 127.0.0.1:3001
MUS_SERVER_ADDR=${MUS_SERVER_ADDR:-127.0.0.1:3001}

mkdir -p /tmp/nginx
sed \
    -e "s|__DNS_RESOLVER__|${DNS_RESOLVER}|g" \
    -e "s|__MUS_SERVER_ADDR__|${MUS_SERVER_ADDR}|g" \
    /etc/nginx/nginx.conf > /tmp/nginx/nginx.conf

exec nginx -c /tmp/nginx/nginx.conf -g 'daemon off;'
```

Set `MUS_SERVER_ADDR` via environment variable:
- **Docker Compose:** `MUS_SERVER_ADDR=mus-server:3001`
- **Kubernetes sidecar:** omit it — default `127.0.0.1:3001` applies (same pod, localhost)

### Permissions-Policy — critical for voice

If your nginx sets a `Permissions-Policy` security header, **you must explicitly allow microphone for the same origin**. Without this, the browser silently blocks the microphone and voice recording fails with no visible error.

```nginx
# ❌ Blocks voice recording entirely
add_header Permissions-Policy "microphone=()" always;

# ✅ Allows same-origin mic access
add_header Permissions-Policy "microphone=(self)" always;
```

> **nginx inheritance gotcha:** nginx's `add_header` inheritance is all-or-nothing per config level. Any `location` block that sets its own `add_header` must repeat **all** security headers, including Permissions-Policy — otherwise they're silently dropped for that location.

**Impevia** hit this exact issue in production. Voice recording worked fine in local dev (Vite proxy, no nginx headers) but failed silently after deployment until `microphone=()` was changed to `microphone=(self)` in all relevant `location` blocks.

### Slack proxy in nginx

```nginx
location = /api/slack-proxy {
    set $chefbot https://your-slack-proxy.example.com/;
    proxy_pass $chefbot;
    proxy_set_header Host your-slack-proxy.example.com;
    proxy_ssl_server_name on;
    proxy_set_header X-Real-IP $remote_addr;
}
```

In **Impevia**, the target is `https://chefbot.services.datachef.co/` — DataChef's Chefbot service. Replace with your own proxy URL.

---

## Production: Kubernetes Sidecar

Run `mus-server` as a sidecar container in the same pod as your frontend. nginx reaches it at `127.0.0.1:3001` (localhost within the pod — no service DNS needed).

### Deployment

```yaml
spec:
  template:
    spec:
      containers:
        # --- existing nginx/frontend container ---
        - name: frontend
          env:
            - name: MUS_SERVER_ADDR
              value: "127.0.0.1:3001"   # sidecar is on localhost

        # --- mus-server sidecar ---
        - name: mus-server
          image: ghcr.io/datachefhq/mus-server:latest
          ports:
            - containerPort: 3001
          envFrom:
            - secretRef:
                name: mus-secrets       # contains SLACK_BOT_TOKEN
          livenessProbe:
            httpGet:
              path: /healthz
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /healthz
              port: 3001
            initialDelaySeconds: 3
            periodSeconds: 5
          securityContext:
            readOnlyRootFilesystem: true
            runAsNonRoot: true
            runAsUser: 1000
          volumeMounts:
            - name: mus-tmp
              mountPath: /tmp

      volumes:
        - name: mus-tmp
          emptyDir: {}
```

### Create the Kubernetes secret

```sh
kubectl create secret generic mus-secrets \
  --from-literal=SLACK_BOT_TOKEN=xoxb-your-token \
  -n your-namespace
```

**Impevia** runs this in both `impevia-dev` and `impevia-production` namespaces, referencing the secret via `extraEnvFrom` in the Helm values file.

### Helm values (if using Helm)

```yaml
frontend:
  extraEnv:
    - name: MUS_SERVER_ADDR
      value: "127.0.0.1:3001"

  musServer:
    enabled: true
    image:
      repository: ghcr.io/datachefhq/mus-server
      tag: latest
    extraEnvFrom:
      - secretRef:
          name: mus-secrets
```

---

## Slack Integration

MUS sends feedback and support requests to Slack via a server-side proxy. The browser never calls Slack directly — it posts to `/api/slack-proxy` on your own domain, which your backend forwards to a Slack-capable proxy service.

**What you need:**

1. A Slack bot token (`xoxb-...`) installed in your workspace with `chat:write` and `users:read` scopes
2. The Slack channel ID where feedback threads should appear
3. A server-side proxy that accepts the request and calls the Slack API (mus-server handles the Slack API calls; you just need the proxy route to reach it)

**Config:**
```js
slack: {
  proxyUrl: '/api/slack-proxy',
  supportTeamEmails: ['engineer@yourcompany.com'],
  feedbackChannelId: 'C0XXXXXXXXX',   // copy from Slack channel URL
},
```

**DataChef / Impevia setup:**
DataChef operates **Chefbot** (`https://chefbot.services.datachef.co`), an internal Slack proxy service. Impevia's nginx forwards `/api/slack-proxy` to Chefbot, which delivers messages to the configured Slack workspace. If you're integrating MUS outside of DataChef, replace the Chefbot URL with your own Slack proxy endpoint, or implement a simple pass-through route in your backend.

---

## Troubleshooting

### Voice recording silently fails
**Cause:** `Permissions-Policy: microphone=()` header blocks mic access at the browser level — no error is shown to the user.
**Fix:** Change to `microphone=(self)` in every nginx `add_header` directive. Check all `location` blocks — headers are not inherited if any local `add_header` is set.

### nginx fails to start: `host not found in upstream`
**Cause:** `proxy_pass http://mus-server:3001` is resolved at nginx startup, before mus-server is ready.
**Fix:** Use the variable proxy pattern: `set $mus_server http://...; proxy_pass $mus_server;`. Requires a `resolver` directive. See [Production: nginx](#production-nginx).

### `pnpm install` fails with 401
**Cause:** No auth token for GitHub Packages.
**Fix:** Add `//npm.pkg.github.com/:_authToken=YOUR_PAT` to `~/.npmrc`. The token needs `read:packages` scope.

### `pnpm install` fails with 403 in CI
**Cause:** The automatic `GITHUB_TOKEN` in GitHub Actions cannot read packages from other repos.
**Fix:** Create a personal PAT with `read:packages` scope, store it as a repo secret (e.g. `PACKAGES_READ_TOKEN`), and pass it as a Docker build secret — not as a plain env var that ends up in image layers.

### Toolbar not visible
- Check `enabled: true` in `musConfig`
- Confirm `MusProvider` wraps the full app tree (above the router)
- Check browser console for `useMusConfig must be used within a <MusProvider>`

### Voice upload returns 413
**Cause:** nginx's default body size limit (1 MB) is too small for audio files.
**Fix:** Add `client_max_body_size 15m;` to the `/api/mus/` location block.

### `mus-server` container exits immediately
Check that `SLACK_BOT_TOKEN` is set. The server starts successfully without it but Slack actions will fail at runtime — verify with `docker logs <container>` or `kubectl logs <pod> -c mus-server`.
