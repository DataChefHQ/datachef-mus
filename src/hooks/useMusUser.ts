import { useStytchUser } from '@stytch/react'
import { useMusConfig } from '@/context/MusContext'

/** Extract the local part of an email as a fallback name */
function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  return local || 'Anonymous'
}

export function useMusUser() {
  const config = useMusConfig()

  // 1. Config override takes priority
  if (config.user) {
    const email = config.user.email?.trim() || ''
    return {
      name: config.user.name?.trim() || nameFromEmail(email),
      email,
    }
  }

  // 2. Try Stytch session
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { user } = useStytchUser()

    const first = user?.name?.first_name ?? ''
    const last = user?.name?.last_name ?? ''
    const email = user?.emails?.[0]?.email ?? ''
    const name = `${first} ${last}`.trim() || nameFromEmail(email)

    return { name, email }
  } catch {
    // No StytchProvider in tree — return anonymous fallback
    return { name: 'Anonymous', email: '' }
  }
}
