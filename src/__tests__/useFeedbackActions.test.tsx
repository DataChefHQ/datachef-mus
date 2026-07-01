import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { MusProvider } from '@/context/MusContext'
import { useFeedbackActions } from '@/hooks/useFeedbackActions'

vi.mock('@/lib/slack-client', () => ({
  sendThumbsFeedback: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/demo-mode', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/demo-mode')>()
  return { ...actual, simulateFeedback: vi.fn().mockResolvedValue(undefined) }
})

const minConfig = {
  projectName: 'Test',
  slack: { proxyUrl: '/api', supportTeamEmails: [], feedbackChannelId: 'C123' },
  showWelcomeDialog: false,
}

function makeWrapper(configOverrides = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MusProvider config={{ ...minConfig, ...configOverrides }}>{children}</MusProvider>
    )
  }
}

describe('useFeedbackActions', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("handleAction('support') returns 'dialog'", () => {
    const { result } = renderHook(() => useFeedbackActions('s1', 'Section 1'), {
      wrapper: makeWrapper(),
    })
    expect(result.current.handleAction('support')).toBe('dialog')
  })

  it("handleAction('voice') returns 'dialog'", () => {
    const { result } = renderHook(() => useFeedbackActions('s1', 'Section 1'), {
      wrapper: makeWrapper(),
    })
    expect(result.current.handleAction('voice')).toBe('dialog')
  })

  it("handleAction('video') returns 'dialog'", () => {
    const { result } = renderHook(() => useFeedbackActions('s1', 'Section 1'), {
      wrapper: makeWrapper(),
    })
    expect(result.current.handleAction('video')).toBe('dialog')
  })

  it("handleAction('thumbs-up') returns 'done'", () => {
    const { result } = renderHook(() => useFeedbackActions('s1', 'Section 1'), {
      wrapper: makeWrapper(),
    })
    let returnValue: string | undefined
    act(() => {
      returnValue = result.current.handleAction('thumbs-up')
    })
    expect(returnValue).toBe('done')
  })

  it("handleAction('thumbs-down') returns 'done'", () => {
    const { result } = renderHook(() => useFeedbackActions('s1', 'Section 1'), {
      wrapper: makeWrapper(),
    })
    let returnValue: string | undefined
    act(() => {
      returnValue = result.current.handleAction('thumbs-down')
    })
    expect(returnValue).toBe('done')
  })

  it('onThumbsUp callback is called on thumbs-up', () => {
    const onThumbsUp = vi.fn()
    const { result } = renderHook(() => useFeedbackActions('s1', 'Section 1'), {
      wrapper: makeWrapper({ onThumbsUp }),
    })
    act(() => {
      result.current.handleAction('thumbs-up')
    })
    expect(onThumbsUp).toHaveBeenCalledWith('s1', 'Section 1')
  })

  it('onThumbsDown callback is called on thumbs-down', () => {
    const onThumbsDown = vi.fn()
    const { result } = renderHook(() => useFeedbackActions('s1', 'Section 1'), {
      wrapper: makeWrapper({ onThumbsDown }),
    })
    act(() => {
      result.current.handleAction('thumbs-down')
    })
    expect(onThumbsDown).toHaveBeenCalledWith('s1', 'Section 1')
  })

  it('onFeedbackSubmitted is called with action type', () => {
    const onFeedbackSubmitted = vi.fn()
    const { result } = renderHook(() => useFeedbackActions('s1', 'Section 1'), {
      wrapper: makeWrapper({ onFeedbackSubmitted }),
    })
    act(() => {
      result.current.handleAction('thumbs-up')
    })
    expect(onFeedbackSubmitted).toHaveBeenCalledWith('thumbs-up', 's1', 'Section 1')
  })

  it('toggle: calling thumbs-up twice — second call does NOT trigger onThumbsUp again', () => {
    const onThumbsUp = vi.fn()
    const { result } = renderHook(() => useFeedbackActions('s1', 'Section 1'), {
      wrapper: makeWrapper({ onThumbsUp }),
    })
    // First call — votes thumbs-up
    act(() => {
      result.current.handleAction('thumbs-up')
    })
    expect(onThumbsUp).toHaveBeenCalledTimes(1)

    // Second call — toggles off (removes vote), callback NOT called again
    let secondReturn: string | undefined
    act(() => {
      secondReturn = result.current.handleAction('thumbs-up')
    })
    expect(secondReturn).toBe('done')
    expect(onThumbsUp).toHaveBeenCalledTimes(1)
  })

  it('demoMode: simulateFeedback is called instead of sendThumbsFeedback', async () => {
    const { simulateFeedback } = await import('@/lib/demo-mode')
    const { sendThumbsFeedback } = await import('@/lib/slack-client')

    const { result } = renderHook(() => useFeedbackActions('s1', 'Section 1'), {
      wrapper: makeWrapper({ demoMode: true }),
    })
    act(() => {
      result.current.handleAction('thumbs-up')
    })

    expect(simulateFeedback).toHaveBeenCalled()
    expect(sendThumbsFeedback).not.toHaveBeenCalled()
  })
})
