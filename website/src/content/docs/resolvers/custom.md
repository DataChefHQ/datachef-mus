---
title: Custom Resolvers
description: Write a user resolver for any auth system or data source.
---

A resolver is just a React hook — a function that calls other hooks and returns `{ name, email }` or `null`.

```ts
type UserResolver = () => { name: string; email: string } | null
```

Return `null` when the user isn't logged in. MUS falls back to `{ name: 'Anonymous', email: '' }`.

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

<MusProvider config={{
  ...
  userResolver: myResolver,
}}>
```

## localStorage

```ts
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

const cookieResolver: UserResolver = () => {
  const name = Cookies.get('user_name')
  const email = Cookies.get('user_email')
  if (!email) return null
  return { name: name ?? email, email }
}
```

## React Query / SWR

```ts
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

## Combining resolvers

Try multiple sources in order — first non-null wins:

```ts
const multiResolver: UserResolver = () => {
  const fromStytch = stytchResolver()()
  const fromClerk = clerkResolver()()
  return fromStytch ?? fromClerk ?? null
}
```

## Rules

A user resolver is a React hook, so the usual [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) apply:

- Don't call conditionally — the hook is always called inside `MusProvider`
- Don't call inside loops or nested functions
- You can call other hooks (`useState`, `useEffect`, `useContext`, etc.) freely
