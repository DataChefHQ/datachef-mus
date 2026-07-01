import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThumbsStore } from '@/hooks/useThumbsStore'

describe('useThumbsStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initial vote is null', () => {
    const { result } = renderHook(() => useThumbsStore('section1'))
    expect(result.current.vote).toBeNull()
  })

  it("setVote('thumbs-up') updates the vote state", () => {
    const { result } = renderHook(() => useThumbsStore('section1'))
    act(() => {
      result.current.setVote('thumbs-up')
    })
    expect(result.current.vote).toBe('thumbs-up')
  })

  it("setVote updates localStorage", () => {
    const { result } = renderHook(() => useThumbsStore('section1'))
    act(() => {
      result.current.setVote('thumbs-up')
    })
    expect(localStorage.getItem('mus-thumbs-section1')).toBe('thumbs-up')
  })

  it('setVote(null) removes the item from localStorage', () => {
    const { result } = renderHook(() => useThumbsStore('section1'))
    act(() => {
      result.current.setVote('thumbs-down')
    })
    expect(localStorage.getItem('mus-thumbs-section1')).toBe('thumbs-down')

    act(() => {
      result.current.setVote(null)
    })
    expect(localStorage.getItem('mus-thumbs-section1')).toBeNull()
    expect(result.current.vote).toBeNull()
  })

  it('new hook instance with same sectionId reads the persisted vote', () => {
    // First hook instance writes a vote
    const { result: first } = renderHook(() => useThumbsStore('section1'))
    act(() => {
      first.current.setVote('thumbs-down')
    })

    // Second hook instance reads from localStorage
    const { result: second } = renderHook(() => useThumbsStore('section1'))
    expect(second.current.vote).toBe('thumbs-down')
  })

  it('different sectionIds are independent', () => {
    const { result: hookA } = renderHook(() => useThumbsStore('sectionA'))
    const { result: hookB } = renderHook(() => useThumbsStore('sectionB'))

    act(() => {
      hookA.current.setVote('thumbs-up')
    })
    act(() => {
      hookB.current.setVote('thumbs-down')
    })

    expect(hookA.current.vote).toBe('thumbs-up')
    expect(hookB.current.vote).toBe('thumbs-down')
    expect(localStorage.getItem('mus-thumbs-sectionA')).toBe('thumbs-up')
    expect(localStorage.getItem('mus-thumbs-sectionB')).toBe('thumbs-down')
  })
})
