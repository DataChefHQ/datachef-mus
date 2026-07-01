// @ts-ignore - requires @clerk/clerk-react peer dependency: npm install @clerk/clerk-react
import { useUser } from '@clerk/clerk-react'
import type { UserResolver } from '../types'

/** User resolver for @clerk/clerk-react. Requires @clerk/clerk-react in your project. */
export function clerkResolver(): UserResolver {
  return function useClerkResolver() {
    const { user } = useUser() as {
      user: {
        firstName?: string | null
        lastName?: string | null
        primaryEmailAddress?: { emailAddress: string } | null
      } | null | undefined
    }
    const email = user?.primaryEmailAddress?.emailAddress ?? ''
    const first = user?.firstName ?? ''
    const last = user?.lastName ?? ''
    const name = `${first} ${last}`.trim() || email.split('@')[0] || 'Anonymous'
    return { name, email }
  }
}
