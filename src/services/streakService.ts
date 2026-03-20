/**
 * Streak service - calculates and persists daily streak data.
 *
 * Rules:
 * - A day is "complete" when the user reviews >= dailyGoal words.
 * - Streak = consecutive days of completing the daily goal.
 * - Streak resets to 0 if a day is missed (a day with no entry, or
 *   an entry where wordsReviewed < dailyGoal).
 * - Grace period: the streak check only considers dates up to and
 *   including yesterday, so a user reviewing late on day N still
 *   counts for day N even if the app is opened the following morning.
 */

import type { DailyStats } from '@/types'
import type { StorageService } from './storage/StorageService'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Number of past days to scan when calculating the current streak. */
const STREAK_SCAN_DAYS = 366

/** Confidence threshold above which a word is considered "learned". */
export const LEARNED_CONFIDENCE_THRESHOLD = 0.8

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns today's date string in YYYY-MM-DD format (local time). */
export function todayDateString(): string {
  const d = new Date()
  return formatDate(d)
}

/** Returns yesterday's date string in YYYY-MM-DD format (local time). */
export function yesterdayDateString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return formatDate(d)
}

/** Formats a Date object as YYYY-MM-DD using local time. */
export function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns a date string that is `offset` days before `baseDate`.
 * Positive offset = further in the past.
 */
export function offsetDate(baseDate: string, offset: number): string {
  const d = new Date(`${baseDate}T00:00:00`)
  d.setDate(d.getDate() - offset)
  return formatDate(d)
}

// ─── Streak calculation ───────────────────────────────────────────────────────

/**
 * Calculates the current streak in days given an array of daily stats records
 * and the daily goal.
 *
 * The algorithm walks backward day by day, starting from today.
 * Grace period: if today has no completed entry yet, we skip it and start
 * counting from yesterday. If today IS already complete, it counts too.
 *
 * @param statsMap  - Map from date string (YYYY-MM-DD) to DailyStats.
 * @param dailyGoal - Minimum words reviewed per day to count as complete.
 * @param today     - Today's date string (injectable for testing).
 * @returns Current streak count (days).
 */
export function calculateCurrentStreak(
  statsMap: ReadonlyMap<string, DailyStats>,
  dailyGoal: number,
  today: string = todayDateString(),
): number {
  // Determine the start date for counting.
  // If today is already complete, start from today.
  // Otherwise apply the grace period and start from yesterday.
  const todayEntry = statsMap.get(today)
  const todayComplete = todayEntry !== undefined && todayEntry.wordsReviewed >= dailyGoal

  // daysBack: how many days before today we start checking (0 = today, 1 = yesterday, ...)
  let daysBack = todayComplete ? 0 : 1
  let streak = 0

  while (daysBack < STREAK_SCAN_DAYS) {
    const checkDate = offsetDate(today, daysBack)
    const entry = statsMap.get(checkDate)
    const completed = entry !== undefined && entry.wordsReviewed >= dailyGoal

    if (!completed) break

    streak++
    daysBack++
  }

  return streak
}

/**
 * Calculates the all-time best streak from a map of daily stats.
 *
 * Scans all dates present in the map and finds the longest consecutive run
 * of days where wordsReviewed >= dailyGoal.
 *
 * @param statsMap  - Map from date string (YYYY-MM-DD) to DailyStats.
 * @param dailyGoal - Minimum words reviewed per day to count as complete.
 * @returns Best streak count (days).
 */
export function calculateBestStreak(
  statsMap: ReadonlyMap<string, DailyStats>,
  dailyGoal: number,
): number {
  if (statsMap.size === 0) return 0

  const sortedDates = Array.from(statsMap.keys()).sort()
  let bestStreak = 0
  let currentRun = 0
  let prevDate: string | null = null

  for (const date of sortedDates) {
    const entry = statsMap.get(date)
    const completed = entry !== undefined && entry.wordsReviewed >= dailyGoal

    if (!completed) {
      currentRun = 0
      prevDate = null
      continue
    }

    if (prevDate !== null) {
      // Check if this date is exactly one day after the previous.
      // offsetDate(prevDate, -1) returns the day after prevDate.
      const dayAfterPrev = offsetDate(prevDate, -1)
      if (dayAfterPrev === date) {
        currentRun++
      } else {
        // Gap: restart the run.
        currentRun = 1
      }
    } else {
      currentRun = 1
    }

    if (currentRun > bestStreak) bestStreak = currentRun
    prevDate = date
  }

  return bestStreak
}

