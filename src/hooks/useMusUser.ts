import { useRef } from 'react'
import { useMusConfig } from '@/context/MusContext'

function nameFromEmail(email: string): string {
  return email.split('@')[0] || 'Anonymous'
}

const NOOP = () => ({ name: 'Anonymous', email: '' })

export function useMusUser() {
  const config = useMusConfig()

  // Freeze the resolver reference at mount so the number of hooks called
  // is stable across renders. config.userResolver must not change after first render.
  const resolverRef = useRef(config.userResolver ?? NOOP)

  // Always call the resolver (NOOP when not configured) — unconditional, hooks-safe
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const fromResolver = resolverRef.current()

  // config.user always wins
  if (config.user) {
    const email = config.user.email?.trim() ?? ''
    return { name: config.user.name?.trim() || nameFromEmail(email), email }
  }

  return fromResolver
}
