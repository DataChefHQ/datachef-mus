import { useStytchUser } from '@stytch/react'
import type { UserResolver } from '../types'

/** User resolver for @stytch/react. Requires @stytch/react in your project. */
export function stytchResolver(): UserResolver {
  return function useStytchResolver() {
    const { user } = useStytchUser()
    const email = user?.emails?.[0]?.email ?? ''
    const first = user?.name?.first_name ?? ''
    const last = user?.name?.last_name ?? ''
    const name = `${first} ${last}`.trim() || email.split('@')[0] || 'Anonymous'
    return { name, email }
  }
}
