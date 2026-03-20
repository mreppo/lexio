import { describe, it, expect } from 'vitest'
import type { DailyStats } from '@/types'
import {
  computeIntensityLevel,
  buildActivityDays,
  buildCalendarDays,
  computeOverallMetrics,
  CALENDAR_DAYS,
} from './activityData'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeStats(date: string, wordsReviewed: number, correctCount = 0): DailyStats {
  return {
    date,
    wordsReviewed,
    correctCount,
    incorrectCount: wordsReviewed - correctCount,
    streakDays: 1,
  }
}

// ─── computeIntensityLevel ────────────────────────────────────────────────────

describe('computeIntensityLevel', () => {
  it('should return 0 for zero words reviewed', () => {
    expect(computeIntensityLevel(0, 20)).toBe(0)
  })

  it('should return at least 1 for any non-zero review count', () => {
    expect(computeIntensityLevel(1, 20)).toBeGreaterThanOrEqual(1)
  })

  it('should return 4 for very high review counts', () => {
    expect(computeIntensityLevel(100, 20)).toBe(4)
  })

  it('should scale thresholds proportionally with dailyGoal', () => {
    // At goal=20, level thresholds are [1,5,15,30]
    // At goal=40, thresholds double
    const levelAt20 = computeIntensityLevel(10, 20)
    const levelAt40 = computeIntensityLevel(10, 40)
    // 10 reviews at goal=20 should be higher intensity than at goal=40
    expect(levelAt20).toBeGreaterThanOrEqual(levelAt40)
  })

  it('should return values in range 0-4', () => {
    for (let w = 0; w <= 50; w++) {
      const level = computeIntensityLevel(w, 20)
      expect(level).toBeGreaterThanOrEqual(0)
      expect(level).toBeLessThanOrEqual(4)
    }
  })
})

// ─── buildActivityDays ────────────────────────────────────────────────────────

describe('buildActivityDays', () => {
  it('should return exactly the requested number of days', () => {
    expect(buildActivityDays([], 7, '2024-01-15').length).toBe(7)
    expect(buildActivityDays([], 30, '2024-01-15').length).toBe(30)
  })

  it('should have zeroed values for missing days', () => {
    const days = buildActivityDays([], 7, '2024-01-15')
    for (const day of days) {
      expect(day.wordsReviewed).toBe(0)
      expect(day.correctCount).toBe(0)
      expect(day.incorrectCount).toBe(0)
      expect(day.accuracy).toBeNull()
    }
  })

  it('should place today as the last element', () => {
    const today = '2024-03-01'
    const days = buildActivityDays([], 7, today)
    expect(days[days.length - 1].date).toBe(today)
  })

  it('should place 6 days ago as the first element for a 7-day range', () => {
    const today = '2024-03-07'
    const days = buildActivityDays([], 7, today)
    expect(days[0].date).toBe('2024-03-01')
  })

  it('should populate stats from DailyStats records', () => {
    const today = '2024-03-10'
    const stats = [makeStats('2024-03-10', 15, 12), makeStats('2024-03-09', 8, 6)]
    const days = buildActivityDays(stats, 7, today)

    const todayEntry = days.find((d) => d.date === '2024-03-10')
    expect(todayEntry?.wordsReviewed).toBe(15)
    expect(todayEntry?.correctCount).toBe(12)
    expect(todayEntry?.incorrectCount).toBe(3)
    expect(todayEntry?.accuracy).toBeCloseTo(12 / 15)
  })

  it('should set accuracy to null for days with zero reviews', () => {
    const today = '2024-03-10'
    const days = buildActivityDays([], 7, today)
    for (const day of days) {
      expect(day.accuracy).toBeNull()
    }
  })
})

// ─── buildCalendarDays ────────────────────────────────────────────────────────

describe('buildCalendarDays', () => {
  it('should return exactly CALENDAR_DAYS entries', () => {
    const days = buildCalendarDays([], 20, '2024-03-01')
    expect(days.length).toBe(CALENDAR_DAYS)
  })

  it('should place today as the last element', () => {
    const today = '2024-06-15'
    const days = buildCalendarDays([], 20, today)
    expect(days[days.length - 1].date).toBe(today)
  })

  it('should set level 0 for days with no activity', () => {
    const days = buildCalendarDays([], 20, '2024-03-01')
    for (const day of days) {
      expect(day.level).toBe(0)
    }
  })

  it('should set hasData=false for days with no record', () => {
    const days = buildCalendarDays([], 20, '2024-03-01')
    for (const day of days) {
      expect(day.hasData).toBe(false)
    }
  })

  it('should set hasData=true and level > 0 for active days', () => {
    const today = '2024-03-01'
    const stats = [makeStats(today, 20)]
    const days = buildCalendarDays(stats, 20, today)
    const todayEntry = days[days.length - 1]
    expect(todayEntry.hasData).toBe(true)
    expect(todayEntry.level).toBeGreaterThan(0)
  })

  it('should assign level 4 when daily goal is met', () => {
    const today = '2024-03-01'
    const stats = [makeStats(today, 30)] // above 30-threshold at goal=20
    const days = buildCalendarDays(stats, 20, today)
    const todayEntry = days[days.length - 1]
    expect(todayEntry.level).toBe(4)
  })
})

// ─── computeOverallMetrics ────────────────────────────────────────────────────

describe('computeOverallMetrics', () => {
  it('should return zeroes and null accuracy for empty stats', () => {
    const metrics = computeOverallMetrics([])
    expect(metrics.totalReviews).toBe(0)
    expect(metrics.averageAccuracy).toBeNull()
  })

  it('should sum all wordsReviewed as totalReviews', () => {
    const stats = [
      makeStats('2024-01-01', 10, 8),
      makeStats('2024-01-02', 20, 15),
      makeStats('2024-01-03', 5, 5),
    ]
    const metrics = computeOverallMetrics(stats)
    expect(metrics.totalReviews).toBe(35)
  })

  it('should compute weighted average accuracy across all days', () => {
    // 10 reviewed, 8 correct + 20 reviewed, 15 correct = 30 reviewed, 23 correct = 76.67%
    const stats = [makeStats('2024-01-01', 10, 8), makeStats('2024-01-02', 20, 15)]
    const metrics = computeOverallMetrics(stats)
    expect(metrics.averageAccuracy).toBe(77) // Math.round(23/30 * 100)
  })

  it('should return 100% accuracy when all reviews are correct', () => {
    const stats = [makeStats('2024-01-01', 10, 10)]
    const metrics = computeOverallMetrics(stats)
    expect(metrics.averageAccuracy).toBe(100)
  })

  it('should return 0% accuracy when no reviews are correct', () => {
    const stats = [makeStats('2024-01-01', 5, 0)]
    const metrics = computeOverallMetrics(stats)
    expect(metrics.averageAccuracy).toBe(0)
  })
})
