/**
 * Tests for SessionSummary component.
 *
 * Covers:
 * - Displays words reviewed count
 * - Displays correct / incorrect breakdown
 * - Calculates and displays accuracy percentage
 * - Shows streak info when streakDays > 0
 * - Does not show streak info when streakDays === 0
 * - Calls onContinue when "Start new session" is clicked
 * - Calls onGoHome when "Back to dashboard" is clicked
 * - Shows an encouraging message appropriate to accuracy
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { SessionSummary } from './SessionSummary'

function renderSummary(
  wordsReviewed = 10,
  correctCount = 8,
  streakDays = 0,
  onContinue = vi.fn(),
  onGoHome = vi.fn(),
) {
  return render(
    <ThemeProvider theme={createTheme()}>
      <SessionSummary
        wordsReviewed={wordsReviewed}
        correctCount={correctCount}
        streakDays={streakDays}
        onContinue={onContinue}
        onGoHome={onGoHome}
      />
    </ThemeProvider>,
  )
}

describe('SessionSummary', () => {
  it('should show Session complete heading', () => {
    renderSummary()
    expect(screen.getByText('Session complete!')).toBeInTheDocument()
  })

  it('should display words reviewed count', () => {
    renderSummary(15, 12)
    expect(screen.getByLabelText('15 words reviewed')).toBeInTheDocument()
  })

  it('should display accuracy percentage', () => {
    // 8/10 = 80%
    renderSummary(10, 8)
    expect(screen.getByLabelText('80% accuracy')).toBeInTheDocument()
  })

  it('should display correct count', () => {
    renderSummary(10, 8)
    expect(screen.getByLabelText('8 correct')).toBeInTheDocument()
  })

  it('should display incorrect count', () => {
    // 10 - 8 = 2 incorrect
    renderSummary(10, 8)
    expect(screen.getByLabelText('2 incorrect')).toBeInTheDocument()
  })

  it('should show 0% accuracy when wordsReviewed is 0', () => {
    renderSummary(0, 0)
    expect(screen.getByLabelText('0% accuracy')).toBeInTheDocument()
  })

  it('should show streak info when streakDays > 0', () => {
    renderSummary(10, 8, 5)
    expect(screen.getByText(/5 day streak/i)).toBeInTheDocument()
  })

  it('should not show streak info when streakDays === 0', () => {
    renderSummary(10, 8, 0)
    expect(screen.queryByText(/day streak/i)).not.toBeInTheDocument()
  })

  it('should call onContinue when "Start new session" is clicked', async () => {
    const onContinue = vi.fn()
    renderSummary(10, 8, 0, onContinue)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /start new session/i }))
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('should call onGoHome when "Back to dashboard" is clicked', async () => {
    const onGoHome = vi.fn()
    renderSummary(10, 8, 0, vi.fn(), onGoHome)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /back to dashboard/i }))
    expect(onGoHome).toHaveBeenCalledOnce()
  })

  it('should show outstanding message for >= 90% accuracy', () => {
    renderSummary(10, 9)  // 90%
    expect(screen.getByText(/outstanding/i)).toBeInTheDocument()
  })

  it('should show great job message for >= 75% accuracy', () => {
    renderSummary(10, 8)  // 80%
    expect(screen.getByText(/great job/i)).toBeInTheDocument()
  })

  it('should show good effort message for >= 50% accuracy', () => {
    renderSummary(10, 6)  // 60%
    expect(screen.getByText(/good effort/i)).toBeInTheDocument()
  })

  it('should show keep going message for < 50% accuracy', () => {
    renderSummary(10, 4)  // 40%
    expect(screen.getByText(/keep going/i)).toBeInTheDocument()
  })
})
