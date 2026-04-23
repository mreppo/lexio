/**
 * Tests for QuizTopBar — shared quiz top-bar component.
 *
 * Extracted from TypeQuizContent during issue #147 (Liquid Glass: Quiz MC).
 *
 * Covers:
 * - Renders the close button with correct aria-label
 * - Renders the progress bar (role="progressbar")
 * - Renders the N/M pill with correct text
 * - Calls onClose when the close button is clicked
 * - Progress value is correctly computed from current/total
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { QuizTopBar } from './QuizTopBar'

function renderTopBar(current: number, total: number, onClose = vi.fn()) {
  return render(
    <ThemeProvider theme={createTheme()}>
      <QuizTopBar progress={{ current, total }} onClose={onClose} />
    </ThemeProvider>,
  )
}

describe('QuizTopBar', () => {
  it('should render the close button with aria-label "Close quiz"', () => {
    renderTopBar(3, 10)
    expect(screen.getByRole('button', { name: 'Close quiz' })).toBeInTheDocument()
  })

  it('should render the progress bar', () => {
    renderTopBar(5, 14)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should render the N/M pill with current and total', () => {
    renderTopBar(7, 14)
    expect(screen.getByText('7/14')).toBeInTheDocument()
  })

  it('should render 0/0 pill when total is zero', () => {
    renderTopBar(0, 0)
    expect(screen.getByText('0/0')).toBeInTheDocument()
  })

  it('should call onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    renderTopBar(2, 10, onClose)
    fireEvent.click(screen.getByRole('button', { name: 'Close quiz' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should set the correct aria-label on the progress bar', () => {
    renderTopBar(4, 10)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-label', 'Session progress: 4 of 10 words completed')
  })

  it('should clamp progress value to 1 when current exceeds total', () => {
    renderTopBar(15, 10)
    const bar = screen.getByRole('progressbar')
    // Progress value is clamped; aria-valuenow should be 100 (100%)
    expect(bar).toHaveAttribute('aria-valuenow', '100')
  })
})
