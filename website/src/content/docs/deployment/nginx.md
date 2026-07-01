---
title: nginx
description: Configure nginx to proxy /api/mus/ to mus-server, with the variable proxy pattern and Permissions-Policy.
---

## The variable proxy pattern

nginx resolves `proxy_pass` hostnames **at startup**. If `mus-server` isn't ready yet (race condition, or it's a Kubernetes sidecar that starts a second later), nginx fails:

```
host not found in upstream "mus-server"
```

The fix: store the upstream in a variable. nginx then defers DNS resolution to request time.

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

`__DNS_RESOLVER__` and `__MUS_SERVER_ADDR__` are substituted at container start by an entrypoint script.

## Entrypoint script

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

| Deployment | Value |
|------------|-------|
| Docker Compose | `mus-server:3001` |
| Kubernetes sidecar | omit; default `127.0.0.1:3001` applies |

## Permissions-Policy: critical for voice

:::caution[Voice recording will silently fail without this]
If your nginx sets a `Permissions-Policy` header that blocks the microphone, voice recording fails with no visible error to the user.
:::

```nginx
# ❌ Blocks voice recording entirely
add_header Permissions-Policy "microphone=()" always;

# ✅ Allows same-origin mic access
add_header Permissions-Policy "microphone=(self)" always;
```

### nginx inheritance gotcha

`add_header` inheritance is all-or-nothing per config level. Any `location` block that sets its own `add_header` must **repeat all security headers**, including `Permissions-Policy`, otherwise they are silently dropped for that location.

```nginx
# ✅ Both headers present in every location that uses add_header
location /api/mus/ {
    add_header Permissions-Policy "microphone=(self)" always;
    add_header X-Content-Type-Options "nosniff" always;
    # ... other headers ...
    set $mus_server http://__MUS_SERVER_ADDR__;
    proxy_pass $mus_server;
    client_max_body_size 15m;
}
```

## Slack proxy in nginx

If your text/thumbs feedback goes through a separate Slack proxy service:

```nginx
location = /api/slack-proxy {
    set $slack_proxy https://your-slack-proxy.example.com/;
    proxy_pass $slack_proxy;
    proxy_set_header Host your-slack-proxy.example.com;
    proxy_ssl_server_name on;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Troubleshooting

### `host not found in upstream`
Use the variable proxy pattern above. Direct `proxy_pass http://mus-server:3001` causes startup failures.

### Voice upload returns 413
nginx's default body size is 1 MB. Voice recordings are larger. Add `client_max_body_size 15m;` to the `/api/mus/` location block.

### Voice works locally but fails in production
Check `Permissions-Policy`. Local dev uses the Vite proxy (no nginx headers). Production nginx may have `microphone=()`; change it to `microphone=(self)` in every location block that sets `add_header`.
