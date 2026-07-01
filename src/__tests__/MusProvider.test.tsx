import { describe, it, expect, vi } from 'vitest'
import { render, screen, renderHook } from '@testing-library/react'
import React from 'react'
import { MusProvider, useMusConfig } from '@/context/MusContext'

vi.mock('@/components/dialogs/WelcomeDialog', () => ({
  WelcomeDialog: () => <div data-testid="welcome-dialog" />,
}))

// Mock MusThemeRoot to render children directly (no shadow DOM needed in tests)
vi.mock('@/components/MusThemeRoot', () => ({
  MusThemeRoot: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const minConfig = {
  projectName: 'Test',
  slack: { proxyUrl: '/api', supportTeamEmails: [], feedbackChannelId: 'C123' },
  showWelcomeDialog: false,
}

function renderWithProvider(ui: React.ReactNode, configOverrides = {}) {
  return render(
    <MusProvider config={{ ...minConfig, ...configOverrides }}>{ui}</MusProvider>
  )
}

describe('MusProvider', () => {
  it('renders children', () => {
    renderWithProvider(<div data-testid="child">hello</div>)
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('useMusConfig returns the provided config', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MusProvider config={minConfig}>{children}</MusProvider>
    )
    const { result } = renderHook(() => useMusConfig(), { wrapper })
    expect(result.current.projectName).toBe('Test')
    expect(result.current.slack.feedbackChannelId).toBe('C123')
  })

  it('applies defaults: hoverDelay=500, triggerPosition=top-right, actions has 5 items', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MusProvider config={minConfig}>{children}</MusProvider>
    )
    const { result } = renderHook(() => useMusConfig(), { wrapper })
    expect(result.current.hoverDelay).toBe(500)
    expect(result.current.triggerPosition).toBe('top-right')
    expect(result.current.actions).toHaveLength(5)
  })

  it('showWelcomeDialog: false suppresses WelcomeDialog', () => {
    renderWithProvider(<div />, { showWelcomeDialog: false })
    expect(screen.queryByTestId('welcome-dialog')).not.toBeInTheDocument()
  })

  it('enabled: false suppresses WelcomeDialog', () => {
    renderWithProvider(<div />, { enabled: false, showWelcomeDialog: true })
    expect(screen.queryByTestId('welcome-dialog')).not.toBeInTheDocument()
  })

  it('mode: standalone suppresses WelcomeDialog', () => {
    renderWithProvider(<div />, { mode: 'standalone', showWelcomeDialog: true })
    expect(screen.queryByTestId('welcome-dialog')).not.toBeInTheDocument()
  })

  it('shows WelcomeDialog when conditions are met', () => {
    renderWithProvider(<div />, { showWelcomeDialog: true, enabled: true })
    expect(screen.getByTestId('welcome-dialog')).toBeInTheDocument()
  })

  it('useMusConfig throws when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useMusConfig())).toThrow(
      'useMusConfig must be used within a <MusProvider>'
    )
    consoleError.mockRestore()
  })
})
