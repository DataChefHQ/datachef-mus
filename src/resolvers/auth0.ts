// @ts-ignore - requires @auth0/auth0-react peer dependency: npm install @auth0/auth0-react
import { useUser } from '@auth0/auth0-react'
import type { UserResolver } from '../types'

/** User resolver for @auth0/auth0-react. Requires @auth0/auth0-react in your project. */
export function auth0Resolver(): UserResolver {
  return function useAuth0Resolver() {
    const { user } = useUser() as {
      user?: {
        name?: string
        email?: string
        given_name?: string
        family_name?: string
      }
    }
    const email = user?.email ?? ''
    const name = user?.name || `${user?.given_name ?? ''} ${user?.family_name ?? ''}`.trim() || email.split('@')[0] || 'Anonymous'
    return { name, email }
  }
}
