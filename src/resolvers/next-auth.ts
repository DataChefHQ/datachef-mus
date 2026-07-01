// @ts-ignore - requires next-auth peer dependency: npm install next-auth
import { useSession } from 'next-auth/react'
import type { UserResolver } from '../types'

/** User resolver for next-auth. Requires next-auth in your project. */
export function nextAuthResolver(): UserResolver {
  return function useNextAuthResolver() {
    const { data: session } = useSession() as {
      data: { user?: { name?: string | null; email?: string | null } } | null
    }
    const email = session?.user?.email ?? ''
    const name = session?.user?.name || email.split('@')[0] || 'Anonymous'
    return { name, email }
  }
}
