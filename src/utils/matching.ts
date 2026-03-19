/**
 * Answer matching utilities for the quiz type mode.
 *
 * Provides Levenshtein distance calculation and answer comparison
 * with configurable typo tolerance levels.
 */

// ─── Levenshtein Distance ─────────────────────────────────────────────────────

/**
 * Calculates the Levenshtein edit distance between two strings.
 * Uses dynamic programming (Wagner-Fischer algorithm) with O(m*n) time
 * and O(min(m,n)) space optimisation.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  // Ensure 'a' is the shorter string for space optimisation
  if (a.length > b.length) return levenshtein(b, a)

  let prev = Array.from({ length: a.length + 1 }, (_, i) => i)
  let curr = new Array<number>(a.length + 1)

  for (let j = 1; j <= b.length; j++) {
    curr[0] = j
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[i] = Math.min(
        curr[i - 1] + 1,          // insertion
        prev[i] + 1,               // deletion
        prev[i - 1] + substitutionCost, // substitution
      )
    }
    ;[prev, curr] = [curr, prev]
  }

  return prev[a.length]
}

// ─── Match Result ─────────────────────────────────────────────────────────────

/** The result of comparing a user's answer against the correct answer. */
export type MatchResult = 'correct' | 'almost' | 'incorrect'

export interface AnswerMatchResult {
  readonly result: MatchResult
  /**
   * The normalised correct answer (trimmed, original casing).
   * Useful for displaying "The correct answer is: …" on incorrect/almost.
   */
  readonly correctAnswer: string
  /** The edit distance between the normalised inputs. */
  readonly distance: number
}

// ─── Answer Matching ──────────────────────────────────────────────────────────

/**
 * Normalises a string for comparison: trims whitespace and lowercases.
 */
function normalise(s: string): string {
  return s.trim().toLowerCase()
}

/**
 * Compares a user's typed answer against the correct answer.
 *
 * Matching rules:
 * - Comparison is case-insensitive and whitespace-trimmed.
 * - If the edit distance is 0 → 'correct'.
 * - If the edit distance is within the tolerance level → 'almost'.
 * - Otherwise → 'incorrect'.
 *
 * @param userAnswer  - The raw string the user typed.
 * @param correctAnswer - The expected correct translation.
 * @param typoTolerance - Maximum edit distance to accept as 'almost' (from UserSettings).
 *                        0 = exact match only, 1 = one char off, 2 = two chars off.
 */
export function matchAnswer(
  userAnswer: string,
  correctAnswer: string,
  typoTolerance: number,
): AnswerMatchResult {
  const normUser = normalise(userAnswer)
  const normCorrect = normalise(correctAnswer)
  const distance = levenshtein(normUser, normCorrect)

  let result: MatchResult
  if (distance === 0) {
    result = 'correct'
  } else if (typoTolerance > 0 && distance <= typoTolerance) {
    result = 'almost'
  } else {
    result = 'incorrect'
  }

  return {
    result,
    correctAnswer: correctAnswer.trim(),
    distance,
  }
}
