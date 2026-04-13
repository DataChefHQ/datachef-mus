import { useState, useCallback } from 'react'

type ThumbsVote = 'thumbs-up' | 'thumbs-down' | null

const STORAGE_PREFIX = 'mus-thumbs-'

function getStoredVote(sectionId: string): ThumbsVote {
  try {
    const value = localStorage.getItem(STORAGE_PREFIX + sectionId)
    if (value === 'thumbs-up' || value === 'thumbs-down') return value
  } catch {
    // localStorage unavailable
  }
  return null
}

function setStoredVote(sectionId: string, vote: ThumbsVote) {
  try {
    if (vote) {
      localStorage.setItem(STORAGE_PREFIX + sectionId, vote)
    } else {
      localStorage.removeItem(STORAGE_PREFIX + sectionId)
    }
  } catch {
    // localStorage unavailable
  }
}

export function useThumbsStore(sectionId: string) {
  const [vote, setVoteState] = useState<ThumbsVote>(() => getStoredVote(sectionId))

  const setVote = useCallback(
    (newVote: ThumbsVote) => {
      setVoteState(newVote)
      setStoredVote(sectionId, newVote)
    },
    [sectionId]
  )

  return { vote, setVote }
}
