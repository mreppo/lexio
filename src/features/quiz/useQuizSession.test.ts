/**
 * Tests for useQuizSession hook.
 *
 * We test the logic of the quiz session by mocking the storage service
 * and the spaced repetition engine's getNextWords / recordAttempt functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { StorageContext } from '@/hooks/useStorage'
import type { StorageService } from '@/services/storage/StorageService'
import type { Word, LanguagePair, UserSettings, WordProgress } from '@/types'
import { useQuizSession } from './useQuizSession'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/services/spacedRepetition', () => ({
  getNextWords: vi.fn(),
  recordAttempt: vi.fn(),
}))

import { getNextWords, recordAttempt } from '@/services/spacedRepetition'
const mockGetNextWords = vi.mocked(getNextWords)
const mockRecordAttempt = vi.mocked(recordAttempt)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockPair: LanguagePair = {
  id: 'pair-1',
  sourceLang: 'Latvian',
  targetLang: 'English',
  sourceCode: 'lv',
  targetCode: 'en',
  createdAt: 1000,
}

const makeWord = (id: string, source: string, target: string): Word => ({
  id,
  pairId: 'pair-1',
  source,
  target,
  notes: null,
  tags: [],
  createdAt: 1000,
  isFromPack: false,
})

const mockSettings: UserSettings = {
  activePairId: 'pair-1',
  quizMode: 'type',
  dailyGoal: 3,
  theme: 'dark',
  typoTolerance: 1,
}

const mockProgress: WordProgress = {
  wordId: 'w1',
  correctCount: 0,
  incorrectCount: 0,
  streak: 0,
  lastReviewed: null,
  nextReview: 0,
  confidence: 0,
  history: [],
}

function makeMockStorage(): StorageService {
  return {
    getLanguagePairs: vi.fn(),
    getLanguagePair: vi.fn(),
    saveLanguagePair: vi.fn(),
    deleteLanguagePair: vi.fn(),
    getWords: vi.fn(),
    getWord: vi.fn(),
    saveWord: vi.fn(),
    saveWords: vi.fn(),
    deleteWord: vi.fn(),
    getWordProgress: vi.fn(),
    getAllProgress: vi.fn(),
    saveWordProgress: vi.fn(),
    getSettings: vi.fn().mockResolvedValue(mockSettings),
    saveSettings: vi.fn(),
    getDailyStats: vi.fn().mockResolvedValue(null),
    getDailyStatsRange: vi.fn().mockResolvedValue([]),
    saveDailyStats: vi.fn(),
    getRecentDailyStats: vi.fn().mockResolvedValue([]),
    exportAll: vi.fn(),
    importAll: vi.fn(),
    clearAll: vi.fn(),
  }
}

function makeWrapper(storage: StorageService) {
  return ({ children }: { children: ReactNode }) =>
    createElement(StorageContext.Provider, { value: storage }, children)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useQuizSession', () => {
  let mockStorage: StorageService

  beforeEach(() => {
    mockStorage = makeMockStorage()
    vi.clearAllMocks()
  })

  it('should start in loading phase and transition to question phase when words are available', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    expect(result.current.state.phase).toBe('loading')

    await waitFor(() => {
      expect(result.current.state.phase).toBe('question')
    })

    expect(result.current.state.currentWord).toEqual(word)
  })

  it('should finish immediately if no words are available', async () => {
    mockGetNextWords.mockResolvedValue([])

    const { result } = renderHook(
      () => useQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => {
      expect(result.current.state.phase).toBe('finished')
    })
  })

  it('should show the word to translate based on direction', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => {
      expect(result.current.state.phase).toBe('question')
    })

    expect(result.current.state.direction).toBe('source-to-target')
    expect(result.current.state.currentWord?.source).toBe('māja')
  })

  it('should transition to feedback after submitting an answer', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      await result.current.submitAnswer('house')
    })

    expect(result.current.state.phase).toBe('feedback')
  })

  it('should record a correct result for exact match', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      await result.current.submitAnswer('house')
    })

    expect(result.current.state.lastResult?.result).toBe('correct')
    expect(result.current.state.correctCount).toBe(1)
    expect(result.current.state.wordsCompleted).toBe(1)

    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage, 'w1', true, 'source-to-target', 'type',
    )
  })

  it('should record an incorrect result for a wrong answer', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      await result.current.submitAnswer('wrong')
    })

    expect(result.current.state.lastResult?.result).toBe('incorrect')
    expect(result.current.state.correctCount).toBe(0)

    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage, 'w1', false, 'source-to-target', 'type',
    )
  })

  it('should record an almost result as correct attempt', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useQuizSession(mockPair, { ...mockSettings, typoTolerance: 1 }),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    // 'hous' is 1 char off from 'house' - within tolerance 1
    await act(async () => {
      await result.current.submitAnswer('hous')
    })

    expect(result.current.state.lastResult?.result).toBe('almost')
    expect(result.current.state.correctCount).toBe(1)

    // almost is treated as correct for recording purposes
    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage, 'w1', true, 'source-to-target', 'type',
    )
  })

  it('should advance to the next word after feedback', async () => {
    const word1 = makeWord('w1', 'māja', 'house')
    const word2 = makeWord('w2', 'kaķis', 'cat')
    mockGetNextWords.mockResolvedValue([
      { word: word1, direction: 'source-to-target', progress: null },
      { word: word2, direction: 'source-to-target', progress: null },
    ])
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.currentWord?.id).toBe('w1')

    await act(async () => {
      await result.current.submitAnswer('house')
    })

    expect(result.current.state.phase).toBe('feedback')

    act(() => {
      result.current.advance()
    })

    expect(result.current.state.phase).toBe('question')
    expect(result.current.state.currentWord?.id).toBe('w2')
  })

  it('should finish the session when daily goal is reached', async () => {
    const words = [
      { word: makeWord('w1', 'māja', 'house'), direction: 'source-to-target' as const, progress: null },
      { word: makeWord('w2', 'kaķis', 'cat'), direction: 'source-to-target' as const, progress: null },
      { word: makeWord('w3', 'suns', 'dog'), direction: 'source-to-target' as const, progress: null },
    ]
    mockGetNextWords.mockResolvedValue(words)
    mockRecordAttempt.mockResolvedValue(mockProgress)

    // dailyGoal = 3 in mockSettings
    const { result } = renderHook(
      () => useQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    // Answer word 1
    await act(async () => { await result.current.submitAnswer('house') })
    act(() => { result.current.advance() })

    // Answer word 2
    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    await act(async () => { await result.current.submitAnswer('cat') })
    act(() => { result.current.advance() })

    // Answer word 3 - this should trigger finish
    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    await act(async () => { await result.current.submitAnswer('dog') })
    act(() => { result.current.advance() })

    expect(result.current.state.phase).toBe('finished')
    expect(result.current.state.wordsCompleted).toBe(3)
  })

  it('should finish when session is ended manually', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    act(() => {
      result.current.endSession()
    })

    expect(result.current.state.phase).toBe('finished')
  })

  it('should quiz in target-to-source direction', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'target-to-source', progress: null },
    ])
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    expect(result.current.state.direction).toBe('target-to-source')
    // The question should show the target word
    expect(result.current.state.currentWord?.target).toBe('house')

    // Answering with the source should be correct
    await act(async () => {
      await result.current.submitAnswer('māja')
    })

    expect(result.current.state.lastResult?.result).toBe('correct')
    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage, 'w1', true, 'target-to-source', 'type',
    )
  })

  it('should finish immediately if pair is null', async () => {
    const { result } = renderHook(
      () => useQuizSession(null, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => {
      expect(result.current.state.phase).toBe('finished')
    })
  })

  it('should provide session goal from settings dailyGoal', async () => {
    mockGetNextWords.mockResolvedValue([])

    const { result } = renderHook(
      () => useQuizSession(mockPair, { ...mockSettings, dailyGoal: 15 }),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('finished'))

    expect(result.current.state.sessionGoal).toBe(15)
  })
})
