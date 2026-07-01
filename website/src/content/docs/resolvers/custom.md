---
title: Custom Resolvers
description: Write a user resolver for any auth system or data source.
---

A `UserResolver` is a React hook — a function that calls other hooks and returns `{ name, email }` or `null`.

```ts
type UserResolver = () => { name: string; email: string } | null
```

Return `null` when the user is not logged in. MUS falls back to `{ name: 'Anonymous', email: '' }`.

Pass it directly to `MusProvider`:

```tsx
import type { UserResolver } from '@datachefhq/mus'

<MusProvider config={{
  projectName: 'My App',
  slack: { ... },
  userResolver: myResolver,
}}>
```

## Your own auth context

```ts
import type { UserResolver } from '@datachefhq/mus'

const myResolver: UserResolver = () => {
  const { currentUser } = useMyAuthContext()  // your own hook
  if (!currentUser) return null
  return {
    name: currentUser.displayName,
    email: currentUser.email,
  }
}
```

## localStorage

```ts
import { useState, useEffect } from 'react'
import type { UserResolver } from '@datachefhq/mus'

const localStorageResolver: UserResolver = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('current_user')
    if (raw) {
      try {
        setUser(JSON.parse(raw))
      } catch {}
    }
  }, [])

  return user
}
```

## Cookie

```ts
import Cookies from 'js-cookie'
import type { UserResolver } from '@datachefhq/mus'

const cookieResolver: UserResolver = () => {
  const name = Cookies.get('user_name')
  const email = Cookies.get('user_email')
  if (!email) return null
  return { name: name ?? email, email }
}
```

## React Query / SWR

```ts
import type { UserResolver } from '@datachefhq/mus'

const apiResolver: UserResolver = () => {
  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => fetch('/api/me').then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  })

  if (!data?.email) return null
  return { name: data.name ?? data.email, email: data.email }
}
```

## Resolver factory pattern

If you want to pass options (e.g. a config object), wrap the resolver in a factory function — the same pattern used by the built-in resolvers:

```ts
import type { UserResolver } from '@datachefhq/mus'

function myAuthResolver(options?: { fallbackName?: string }): UserResolver {
  return () => {
    const { session } = useMyAuth()
    if (!session?.user) return null
    return {
      name: session.user.name ?? options?.fallbackName ?? session.user.email,
      email: session.user.email,
    }
  }
}

// Usage:
<MusProvider config={{
  ...
  userResolver: myAuthResolver({ fallbackName: 'Team Member' }),
}}>
```

## Rules

A user resolver is a React hook, so the [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) apply:

- Do not call conditionally — the hook is always called inside `MusProvider`
- Do not call inside loops or nested functions
- You can call other hooks (`useState`, `useEffect`, `useContext`, etc.) freely
