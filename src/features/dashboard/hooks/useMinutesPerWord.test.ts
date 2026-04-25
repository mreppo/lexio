import { describe, it, expect } from 'vitest'
import type { DailyStats } from '@/types'
import { computeMinutesPerWord, DEFAULT_MINUTES_PER_WORD } from './useMinutesPerWord'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeDay(
  date: string,
  wordsReviewed: number,
  durationMs?: number,
  correct = wordsReviewed,
): DailyStats {
  return {
    date,
    wordsReviewed,
    correctCount: correct,
    incorrectCount: wordsReviewed - correct,
    streakDays: 1,
    ...(durationMs !== undefined ? { durationMs } : {}),
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('computeMinutesPerWord', () => {
  it('should return DEFAULT_MINUTES_PER_WORD when given an empty array', () => {
    expect(computeMinutesPerWord([])).toBe(DEFAULT_MINUTES_PER_WORD)
  })

  it('should return DEFAULT_MINUTES_PER_WORD when no days have durationMs', () => {
    const stats: DailyStats[] = [makeDay('2026-04-01', 10), makeDay('2026-04-02', 20)]
    expect(computeMinutesPerWord(stats)).toBe(DEFAULT_MINUTES_PER_WORD)
  })

  it('should return DEFAULT_MINUTES_PER_WORD when durationMs is 0', () => {
    const stats: DailyStats[] = [makeDay('2026-04-01', 10, 0)]
    expect(computeMinutesPerWord(stats)).toBe(DEFAULT_MINUTES_PER_WORD)
  })

  it('should return DEFAULT_MINUTES_PER_WORD when wordsReviewed is 0', () => {
    const stats: DailyStats[] = [makeDay('2026-04-01', 0, 60_000)]
    expect(computeMinutesPerWord(stats)).toBe(DEFAULT_MINUTES_PER_WORD)
  })

  it('should compute correct minutes-per-word from a single day', () => {
    // 10 words in 5 minutes (300 000 ms) = 0.5 min/word
    const stats: DailyStats[] = [makeDay('2026-04-01', 10, 300_000)]
    expect(computeMinutesPerWord(stats)).toBeCloseTo(0.5, 5)
  })

  it('should compute correct rolling average across multiple days', () => {
    // Day 1: 10 words in 5 min  →  300 000 ms
    // Day 2: 20 words in 6 min  →  360 000 ms
    // Total: 30 words in 11 min  →  avg = 11/30 ≈ 0.3667 min/word
    const stats: DailyStats[] = [
      makeDay('2026-04-01', 10, 300_000),
      makeDay('2026-04-02', 20, 360_000),
    ]
    const expected = (300_000 + 360_000) / 30 / 60_000
    expect(computeMinutesPerWord(stats)).toBeCloseTo(expected, 5)
  })

  it('should skip days missing durationMs and include only timed days', () => {
    // Day 1: no durationMs (pre-feature data) — must be skipped
    // Day 2: 10 words in 5 min → 0.5 min/word
    const stats: DailyStats[] = [
      makeDay('2026-04-01', 15), // no durationMs
      makeDay('2026-04-02', 10, 300_000), // timed
    ]
    expect(computeMinutesPerWord(stats)).toBeCloseTo(0.5, 5)
  })

  it('should handle a single very fast session (10 s total for 10 words = 0.0167 min/word)', () => {
    const stats: DailyStats[] = [makeDay('2026-04-01', 10, 10_000)]
    expect(computeMinutesPerWord(stats)).toBeCloseTo(10_000 / 10 / 60_000, 5)
  })

  it('should return DEFAULT_MINUTES_PER_WORD as a fallback value of 0.5', () => {
    expect(DEFAULT_MINUTES_PER_WORD).toBe(0.5)
  })
})
