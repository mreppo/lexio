import { describe, it, expect } from 'vitest'
import { levenshtein, matchAnswer } from './matching'
import type { MatchResult } from './matching'

// ─── levenshtein ─────────────────────────────────────────────────────────────

describe('levenshtein', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshtein('cat', 'cat')).toBe(0)
  })

  it('should return 0 for two empty strings', () => {
    expect(levenshtein('', '')).toBe(0)
  })

  it('should return the length of the non-empty string when the other is empty', () => {
    expect(levenshtein('hello', '')).toBe(5)
    expect(levenshtein('', 'hello')).toBe(5)
  })

  it('should calculate distance for a single substitution', () => {
    expect(levenshtein('cat', 'bat')).toBe(1)
  })

  it('should calculate distance for a single insertion', () => {
    expect(levenshtein('cat', 'cats')).toBe(1)
    expect(levenshtein('cats', 'cat')).toBe(1)
  })

  it('should calculate distance for a single deletion', () => {
    expect(levenshtein('cats', 'cat')).toBe(1)
  })

  it('should calculate distance for multiple edits', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    expect(levenshtein('saturday', 'sunday')).toBe(3)
  })

  it('should be symmetric', () => {
    expect(levenshtein('abc', 'xyz')).toBe(levenshtein('xyz', 'abc'))
    expect(levenshtein('kitten', 'sitting')).toBe(levenshtein('sitting', 'kitten'))
  })

  it('should handle Latvian diacritics', () => {
    // ā vs a is one substitution
    expect(levenshtein('māja', 'maja')).toBe(1)
    // galds vs galdi is one substitution
    expect(levenshtein('galds', 'galdi')).toBe(1)
  })
})

// ─── matchAnswer ──────────────────────────────────────────────────────────────

describe('matchAnswer', () => {
  // ── Exact match ────────────────────────────────────────────────────────────

  it('should return correct for an exact match', () => {
    const result = matchAnswer('house', 'house', 0)
    expect(result.result).toBe<MatchResult>('correct')
    expect(result.distance).toBe(0)
  })

  it('should return correct for a case-insensitive match', () => {
    const result = matchAnswer('House', 'house', 0)
    expect(result.result).toBe<MatchResult>('correct')
  })

  it('should return correct when the answer has leading/trailing whitespace', () => {
    const result = matchAnswer('  house  ', 'house', 0)
    expect(result.result).toBe<MatchResult>('correct')
  })

  it('should preserve the original (trimmed) correctAnswer in the result', () => {
    const result = matchAnswer('house', '  house  ', 0)
    expect(result.correctAnswer).toBe('house')
  })

  // ── Typo tolerance = 0 (exact only) ────────────────────────────────────────

  it('should return incorrect when distance is 1 and tolerance is 0', () => {
    const result = matchAnswer('hous', 'house', 0)
    expect(result.result).toBe<MatchResult>('incorrect')
  })

  it('should return incorrect when distance is 2 and tolerance is 0', () => {
    const result = matchAnswer('hos', 'house', 0)
    expect(result.result).toBe<MatchResult>('incorrect')
  })

  // ── Typo tolerance = 1 ─────────────────────────────────────────────────────

  it('should return almost when distance is 1 and tolerance is 1', () => {
    const result = matchAnswer('hous', 'house', 1)
    expect(result.result).toBe<MatchResult>('almost')
  })

  it('should return incorrect when distance is 2 and tolerance is 1', () => {
    const result = matchAnswer('hos', 'house', 1)
    expect(result.result).toBe<MatchResult>('incorrect')
  })

  // ── Typo tolerance = 2 ─────────────────────────────────────────────────────

  it('should return almost when distance is 1 and tolerance is 2', () => {
    const result = matchAnswer('hous', 'house', 2)
    expect(result.result).toBe<MatchResult>('almost')
  })

  it('should return almost when distance is 2 and tolerance is 2', () => {
    const result = matchAnswer('hos', 'house', 2)
    expect(result.result).toBe<MatchResult>('almost')
  })

  it('should return incorrect when distance is 3 and tolerance is 2', () => {
    const result = matchAnswer('ho', 'house', 2)
    expect(result.result).toBe<MatchResult>('incorrect')
  })

  // ── Latvian diacritics ─────────────────────────────────────────────────────

  it('should handle Latvian diacritics as distinct characters (distance 1)', () => {
    // māja typed as maja: 1 char difference
    const result1 = matchAnswer('maja', 'māja', 0)
    expect(result1.result).toBe<MatchResult>('incorrect')
    expect(result1.distance).toBe(1)

    const result2 = matchAnswer('maja', 'māja', 1)
    expect(result2.result).toBe<MatchResult>('almost')
  })

  it('should return correct for exact Latvian diacritic match', () => {
    const result = matchAnswer('māja', 'māja', 0)
    expect(result.result).toBe<MatchResult>('correct')
  })

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it('should return incorrect for an empty answer against a non-empty correct answer', () => {
    const result = matchAnswer('', 'house', 0)
    expect(result.result).toBe<MatchResult>('incorrect')
    expect(result.distance).toBe(5)
  })

  it('should include the distance in the result', () => {
    const result = matchAnswer('hous', 'house', 1)
    expect(result.distance).toBe(1)
  })
})
