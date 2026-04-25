import { describe, it, expect } from 'vitest'
import type { Word, WordProgress } from '@/types'
import { computeDueCount } from './dueWords'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const NOW = 1_700_000_000_000 // fixed reference timestamp for deterministic tests

function makeWord(id: string): Word {
  return {
    id,
    pairId: 'pair-1',
    source: 'word',
    target: 'vārds',
    notes: null,
    tags: [],
    createdAt: 1000,
    isFromPack: false,
  }
}

function makeProgress(wordId: string, nextReview: number): WordProgress {
  return {
    wordId,
    correctCount: 3,
    incorrectCount: 1,
    streak: 1,
    lastReviewed: NOW - 100_000,
    nextReview,
    confidence: 0.5,
    history: [],
  }
}

// ─── computeDueCount ─────────────────────────────────────────────────────────

describe('computeDueCount', () => {
  it('should return 0 for an empty word list', () => {
    expect(computeDueCount([], [], NOW)).toBe(0)
  })

  it('should count all words as due when no progress records exist', () => {
    const words = [makeWord('w1'), makeWord('w2'), makeWord('w3')]
    expect(computeDueCount(words, [], NOW)).toBe(3)
  })

  it('should count a word as due when nextReview is exactly now', () => {
    const words = [makeWord('w1')]
    const progress = [makeProgress('w1', NOW)]
    expect(computeDueCount(words, progress, NOW)).toBe(1)
  })

  it('should count a word as due when nextReview is in the past', () => {
    const words = [makeWord('w1')]
    const progress = [makeProgress('w1', NOW - 1)]
    expect(computeDueCount(words, progress, NOW)).toBe(1)
  })

  it('should not count a word as due when nextReview is in the future', () => {
    const words = [makeWord('w1')]
    const progress = [makeProgress('w1', NOW + 1)]
    expect(computeDueCount(words, progress, NOW)).toBe(0)
  })

  it('should correctly count a mix of due and not-due words', () => {
    const words = [makeWord('w1'), makeWord('w2'), makeWord('w3'), makeWord('w4')]
    const progress = [
      makeProgress('w1', NOW - 60_000), // due (past)
      makeProgress('w2', NOW), // due (exactly now)
      makeProgress('w3', NOW + 60_000), // not due (future)
      // w4 has no progress — always due
    ]
    expect(computeDueCount(words, progress, NOW)).toBe(3)
  })

  it('should handle all words being due', () => {
    const words = [makeWord('w1'), makeWord('w2')]
    const progress = [makeProgress('w1', NOW - 1000), makeProgress('w2', NOW - 2000)]
    expect(computeDueCount(words, progress, NOW)).toBe(2)
  })

  it('should handle all words being not due', () => {
    const words = [makeWord('w1'), makeWord('w2')]
    const progress = [makeProgress('w1', NOW + 1_000_000), makeProgress('w2', NOW + 2_000_000)]
    expect(computeDueCount(words, progress, NOW)).toBe(0)
  })

  it('should accept an injectable now parameter for deterministic results', () => {
    const words = [makeWord('w1')]
    const futureReview = NOW + 1000
    const progress = [makeProgress('w1', futureReview)]

    // At NOW: not due
    expect(computeDueCount(words, progress, NOW)).toBe(0)
    // At futureReview: exactly due
    expect(computeDueCount(words, progress, futureReview)).toBe(1)
    // After futureReview: still due
    expect(computeDueCount(words, progress, futureReview + 1)).toBe(1)
  })
})
