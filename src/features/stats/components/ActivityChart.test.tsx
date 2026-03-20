import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { theme } from '@/theme'
import { ActivityChart } from './ActivityChart'
import type { ActivityDay } from '../utils/activityData'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeDay(date: string, wordsReviewed: number, accuracy: number | null = null): ActivityDay {
  const correctCount = accuracy !== null ? Math.round(wordsReviewed * accuracy) : 0
  return {
    date,
    wordsReviewed,
    correctCount,
    incorrectCount: wordsReviewed - correctCount,
    accuracy,
  }
}

function emptyDays(count: number): ActivityDay[] {
  return Array.from({ length: count }, (_, i) =>
    makeDay(`2024-01-${String(i + 1).padStart(2, '0')}`, 0),
  )
}

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ActivityChart', () => {
  const days7 = emptyDays(7)
  const days30 = emptyDays(30)

  it('should render without crashing', () => {
    wrap(<ActivityChart days7={days7} days30={days30} loading={false} />)
    expect(screen.getByText('Activity')).toBeInTheDocument()
  })

  it('should show toggle buttons for 7d and 30d', () => {
    wrap(<ActivityChart days7={days7} days30={days30} loading={false} />)
    expect(screen.getByRole('button', { name: /last 7 days/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /last 30 days/i })).toBeInTheDocument()
  })

  it('should show empty state message when no activity', () => {
    wrap(<ActivityChart days7={days7} days30={days30} loading={false} />)
    expect(screen.getByText(/No activity in the last 7 days/i)).toBeInTheDocument()
  })

  it('should render SVG chart when there is activity', () => {
    const activeDays7 = days7.map((d, i) => (i === 3 ? makeDay(d.date, 10, 0.8) : d))
    const { container } = wrap(
      <ActivityChart days7={activeDays7} days30={days30} loading={false} />,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should switch to 30-day view when toggle is clicked', async () => {
    const user = userEvent.setup()
    const activeDays30 = days30.map((d, i) => (i === 15 ? makeDay(d.date, 20, 0.9) : d))
    wrap(<ActivityChart days7={days7} days30={activeDays30} loading={false} />)

    // Initially showing 7-day view with no activity
    expect(screen.getByText(/No activity in the last 7 days/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /last 30 days/i }))
    // After toggle, 30-day has activity so no empty state message
    expect(screen.queryByText(/No activity in the last 30 days/i)).not.toBeInTheDocument()
  })

  it('should show empty state for 30 days after toggling', async () => {
    const user = userEvent.setup()
    wrap(<ActivityChart days7={days7} days30={days30} loading={false} />)

    await user.click(screen.getByRole('button', { name: /last 30 days/i }))
    expect(screen.getByText(/No activity in the last 30 days/i)).toBeInTheDocument()
  })

  it('should show skeleton when loading', () => {
    const { container } = wrap(<ActivityChart days7={days7} days30={days30} loading={true} />)
    const skeletons = container.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show legend when chart has activity', () => {
    const activeDays7 = [makeDay('2024-01-01', 10, 0.8), ...emptyDays(6)]
    wrap(<ActivityChart days7={activeDays7} days30={days30} loading={false} />)
    expect(screen.getByText(/≥70% accuracy/i)).toBeInTheDocument()
  })
})
