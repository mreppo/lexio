/**
 * Tests for GoalCelebration component.
 *
 * Covers:
 * - Renders when open is true
 * - Does not render visible content when open is false
 * - Shows the daily goal count
 * - Shows streak when streakDays > 1
 * - Hides streak when streakDays <= 1
 * - Auto-closes after timeout
 * - Calls onClose when "Keep going" button is clicked
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { GoalCelebration, GOAL_CELEBRATION_AUTO_CLOSE_MS } from './GoalCelebration'

interface RenderOptions {
  open?: boolean
  onClose?: ReturnType<typeof vi.fn>
  dailyGoal?: number
  streakDays?: number
}

function renderCelebration({
  open = true,
  onClose = vi.fn(),
  dailyGoal = 20,
  streakDays = 0,
}: RenderOptions = {}) {
  return render(
    <ThemeProvider theme={createTheme()}>
      <GoalCelebration
        open={open}
        onClose={onClose}
        dailyGoal={dailyGoal}
        streakDays={streakDays}
      />
    </ThemeProvider>,
  )
}

describe('GoalCelebration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render the celebration heading when open', () => {
    renderCelebration({ open: true })
    expect(screen.getByText('Daily goal met!')).toBeInTheDocument()
  })

  it('should not show the celebration dialog content when closed', () => {
    renderCelebration({ open: false })
    expect(screen.queryByText('Daily goal met!')).not.toBeInTheDocument()
  })

  it('should display the daily goal word count', () => {
    renderCelebration({ open: true, dailyGoal: 20 })
    expect(screen.getByText(/You reviewed 20 words today/i)).toBeInTheDocument()
  })

  it('should display a custom daily goal count', () => {
    renderCelebration({ open: true, dailyGoal: 50 })
    expect(screen.getByText(/You reviewed 50 words today/i)).toBeInTheDocument()
  })

  it('should show streak info when streakDays > 1', () => {
    renderCelebration({ open: true, streakDays: 5 })
    expect(screen.getByText(/5 day streak/i)).toBeInTheDocument()
  })

  it('should not show streak info when streakDays === 0', () => {
    renderCelebration({ open: true, streakDays: 0 })
    expect(screen.queryByText(/day streak/i)).not.toBeInTheDocument()
  })

  it('should not show streak info when streakDays === 1', () => {
    renderCelebration({ open: true, streakDays: 1 })
    expect(screen.queryByText(/day streak/i)).not.toBeInTheDocument()
  })

  it('should call onClose after the auto-close timeout', () => {
    const onClose = vi.fn()
    renderCelebration({ open: true, onClose })

    expect(onClose).not.toHaveBeenCalled()
    vi.advanceTimersByTime(GOAL_CELEBRATION_AUTO_CLOSE_MS)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should not call onClose before the timeout has elapsed', () => {
    const onClose = vi.fn()
    renderCelebration({ open: true, onClose })

    vi.advanceTimersByTime(GOAL_CELEBRATION_AUTO_CLOSE_MS - 1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('should call onClose when "Keep going" button is clicked', async () => {
    vi.useRealTimers()
    const onClose = vi.fn()
    renderCelebration({ open: true, onClose })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /keep going/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should not trigger auto-close when closed', () => {
    const onClose = vi.fn()
    renderCelebration({ open: false, onClose })
    vi.advanceTimersByTime(GOAL_CELEBRATION_AUTO_CLOSE_MS * 2)
    expect(onClose).not.toHaveBeenCalled()
  })
})
