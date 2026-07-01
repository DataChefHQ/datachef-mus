import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { useStytchUser } from '@stytch/react'
import { stytchResolver } from '@/resolvers/stytch'
import { MusProvider } from '@/context/MusContext'
import { useMusUser } from '@/hooks/useMusUser'

const minSlack = { proxyUrl: '/api', supportTeamEmails: [], feedbackChannelId: 'C123' }

function makeWrapper(configOverrides: Record<string, unknown> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MusProvider
        config={{
          projectName: 'Test',
          slack: minSlack,
          showWelcomeDialog: false,
          ...configOverrides,
        }}
      >
        {children}
      </MusProvider>
    )
  }
}

describe('stytchResolver', () => {
  beforeEach(() => {
    vi.mocked(useStytchUser).mockReturnValue({ user: null } as ReturnType<typeof useStytchUser>)
  })

  it('stytchResolver() returns a hook function', () => {
    const resolver = stytchResolver()
    expect(typeof resolver).toBe('function')
  })

  it('resolver hook extracts name+email from Stytch session', () => {
    vi.mocked(useStytchUser).mockReturnValue({
      user: {
        emails: [{ email: 'jane@example.com' }],
        name: { first_name: 'Jane', last_name: 'Doe' },
      },
    } as ReturnType<typeof useStytchUser>)

    const resolver = stytchResolver()
    const { result } = renderHook(() => resolver())
    expect(result.current.name).toBe('Jane Doe')
    expect(result.current.email).toBe('jane@example.com')
  })

  it('resolver hook returns anonymous when Stytch user is null', () => {
    vi.mocked(useStytchUser).mockReturnValue({ user: null } as ReturnType<typeof useStytchUser>)

    const resolver = stytchResolver()
    const { result } = renderHook(() => resolver())
    expect(result.current.name).toBe('Anonymous')
    expect(result.current.email).toBe('')
  })

  it('resolver hook derives name from email when name fields are empty', () => {
    vi.mocked(useStytchUser).mockReturnValue({
      user: {
        emails: [{ email: 'alice@example.com' }],
        name: { first_name: '', last_name: '' },
      },
    } as ReturnType<typeof useStytchUser>)

    const resolver = stytchResolver()
    const { result } = renderHook(() => resolver())
    expect(result.current.name).toBe('alice')
    expect(result.current.email).toBe('alice@example.com')
  })
})

describe('userResolver in MusProvider config', () => {
  beforeEach(() => {
    vi.mocked(useStytchUser).mockReturnValue({ user: null } as ReturnType<typeof useStytchUser>)
  })

  it('userResolver provided to MusProvider is called by useMusUser', () => {
    const useCustomResolver = vi.fn(() => ({ name: 'Resolver User', email: 'resolver@example.com' }))

    const { result } = renderHook(() => useMusUser(), {
      wrapper: makeWrapper({ userResolver: useCustomResolver }),
    })

    expect(useCustomResolver).toHaveBeenCalled()
    expect(result.current.name).toBe('Resolver User')
    expect(result.current.email).toBe('resolver@example.com')
  })

  it('config.user takes priority over userResolver', () => {
    const useCustomResolver = vi.fn(() => ({ name: 'Resolver User', email: 'resolver@example.com' }))

    const { result } = renderHook(() => useMusUser(), {
      wrapper: makeWrapper({
        user: { name: 'Config User', email: 'config@example.com' },
        userResolver: useCustomResolver,
      }),
    })

    // config.user wins — resolver result is ignored (resolver may still be called for hooks stability)
    expect(result.current.name).toBe('Config User')
    expect(result.current.email).toBe('config@example.com')
  })
})