// ─── Persistence ──────────────────────────────────────────────────────────────

/**
 * Updates (or creates) the DailyStats entry for today after a quiz session.
 * Recalculates the streak and persists it.
 *
 * @param storage       - The storage service.
 * @param wordsReviewed - Words reviewed in the completed session.
 * @param correctCount  - Correct answers in the completed session.
 * @param dailyGoal     - Minimum words per day for the goal to be met.
 * @returns The updated streak count for today.
 */
export async function updateDailyStatsAfterSession(
  storage: StorageService,
  wordsReviewed: number,
  correctCount: number,
  dailyGoal: number,
): Promise<number> {
  const today = todayDateString()

  // Load the existing entry for today (if any) and merge.
  const existing = await storage.getDailyStats(today)

  const updatedWordsReviewed = (existing?.wordsReviewed ?? 0) + wordsReviewed
  const updatedCorrect = (existing?.correctCount ?? 0) + correctCount
  const updatedIncorrect = (existing?.incorrectCount ?? 0) + (wordsReviewed - correctCount)

  // Fetch enough history to compute current streak.
  const recentStats = await storage.getRecentDailyStats(STREAK_SCAN_DAYS)
  const statsMap = new Map<string, DailyStats>(recentStats.map((s) => [s.date, s]))

  // Apply today's updated totals into the map before calculating streak.
  const todayEntry: DailyStats = {
    date: today,
    wordsReviewed: updatedWordsReviewed,
    correctCount: updatedCorrect,
    incorrectCount: updatedIncorrect,
    streakDays: 0, // placeholder - filled below
  }
  statsMap.set(today, todayEntry)

  const currentStreak = calculateCurrentStreak(statsMap, dailyGoal, today)

  const finalEntry: DailyStats = { ...todayEntry, streakDays: currentStreak }
  await storage.saveDailyStats(finalEntry)

  return currentStreak
}

/**
 * Loads the current streak from storage.
 *
 * Reads DailyStats history, computes the current streak using the canonical
 * algorithm, and returns it.
 *
 * @param storage   - The storage service.
 * @param dailyGoal - Minimum words per day for the goal to be met.
 * @returns Current streak count.
 */
export async function loadCurrentStreak(
  storage: StorageService,
  dailyGoal: number,
): Promise<number> {
  const recentStats = await storage.getRecentDailyStats(STREAK_SCAN_DAYS)
  const statsMap = new Map<string, DailyStats>(recentStats.map((s) => [s.date, s]))
  return calculateCurrentStreak(statsMap, dailyGoal)
}

/**
 * Loads the all-time best streak from storage.
 *
 * @param storage   - The storage service.
 * @param dailyGoal - Minimum words per day for the goal to be met.
 * @returns Best streak count.
 */
export async function loadBestStreak(storage: StorageService, dailyGoal: number): Promise<number> {
  const recentStats = await storage.getRecentDailyStats(STREAK_SCAN_DAYS)
  const statsMap = new Map<string, DailyStats>(recentStats.map((s) => [s.date, s]))
  return calculateBestStreak(statsMap, dailyGoal)
}

/**
 * Loads today's DailyStats entry from storage.
 *
 * Centralises the "today" date logic so callers don't need to import
 * todayDateString separately.
 *
 * @param storage - The storage service.
 * @returns Today's DailyStats, or null if none exists yet.
 */
export async function getTodayStats(storage: StorageService): Promise<DailyStats | null> {
  return storage.getDailyStats(todayDateString())
}
