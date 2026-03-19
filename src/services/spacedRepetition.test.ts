import { describe, it, expect, vi } from 'vitest'
import {
  calculateConfidence,
  getReviewIntervalMs,
  computeProgressAfterAttempt,
  getNextWords,
  recordAttempt,
  SPACED_REPETITION_CONFIG,
} from './spacedRepetition'
import type { AttemptRecord, WordProgress, Word } from '@/types'
import type { StorageService } from '@/services/storage/StorageService'

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function makeAttempt(correct: boolean, timestamp = 0): AttemptRecord {
  return {
    direction: 'source-to-target',
    mode: 'type',
    correct,
    timestamp,
  }
}

function makeHistory(results: boolean[]): readonly AttemptRecord[] {
  return results.map((correct, i) => makeAttempt(correct, i * 1000))
}

function makeWord(id: string, pairId = 'pair-1'): Word {
  return {
    id,
    pairId,
    source: `word-${id}`,
    target: `target-${id}`,
    notes: null,
    tags: [],
    createdAt: 0,
    isFromPack: false,
  }
}

function makeProgress(
  wordId: string,
  overrides: Partial<WordProgress> = {},
): WordProgress {
  return {
    wordId,
    correctCount: 0,
    incorrectCount: 0,
    streak: 0,
    lastReviewed: null,
    nextReview: 0,
    confidence: 0,
    history: [],
    ...overrides,
  }
}

/** Creates a minimal StorageService mock. */
function makeMockStorage(
  words: Word[] = [],
  progressMap: Map<string, WordProgress> = new Map(),
): StorageService {
  const savedProgress = new Map<string, WordProgress>(progressMap)
  const savedDailyStats = new Map()

  return {
    getWords: vi.fn().mockResolvedValue(words),
    getWordProgress: vi.fn((id: string) =>
      Promise.resolve(savedProgress.get(id) ?? null),
    ),
    saveWordProgress: vi.fn((p: WordProgress) => {
      savedProgress.set(p.wordId, p)
      return Promise.resolve()
    }),
    getDailyStats: vi.fn((date: string) =>
      Promise.resolve(savedDailyStats.get(date) ?? null),
    ),
    saveDailyStats: vi.fn((stats) => {
      savedDailyStats.set(stats.date, stats)
      return Promise.resolve()
    }),
    // Unused methods - stubbed to satisfy the interface
    getLanguagePairs: vi.fn().mockResolvedValue([]),
    getLanguagePair: vi.fn().mockResolvedValue(null),
    saveLanguagePair: vi.fn().mockResolvedValue(undefined),
    deleteLanguagePair: vi.fn().mockResolvedValue(undefined),
    getWord: vi.fn().mockResolvedValue(null),
    saveWord: vi.fn().mockResolvedValue(undefined),
    saveWords: vi.fn().mockResolvedValue(undefined),
    deleteWord: vi.fn().mockResolvedValue(undefined),
    getAllProgress: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn(),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    getDailyStatsRange: vi.fn().mockResolvedValue([]),
    getRecentDailyStats: vi.fn().mockResolvedValue([]),
    exportAll: vi.fn().mockResolvedValue('{}'),
    importAll: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
  } as unknown as StorageService
}

// ─── calculateConfidence ──────────────────────────────────────────────────────

