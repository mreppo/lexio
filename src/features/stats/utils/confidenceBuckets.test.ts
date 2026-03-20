import { describe, it, expect } from 'vitest'
import type { Word, WordProgress } from '@/types'
import {
  getConfidenceBucket,
  buildWordStatsList,
  computeBucketCounts,
  LEARNING_THRESHOLD,
  FAMILIAR_THRESHOLD,
  MASTERED_THRESHOLD,
} from './confidenceBuckets'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeWord(id: string, source = 'hello', target = 'sveiki'): Word {
  return {
    id,
    pairId: 'pair-1',
    source,
    target,
    notes: null,
    tags: [],
    createdAt: 1000,
    isFromPack: false,
  }
}

function makeProgress(
  wordId: string,
  confidence: number,
  correct = 3,
  incorrect = 1,
): WordProgress {
  return {
    wordId,
    correctCount: correct,
    incorrectCount: incorrect,
    streak: 2,
    lastReviewed: 2000,
    nextReview: 3000,
    confidence,
    history: [],
  }
}

// ─── getConfidenceBucket ──────────────────────────────────────────────────────

describe('getConfidenceBucket', () => {
  it('should return "learning" for confidence 0', () => {
    expect(getConfidenceBucket(0)).toBe('learning')
  })

  it('should return "learning" for confidence just below LEARNING_THRESHOLD', () => {
    expect(getConfidenceBucket(LEARNING_THRESHOLD - 0.01)).toBe('learning')
  })

  it('should return "familiar" for confidence exactly at LEARNING_THRESHOLD', () => {
    expect(getConfidenceBucket(LEARNING_THRESHOLD)).toBe('familiar')
  })

  it('should return "familiar" for confidence mid-range', () => {
    expect(getConfidenceBucket(0.55)).toBe('familiar')
  })

  it('should return "familiar" for confidence just below FAMILIAR_THRESHOLD', () => {
    expect(getConfidenceBucket(FAMILIAR_THRESHOLD - 0.01)).toBe('familiar')
  })

  it('should return "mastered" for confidence exactly at MASTERED_THRESHOLD', () => {
    expect(getConfidenceBucket(MASTERED_THRESHOLD)).toBe('mastered')
  })

  it('should return "mastered" for confidence 1.0', () => {
    expect(getConfidenceBucket(1.0)).toBe('mastered')
  })

  it('should return "mastered" for confidence 0.9', () => {
    expect(getConfidenceBucket(0.9)).toBe('mastered')
  })
})

// ─── buildWordStatsList ───────────────────────────────────────────────────────

describe('buildWordStatsList', () => {
  it('should return an entry per word', () => {
    const words = [makeWord('w1'), makeWord('w2'), makeWord('w3')]
    const progress = [makeProgress('w1', 0.8)]
    const result = buildWordStatsList(words, progress)
    expect(result).toHaveLength(3)
  })

  it('should assign null progress and bucket "learning" for words with no progress record', () => {
    const words = [makeWord('w1')]
    const result = buildWordStatsList(words, [])
    expect(result[0].progress).toBeNull()
    expect(result[0].bucket).toBe('learning')
    expect(result[0].confidence).toBe(0)
    expect(result[0].timesReviewed).toBe(0)
    expect(result[0].correctPct).toBeNull()
    expect(result[0].lastReviewed).toBeNull()
  })

  it('should compute timesReviewed as correct + incorrect', () => {
    const words = [makeWord('w1')]
    const progress = [makeProgress('w1', 0.5, 7, 3)]
    const result = buildWordStatsList(words, progress)
    expect(result[0].timesReviewed).toBe(10)
  })

  it('should compute correctPct as percentage (0-100)', () => {
    const words = [makeWord('w1')]
    const progress = [makeProgress('w1', 0.5, 3, 1)]
    const result = buildWordStatsList(words, progress)
    expect(result[0].correctPct).toBe(75)
  })

  it('should set correctPct to null when timesReviewed is 0', () => {
    const words = [makeWord('w1')]
    const progress = [makeProgress('w1', 0, 0, 0)]
    const result = buildWordStatsList(words, progress)
    expect(result[0].correctPct).toBeNull()
  })

  it('should carry through the lastReviewed timestamp', () => {
    const words = [makeWord('w1')]
    const progress = [makeProgress('w1', 0.6)]
    const result = buildWordStatsList(words, progress)
    expect(result[0].lastReviewed).toBe(2000)
  })

  it('should correctly assign bucket for familiar confidence', () => {
    const words = [makeWord('w1')]
    const progress = [makeProgress('w1', 0.55)]
    const result = buildWordStatsList(words, progress)
    expect(result[0].bucket).toBe('familiar')
  })

  it('should correctly assign bucket for mastered confidence', () => {
    const words = [makeWord('w1')]
    const progress = [makeProgress('w1', 0.85)]
    const result = buildWordStatsList(words, progress)
    expect(result[0].bucket).toBe('mastered')
  })
})

// ─── computeBucketCounts ─────────────────────────────────────────────────────

describe('computeBucketCounts', () => {
  it('should return all zeroes for an empty list', () => {
    const counts = computeBucketCounts([])
    expect(counts).toEqual({ learning: 0, familiar: 0, mastered: 0, total: 0 })
  })

  it('should correctly count words per bucket', () => {
    const words = [makeWord('w1'), makeWord('w2'), makeWord('w3'), makeWord('w4'), makeWord('w5')]
    const progress = [
      makeProgress('w1', 0.1), // learning
      makeProgress('w2', 0.3), // learning
      makeProgress('w3', 0.5), // familiar
      makeProgress('w4', 0.65), // familiar
      makeProgress('w5', 0.9), // mastered
    ]
    const wordStats = buildWordStatsList(words, progress)
    const counts = computeBucketCounts(wordStats)

    expect(counts.learning).toBe(2)
    expect(counts.familiar).toBe(2)
    expect(counts.mastered).toBe(1)
    expect(counts.total).toBe(5)
  })

  it('should count words with no progress as "learning"', () => {
    const words = [makeWord('w1'), makeWord('w2')]
    const wordStats = buildWordStatsList(words, [])
    const counts = computeBucketCounts(wordStats)

    expect(counts.learning).toBe(2)
    expect(counts.familiar).toBe(0)
    expect(counts.mastered).toBe(0)
    expect(counts.total).toBe(2)
  })
})
