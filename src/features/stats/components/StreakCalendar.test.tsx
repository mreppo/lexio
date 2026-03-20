import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { theme } from '@/theme'
import { StreakCalendar } from './StreakCalendar'
import { buildCalendarDays } from '../utils/activityData'
import type { CalendarDay } from '../utils/activityData'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

function emptyCalendar(count = 91): CalendarDay[] {
  return Array.from({ length: count }, (_, i) => ({
    date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
    level: 0 as const,
    wordsReviewed: 0,
    hasData: false,
  }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StreakCalendar', () => {
  it('should render without crashing', () => {
    wrap(<StreakCalendar days={emptyCalendar()} loading={false} />)
    expect(screen.getByText('Activity calendar')).toBeInTheDocument()
  })

  it('should render a grid with calendar days', () => {
    wrap(<StreakCalendar days={emptyCalendar()} loading={false} />)
    expect(screen.getByRole('grid', { name: /Activity calendar heatmap/i })).toBeInTheDocument()
  })

  it('should render the correct number of grid cells', () => {
    const days = emptyCalendar(91)
    wrap(<StreakCalendar days={days} loading={false} />)
    const cells = screen.getAllByRole('gridcell')
    expect(cells.length).toBe(91)
  })

  it('should show skeleton when loading', () => {
    const { container } = wrap(<StreakCalendar days={emptyCalendar()} loading={true} />)
    const skeletons = container.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should render a legend', () => {
    wrap(<StreakCalendar days={emptyCalendar()} loading={false} />)
    expect(screen.getByText('Less')).toBeInTheDocument()
    expect(screen.getByText('More')).toBeInTheDocument()
  })

  it('should set aria-label on grid cells with date info', () => {
    const today = '2024-03-15'
    const days = buildCalendarDays([], 20, today)
    wrap(<StreakCalendar days={days} loading={false} />)
    // Check that at least one cell has an aria-label mentioning March
    const cells = screen.getAllByRole('gridcell')
    const hasMarch = cells.some((c) => c.getAttribute('aria-label')?.includes('Mar'))
    expect(hasMarch).toBe(true)
  })

  it('should show "No activity" label for empty days', () => {
    const today = '2024-03-15'
    const days = buildCalendarDays([], 20, today)
    wrap(<StreakCalendar days={days} loading={false} />)
    const cells = screen.getAllByRole('gridcell')
    // All cells should show "No activity" for empty calendar
    const allNoActivity = cells.every((c) => c.getAttribute('aria-label')?.includes('No activity'))
    expect(allNoActivity).toBe(true)
  })
})
