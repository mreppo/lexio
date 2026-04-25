/**
 * Shared utility for computing due-word counts.
 *
 * Extracted from DashboardScreen and QuizHub where the same function was
 * defined inline in both files. A word is "due" when its nextReview
 * timestamp is at or before the current time, OR when it has no progress
 * record at all (never reviewed).
 */

import type { Word, WordProgress } from '@/types'

/**
 * Compute how many words are due right now (nextReview <= now).
 * Words with no progress record are also due (never reviewed).
 *
 * @param words        - All words in the active pair.
 * @param progressList - All progress records for the active pair.
 * @param now          - The reference timestamp in ms. Defaults to Date.now().
 *                       Injectable for deterministic unit tests.
 */
export function computeDueCount(
  words: readonly Word[],
  progressList: readonly WordProgress[],
  now: number = Date.now(),
): number {
  const progressMap = new Map<string, WordProgress>()
  for (const p of progressList) {
    progressMap.set(p.wordId, p)
  }

  let count = 0
  for (const word of words) {
    const progress = progressMap.get(word.id)
    if (progress === undefined || progress.nextReview <= now) {
      count++
    }
  }
  return count
}
