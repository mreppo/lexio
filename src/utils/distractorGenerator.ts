/**
 * Distractor generation for multiple-choice quiz mode.
 *
 * Given a correct word and a pool of candidate words from the same language
 * pair, produces 3 distractor options so the quiz can display 4 choices total.
 *
 * Rules applied (in order):
 * 1. Never include the correct word itself.
 * 2. Exclude words whose answer text starts with the same 3 characters as the
 *    correct answer (too similar, confusing rather than instructive).
 * 3. Avoid repeating distractors that were shown in the immediately preceding
 *    question (pass recentDistractorIds to enable this).
 * 4. If fewer than 3 suitable candidates remain, fall back to the best available
 *    candidates (same-prefix filter lifted first, then recency filter).
 * 5. Shuffle the final 4 options (correct + 3 distractors) so the correct
 *    answer is not always in the same slot.
 */

import type { Word, QuizDirection } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Number of choices presented per question (1 correct + DISTRACTOR_COUNT wrong). */
export const CHOICE_COUNT = 4
export const DISTRACTOR_COUNT = CHOICE_COUNT - 1

/** Minimum number of characters to check for prefix similarity. */
const SIMILAR_PREFIX_LENGTH = 3

/** Minimum total words in a pair to run choice mode. */
export const MIN_WORDS_FOR_CHOICE = CHOICE_COUNT

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DistractorResult {
  /** The shuffled list of 4 option strings (correct answer included). */
  readonly options: readonly string[]
  /** The index within `options` of the correct answer. */
  readonly correctIndex: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle. Returns a new array; does not mutate the input.
 */
function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Returns the answer text for a word given the quiz direction.
 */
function answerText(word: Word, direction: QuizDirection): string {
  return direction === 'source-to-target' ? word.target : word.source
}

/**
 * Returns true if two strings share the same first N characters (case-insensitive).
 */
function hasSimilarPrefix(a: string, b: string, length: number): boolean {
  if (a.length < length || b.length < length) return false
  return a.slice(0, length).toLowerCase() === b.slice(0, length).toLowerCase()
}

// ─── Core Generator ───────────────────────────────────────────────────────────

/**
 * Generates 3 distractors from `pool` and returns all 4 shuffled options.
 *
 * @param correctWord         - The word being quizzed (will NOT appear in distractors).
 * @param direction           - The direction of this quiz question.
 * @param pool                - All words in the active language pair (including correctWord).
 * @param recentDistractorIds - IDs of words used as distractors in the previous question.
 *                              Pass an empty array if there is no previous question.
 * @returns DistractorResult with shuffled options and the index of the correct answer,
 *          or null if the pool has fewer than MIN_WORDS_FOR_CHOICE words.
 */
export function generateDistractors(
  correctWord: Word,
  direction: QuizDirection,
  pool: readonly Word[],
  recentDistractorIds: readonly string[] = [],
): DistractorResult | null {
  if (pool.length < MIN_WORDS_FOR_CHOICE) return null

  const correctText = answerText(correctWord, direction)

  // Candidate pool: all words except the correct one
  const candidates = pool.filter((w) => w.id !== correctWord.id)

  // Apply filters progressively - relax constraints if not enough candidates remain.

  // Tier 1: exclude similar prefix AND recently used
  const tier1 = candidates.filter(
    (w) =>
      !hasSimilarPrefix(answerText(w, direction), correctText, SIMILAR_PREFIX_LENGTH) &&
      !recentDistractorIds.includes(w.id),
  )

  // Tier 2: exclude similar prefix only (allow recently used)
  const tier2 = candidates.filter(
    (w) => !hasSimilarPrefix(answerText(w, direction), correctText, SIMILAR_PREFIX_LENGTH),
  )

  // Tier 3: all candidates (no filters - last resort)
  const tier3 = candidates

  // Pick from the highest tier that has enough candidates
  let source: readonly Word[]
  if (tier1.length >= DISTRACTOR_COUNT) {
    source = tier1
  } else if (tier2.length >= DISTRACTOR_COUNT) {
    source = tier2
  } else {
    source = tier3
  }

  // Shuffle and take the required number of distractors
  const shuffledSource = shuffle(source)
  const distractors = shuffledSource.slice(0, DISTRACTOR_COUNT)

  // Build and shuffle the 4 options (correct + 3 distractors)
  const allOptionWords: string[] = [
    correctText,
    ...distractors.map((w) => answerText(w, direction)),
  ]
  const shuffledOptions = shuffle(allOptionWords)
  const correctIndex = shuffledOptions.indexOf(correctText)

  return {
    options: shuffledOptions,
    correctIndex,
  }
}