describe('calculateConfidence', () => {
  it('should return 0 for an empty history', () => {
    expect(calculateConfidence([], 0)).toBe(0)
  })

  it('should return 1 for a history of all correct answers', () => {
    const history = makeHistory([true, true, true, true, true])
    expect(calculateConfidence(history, 0)).toBe(1)
  })

  it('should return 0 for a history of all incorrect answers', () => {
    const history = makeHistory([false, false, false, false, false])
    expect(calculateConfidence(history, 0)).toBe(0)
  })

  it('should weight recent attempts more heavily than older ones', () => {
    // Recent: mostly correct; older: all incorrect
    const historyRecentGood = makeHistory([false, false, false, false, false, true, true, true, true, true])
    const historyRecentBad = makeHistory([true, true, true, true, true, false, false, false, false, false])

    const confRecentGood = calculateConfidence(historyRecentGood, 0)
    const confRecentBad = calculateConfidence(historyRecentBad, 0)

    // Recent-good should score higher because correct answers are in the high-weight positions
    expect(confRecentGood).toBeGreaterThan(confRecentBad)
  })

  it('should apply streak multiplier when streak >= STREAK_THRESHOLD', () => {
    // Use a mixed history so confidence is not already at 1.0 before the multiplier
    const history = makeHistory([false, true, false, true, true, true])
    const withoutStreak = calculateConfidence(history, 0)
    const withStreak = calculateConfidence(history, SPACED_REPETITION_CONFIG.STREAK_THRESHOLD)

    expect(withStreak).toBeGreaterThan(withoutStreak)
  })

  it('should not apply streak multiplier when streak is below threshold', () => {
    const history = makeHistory([true, true, true])
    const belowThreshold = calculateConfidence(history, SPACED_REPETITION_CONFIG.STREAK_THRESHOLD - 1)
    const noStreak = calculateConfidence(history, 0)

    expect(belowThreshold).toBe(noStreak)
  })

  it('should cap confidence at 1', () => {
    const history = makeHistory(Array(20).fill(true))
    const confidence = calculateConfidence(history, 10)
    expect(confidence).toBeLessThanOrEqual(1)
  })

  it('should never return confidence below 0', () => {
    const history = makeHistory(Array(20).fill(false))
    const confidence = calculateConfidence(history, 0)
    expect(confidence).toBeGreaterThanOrEqual(0)
  })

  it('should use older attempts when history exceeds the weighted window', () => {
    // 15 older incorrect + 5 recent correct - older ones contribute but with weight 1
    const history = makeHistory([
      ...Array(15).fill(false),
      ...Array(5).fill(true),
    ])
    const confidence = calculateConfidence(history, 0)
    // Should be > 0 (recent correct) but < 1 (older incorrect drag it down)
    expect(confidence).toBeGreaterThan(0)
    expect(confidence).toBeLessThan(1)
  })
})

// ─── getReviewIntervalMs ──────────────────────────────────────────────────────

describe('getReviewIntervalMs', () => {
  const cfg = SPACED_REPETITION_CONFIG

  it('should return INTERVAL_VERY_LOW_MS for confidence < 0.2', () => {
    expect(getReviewIntervalMs(0)).toBe(cfg.INTERVAL_VERY_LOW_MS)
    expect(getReviewIntervalMs(0.1)).toBe(cfg.INTERVAL_VERY_LOW_MS)
    expect(getReviewIntervalMs(0.19)).toBe(cfg.INTERVAL_VERY_LOW_MS)
  })

  it('should return INTERVAL_LOW_MS for confidence 0.2–0.4', () => {
    expect(getReviewIntervalMs(0.2)).toBe(cfg.INTERVAL_LOW_MS)
    expect(getReviewIntervalMs(0.3)).toBe(cfg.INTERVAL_LOW_MS)
    expect(getReviewIntervalMs(0.39)).toBe(cfg.INTERVAL_LOW_MS)
  })

  it('should return INTERVAL_MEDIUM_MS for confidence 0.4–0.6', () => {
    expect(getReviewIntervalMs(0.4)).toBe(cfg.INTERVAL_MEDIUM_MS)
    expect(getReviewIntervalMs(0.5)).toBe(cfg.INTERVAL_MEDIUM_MS)
    expect(getReviewIntervalMs(0.59)).toBe(cfg.INTERVAL_MEDIUM_MS)
  })

  it('should return INTERVAL_HIGH_MS for confidence 0.6–0.8', () => {
    expect(getReviewIntervalMs(0.6)).toBe(cfg.INTERVAL_HIGH_MS)
    expect(getReviewIntervalMs(0.7)).toBe(cfg.INTERVAL_HIGH_MS)
    expect(getReviewIntervalMs(0.79)).toBe(cfg.INTERVAL_HIGH_MS)
  })

  it('should return INTERVAL_VERY_HIGH_MS for confidence >= 0.8', () => {
    expect(getReviewIntervalMs(0.8)).toBe(cfg.INTERVAL_VERY_HIGH_MS)
    expect(getReviewIntervalMs(0.9)).toBe(cfg.INTERVAL_VERY_HIGH_MS)
    expect(getReviewIntervalMs(1)).toBe(cfg.INTERVAL_VERY_HIGH_MS)
  })

  it('should assign progressively longer intervals for higher confidence', () => {
    expect(getReviewIntervalMs(0.1)).toBeLessThan(getReviewIntervalMs(0.3))
    expect(getReviewIntervalMs(0.3)).toBeLessThan(getReviewIntervalMs(0.5))
    expect(getReviewIntervalMs(0.5)).toBeLessThan(getReviewIntervalMs(0.7))
    expect(getReviewIntervalMs(0.7)).toBeLessThan(getReviewIntervalMs(0.9))
  })
})

