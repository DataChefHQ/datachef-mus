import { useStytchUser } from '@stytch/react'

export function useMusUser() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { user } = useStytchUser()

    const first = user?.name?.first_name ?? ''
    const last = user?.name?.last_name ?? ''
    const name = `${first} ${last}`.trim() || 'Anonymous'
    const email = user?.emails?.[0]?.email ?? ''

    return { name, email }
  } catch {
    // No StytchProvider in tree — return anonymous fallback
    return { name: 'Anonymous', email: '' }
  }
}
