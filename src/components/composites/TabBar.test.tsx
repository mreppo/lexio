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
})
