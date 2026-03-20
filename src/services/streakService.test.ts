/**
 * Tests for streakService - daily streak calculation logic.
 */

import { describe, it, expect } from 'vitest'
import type { DailyStats } from '@/types'
import {
  calculateCurrentStreak,
  calculateBestStreak,
  formatDate,
  offsetDate,
  todayDateString,
  yesterdayDateString,
  LEARNED_CONFIDENCE_THRESHOLD,
} from './streakService'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStats(date: string, wordsReviewed: number): DailyStats {
  return {
    date,
    wordsReviewed,
    correctCount: wordsReviewed,
    incorrectCount: 0,
    streakDays: 0,
  }
}

function makeMap(entries: DailyStats[]): Map<string, DailyStats> {
  return new Map(entries.map((s) => [s.date, s]))
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a date object as YYYY-MM-DD', () => {
    expect(formatDate(new Date(2024, 0, 5))).toBe('2024-01-05') // January 5
    expect(formatDate(new Date(2024, 11, 31))).toBe('2024-12-31') // December 31
    expect(formatDate(new Date(2024, 1, 29))).toBe('2024-02-29') // Leap day
  })
})

describe('offsetDate', () => {
  it('returns a date string offset by the given number of days (past)', () => {
    expect(offsetDate('2024-03-10', 1)).toBe('2024-03-09')
    expect(offsetDate('2024-03-10', 5)).toBe('2024-03-05')
    expect(offsetDate('2024-03-01', 1)).toBe('2024-02-29') // leap year boundary
  })

  it('returns a date string offset into the future with negative offset', () => {
    expect(offsetDate('2024-03-10', -1)).toBe('2024-03-11')
    expect(offsetDate('2024-02-29', -1)).toBe('2024-03-01')
  })
})

describe('todayDateString', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    expect(todayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('yesterdayDateString', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    expect(yesterdayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('is one day before today', () => {
    const today = todayDateString()
    expect(offsetDate(today, 1)).toBe(yesterdayDateString())
  })
})

// ─── calculateCurrentStreak ───────────────────────────────────────────────────

describe('calculateCurrentStreak', () => {
  const GOAL = 5

  it('returns 0 for an empty map', () => {
    expect(calculateCurrentStreak(new Map(), GOAL, '2024-03-10')).toBe(0)
  })

  it('returns 0 when today has no entry yet (grace: starts checking yesterday)', () => {
    // No entry for yesterday either.
    const stats = makeMap([makeStats('2024-03-08', GOAL)])
    // Yesterday = 2024-03-09, not in map → streak is 0.
    expect(calculateCurrentStreak(stats, GOAL, '2024-03-10')).toBe(0)
  })

  it('counts a single completed day (yesterday)', () => {
    const stats = makeMap([makeStats('2024-03-09', GOAL)])
    expect(calculateCurrentStreak(stats, GOAL, '2024-03-10')).toBe(1)
  })

  it('counts consecutive completed days ending yesterday', () => {
    const stats = makeMap([
      makeStats('2024-03-07', GOAL),
      makeStats('2024-03-08', GOAL),
      makeStats('2024-03-09', GOAL),
    ])
    expect(calculateCurrentStreak(stats, GOAL, '2024-03-10')).toBe(3)
  })

  it('counts today when today is already complete', () => {
    const stats = makeMap([makeStats('2024-03-09', GOAL), makeStats('2024-03-10', GOAL)])
    expect(calculateCurrentStreak(stats, GOAL, '2024-03-10')).toBe(2)
  })

  it('breaks streak when a day is missed', () => {
    // 2024-03-08 is missing (gap between 07 and 09).
    const stats = makeMap([makeStats('2024-03-07', GOAL), makeStats('2024-03-09', GOAL)])
    // Yesterday is 2024-03-09 (completed), but 2024-03-08 is missing → streak = 1.
    expect(calculateCurrentStreak(stats, GOAL, '2024-03-10')).toBe(1)
  })

  it('breaks streak when a day has fewer words than dailyGoal', () => {
    const stats = makeMap([
      makeStats('2024-03-08', GOAL),
      makeStats('2024-03-09', GOAL - 1), // not enough
    ])
    expect(calculateCurrentStreak(stats, GOAL, '2024-03-10')).toBe(0)
  })

  it('applies grace period: today not yet started does not break streak', () => {
    // User reviewed yesterday and the day before, but nothing today yet.
    const stats = makeMap([makeStats('2024-03-08', GOAL), makeStats('2024-03-09', GOAL)])
    // Today (2024-03-10) has no entry — grace period applies.
    expect(calculateCurrentStreak(stats, GOAL, '2024-03-10')).toBe(2)
  })

  it('only counts today if goal is already met today', () => {
    // Today partially done (below goal) - should not count.
    const stats = makeMap([makeStats('2024-03-09', GOAL), makeStats('2024-03-10', GOAL - 1)])
    expect(calculateCurrentStreak(stats, GOAL, '2024-03-10')).toBe(1)
  })
})

// ─── calculateBestStreak ─────────────────────────────────────────────────────

describe('calculateBestStreak', () => {
  const GOAL = 5

  it('returns 0 for an empty map', () => {
    expect(calculateBestStreak(new Map(), GOAL)).toBe(0)
  })

  it('returns 1 for a single completed day', () => {
    const stats = makeMap([makeStats('2024-03-09', GOAL)])
    expect(calculateBestStreak(stats, GOAL)).toBe(1)
  })

  it('calculates a multi-day streak', () => {
    const stats = makeMap([
      makeStats('2024-03-07', GOAL),
      makeStats('2024-03-08', GOAL),
      makeStats('2024-03-09', GOAL),
    ])
    expect(calculateBestStreak(stats, GOAL)).toBe(3)
  })

  it('returns the longest run when there are multiple runs', () => {
    const stats = makeMap([
      makeStats('2024-03-01', GOAL),
      makeStats('2024-03-02', GOAL),
      // gap on 2024-03-03
      makeStats('2024-03-04', GOAL),
      makeStats('2024-03-05', GOAL),
      makeStats('2024-03-06', GOAL),
      makeStats('2024-03-07', GOAL),
    ])
    expect(calculateBestStreak(stats, GOAL)).toBe(4)
  })

  it('ignores days with fewer words than dailyGoal', () => {
    const stats = makeMap([
      makeStats('2024-03-08', GOAL),
      makeStats('2024-03-09', GOAL - 1), // not enough
      makeStats('2024-03-10', GOAL),
    ])
    expect(calculateBestStreak(stats, GOAL)).toBe(1)
  })

  it('handles a single long unbroken streak', () => {
    const entries: DailyStats[] = []
    for (let i = 1; i <= 30; i++) {
      entries.push(makeStats(`2024-01-${String(i).padStart(2, '0')}`, GOAL))
    }
    expect(calculateBestStreak(makeMap(entries), GOAL)).toBe(30)
  })
})

// ─── LEARNED_CONFIDENCE_THRESHOLD ────────────────────────────────────────────

describe('LEARNED_CONFIDENCE_THRESHOLD', () => {
  it('is 0.8', () => {
    expect(LEARNED_CONFIDENCE_THRESHOLD).toBe(0.8)
  })
})
