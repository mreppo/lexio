/**
 * useMinutesPerWord - computes a rolling average of minutes-per-word from
 * recent session history.
 *
 * Uses the last ROLLING_SESSION_DAYS days of DailyStats. Each day's entry
 * contributes to the aggregate only when both durationMs and wordsReviewed
 * are present and non-zero (older entries that predate the durationMs field
 * are silently skipped to preserve backward compatibility).
 *
 * Falls back to DEFAULT_MINUTES_PER_WORD when there is insufficient data
 * (e.g. first launch, new language pair, or no timed sessions yet).
 */

import { useMemo } from 'react'
import type { DailyStats } from '@/types'

/** Number of recent days to include in the rolling average. */
export const ROLLING_SESSION_DAYS = 10

/**
 * Fallback estimate used when no timed session data is available.
 * 0.5 min (30 s) per word is a reasonable first-launch guess.
 */
export const DEFAULT_MINUTES_PER_WORD = 0.5

/**
 * Computes a rolling minutes-per-word estimate from an array of DailyStats.
 *
 * Pure function — exposed for unit testing without React.
 *
 * @param recentStats - DailyStats records (order and count determined by caller).
 * @returns Minutes per word, or DEFAULT_MINUTES_PER_WORD when data is absent.
 */
export function computeMinutesPerWord(recentStats: readonly DailyStats[]): number {
  let totalMs = 0
  let totalWords = 0

  for (const day of recentStats) {
    if (day.durationMs !== undefined && day.durationMs > 0 && day.wordsReviewed > 0) {
      totalMs += day.durationMs
      totalWords += day.wordsReviewed
    }
  }

  if (totalWords === 0) return DEFAULT_MINUTES_PER_WORD

  return totalMs / totalWords / 60_000
}

/**
 * React hook that memoises the minutes-per-word estimate.
 *
 * @param recentStats - DailyStats for the last ROLLING_SESSION_DAYS days,
 *                      as returned by useDashboard / storage.getRecentDailyStats.
 */
export function useMinutesPerWord(recentStats: readonly DailyStats[]): number {
  // Stable serialised key so the memoisation responds to value changes, not
  // reference changes (the dashboard re-fetches produce new array instances).
  const statsKey = recentStats
    .slice(0, ROLLING_SESSION_DAYS)
    .map((s) => `${s.date}:${s.durationMs ?? ''}:${s.wordsReviewed}`)
    .join('|')

  return useMemo(
    () => computeMinutesPerWord(recentStats.slice(0, ROLLING_SESSION_DAYS)),
    // statsKey is a compact, stable representation of the relevant slice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statsKey],
  )
}
