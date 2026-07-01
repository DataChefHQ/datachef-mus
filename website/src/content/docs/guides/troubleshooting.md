---
title: Troubleshooting
description: Common MUS issues and how to fix them.
---

## Voice recording silently fails

**Cause:** The browser's `Permissions-Policy` header blocks microphone access. The browser doesn't show an error — recording just never starts.

**Fix:** Change `microphone=()` to `microphone=(self)` in your nginx config:

```nginx
# ❌ Blocks mic
add_header Permissions-Policy "microphone=()" always;

# ✅ Allows same-origin mic access
add_header Permissions-Policy "microphone=(self)" always;
```

Repeat this change in **every** `location` block that sets its own `add_header` — nginx's header inheritance is all-or-nothing per level.

---

## nginx fails to start: `host not found in upstream`

**Cause:** `proxy_pass http://mus-server:3001` is resolved at nginx startup, before `mus-server` is ready.

**Fix:** Use the variable proxy pattern:

```nginx
resolver 127.0.0.11 valid=10s ipv6=off;

location /api/mus/ {
    set $mus_server http://mus-server:3001;
    proxy_pass $mus_server;
}
```

See [nginx](/deployment/nginx) for the full entrypoint script.

---

## Voice upload returns 413

**Cause:** nginx's default body size limit is 1 MB — too small for audio files.

**Fix:** Add `client_max_body_size 15m;` to the `/api/mus/` location block.

---

## Toolbar not visible

Check in order:

1. `enabled: true` in `musConfig` (or omit it — default is `true`)
2. `MusProvider` wraps the full app tree, above the router
3. Browser console — look for `useMusConfig must be used within a <MusProvider>`
4. CSS import: `import '@datachef/mus/styles.css'`
5. No z-index conflicts with a sticky header or overlay

---

## `npm install` fails with 401

**Cause:** No auth token for GitHub Packages (if the package is not yet on the public npm registry).

**Fix:** Add to `~/.npmrc`:

```
//npm.pkg.github.com/:_authToken=YOUR_PAT
```

The PAT needs `read:packages` scope.

---

## `npm install` fails with 403 in CI

**Cause:** The automatic `GITHUB_TOKEN` in GitHub Actions cannot read packages from other repos.

**Fix:** Create a personal PAT with `read:packages` scope, store it as a repo secret (e.g. `PACKAGES_READ_TOKEN`), and pass it to the Docker build as a secret — not as a plain env var that ends up in image layers.

---

## `mus-server` container exits immediately

Check `docker logs <container>` or `kubectl logs <pod> -c mus-server`. The most common cause is a missing or invalid `SLACK_BOT_TOKEN`.

```bash
docker run -e SLACK_BOT_TOKEN=xoxb-your-token ghcr.io/datachefhq/mus-server:latest
```

---

## Forms show "Anonymous" / empty email

**Cause:** No user resolver configured and no `config.user` override.

**Fix:** Add a `userResolver` for your auth system, or set `config.user` explicitly:

```ts
<MusProvider config={{
  ...
  user: { name: 'Jane Doe', email: 'jane@example.com' },
  // or:
  userResolver: clerkResolver(),
}}>
```

---

## Support channel created but user not invited

**Cause:** The email address used to look up the Slack user doesn't match the email in the workspace.

**Check:** The email in `supportTeamEmails` (and the submitting user's email) must match the email addresses in your Slack workspace. The bot uses `users.lookupByEmail` internally.

**Required scope:** `users:read.email` must be enabled on the Slack bot.