// ─── computeProgressAfterAttempt ─────────────────────────────────────────────

describe('computeProgressAfterAttempt', () => {
  const NOW = 1_700_000_000_000

  it('should create progress from scratch for a first-ever attempt', () => {
    const result = computeProgressAfterAttempt(null, 'word-1', true, 'source-to-target', 'type', NOW)

    expect(result.wordId).toBe('word-1')
    expect(result.correctCount).toBe(1)
    expect(result.incorrectCount).toBe(0)
    expect(result.streak).toBe(1)
    expect(result.lastReviewed).toBe(NOW)
    expect(result.history).toHaveLength(1)
    expect(result.history[0].correct).toBe(true)
  })

  it('should increment streak on correct answer', () => {
    const existing = makeProgress('word-1', { streak: 2 })
    const result = computeProgressAfterAttempt(existing, 'word-1', true, 'source-to-target', 'type', NOW)

    expect(result.streak).toBe(3)
  })

  it('should reset streak to 0 on incorrect answer', () => {
    const existing = makeProgress('word-1', { streak: 5 })
    const result = computeProgressAfterAttempt(existing, 'word-1', false, 'source-to-target', 'type', NOW)

    expect(result.streak).toBe(0)
  })

  it('should schedule next review in the future', () => {
    const result = computeProgressAfterAttempt(null, 'word-1', true, 'source-to-target', 'type', NOW)

    expect(result.nextReview).toBeGreaterThan(NOW)
  })

  it('should schedule a sooner review after incorrect vs correct answer', () => {
    const base = makeProgress('word-1', {
      history: makeHistory([true, true, true, true]) as AttemptRecord[],
      streak: 4,
    })

    const afterCorrect = computeProgressAfterAttempt(base, 'word-1', true, 'source-to-target', 'type', NOW)
    const afterIncorrect = computeProgressAfterAttempt(base, 'word-1', false, 'source-to-target', 'type', NOW)

    expect(afterIncorrect.nextReview).toBeLessThan(afterCorrect.nextReview)
  })

  it('should not exceed MAX_HISTORY_SIZE', () => {
    const maxSize = SPACED_REPETITION_CONFIG.MAX_HISTORY_SIZE
    const fullHistory = makeHistory(Array(maxSize).fill(true)) as AttemptRecord[]
    const existing = makeProgress('word-1', { history: fullHistory })

    const result = computeProgressAfterAttempt(existing, 'word-1', true, 'source-to-target', 'type', NOW)

    expect(result.history.length).toBe(maxSize)
  })

  it('should drop the oldest record when history is full', () => {
    const maxSize = SPACED_REPETITION_CONFIG.MAX_HISTORY_SIZE
    // All false except we add a true one to a full history
    const fullHistory = makeHistory(Array(maxSize).fill(false)) as AttemptRecord[]
    const existing = makeProgress('word-1', { history: fullHistory, streak: 0 })

    const result = computeProgressAfterAttempt(existing, 'word-1', true, 'source-to-target', 'type', NOW)

    expect(result.history.length).toBe(maxSize)
    // The newest entry should be correct (true)
    expect(result.history[result.history.length - 1].correct).toBe(true)
  })

  it('should accumulate correctCount and incorrectCount', () => {
    const existing = makeProgress('word-1', { correctCount: 3, incorrectCount: 1 })
    const afterCorrect = computeProgressAfterAttempt(existing, 'word-1', true, 'source-to-target', 'type', NOW)
    const afterIncorrect = computeProgressAfterAttempt(existing, 'word-1', false, 'source-to-target', 'type', NOW)

    expect(afterCorrect.correctCount).toBe(4)
    expect(afterCorrect.incorrectCount).toBe(1)
    expect(afterIncorrect.correctCount).toBe(3)
    expect(afterIncorrect.incorrectCount).toBe(2)
  })

  it('should record the attempt direction and mode', () => {
    const result = computeProgressAfterAttempt(null, 'word-1', true, 'target-to-source', 'choice', NOW)

    const lastAttempt = result.history[result.history.length - 1]
    expect(lastAttempt.direction).toBe('target-to-source')
    expect(lastAttempt.mode).toBe('choice')
  })

  it('should reduce confidence after incorrect answer on a high-confidence word', () => {
    // Build a high-confidence word
    const history = makeHistory(Array(8).fill(true)) as AttemptRecord[]
    const existing = makeProgress('word-1', {
      history,
      streak: 8,
      confidence: 0.95,
    })

    const afterIncorrect = computeProgressAfterAttempt(
      existing,
      'word-1',
      false,
      'source-to-target',
      'type',
      NOW,
    )

    // Confidence should decrease but not drop to 0 because of damping
    expect(afterIncorrect.confidence).toBeLessThan(existing.confidence)
    expect(afterIncorrect.confidence).toBeGreaterThan(0)
  })
})

