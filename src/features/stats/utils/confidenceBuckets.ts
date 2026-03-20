/**
 * Confidence bucket utilities for the stats screen.
 *
 * Categorises words into three learning stages based on their confidence score:
 *   - Learning  (0.0 – 0.4): just started or struggling
 *   - Familiar  (0.4 – 0.7): making progress
 *   - Mastered  (0.7 – 1.0): solidly known
 *
 * These thresholds are intentionally different from the dashboard's MASTERED_THRESHOLD (0.8)
 * because the stats screen is meant to show a more granular view of progress.
 */

import type { Word, WordProgress } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Upper bound (exclusive) of the "Learning" confidence bucket. */
export const LEARNING_THRESHOLD = 0.4

/** Upper bound (exclusive) of the "Familiar" confidence bucket. */
export const FAMILIAR_THRESHOLD = 0.7

/** Minimum confidence to be considered "Mastered". */
export const MASTERED_THRESHOLD = 0.7

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfidenceBucket = 'learning' | 'familiar' | 'mastered'

export interface BucketCounts {
  readonly learning: number
  readonly familiar: number
  readonly mastered: number
  readonly total: number
}

export interface WordWithStats {
  readonly word: Word
  readonly progress: WordProgress | null
  readonly bucket: ConfidenceBucket
  readonly timesReviewed: number
  readonly correctPct: number | null
  readonly confidence: number
  readonly lastReviewed: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the confidence bucket for a given confidence score (0-1). */
export function getConfidenceBucket(confidence: number): ConfidenceBucket {
  if (confidence >= MASTERED_THRESHOLD) return 'mastered'
  if (confidence >= LEARNING_THRESHOLD) return 'familiar'
  return 'learning'
}

/**
 * Builds a per-word stats list combining word metadata with progress data.
 *
 * Words with no progress record have confidence=0 and are in the "learning" bucket.
 *
 * @param words    - All words for the active pair.
 * @param progress - All progress records for the active pair.
 * @returns Combined per-word stats, one entry per word.
 */
export function buildWordStatsList(
  words: readonly Word[],
  progress: readonly WordProgress[],
): WordWithStats[] {
  const progressMap = new Map(progress.map((p) => [p.wordId, p]))

  return words.map((word) => {
    const p = progressMap.get(word.id) ?? null
    const timesReviewed = p !== null ? p.correctCount + p.incorrectCount : 0
    const confidence = p?.confidence ?? 0
    const correctPct =
      timesReviewed > 0 ? Math.round((p!.correctCount / timesReviewed) * 100) : null

    return {
      word,
      progress: p,
      bucket: getConfidenceBucket(confidence),
      timesReviewed,
      correctPct,
      confidence,
      lastReviewed: p?.lastReviewed ?? null,
    }
  })
}

/**
 * Aggregates per-word stats into bucket counts.
 *
 * @param wordStats - Output of buildWordStatsList.
 * @returns Count per bucket plus total.
 */
export function computeBucketCounts(wordStats: readonly WordWithStats[]): BucketCounts {
  let learning = 0
  let familiar = 0
  let mastered = 0

  for (const ws of wordStats) {
    if (ws.bucket === 'mastered') mastered++
    else if (ws.bucket === 'familiar') familiar++
    else learning++
  }

  return { learning, familiar, mastered, total: wordStats.length }
}
