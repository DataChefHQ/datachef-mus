import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useMusConfig } from '@/context/MusContext'
import { useFeedbackActions } from '@/hooks/useFeedbackActions'
import { FeedbackTrigger } from '@/components/FeedbackTrigger'
import { FeedbackToolbar } from '@/components/FeedbackToolbar'
import { SupportDialog } from '@/components/dialogs/SupportDialog'
import { FeedbackDialog } from '@/components/dialogs/FeedbackDialog'
import { VideoDialog } from '@/components/dialogs/VideoDialog'
import type { FeedbackAction, FeedbackActionType } from '@/types'

interface FeedbackTargetProps {
  /** Unique ID for this section — used in API payloads */
  sectionId: string
  /** Human-readable section name */
  sectionName: string
  children: ReactNode
  className?: string
  /** Video URL for this section (used by the video overview dialog) */
  videoUrl?: string
  /** Override global actions for this section */
  actions?: FeedbackAction[]
}

export function FeedbackTarget({
  sectionId,
  sectionName,
  children,
  className,
  videoUrl,
  actions,
}: FeedbackTargetProps) {
  const config = useMusConfig()
  const { handleAction, activeThumb } = useFeedbackActions(sectionId, sectionName)
  const resolvedActions = actions ?? config.actions

  const [showTrigger, setShowTrigger] = useState(false)
  const [showToolbar, setShowToolbar] = useState(false)
  const [activeDialog, setActiveDialog] = useState<FeedbackActionType | null>(null)

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const hoverDelay = config.hoverDelay ?? 500

  const handleMouseEnter = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => {
      setShowTrigger(true)
    }, hoverDelay)
  }, [hoverDelay])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    if (!showToolbar && !activeDialog) {
      setShowTrigger(false)
    }
  }, [showToolbar, activeDialog])

  const handleTriggerClick = useCallback(() => {
    setShowToolbar((prev) => !prev)
  }, [])

  const handleActionClick = useCallback(
    (type: FeedbackActionType) => {
      const result = handleAction(type)
      if (result === 'dialog') {
        setActiveDialog(type)
        setShowToolbar(false)
      }
    },
    [handleAction]
  )

  const handleDialogClose = useCallback(() => {
    setActiveDialog(null)
    setShowTrigger(false)
    setShowToolbar(false)
  }, [])

  // Close toolbar when clicking outside
  useEffect(() => {
    if (!showToolbar) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowToolbar(false)
        setShowTrigger(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showToolbar])

  // Close on ESC
  useEffect(() => {
    if (!showToolbar && !activeDialog) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowToolbar(false)
        setActiveDialog(null)
        setShowTrigger(false)
      }
    }

    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [showToolbar, activeDialog])

  const position = config.triggerPosition ?? 'top-right'

  // Position the trigger+toolbar row at the chosen corner
  // Trigger straddles the edge: offset by half its size (18px) so it's half-outside
  const positionClasses: Record<string, string> = {
    'top-left': '-top-[18px] -left-[18px]',
    'top-right': '-top-[18px] -right-[18px]',
    'bottom-left': '-bottom-[18px] -left-[18px]',
    'bottom-right': '-bottom-[18px] -right-[18px]',
  }

  // Toolbar expands in the opposite direction of the trigger's corner
  const toolbarDirection = position.includes('right') ? 'flex-row-reverse' : 'flex-row'

  // Transform origin for grow animation — grows from the trigger's corner
  const growOrigin: Record<string, string> = {
    'top-left': 'top left',
    'top-right': 'top right',
    'bottom-left': 'bottom left',
    'bottom-right': 'bottom right',
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {/* Trigger + Toolbar row */}
      {showTrigger && (
        <div
          className={cn(
            'absolute z-40 flex items-center gap-3',
            positionClasses[position],
            toolbarDirection
          )}
        >
          {/* Trigger (lightbulb) */}
          <FeedbackTrigger
            onClick={handleTriggerClick}
            isActive={showToolbar}
            style={{ transformOrigin: growOrigin[position] }}
          />

          {/* Toolbar — expands opposite to trigger */}
          {showToolbar && (
            <FeedbackToolbar
              actions={resolvedActions}
              onAction={handleActionClick}
              growOrigin={position.includes('right') ? 'right center' : 'left center'}
              activeThumb={activeThumb}
            />
          )}
        </div>
      )}

      {/* Dialogs */}
      {activeDialog === 'support' && (
        <SupportDialog
          sectionId={sectionId}
          sectionName={sectionName}
          onClose={handleDialogClose}
        />
      )}
      {activeDialog === 'voice' && (
        <FeedbackDialog
          sectionId={sectionId}
          sectionName={sectionName}
          onClose={handleDialogClose}
        />
      )}
      {activeDialog === 'video' && (
        <VideoDialog
          sectionId={sectionId}
          sectionName={sectionName}
          onClose={handleDialogClose}
          videoUrl={videoUrl}
        />
      )}
    </div>
  )
}
