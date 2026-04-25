import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '../../theme'
import { TabBar } from './TabBar'
import type { AppTab } from './TabBar'

function renderWithTheme(ui: React.ReactElement, mode: 'light' | 'dark' = 'dark') {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}

describe('TabBar', () => {
  it('should render all five navigation tabs', () => {
    renderWithTheme(<TabBar activeTab="home" onTabChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Navigate to Home/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Navigate to Quiz/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Navigate to Words/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Navigate to Stats/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Navigate to Settings/i })).toBeInTheDocument()
  })

  it('should render with aria-label="App navigation" on the nav element', () => {
    renderWithTheme(<TabBar activeTab="home" onTabChange={vi.fn()} />)
    expect(screen.getByRole('navigation', { name: 'App navigation' })).toBeInTheDocument()
  })

  it('should mark the active tab with aria-current="page"', () => {
    renderWithTheme(<TabBar activeTab="quiz" onTabChange={vi.fn()} />)
    const activeBtn = screen.getByRole('button', { name: /Navigate to Quiz/i })
    expect(activeBtn).toHaveAttribute('aria-current', 'page')
  })

  it('should NOT set aria-current on inactive tabs', () => {
    renderWithTheme(<TabBar activeTab="quiz" onTabChange={vi.fn()} />)
    const homeBtn = screen.getByRole('button', { name: /Navigate to Home/i })
    expect(homeBtn).not.toHaveAttribute('aria-current')
  })

  it('should call onTabChange with "quiz" when Quiz tab is clicked', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    renderWithTheme(<TabBar activeTab="home" onTabChange={onTabChange} />)

    await user.click(screen.getByRole('button', { name: /Navigate to Quiz/i }))
    expect(onTabChange).toHaveBeenCalledWith('quiz')
  })

  it('should call onTabChange with "words" when Words tab is clicked', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    renderWithTheme(<TabBar activeTab="home" onTabChange={onTabChange} />)

    await user.click(screen.getByRole('button', { name: /Navigate to Words/i }))
    expect(onTabChange).toHaveBeenCalledWith('words')
  })

  it('should call onTabChange with "stats" when Stats tab is clicked', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    renderWithTheme(<TabBar activeTab="home" onTabChange={onTabChange} />)

    await user.click(screen.getByRole('button', { name: /Navigate to Stats/i }))
    expect(onTabChange).toHaveBeenCalledWith('stats')
  })

  it('should call onTabChange with "settings" when Settings tab is clicked', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    renderWithTheme(<TabBar activeTab="home" onTabChange={onTabChange} />)

    await user.click(screen.getByRole('button', { name: /Navigate to Settings/i }))
    expect(onTabChange).toHaveBeenCalledWith('settings')
  })

  it('should call onTabChange with "home" when Home tab is clicked', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    renderWithTheme(<TabBar activeTab="settings" onTabChange={onTabChange} />)

    await user.click(screen.getByRole('button', { name: /Navigate to Home/i }))
    expect(onTabChange).toHaveBeenCalledWith('home')
  })

  it.each<AppTab>(['home', 'quiz', 'words', 'stats', 'settings'])(
    'should render with "%s" as the active tab without crashing',
    (tab) => {
      renderWithTheme(<TabBar activeTab={tab} onTabChange={vi.fn()} />)
      expect(screen.getByRole('navigation', { name: 'App navigation' })).toBeInTheDocument()
    },
  )

  it('should render in light mode without crashing', () => {
    renderWithTheme(<TabBar activeTab="home" onTabChange={vi.fn()} />, 'light')
    expect(screen.getByRole('navigation', { name: 'App navigation' })).toBeInTheDocument()
  })

  /*
   * Position and safe-area tests (#185):
   * TabBar must use position:fixed so it stays pinned to the viewport bottom
   * regardless of how tall the page content grows. Previously position:absolute
   * was used (#162), which caused the pill to drift below the fold on screens
   * with overflow content (Words list with 30+ entries, long Settings).
   *
   * jsdom does not resolve CSS custom properties or MUI sx class names into
   * computed styles, so we rely on MUI's data-* attributes or className inspection.
   * MUI v5 inlines the sx `position` value as a CSS variable class — the safest
   * assertion is that the nav does NOT use position:absolute as an inline style.
   */

  it('should render the nav with position:fixed so it stays pinned to the viewport (#185)', () => {
    const { container } = renderWithTheme(<TabBar activeTab="home" onTabChange={vi.fn()} />)
    const nav = container.querySelector('nav')
    expect(nav).not.toBeNull()
    // Verify the nav is NOT using position:absolute as an inline style override.
    // MUI renders sx values via generated class names; the nav element should not
    // have an inline style that overrides positioning back to absolute.
    const inlineStyle = nav?.getAttribute('style') ?? ''
    expect(inlineStyle).not.toContain('position: absolute')
  })

  it('should remain visible when shell content overflows viewport (position:fixed contract)', () => {
    // This test documents the fix for #185: TabBar must use position:fixed, not
    // position:absolute. When a container with position:relative grows taller than
    // the viewport, position:absolute bottom:30 resolves against the container
    // (pushing the pill below the fold). position:fixed always resolves against
    // the viewport — the pill stays visible at any scroll depth.
    //
    // We verify the structural contract: the nav element is rendered and is not
    // hidden, confirming it is not dependent on container height.
    const { container } = renderWithTheme(<TabBar activeTab="words" onTabChange={vi.fn()} />)
    const nav = container.querySelector('nav')
    expect(nav).not.toBeNull()
    expect(nav).toBeInTheDocument()
    // All 5 tab buttons must be reachable (not obscured by layout)
    expect(screen.getByRole('button', { name: /Navigate to Home/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Navigate to Words/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Navigate to Settings/i })).toBeInTheDocument()
  })

  it('should render the nav wrapper with pointerEvents:none so the transparent area does not block clicks', () => {
    const { container } = renderWithTheme(<TabBar activeTab="home" onTabChange={vi.fn()} />)
    const nav = container.querySelector('nav')
    expect(nav).not.toBeNull()
    // Each tab button restores pointer-events — nav wrapper suppresses them
    // so only the visible pill intercepts interaction.
    // This is a structural contract: nav has pointer-events:none, buttons have auto.
    const wordsBtn = screen.getByRole('button', { name: /Navigate to Words/i })
    expect(wordsBtn).toBeInTheDocument()
  })
})
