---
title: Kubernetes
description: Run mus-server as a sidecar container in your Kubernetes deployment.
---

Run `mus-server` as a sidecar in the same pod as your frontend. nginx reaches it at `127.0.0.1:3001` with no Kubernetes service or DNS needed.

## Deployment spec

```yaml
spec:
  template:
    spec:
      containers:
        # --- existing frontend container ---
        - name: frontend
          image: your-frontend:latest
          env:
            - name: MUS_SERVER_ADDR
              value: "127.0.0.1:3001"   # sidecar is on localhost within the pod

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

## Create the secret

```bash
kubectl create secret generic mus-secrets \
  --from-literal=SLACK_BOT_TOKEN=xoxb-your-token \
  -n your-namespace
```

If you run multiple namespaces (e.g. `dev` and `production`), create the secret in each:

```bash
kubectl create secret generic mus-secrets \
  --from-literal=SLACK_BOT_TOKEN=xoxb-your-token \
  -n your-app-dev

kubectl create secret generic mus-secrets \
  --from-literal=SLACK_BOT_TOKEN=xoxb-your-token \
  -n your-app-production
```

## Helm values

If your chart supports sidecars via values:

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

## nginx config

With `MUS_SERVER_ADDR=127.0.0.1:3001`, the entrypoint substitutes the variable and nginx proxies to the sidecar on localhost. No `resolver` directive is needed because there is no DNS lookup; it's loopback.

For the full nginx setup see [nginx](/deployment/nginx).

## Checking logs

```bash
# mus-server sidecar logs
kubectl logs <pod-name> -c mus-server -n your-namespace

# Follow logs
kubectl logs -f <pod-name> -c mus-server -n your-namespace
```