// ─── getNextWords ─────────────────────────────────────────────────────────────

describe('getNextWords', () => {
  const NOW = 1_700_000_000_000
  const FUTURE = NOW + 24 * 60 * 60 * 1000  // 1 day in the future
  const PAST = NOW - 60 * 1000              // 1 minute in the past

  it('should return an empty array when there are no words', async () => {
    const storage = makeMockStorage([])
    const result = await getNextWords(storage, 'pair-1', 5, NOW)
    expect(result).toHaveLength(0)
  })

  it('should return up to count words', async () => {
    const words = [makeWord('w1'), makeWord('w2'), makeWord('w3')]
    const storage = makeMockStorage(words)
    const result = await getNextWords(storage, 'pair-1', 2, NOW)
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('should prioritise overdue words over new ones', async () => {
    const overdueWord = makeWord('overdue')
    const newWord = makeWord('new')

    const overdueProgress = makeProgress('overdue', { nextReview: PAST })
    const progressMap = new Map([['overdue', overdueProgress]])
    const storage = makeMockStorage([overdueWord, newWord], progressMap)

    const result = await getNextWords(storage, 'pair-1', 1, NOW)

    expect(result).toHaveLength(1)
    expect(result[0].word.id).toBe('overdue')
  })

  it('should sort overdue words with most overdue first', async () => {
    const word1 = makeWord('w1')
    const word2 = makeWord('w2')
    const word3 = makeWord('w3')

    // w3 is most overdue (lowest nextReview), w1 is least overdue
    const progressMap = new Map([
      ['w1', makeProgress('w1', { nextReview: NOW - 1000 })],
      ['w2', makeProgress('w2', { nextReview: NOW - 5000 })],
      ['w3', makeProgress('w3', { nextReview: NOW - 10000 })],
    ])
    const storage = makeMockStorage([word1, word2, word3], progressMap)

    const result = await getNextWords(storage, 'pair-1', 3, NOW)

    expect(result[0].word.id).toBe('w3')  // most overdue
    expect(result[1].word.id).toBe('w2')
    expect(result[2].word.id).toBe('w1')  // least overdue
  })

  it('should include new words when slots remain after overdue', async () => {
    const words = [makeWord('new1'), makeWord('new2'), makeWord('new3')]
    const storage = makeMockStorage(words)

    const result = await getNextWords(storage, 'pair-1', 3, NOW)

    // All should be new (no progress)
    expect(result.every((r) => r.progress === null)).toBe(true)
  })

  it('should limit new words per batch to MAX_NEW_WORDS_PER_BATCH', async () => {
    const cfg = SPACED_REPETITION_CONFIG
    const words = Array.from({ length: cfg.MAX_NEW_WORDS_PER_BATCH + 5 }, (_, i) =>
      makeWord(`new-${i}`),
    )
    const storage = makeMockStorage(words)

    const result = await getNextWords(storage, 'pair-1', cfg.MAX_NEW_WORDS_PER_BATCH + 5, NOW)

    const newWordsInResult = result.filter((r) => r.progress === null)
    expect(newWordsInResult.length).toBeLessThanOrEqual(cfg.MAX_NEW_WORDS_PER_BATCH)
  })

  it('should fill remaining slots with low-confidence words', async () => {
    const word1 = makeWord('w1')
    const word2 = makeWord('w2')

    // Not overdue, just low confidence
    const progressMap = new Map([
      ['w1', makeProgress('w1', { nextReview: FUTURE, confidence: 0.1 })],
      ['w2', makeProgress('w2', { nextReview: FUTURE, confidence: 0.3 })],
    ])
    const storage = makeMockStorage([word1, word2], progressMap)

    const result = await getNextWords(storage, 'pair-1', 2, NOW)

    expect(result).toHaveLength(2)
    // w1 should come first (lower confidence)
    expect(result[0].word.id).toBe('w1')
    expect(result[1].word.id).toBe('w2')
  })

  it('should assign a direction to each word', async () => {
    const words = [makeWord('w1'), makeWord('w2')]
    const storage = makeMockStorage(words)

    const result = await getNextWords(storage, 'pair-1', 2, NOW)

    for (const item of result) {
      expect(['source-to-target', 'target-to-source']).toContain(item.direction)
    }
  })

  it('should handle the case where all words are mastered (no overdue)', async () => {
    const words = [makeWord('w1'), makeWord('w2')]
    const progressMap = new Map([
      ['w1', makeProgress('w1', { nextReview: FUTURE, confidence: 0.95 })],
      ['w2', makeProgress('w2', { nextReview: FUTURE, confidence: 0.9 })],
    ])
    const storage = makeMockStorage(words, progressMap)

    const result = await getNextWords(storage, 'pair-1', 2, NOW)

    // Should still return them (lowest confidence first from the "low confidence" bucket)
    expect(result).toHaveLength(2)
    // w2 lower confidence (0.9 < 0.95), but actually w2=0.9 < w1=0.95, so w2 first
    expect(result[0].word.id).toBe('w2')
  })
})

// ─── recordAttempt ────────────────────────────────────────────────────────────

describe('recordAttempt', () => {
  const NOW = 1_700_000_000_000

  it('should save updated progress to storage', async () => {
    const storage = makeMockStorage()
    await recordAttempt(storage, 'word-1', true, 'source-to-target', 'type', NOW)

    expect(storage.saveWordProgress).toHaveBeenCalledOnce()
    const saved = vi.mocked(storage.saveWordProgress).mock.calls[0][0]
    expect(saved.wordId).toBe('word-1')
    expect(saved.correctCount).toBe(1)
  })

  it('should update DailyStats after a correct attempt', async () => {
    const storage = makeMockStorage()
    await recordAttempt(storage, 'word-1', true, 'source-to-target', 'type', NOW)

    expect(storage.saveDailyStats).toHaveBeenCalledOnce()
    const savedStats = vi.mocked(storage.saveDailyStats).mock.calls[0][0]
    expect(savedStats.wordsReviewed).toBe(1)
    expect(savedStats.correctCount).toBe(1)
    expect(savedStats.incorrectCount).toBe(0)
  })

  it('should update DailyStats after an incorrect attempt', async () => {
    const storage = makeMockStorage()
    await recordAttempt(storage, 'word-1', false, 'source-to-target', 'type', NOW)

    const savedStats = vi.mocked(storage.saveDailyStats).mock.calls[0][0]
    expect(savedStats.wordsReviewed).toBe(1)
    expect(savedStats.correctCount).toBe(0)
    expect(savedStats.incorrectCount).toBe(1)
  })

  it('should accumulate DailyStats across multiple attempts', async () => {
    const storage = makeMockStorage()
    await recordAttempt(storage, 'word-1', true, 'source-to-target', 'type', NOW)
    await recordAttempt(storage, 'word-2', false, 'target-to-source', 'choice', NOW)

    const calls = vi.mocked(storage.saveDailyStats).mock.calls
    const lastStats = calls[calls.length - 1][0]
    expect(lastStats.wordsReviewed).toBe(2)
    expect(lastStats.correctCount).toBe(1)
    expect(lastStats.incorrectCount).toBe(1)
  })

  it('should return the updated WordProgress', async () => {
    const storage = makeMockStorage()
    const result = await recordAttempt(storage, 'word-1', true, 'source-to-target', 'type', NOW)

    expect(result.wordId).toBe('word-1')
    expect(result.streak).toBe(1)
    expect(result.lastReviewed).toBe(NOW)
  })

  it('should use existing progress when present', async () => {
    const existing = makeProgress('word-1', { streak: 4, correctCount: 4 })
    const progressMap = new Map([['word-1', existing]])
    const storage = makeMockStorage([], progressMap)

    const result = await recordAttempt(storage, 'word-1', true, 'source-to-target', 'type', NOW)

    expect(result.streak).toBe(5)
    expect(result.correctCount).toBe(5)
  })

  it('should use the current date for DailyStats key', async () => {
    const storage = makeMockStorage()
    // Use a fixed timestamp: 2023-11-14
    const fixedNow = new Date('2023-11-14T10:00:00Z').getTime()
    await recordAttempt(storage, 'word-1', true, 'source-to-target', 'type', fixedNow)

    const savedStats = vi.mocked(storage.saveDailyStats).mock.calls[0][0]
    expect(savedStats.date).toBe('2023-11-14')
  })
})

// ─── Integration: confidence reflects learning progress ───────────────────────

describe('confidence score reflects learning progress', () => {
  const NOW = 1_700_000_000_000

  it('should increase confidence over a session of correct answers', () => {
    let progress: WordProgress | null = null
    const wordId = 'word-1'

    for (let i = 0; i < 6; i++) {
      progress = computeProgressAfterAttempt(
        progress,
        wordId,
        true,
        'source-to-target',
        'type',
        NOW + i * 1000,
      )
    }

    expect(progress!.confidence).toBeGreaterThan(0.5)
    expect(progress!.streak).toBe(6)
  })

  it('should not completely reset confidence after one wrong answer in a long streak', () => {
    let progress: WordProgress | null = null
    const wordId = 'word-1'

    // 8 correct answers
    for (let i = 0; i < 8; i++) {
      progress = computeProgressAfterAttempt(
        progress,
        wordId,
        true,
        'source-to-target',
        'type',
        NOW + i * 1000,
      )
    }

    const confidenceBeforeWrong = progress!.confidence

    // One wrong answer
    progress = computeProgressAfterAttempt(
      progress,
      wordId,
      false,
      'source-to-target',
      'type',
      NOW + 8000,
    )

    // Should still have meaningful confidence (not at 0)
    expect(progress.confidence).toBeGreaterThan(0)
    expect(progress.confidence).toBeLessThan(confidenceBeforeWrong)
  })

  it('should schedule progressively longer intervals as confidence grows', () => {
    let progress: WordProgress | null = null
    const intervals: number[] = []

    for (let i = 0; i < 5; i++) {
      progress = computeProgressAfterAttempt(
        progress,
        'word-1',
        true,
        'source-to-target',
        'type',
        NOW + i * 1000,
      )
      intervals.push(progress.nextReview - (NOW + i * 1000))
    }

    // Each interval should be >= the previous (non-decreasing)
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1])
    }
  })
})
