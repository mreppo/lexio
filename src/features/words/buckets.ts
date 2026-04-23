/**
 * Bucket thresholds and classifier for word confidence scores.
 *
 * Extracted from DashboardScreen.tsx so that both Dashboard and Library can
 * share the same thresholds without duplication. The classifier maps a
 * confidence value (0–1) to one of four named buckets:
 *   - 'new'       — never reviewed (null confidence)
 *   - 'learning'  — below FAMILIAR_THRESHOLD
 *   - 'familiar'  — between FAMILIAR_THRESHOLD and MASTERED_THRESHOLD
 *   - 'mastered'  — at or above MASTERED_THRESHOLD
 *
 * These thresholds mirror the ones previously local to DashboardScreen and
 * align with the wordsLearnedService MASTERED_THRESHOLD (0.8).
 */

/** Confidence threshold below which a word is considered "learning". */
export const FAMILIAR_THRESHOLD = 0.5

/** Confidence threshold at or above which a word is considered "mastered". */
export const MASTERED_THRESHOLD = 0.8

/** The four learning buckets for a word. */
export type WordBucket = 'new' | 'learning' | 'familiar' | 'mastered'

/**
 * Classify a confidence score into a learning bucket.
 *
 * - null → 'new' (word has never been reviewed)
 * - [0, FAMILIAR_THRESHOLD) → 'learning'
 * - [FAMILIAR_THRESHOLD, MASTERED_THRESHOLD) → 'familiar'
 * - [MASTERED_THRESHOLD, 1] → 'mastered'
 */
export function classifyBucket(confidence: number | null): WordBucket {
  if (confidence === null) return 'new'
  if (confidence >= MASTERED_THRESHOLD) return 'mastered'
  if (confidence >= FAMILIAR_THRESHOLD) return 'familiar'
  return 'learning'
}
