import { useStytchUser } from '@stytch/react'
import { useMusConfig } from '@/context/MusContext'

export function useMusUser() {
  const config = useMusConfig()

  // 1. Config override takes priority
  if (config.user) {
    return {
      name: config.user.name?.trim() || 'Anonymous',
      email: config.user.email?.trim() || '',
    }
  }

  // 2. Try Stytch session
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
