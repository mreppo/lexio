import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BottomNav } from './BottomNav'
import type { AppTab } from './BottomNav'

describe('BottomNav', () => {
  it('should render all five navigation tabs', () => {
    render(<BottomNav activeTab="home" onTabChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Navigate to Home/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Navigate to Quiz/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Navigate to Words/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Navigate to Stats/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Navigate to Settings/i })).toBeInTheDocument()
  })

  it('should call onTabChange with correct tab when a tab is clicked', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    render(<BottomNav activeTab="home" onTabChange={onTabChange} />)

    await user.click(screen.getByRole('button', { name: /Navigate to Quiz/i }))
    expect(onTabChange).toHaveBeenCalledWith('quiz')
  })

  it('should call onTabChange with "words" when Words tab is clicked', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    render(<BottomNav activeTab="home" onTabChange={onTabChange} />)

    await user.click(screen.getByRole('button', { name: /Navigate to Words/i }))
    expect(onTabChange).toHaveBeenCalledWith('words')
  })

  it('should call onTabChange with "stats" when Stats tab is clicked', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    render(<BottomNav activeTab="home" onTabChange={onTabChange} />)

    await user.click(screen.getByRole('button', { name: /Navigate to Stats/i }))
    expect(onTabChange).toHaveBeenCalledWith('stats')
  })

  it('should call onTabChange with "settings" when Settings tab is clicked', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    render(<BottomNav activeTab="home" onTabChange={onTabChange} />)

    await user.click(screen.getByRole('button', { name: /Navigate to Settings/i }))
    expect(onTabChange).toHaveBeenCalledWith('settings')
  })

  it('should have aria-label for navigation', () => {
    render(<BottomNav activeTab="home" onTabChange={vi.fn()} />)
    expect(screen.getByRole('navigation', { name: 'App navigation' })).toBeInTheDocument()
  })

  it.each<AppTab>(['home', 'quiz', 'words', 'stats', 'settings'])(
    'should render with "%s" as the active tab without crashing',
    (tab) => {
      render(<BottomNav activeTab={tab} onTabChange={vi.fn()} />)
      expect(screen.getByRole('navigation', { name: 'App navigation' })).toBeInTheDocument()
    },
  )
})
