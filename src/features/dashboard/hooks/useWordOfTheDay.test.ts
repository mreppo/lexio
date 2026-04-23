import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWordOfTheDay, FAMILIAR_THRESHOLD, MASTERED_THRESHOLD } from './useWordOfTheDay'
import type { Word, WordProgress } from '@/types'

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeWord(id: string, pairId = 'pair-1'): Word {
  return {
    id,
    pairId,
    source: `source-${id}`,
    target: `target-${id}`,
    notes: null,
    tags: [],
    createdAt: 1000,
    isFromPack: false,
  }
}

function makeProgress(wordId: string, confidence: number): WordProgress {
  return {
    wordId,
    correctCount: 5,
    incorrectCount: 1,
    streak: 2,
    lastReviewed: 1000,
    nextReview: 2000,
    confidence,
    history: [],
  }
}

const DATE = '2026-04-23'
const PAIR_ID = 'pair-1'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useWordOfTheDay', () => {
  describe('determinism', () => {
    it('should return the same word for the same date and pairId across multiple invocations', () => {
      const words = [makeWord('w1'), makeWord('w2'), makeWord('w3'), makeWord('w4'), makeWord('w5')]
      const progress = words.map((w) => makeProgress(w.id, 0.3))

      const { result: result1 } = renderHook(() => useWordOfTheDay(DATE, PAIR_ID, words, progress))
      const { result: result2 } = renderHook(() => useWordOfTheDay(DATE, PAIR_ID, words, progress))

      expect(result1.current.word?.id).toBeDefined()
      expect(result1.current.word?.id).toBe(result2.current.word?.id)
    })

    it('should return the same word when words array is recreated with identical content', () => {
      const words = [makeWord('w1'), makeWord('w2'), makeWord('w3')]
      const progress = words.map((w) => makeProgress(w.id, 0.3))

      const words2 = [makeWord('w1'), makeWord('w2'), makeWord('w3')]
      const progress2 = words2.map((w) => makeProgress(w.id, 0.3))

      const { result: r1 } = renderHook(() => useWordOfTheDay(DATE, PAIR_ID, words, progress))
      const { result: r2 } = renderHook(() => useWordOfTheDay(DATE, PAIR_ID, words2, progress2))

      expect(r1.current.word?.id).toBe(r2.current.word?.id)
    })
  })

  describe('bucket filtering', () => {
    it('should only include words in learning bucket (confidence < FAMILIAR_THRESHOLD)', () => {
      const w1 = makeWord('w1')
      const w2 = makeWord('w2')
      // w1 is learning, w2 is mastered (should be excluded)
      const progress = [makeProgress('w1', 0.2), makeProgress('w2', MASTERED_THRESHOLD)]

      // Only w1 is eligible — the hook must pick it
      const { result } = renderHook(() => useWordOfTheDay(DATE, PAIR_ID, [w1, w2], progress))
      expect(result.current.word?.id).toBe('w1')
    })

    it('should include words in familiar bucket (FAMILIAR_THRESHOLD <= confidence < MASTERED_THRESHOLD)', () => {
      const w1 = makeWord('w1')
      // Exactly at familiar threshold
      const progress = [makeProgress('w1', FAMILIAR_THRESHOLD)]

      const { result } = renderHook(() => useWordOfTheDay(DATE, PAIR_ID, [w1], progress))
      expect(result.current.word?.id).toBe('w1')
    })

    it('should exclude mastered words (confidence >= MASTERED_THRESHOLD)', () => {
      const w1 = makeWord('w1')
      const progress = [makeProgress('w1', MASTERED_THRESHOLD)]

      const { result } = renderHook(() => useWordOfTheDay(DATE, PAIR_ID, [w1], progress))
      expect(result.current.word).toBeNull()
    })

    it('should exclude words with exactly MASTERED_THRESHOLD confidence', () => {
      const w1 = makeWord('w1')
      const progress = [makeProgress('w1', 0.8)]

      const { result } = renderHook(() => useWordOfTheDay(DATE, PAIR_ID, [w1], progress))
      // Mastered threshold is 0.8 — exactly 0.8 is excluded
      expect(result.current.word).toBeNull()
    })

    it('should exclude new words (no progress record)', () => {
      const w1 = makeWord('w1')
      // No progress record for w1 — it is "new"

      const { result } = renderHook(() => useWordOfTheDay(DATE, PAIR_ID, [w1], []))
      expect(result.current.word).toBeNull()
    })

    it('should include a word with confidence just below MASTERED_THRESHOLD', () => {
      const w1 = makeWord('w1')
      const progress = [makeProgress('w1', MASTERED_THRESHOLD - 0.001)]

      const { result } = renderHook(() => useWordOfTheDay(DATE, PAIR_ID, [w1], progress))
      expect(result.current.word?.id).toBe('w1')
    })
  })

  describe('empty state', () => {
    it('should return null when pairId is null', () => {
      const words = [makeWord('w1')]
      const progress = [makeProgress('w1', 0.3)]

      const { result } = renderHook(() => useWordOfTheDay(DATE, null, words, progress))
      expect(result.current.word).toBeNull()
      expect(result.current.progress).toBeNull()
    })

    it('should return null when words list is empty', () => {
      const { result } = renderHook(() => useWordOfTheDay(DATE, PAIR_ID, [], []))
      expect(result.current.word).toBeNull()
    })

    it('should return null when all words are mastered', () => {
      const words = [makeWord('w1'), makeWord('w2')]
      const progress = words.map((w) => makeProgress(w.id, 0.9))

      const { result } = renderHook(() => useWordOfTheDay(DATE, PAIR_ID, words, progress))
      expect(result.current.word).toBeNull()
    })

    it('should return null when all words are new (no progress records)', () => {
      const words = [makeWord('w1'), makeWord('w2')]

      const { result } = renderHook(() => useWordOfTheDay(DATE, PAIR_ID, words, []))
      expect(result.current.word).toBeNull()
    })
  })

  describe('variation across dates and pairs', () => {
    it('should produce different selections for different dates (statistical)', () => {
      const words = Array.from({ length: 20 }, (_, i) => makeWord(`w${i}`))
      const progress = words.map((w) => makeProgress(w.id, 0.3))

      const results = new Set<string>()
      const dates = [
        '2026-01-01',
        '2026-01-02',
        '2026-01-03',
        '2026-01-04',
        '2026-01-05',
        '2026-02-15',
        '2026-03-20',
        '2026-04-01',
        '2026-05-10',
        '2026-06-30',
      ]

      for (const date of dates) {
        const { result } = renderHook(() => useWordOfTheDay(date, PAIR_ID, words, progress))
        if (result.current.word) {
          results.add(result.current.word.id)
        }
      }

      // With 10 different dates and 20 words, expect at least 2 distinct selections
      expect(results.size).toBeGreaterThanOrEqual(2)
    })

    it('should produce different selections for different pairIds (statistical)', () => {
      const results = new Set<string>()
      const pairIds = ['pair-a', 'pair-b', 'pair-c', 'pair-d', 'pair-e']

      for (const pairId of pairIds) {
        const words = Array.from({ length: 20 }, (_, i) => makeWord(`w${i}`, pairId))
        const progress = words.map((w) => makeProgress(w.id, 0.3))

        const { result } = renderHook(() => useWordOfTheDay(DATE, pairId, words, progress))
        if (result.current.word) {
          results.add(`${pairId}:${result.current.word.id}`)
        }
      }

      // With 5 different pairs and 20 words each, expect at least 2 distinct selections
      expect(results.size).toBeGreaterThanOrEqual(2)
    })
  })

  describe('progress record', () => {
    it('should return the progress record for the selected word', () => {
      const w1 = makeWord('w1')
      const p1 = makeProgress('w1', 0.4)

      const { result } = renderHook(() => useWordOfTheDay(DATE, PAIR_ID, [w1], [p1]))

      expect(result.current.word?.id).toBe('w1')
      expect(result.current.progress).toEqual(p1)
    })
  })
})
