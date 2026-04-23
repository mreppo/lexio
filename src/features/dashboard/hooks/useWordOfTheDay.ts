/**
 * useWordOfTheDay — picks a stable "word of the day" from the active pair's
 * learning + familiar buckets (confidence > 0 and confidence < MASTERED threshold).
 *
 * Stability contract: the same (date, pairId) always produces the same word.
 * We achieve this with a deterministic seeded PRNG (xmur3 seed → mulberry32 generator).
 * The seed is the string `${YYYY-MM-DD}:${pairId}` hashed to a uint32.
 *
 * PRNG choice — mulberry32:
 *   A well-known, extremely fast 32-bit PRNG by Tommy Ettinger (CC0).
 *   Period ~4 billion, passes BigCrush. Single 32-bit state, zero dependencies.
 *   Reference: https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 *
 * Bucket definition (mirrors DashboardScreen bucket logic):
 *   - learning : confidence < FAMILIAR_THRESHOLD  (has a progress record)
 *   - familiar : FAMILIAR_THRESHOLD <= confidence < MASTERED_THRESHOLD
 *   - mastered : confidence >= MASTERED_THRESHOLD  ← EXCLUDED from WotD pool
 *   - new      : no progress record at all         ← EXCLUDED from WotD pool
 *
 * Returns null when the eligible pool is empty (no pair, no words, all mastered/new).
 */

import { useMemo } from 'react'
import type { Word, WordProgress } from '@/types'

// ─── Confidence thresholds (must match DashboardScreen) ──────────────────────

/** Lower bound of "familiar" bucket. */
const FAMILIAR_THRESHOLD = 0.5
/** Lower bound of "mastered" bucket — words at or above this are excluded. */
const MASTERED_THRESHOLD = 0.8

// ─── Seeded PRNG ─────────────────────────────────────────────────────────────

/**
 * xmur3 — converts an arbitrary string to a deterministic uint32 seed.
 * Algorithm by bryc (CC0): https://github.com/bryc/code/blob/master/jshash/PRNGs.md
 */
function xmur3(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  const finalized = h ^ (h >>> 16)
  return finalized >>> 0
}

/**
 * mulberry32 — returns the next float in [0, 1) given a uint32 state.
 * Returns [nextState, float] so the caller can chain calls.
 * Algorithm by Tommy Ettinger (CC0).
 */
function mulberry32(seed: number): [state: number, value: number] {
  let t = (seed + 0x6d2b79f5) >>> 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return [t, value]
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseWordOfTheDayResult {
  /** The selected word, or null when the eligible pool is empty. */
  readonly word: Word | null
  /** The word's progress record, or null if unavailable. */
  readonly progress: WordProgress | null
}

/**
 * Picks a stable word of the day from the eligible pool.
 *
 * @param dateKey    Today's date as "YYYY-MM-DD". Pass `new Date().toISOString().slice(0, 10)`.
 * @param pairId     The active language pair ID, or null.
 * @param words      All words for the active pair.
 * @param progressList  All progress records for the active pair.
 */
export function useWordOfTheDay(
  dateKey: string,
  pairId: string | null,
  words: readonly Word[],
  progressList: readonly WordProgress[],
): UseWordOfTheDayResult {
  return useMemo((): UseWordOfTheDayResult => {
    if (pairId === null || words.length === 0) {
      return { word: null, progress: null }
    }

    // Build a progress map for O(1) lookup
    const progressMap = new Map<string, WordProgress>()
    for (const p of progressList) {
      progressMap.set(p.wordId, p)
    }

    // Filter to learning + familiar pool only
    const eligible = words.filter((w) => {
      const p = progressMap.get(w.id)
      // Must have a progress record (not "new") and must be below mastered threshold
      return p !== undefined && p.confidence < MASTERED_THRESHOLD
    })

    if (eligible.length === 0) {
      return { word: null, progress: null }
    }

    // Seed: "${dateKey}:${pairId}" for date+pair stability
    const seedStr = `${dateKey}:${pairId}`
    const seed = xmur3(seedStr)
    const [, randomValue] = mulberry32(seed)

    // Pick a word deterministically
    const index = Math.floor(randomValue * eligible.length)
    const picked = eligible[index]

    if (picked === undefined) {
      return { word: null, progress: null }
    }

    return {
      word: picked,
      progress: progressMap.get(picked.id) ?? null,
    }
  }, [dateKey, pairId, words, progressList])
}

// Re-export thresholds for use in tests
export { FAMILIAR_THRESHOLD, MASTERED_THRESHOLD }
