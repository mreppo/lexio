/**
 * Tests for useChoiceQuizSession hook.
 *
 * We mock the storage service and spaced repetition functions, and also
 * mock the distractor generator to get deterministic option lists.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { StorageContext } from '@/hooks/useStorage'
import type { StorageService } from '@/services/storage/StorageService'
import type { Word, LanguagePair, UserSettings, WordProgress } from '@/types'
import { useChoiceQuizSession } from './useChoiceQuizSession'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/services/spacedRepetition', () => ({
  getNextWords: vi.fn(),
  recordAttempt: vi.fn(),
}))

vi.mock('@/utils/distractorGenerator', () => ({
  generateDistractors: vi.fn(),
  MIN_WORDS_FOR_CHOICE: 4,
  CHOICE_COUNT: 4,
  DISTRACTOR_COUNT: 3,
}))

import { getNextWords, recordAttempt } from '@/services/spacedRepetition'
import { generateDistractors } from '@/utils/distractorGenerator'
const mockGetNextWords = vi.mocked(getNextWords)
const mockRecordAttempt = vi.mocked(recordAttempt)
const mockGenerateDistractors = vi.mocked(generateDistractors)

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
  quizMode: 'choice',
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

// A fixed distractor result for testing (correct answer is at index 1)
const mockDistractorResult = {
  options: ['cat', 'house', 'dog', 'table'],
  correctIndex: 1,
}

const allWords = [
  makeWord('w1', 'māja', 'house'),
  makeWord('w2', 'kaķis', 'cat'),
  makeWord('w3', 'suns', 'dog'),
  makeWord('w4', 'galds', 'table'),
]

function makeMockStorage(words: Word[] = allWords): StorageService {
  return {
    getLanguagePairs: vi.fn(),
    getLanguagePair: vi.fn(),
    saveLanguagePair: vi.fn(),
    deleteLanguagePair: vi.fn(),
    getWords: vi.fn().mockResolvedValue(words),
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

describe('useChoiceQuizSession', () => {
  let mockStorage: StorageService

  beforeEach(() => {
    mockStorage = makeMockStorage()
    vi.clearAllMocks()
    mockGenerateDistractors.mockReturnValue(mockDistractorResult)
    mockRecordAttempt.mockResolvedValue(mockProgress)
  })

  it('should start in loading phase and transition to question phase', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])

    const { result } = renderHook(
      () => useChoiceQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    expect(result.current.state.phase).toBe('loading')

    await waitFor(() => {
      expect(result.current.state.phase).toBe('question')
    })

    expect(result.current.state.currentWord).toEqual(word)
  })

  it('should show not-enough-words phase when pool has fewer than 4 words', async () => {
    const tinyStorage = makeMockStorage([
      makeWord('w1', 'māja', 'house'),
      makeWord('w2', 'kaķis', 'cat'),
      makeWord('w3', 'suns', 'dog'),
      // only 3 words - below MIN_WORDS_FOR_CHOICE
    ])
    mockGetNextWords.mockResolvedValue([
      { word: makeWord('w1', 'māja', 'house'), direction: 'source-to-target', progress: null },
    ])

    const { result } = renderHook(
      () => useChoiceQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(tinyStorage) },
    )

    await waitFor(() => {
      expect(result.current.state.phase).toBe('not-enough-words')
    })
  })

  it('should finish immediately if no words are returned by getNextWords', async () => {
    mockGetNextWords.mockResolvedValue([])

    const { result } = renderHook(
      () => useChoiceQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => {
      expect(result.current.state.phase).toBe('finished')
    })
  })

  it('should finish immediately if pair is null', async () => {
    const { result } = renderHook(
      () => useChoiceQuizSession(null, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => {
      expect(result.current.state.phase).toBe('finished')
    })
  })

  it('should expose options and correctIndex for the current question', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])

    const { result } = renderHook(
      () => useChoiceQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    expect(result.current.state.options).toEqual(mockDistractorResult.options)
    expect(result.current.state.correctIndex).toBe(mockDistractorResult.correctIndex)
    expect(result.current.state.selectedIndex).toBe(-1)
  })

  it('should transition to feedback after selecting an option', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])

    const { result } = renderHook(
      () => useChoiceQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      await result.current.selectOption(mockDistractorResult.correctIndex)
    })

    expect(result.current.state.phase).toBe('feedback')
    expect(result.current.state.selectedIndex).toBe(mockDistractorResult.correctIndex)
  })

  it('should record correct=true when user selects the correct option', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])

    const { result } = renderHook(
      () => useChoiceQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      await result.current.selectOption(mockDistractorResult.correctIndex)
    })

    expect(result.current.state.lastCorrect).toBe(true)
    expect(result.current.state.correctCount).toBe(1)
    expect(result.current.state.wordsCompleted).toBe(1)

    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage, 'w1', true, 'source-to-target', 'choice',
    )
  })

  it('should record correct=false when user selects a wrong option', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])

    const { result } = renderHook(
      () => useChoiceQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    // Select a wrong option (index 0 = 'cat', correct is index 1 = 'house')
    await act(async () => {
      await result.current.selectOption(0)
    })

    expect(result.current.state.lastCorrect).toBe(false)
    expect(result.current.state.correctCount).toBe(0)
    expect(result.current.state.wordsCompleted).toBe(1)

    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage, 'w1', false, 'source-to-target', 'choice',
    )
  })

  it('should not allow selecting again after an option is already selected', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])

    const { result } = renderHook(
      () => useChoiceQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    // First selection
    await act(async () => {
      await result.current.selectOption(0)
    })

    expect(result.current.state.selectedIndex).toBe(0)

    // Attempt second selection - should be ignored
    await act(async () => {
      await result.current.selectOption(mockDistractorResult.correctIndex)
    })

    // selectedIndex should remain as the first selection
    expect(result.current.state.selectedIndex).toBe(0)
    // recordAttempt should only have been called once
    expect(mockRecordAttempt).toHaveBeenCalledTimes(1)
  })

  it('should advance to the next word after feedback', async () => {
    const word1 = makeWord('w1', 'māja', 'house')
    const word2 = makeWord('w2', 'kaķis', 'cat')
    mockGetNextWords.mockResolvedValue([
      { word: word1, direction: 'source-to-target', progress: null },
      { word: word2, direction: 'source-to-target', progress: null },
    ])

    const { result } = renderHook(
      () => useChoiceQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.currentWord?.id).toBe('w1')

    await act(async () => {
      await result.current.selectOption(mockDistractorResult.correctIndex)
    })

    expect(result.current.state.phase).toBe('feedback')

    act(() => {
      result.current.advance()
    })

    expect(result.current.state.phase).toBe('question')
    expect(result.current.state.currentWord?.id).toBe('w2')
    expect(result.current.state.selectedIndex).toBe(-1)
  })

  it('should finish the session when daily goal is reached', async () => {
    const wordsForQuiz = [
      { word: makeWord('w1', 'māja', 'house'), direction: 'source-to-target' as const, progress: null },
      { word: makeWord('w2', 'kaķis', 'cat'), direction: 'source-to-target' as const, progress: null },
      { word: makeWord('w3', 'suns', 'dog'), direction: 'source-to-target' as const, progress: null },
    ]
    mockGetNextWords.mockResolvedValue(wordsForQuiz)

    // dailyGoal = 3 in mockSettings
    const { result } = renderHook(
      () => useChoiceQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    // Answer word 1
    await act(async () => { await result.current.selectOption(mockDistractorResult.correctIndex) })
    act(() => { result.current.advance() })

    // Answer word 2
    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    await act(async () => { await result.current.selectOption(mockDistractorResult.correctIndex) })
    act(() => { result.current.advance() })

    // Answer word 3 - should trigger finish
    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    await act(async () => { await result.current.selectOption(mockDistractorResult.correctIndex) })
    act(() => { result.current.advance() })

    expect(result.current.state.phase).toBe('finished')
    expect(result.current.state.wordsCompleted).toBe(3)
  })

  it('should end session when endSession is called', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])

    const { result } = renderHook(
      () => useChoiceQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    act(() => {
      result.current.endSession()
    })

    expect(result.current.state.phase).toBe('finished')
  })

  it('should provide session goal from settings dailyGoal', async () => {
    mockGetNextWords.mockResolvedValue([])

    const { result } = renderHook(
      () => useChoiceQuizSession(mockPair, { ...mockSettings, dailyGoal: 10 }),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('finished'))

    expect(result.current.state.sessionGoal).toBe(10)
  })

  it('should record attempt with mode "choice"', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])

    const { result } = renderHook(
      () => useChoiceQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      await result.current.selectOption(mockDistractorResult.correctIndex)
    })

    // The mode must be 'choice', not 'type'
    expect(mockRecordAttempt).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(Boolean),
      expect.any(String),
      'choice',
    )
  })

  it('should handle target-to-source direction', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'target-to-source', progress: null },
    ])
    // Simulate distractors for reverse direction (source answers)
    mockGenerateDistractors.mockReturnValue({
      options: ['kaķis', 'māja', 'suns', 'galds'],
      correctIndex: 1,
    })

    const { result } = renderHook(
      () => useChoiceQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    expect(result.current.state.direction).toBe('target-to-source')

    await act(async () => {
      await result.current.selectOption(1) // correct index
    })

    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage, 'w1', true, 'target-to-source', 'choice',
    )
  })
})
