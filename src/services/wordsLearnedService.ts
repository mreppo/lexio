/**
 * Words learned service - computes the "words learned" metric.
 *
 * A word is considered "learned" when its confidence score exceeds
 * LEARNED_CONFIDENCE_THRESHOLD (0.8).  Words with no progress record
 * have an implicit confidence of 0 and are not yet learned.
 */

import type { StorageService } from './storage/StorageService'
import { LEARNED_CONFIDENCE_THRESHOLD } from './streakService'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WordsLearnedResult {
  /** Number of words whose confidence >= LEARNED_CONFIDENCE_THRESHOLD. */
  readonly learned: number
  /** Total words in the pair (including those with no progress record). */
  readonly total: number
}

// ─── Core logic ───────────────────────────────────────────────────────────────

/**
 * Counts how many words in a language pair have been learned
 * (confidence >= LEARNED_CONFIDENCE_THRESHOLD).
 *
 * @param storage - The storage service.
 * @param pairId  - The language pair to evaluate.
 * @returns learned / total counts for the pair.
 */
export async function getWordsLearnedForPair(
  storage: StorageService,
  pairId: string,
): Promise<WordsLearnedResult> {
  const words = await storage.getWords(pairId)
  const total = words.length

  if (total === 0) return { learned: 0, total: 0 }

  const progressList = await storage.getAllProgress(pairId)
  const progressMap = new Map(progressList.map((p) => [p.wordId, p]))

  let learned = 0
  for (const word of words) {
    const progress = progressMap.get(word.id)
    if (progress !== undefined && progress.confidence >= LEARNED_CONFIDENCE_THRESHOLD) {
      learned++
    }
  }

  return { learned, total }
}

/**
 * Counts total learned and total words across all language pairs.
 *
 * @param storage - The storage service.
 * @returns Aggregated learned / total counts.
 */
export async function getTotalWordsLearned(storage: StorageService): Promise<WordsLearnedResult> {
  const pairs = await storage.getLanguagePairs()

  let totalLearned = 0
  let totalWords = 0

  for (const pair of pairs) {
    const result = await getWordsLearnedForPair(storage, pair.id)
    totalLearned += result.learned
    totalWords += result.total
  }

  return { learned: totalLearned, total: totalWords }
}
