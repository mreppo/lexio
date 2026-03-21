/**
 * Utilities for filtering words by CEFR level.
 *
 * Rules:
 * - If selectedLevels is empty, all words are included (no filtering).
 * - If selectedLevels has values, only words matching at least one selected level
 *   are included — PLUS manually added words (words with no CEFR level tag) which
 *   are always included regardless of filter.
 */

import type { Word } from '@/types'
import { CEFR_LEVELS } from '@/types'
import type { CefrLevel } from '@/types'

/**
 * Returns true if the tag string is a recognised CEFR level.
 */
export function isCefrLevel(tag: string): tag is CefrLevel {
  return (CEFR_LEVELS as readonly string[]).includes(tag)
}

/**
 * Extracts the CEFR level tags from a word's tag array.
 * Returns an empty array if the word has no CEFR level tags.
 */
export function getWordCefrLevels(word: Word): readonly CefrLevel[] {
  return word.tags.filter(isCefrLevel)
}

/**
 * Filters a list of words by selected CEFR levels.
 *
 * - Empty selectedLevels → return all words unchanged.
 * - Non-empty selectedLevels → return words that:
 *   - Have at least one tag matching a selected level, OR
 *   - Have NO CEFR level tags at all (manually added words — always included).
 */
export function filterWordsByLevels(
  words: readonly Word[],
  selectedLevels: readonly CefrLevel[],
): Word[] {
  if (selectedLevels.length === 0) return [...words]

  return words.filter((word) => {
    const wordLevels = getWordCefrLevels(word)
    // Manually added words (no CEFR tags) are always included.
    if (wordLevels.length === 0) return true
    // Pack words: include only if they have at least one selected level.
    return wordLevels.some((level) => selectedLevels.includes(level))
  })
}

/**
 * Counts words per CEFR level for a list of words.
 * Words with multiple CEFR tags are counted once per tag.
 * Words with no CEFR tags are counted in the 'manual' bucket (not in any level).
 */
export function countWordsByLevel(words: readonly Word[]): Record<CefrLevel, number> {
  const counts: Record<CefrLevel, number> = {
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
    C1: 0,
    C2: 0,
  }
  for (const word of words) {
    for (const level of getWordCefrLevels(word)) {
      counts[level]++
    }
  }
  return counts
}
