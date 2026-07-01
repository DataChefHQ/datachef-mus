---
title: User Resolvers — Overview
description: Connect MUS to any authentication system to automatically fill user name and email.
---

A **user resolver** is a React hook that returns the current user's `{ name, email }`. MUS uses it to pre-fill the name and email fields in forms and to include user identity in feedback messages.

## Priority order

1. `config.user` — explicit override on `MusProvider`, always wins
2. `config.userResolver` — your auth system (Stytch, Clerk, Auth0, NextAuth, or custom)
3. Stytch auto-detection — if `@stytch/react` is installed and a session is active, MUS reads it automatically (no configuration needed)
4. Anonymous fallback `{ name: 'Anonymous', email: '' }`

## Built-in resolvers

Import the resolver for your auth system and pass it to `MusProvider`:

### Stytch

```ts
import { stytchResolver } from '@datachef/mus/resolvers/stytch'

<MusProvider config={{
  projectName: 'My App',
  slack: { ... },
  userResolver: stytchResolver(),
}}>
```

Requires `@stytch/react` in your project.

### Clerk

```ts
import { clerkResolver } from '@datachef/mus/resolvers/clerk'

<MusProvider config={{
  ...
  userResolver: clerkResolver(),
}}>
```

Requires `@clerk/clerk-react` in your project.

### Auth0

```ts
import { auth0Resolver } from '@datachef/mus/resolvers/auth0'

<MusProvider config={{
  ...
  userResolver: auth0Resolver(),
}}>
```

Requires `@auth0/auth0-react` in your project.

### NextAuth

```ts
import { nextAuthResolver } from '@datachef/mus/resolvers/next-auth'

<MusProvider config={{
  ...
  userResolver: nextAuthResolver(),
}}>
```

Requires `next-auth` in your project.

## No auth system

If your app doesn't use an authentication library, you can still pre-fill user info:

### Static user (config override)

```ts
<MusProvider config={{
  ...
  user: {
    name: 'Jane Doe',
    email: 'jane@example.com',
  },
}}>
```

### Read from localStorage or a cookie

See [Custom Resolvers](/resolvers/custom) for a `localStorage`-based resolver example.

## Writing a custom resolver

See [Custom Resolvers](/resolvers/custom).
