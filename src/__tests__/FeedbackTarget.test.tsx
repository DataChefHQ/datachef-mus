import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { MusProvider } from '@/context/MusContext'
import { FeedbackTarget } from '@/components/FeedbackTarget'

// Mock MusThemeRoot to render children directly
vi.mock('@/components/MusThemeRoot', () => ({
  MusThemeRoot: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock dialogs to avoid complex setup
vi.mock('@/components/dialogs/SupportDialog', () => ({
  SupportDialog: () => <div data-testid="support-dialog" />,
}))
vi.mock('@/components/dialogs/FeedbackDialog', () => ({
  FeedbackDialog: () => <div data-testid="feedback-dialog" />,
}))
vi.mock('@/components/dialogs/VideoDialog', () => ({
  VideoDialog: () => <div data-testid="video-dialog" />,
}))
vi.mock('@/components/dialogs/StandaloneFeedbackDialog', () => ({
  StandaloneFeedbackDialog: () => <div data-testid="standalone-dialog" />,
}))

const baseConfig = {
  projectName: 'Test',
  slack: { proxyUrl: '/api', supportTeamEmails: [], feedbackChannelId: 'C123' },
  showWelcomeDialog: false,
  demoMode: true,
  hoverDelay: 300,
}

function renderWithProvider(ui: React.ReactNode, configOverrides = {}) {
  return render(
    <MusProvider config={{ ...baseConfig, ...configOverrides }}>{ui}</MusProvider>
  )
}

describe('FeedbackTarget', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders children', () => {
    renderWithProvider(
      <FeedbackTarget sectionId="s1" sectionName="Section 1">
        <div data-testid="content">Content</div>
      </FeedbackTarget>
    )
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('config.enabled===false renders just children without hover behavior', () => {
    const { container } = renderWithProvider(
      <FeedbackTarget sectionId="s1" sectionName="Section 1">
        <div data-testid="content">Content</div>
      </FeedbackTarget>,
      { enabled: false }
    )
    expect(screen.getByTestId('content')).toBeInTheDocument()
    // When disabled, FeedbackTarget returns a plain div — no 'relative' class
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).not.toContain('relative')
  })

  it('trigger is hidden initially', () => {
    renderWithProvider(
      <FeedbackTarget sectionId="s1" sectionName="Section 1">
        <div>Content</div>
      </FeedbackTarget>
    )
    // FeedbackTrigger (the lightbulb button) should not be visible before hover
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('trigger becomes visible after mouseEnter + 300ms (hoverDelay)', () => {
    const { container } = renderWithProvider(
      <FeedbackTarget sectionId="s1" sectionName="Section 1">
        <div>Content</div>
      </FeedbackTarget>
    )
    // FeedbackTarget renders as div.relative (nested inside MusProvider's display:contents div)
    const wrapper = container.querySelector('.relative') as HTMLElement
    expect(wrapper).not.toBeNull()
    fireEvent.mouseEnter(wrapper)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    // After hoverDelay, the FeedbackTrigger button should appear (aria-label "Open feedback actions")
    expect(screen.getByRole('button', { name: 'Open feedback actions' })).toBeInTheDocument()
  })

  it('inset=false: trigger overlay has Tailwind class -top-[18px]', () => {
    const { container } = renderWithProvider(
      <FeedbackTarget sectionId="s1" sectionName="Section 1" inset={false}>
        <div>Content</div>
      </FeedbackTarget>
    )
    const wrapper = container.querySelector('.relative') as HTMLElement
    fireEvent.mouseEnter(wrapper)
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // The overlay div should have the straddling negative position class
    const overlay = container.querySelector('[class*="-top-"]')
    expect(overlay).toBeInTheDocument()
    expect(overlay?.className).toContain('-top-[18px]')
  })

  it('inset=true: trigger overlay uses inline style top:8px (not the Tailwind -top class)', () => {
    const { container } = renderWithProvider(
      <FeedbackTarget sectionId="s1" sectionName="Section 1" inset={true}>
        <div>Content</div>
      </FeedbackTarget>
    )
    const wrapper = container.querySelector('.relative') as HTMLElement
    fireEvent.mouseEnter(wrapper)
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Find overlay that uses inline style for top
    // The inset overlay sets style={{ top: '8px' }} (or right/left/bottom depending on position)
    // Default position is top-right, so top:8px and right:8px
    const allDivs = container.querySelectorAll('div')
    const insetOverlay = Array.from(allDivs).find((el) => {
      const style = (el as HTMLElement).style
      return style.top === '8px' || style.right === '8px'
    })
    expect(insetOverlay).toBeDefined()
    expect(insetOverlay?.className).not.toContain('-top-[18px]')
  })

  it('FeedbackAction with enabled:false is NOT rendered after trigger shown', () => {
    const { container } = renderWithProvider(
      <FeedbackTarget
        sectionId="s1"
        sectionName="Section 1"
        actions={[
          { type: 'thumbs-up', enabled: false },
          { type: 'thumbs-down', enabled: true },
        ]}
      >
        <div>Content</div>
      </FeedbackTarget>
    )

    const wrapper = container.querySelector('.relative') as HTMLElement
    fireEvent.mouseEnter(wrapper)
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Click the trigger to show toolbar
    const triggerBtn = screen.getByRole('button', { name: 'Open feedback actions' })
    fireEvent.click(triggerBtn)

    // thumbs-up has enabled:false — should not be in the toolbar
    // ACTION_LABELS['thumbs-up'] is 'Helpful'
    expect(screen.queryByRole('button', { name: 'Helpful' })).not.toBeInTheDocument()
    // thumbs-down has enabled:true — should be present
    // ACTION_LABELS['thumbs-down'] is 'Not helpful'
    expect(screen.getByRole('button', { name: 'Not helpful' })).toBeInTheDocument()
  })
})
