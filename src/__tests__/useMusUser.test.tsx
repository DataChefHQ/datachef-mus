import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
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

describe('useMusUser', () => {
  it('config.user with name+email returns that user', () => {
    const { result } = renderHook(() => useMusUser(), {
      wrapper: makeWrapper({ user: { name: 'Alice', email: 'alice@example.com' } }),
    })
    expect(result.current.name).toBe('Alice')
    expect(result.current.email).toBe('alice@example.com')
  })

  it('config.user with email only — name is derived from email local part', () => {
    const { result } = renderHook(() => useMusUser(), {
      wrapper: makeWrapper({ user: { email: 'bob@example.com' } }),
    })
    expect(result.current.name).toBe('bob')
    expect(result.current.email).toBe('bob@example.com')
  })

  it('no config.user and no resolver returns Anonymous', () => {
    const { result } = renderHook(() => useMusUser(), {
      wrapper: makeWrapper(),
    })
    expect(result.current.name).toBe('Anonymous')
    expect(result.current.email).toBe('')
  })

  it('userResolver provided — calls resolver hook and returns its result', () => {
    const useCustomResolver = vi.fn(() => ({ name: 'Custom User', email: 'custom@example.com' }))

    const { result } = renderHook(() => useMusUser(), {
      wrapper: makeWrapper({ userResolver: useCustomResolver }),
    })
    expect(useCustomResolver).toHaveBeenCalled()
    expect(result.current.name).toBe('Custom User')
    expect(result.current.email).toBe('custom@example.com')
  })

  it('config.user takes priority over userResolver', () => {
    const useCustomResolver = vi.fn(() => ({ name: 'Resolver User', email: 'resolver@example.com' }))

    const { result } = renderHook(() => useMusUser(), {
      wrapper: makeWrapper({
        user: { name: 'Explicit User', email: 'explicit@example.com' },
        userResolver: useCustomResolver,
      }),
    })
    expect(result.current.name).toBe('Explicit User')
    expect(result.current.email).toBe('explicit@example.com')
  })
})
