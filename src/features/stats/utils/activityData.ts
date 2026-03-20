/**
 * Activity chart data utilities for the stats screen.
 *
 * Transforms raw DailyStats records into chart-ready structures for:
 *   - Bar chart (last 7 or 30 days of words reviewed per day)
 *   - Streak calendar heatmap (last ~90 days)
 */

import type { DailyStats } from '@/types'
import { formatDate, offsetDate } from '@/services/streakService'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActivityDay {
  /** YYYY-MM-DD */
  readonly date: string
  /** Total words reviewed that day (0 if no session). */
  readonly wordsReviewed: number
  /** Correct answers that day. */
  readonly correctCount: number
  /** Incorrect answers that day. */
  readonly incorrectCount: number
  /** Accuracy ratio (0-1), or null if no reviews. */
  readonly accuracy: number | null
}

export type ActivityRange = 7 | 30

export interface CalendarDay {
  /** YYYY-MM-DD */
  readonly date: string
  /** Intensity level: 0 = no activity, 1-4 = increasing activity. */
  readonly level: 0 | 1 | 2 | 3 | 4
  /** Actual words reviewed (for tooltip). */
  readonly wordsReviewed: number
  /** Whether this day has data at all (false = future or truly empty). */
  readonly hasData: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Number of days shown in the streak calendar. */
export const CALENDAR_DAYS = 91 // ~3 months

/** Activity thresholds for calendar intensity levels. */
const LEVEL_THRESHOLDS = [1, 5, 15, 30] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts a wordsReviewed count to a calendar intensity level (0-4).
 *
 * @param wordsReviewed - Number of words reviewed on a given day.
 * @param dailyGoal     - The user's daily goal (used to calibrate intensity).
 */
export function computeIntensityLevel(wordsReviewed: number, dailyGoal: number): 0 | 1 | 2 | 3 | 4 {
  if (wordsReviewed === 0) return 0

  // Scale thresholds relative to the daily goal so that hitting the goal = level 3.
  const scale = Math.max(dailyGoal / 20, 1)
  const scaled = LEVEL_THRESHOLDS.map((t) => Math.round(t * scale))

  if (wordsReviewed >= scaled[3]) return 4
  if (wordsReviewed >= scaled[2]) return 3
  if (wordsReviewed >= scaled[1]) return 2
  return 1
}

/**
 * Builds an array of ActivityDay entries for the given range.
 *
 * Days with no DailyStats record appear with zero values.
 * The array is ordered oldest-first (index 0 = range days ago, last = today).
 *
 * @param dailyStats - Raw DailyStats records (any order).
 * @param range      - 7 or 30 days.
 * @param today      - Today's date string (injectable for testing).
 */
export function buildActivityDays(
  dailyStats: readonly DailyStats[],
  range: ActivityRange,
  today: string = formatDate(new Date()),
): ActivityDay[] {
  const statsMap = new Map(dailyStats.map((s) => [s.date, s]))
  const days: ActivityDay[] = []

  for (let i = range - 1; i >= 0; i--) {
    const date = offsetDate(today, i)
    const record = statsMap.get(date)
    const wordsReviewed = record?.wordsReviewed ?? 0
    const correctCount = record?.correctCount ?? 0
    const incorrectCount = record?.incorrectCount ?? 0
    const accuracy = wordsReviewed > 0 ? correctCount / wordsReviewed : null

    days.push({ date, wordsReviewed, correctCount, incorrectCount, accuracy })
  }

  return days
}

/**
 * Builds an array of CalendarDay entries for the streak calendar heatmap.
 *
 * Covers the last CALENDAR_DAYS days, oldest-first. Future days are excluded.
 *
 * @param dailyStats - Raw DailyStats records (any order).
 * @param dailyGoal  - User's daily goal (used to calibrate intensity).
 * @param today      - Today's date string (injectable for testing).
 */
export function buildCalendarDays(
  dailyStats: readonly DailyStats[],
  dailyGoal: number,
  today: string = formatDate(new Date()),
): CalendarDay[] {
  const statsMap = new Map(dailyStats.map((s) => [s.date, s]))
  const days: CalendarDay[] = []

  for (let i = CALENDAR_DAYS - 1; i >= 0; i--) {
    const date = offsetDate(today, i)
    const record = statsMap.get(date)
    const wordsReviewed = record?.wordsReviewed ?? 0
    const hasData = record !== undefined
    const level = computeIntensityLevel(wordsReviewed, dailyGoal)

    days.push({ date, level, wordsReviewed, hasData })
  }

  return days
}

/**
 * Computes overall summary metrics from DailyStats history.
 *
 * @param dailyStats - All available daily stats records.
 */
export interface OverallMetrics {
  readonly totalReviews: number
  readonly averageAccuracy: number | null
}

export function computeOverallMetrics(dailyStats: readonly DailyStats[]): OverallMetrics {
  let totalReviews = 0
  let totalCorrect = 0

  for (const day of dailyStats) {
    totalReviews += day.wordsReviewed
    totalCorrect += day.correctCount
  }

  const averageAccuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : null

  return { totalReviews, averageAccuracy }
}
