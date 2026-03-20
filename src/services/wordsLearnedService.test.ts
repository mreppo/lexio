/**
 * Tests for wordsLearnedService - words learned metric.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Word, WordProgress, LanguagePair } from '@/types'
import type { StorageService } from './storage/StorageService'
import { getWordsLearnedForPair, getTotalWordsLearned } from './wordsLearnedService'
import { LEARNED_CONFIDENCE_THRESHOLD } from './streakService'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeWord(id: string, pairId: string = 'pair1'): Word {
  return {
    id,
    pairId,
    source: `source-${id}`,
    target: `target-${id}`,
    notes: null,
    tags: [],
    createdAt: Date.now(),
    isFromPack: false,
  }
}

function makeProgress(wordId: string, confidence: number): WordProgress {
  return {
    wordId,
    correctCount: 5,
    incorrectCount: 1,
    streak: 3,
    lastReviewed: Date.now(),
    nextReview: Date.now() + 86400000,
    confidence,
    history: [],
  }
}

function makePair(id: string): LanguagePair {
  return {
    id,
    sourceLang: 'English',
    targetLang: 'Latvian',
    sourceCode: 'en',
    targetCode: 'lv',
    createdAt: Date.now(),
  }
}

function createMockStorage(overrides: Partial<StorageService> = {}): StorageService {
  return {
    getLanguagePairs: vi.fn().mockResolvedValue([]),
    getLanguagePair: vi.fn().mockResolvedValue(null),
    saveLanguagePair: vi.fn().mockResolvedValue(undefined),
    deleteLanguagePair: vi.fn().mockResolvedValue(undefined),
    getWords: vi.fn().mockResolvedValue([]),
    getWord: vi.fn().mockResolvedValue(null),
    saveWord: vi.fn().mockResolvedValue(undefined),
    saveWords: vi.fn().mockResolvedValue(undefined),
    deleteWord: vi.fn().mockResolvedValue(undefined),
    getWordProgress: vi.fn().mockResolvedValue(null),
    getAllProgress: vi.fn().mockResolvedValue([]),
    saveWordProgress: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue({
      activePairId: null,
      quizMode: 'mixed',
      dailyGoal: 20,
      theme: 'dark',
      typoTolerance: 1,
    }),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    getDailyStats: vi.fn().mockResolvedValue(null),
    getDailyStatsRange: vi.fn().mockResolvedValue([]),
    saveDailyStats: vi.fn().mockResolvedValue(undefined),
    getRecentDailyStats: vi.fn().mockResolvedValue([]),
    exportAll: vi.fn().mockResolvedValue('{}'),
    importAll: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as StorageService
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getWordsLearnedForPair', () => {
  let storage: StorageService

  beforeEach(() => {
    storage = createMockStorage()
  })

  it('returns 0/0 when the pair has no words', async () => {
    vi.mocked(storage.getWords).mockResolvedValue([])
    vi.mocked(storage.getAllProgress).mockResolvedValue([])

    const result = await getWordsLearnedForPair(storage, 'pair1')
    expect(result).toEqual({ learned: 0, total: 0 })
  })

  it('counts words with confidence >= threshold as learned', async () => {
    const words = [makeWord('w1'), makeWord('w2'), makeWord('w3')]
    const progress = [
      makeProgress('w1', LEARNED_CONFIDENCE_THRESHOLD), // exactly at threshold = learned
      makeProgress('w2', LEARNED_CONFIDENCE_THRESHOLD + 0.1), // above = learned
      makeProgress('w3', LEARNED_CONFIDENCE_THRESHOLD - 0.01), // below = not learned
    ]

    vi.mocked(storage.getWords).mockResolvedValue(words)
    vi.mocked(storage.getAllProgress).mockResolvedValue(progress)

    const result = await getWordsLearnedForPair(storage, 'pair1')
    expect(result).toEqual({ learned: 2, total: 3 })
  })

  it('does not count words with no progress record as learned', async () => {
    const words = [makeWord('w1'), makeWord('w2')]
    // w2 has no progress record
    const progress = [makeProgress('w1', 0.9)]

    vi.mocked(storage.getWords).mockResolvedValue(words)
    vi.mocked(storage.getAllProgress).mockResolvedValue(progress)

    const result = await getWordsLearnedForPair(storage, 'pair1')
    expect(result).toEqual({ learned: 1, total: 2 })
  })

  it('returns 0 learned when all words have low confidence', async () => {
    const words = [makeWord('w1'), makeWord('w2')]
    const progress = [makeProgress('w1', 0.1), makeProgress('w2', 0.5)]

    vi.mocked(storage.getWords).mockResolvedValue(words)
    vi.mocked(storage.getAllProgress).mockResolvedValue(progress)

    const result = await getWordsLearnedForPair(storage, 'pair1')
    expect(result).toEqual({ learned: 0, total: 2 })
  })

  it('returns total learned when all words exceed threshold', async () => {
    const words = [makeWord('w1'), makeWord('w2'), makeWord('w3')]
    const progress = [makeProgress('w1', 0.9), makeProgress('w2', 0.85), makeProgress('w3', 1.0)]

    vi.mocked(storage.getWords).mockResolvedValue(words)
    vi.mocked(storage.getAllProgress).mockResolvedValue(progress)

    const result = await getWordsLearnedForPair(storage, 'pair1')
    expect(result).toEqual({ learned: 3, total: 3 })
  })
})

describe('getTotalWordsLearned', () => {
  it('returns 0/0 when there are no language pairs', async () => {
    const storage = createMockStorage({
      getLanguagePairs: vi.fn().mockResolvedValue([]),
    })

    const result = await getTotalWordsLearned(storage)
    expect(result).toEqual({ learned: 0, total: 0 })
  })

  it('aggregates learned/total across multiple pairs', async () => {
    const pair1 = makePair('pair1')
    const pair2 = makePair('pair2')

    const storage = createMockStorage({
      getLanguagePairs: vi.fn().mockResolvedValue([pair1, pair2]),
      getWords: vi
        .fn()
        .mockResolvedValueOnce([makeWord('w1', 'pair1'), makeWord('w2', 'pair1')])
        .mockResolvedValueOnce([makeWord('w3', 'pair2')]),
      getAllProgress: vi
        .fn()
        .mockResolvedValueOnce([makeProgress('w1', 0.9), makeProgress('w2', 0.3)])
        .mockResolvedValueOnce([makeProgress('w3', 0.95)]),
    })

    const result = await getTotalWordsLearned(storage)
    // pair1: 1 learned out of 2; pair2: 1 learned out of 1 → total: 2/3
    expect(result).toEqual({ learned: 2, total: 3 })
  })
})
