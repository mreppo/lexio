/**
 * Tests for useMixedQuizSession hook and selectModeForWord utility.
 *
 * Covers:
 * - Mode alternation respects the type ratio
 * - No more than MAX_CONSECUTIVE_SAME_MODE questions in the same mode
 * - Session summary calculations (wordsCompleted, correctCount)
 * - Confidence heuristic nudges low-confidence words toward choice
 * - Both submitAnswer (type mode) and selectOption (choice mode)
 * - Session lifecycle: loading → question → feedback → finished
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { StorageContext } from '@/hooks/useStorage'
import type { StorageService } from '@/services/storage/StorageService'
import type { Word, LanguagePair, UserSettings, WordProgress } from '@/types'
import {
  useMixedQuizSession,
  selectModeForWord,
  MAX_CONSECUTIVE_SAME_MODE,
} from './useMixedQuizSession'
import type { ActiveQuizMode } from './useMixedQuizSession'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/services/spacedRepetition', () => ({
  getNextWords: vi.fn(),
  recordAttempt: vi.fn(),
}))

vi.mock('@/utils/distractorGenerator', () => ({
  generateDistractors: vi.fn(),
  MIN_WORDS_FOR_CHOICE: 4,
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

function makeWord(id: string, source: string, target: string): Word {
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

const mockSettings: UserSettings = {
  activePairId: 'pair-1',
  quizMode: 'mixed',
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

const mockDistr = {
  options: ['house', 'cat', 'dog', 'bird'],
  correctIndex: 0,
}

function makeMockStorage(words: Word[] = []): StorageService {
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

// ─── selectModeForWord unit tests ─────────────────────────────────────────────

describe('selectModeForWord', () => {
  it('should always return type when choiceAvailable is false', () => {
    for (let i = 0; i < 20; i++) {
      expect(selectModeForWord(0.5, [], 0.5, false)).toBe('type')
    }
  })

  it('should return type when typeRatio is 1.0', () => {
    for (let i = 0; i < 20; i++) {
      expect(selectModeForWord(1.0, [], 0.5, true)).toBe('type')
    }
  })

  it('should return choice when typeRatio is 0.0', () => {
    for (let i = 0; i < 20; i++) {
      expect(selectModeForWord(0.0, [], 0.5, true)).toBe('choice')
    }
  })

  it('should force switch after MAX_CONSECUTIVE_SAME_MODE type questions', () => {
    const recentModes: ActiveQuizMode[] = Array(MAX_CONSECUTIVE_SAME_MODE).fill('type')
    // Even with typeRatio 1.0 it should switch to choice
    expect(selectModeForWord(1.0, recentModes, 0.5, true)).toBe('choice')
  })

  it('should force switch after MAX_CONSECUTIVE_SAME_MODE choice questions', () => {
    const recentModes: ActiveQuizMode[] = Array(MAX_CONSECUTIVE_SAME_MODE).fill('choice')
    // Even with typeRatio 0.0 it should switch to type
    expect(selectModeForWord(0.0, recentModes, 0.5, true)).toBe('type')
  })

  it('should not force switch when last N modes are not all the same', () => {
    // Alternating should never trigger the cap
    const recentModes: ActiveQuizMode[] = ['type', 'choice', 'type']
    // With ratio 1.0, should return type (no cap triggered)
    expect(selectModeForWord(1.0, recentModes, 0.5, true)).toBe('type')
  })

  it('should reduce type probability for low-confidence words', () => {
    // With low confidence (< 0.3), the effective type ratio halves.
    // typeRatio = 1.0 → effectiveRatio = 0.5 (so sometimes choice).
    // Run many times: with a seeded approach we just check both outcomes possible.
    // We verify by checking that with typeRatio=1 and confidence=0, we get some choice results.
    const results = new Set<ActiveQuizMode>()
    for (let i = 0; i < 100; i++) {
      results.add(selectModeForWord(1.0, [], 0, true))
    }
    // With effective ratio 0.5 we expect both modes to appear over 100 runs.
    expect(results.has('type')).toBe(true)
    expect(results.has('choice')).toBe(true)
  })

  it('should not reduce type probability for high-confidence words', () => {
    // With high confidence, typeRatio=1.0 should always give type.
    for (let i = 0; i < 20; i++) {
      expect(selectModeForWord(1.0, [], 0.9, true)).toBe('type')
    }
  })
})

// ─── useMixedQuizSession integration tests ────────────────────────────────────

describe('useMixedQuizSession', () => {
  let mockStorage: StorageService

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage = makeMockStorage()
  })

  it('should start in loading phase and move to question phase', async () => {
    const word = makeWord('w1', 'māja', 'house')
    vi.mocked(mockStorage.getWords).mockResolvedValue([word, makeWord('w2', 'a', 'b'), makeWord('w3', 'c', 'd'), makeWord('w4', 'e', 'f')])
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    mockGenerateDistractors.mockReturnValue(mockDistr)
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useMixedQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    expect(result.current.state.phase).toBe('loading')

    await waitFor(() => {
      expect(result.current.state.phase).toBe('question')
    })

    expect(result.current.state.currentWord).toEqual(word)
  })

  it('should finish immediately if no words available', async () => {
    vi.mocked(mockStorage.getWords).mockResolvedValue([])
    mockGetNextWords.mockResolvedValue([])

    const { result } = renderHook(
      () => useMixedQuizSession(mockPair, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => {
      expect(result.current.state.phase).toBe('finished')
    })
  })

  it('should accept a typed answer in type mode', async () => {
    const word = makeWord('w1', 'māja', 'house')
    vi.mocked(mockStorage.getWords).mockResolvedValue([word])
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    // Force type mode by setting typeRatio=1.0
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useMixedQuizSession(mockPair, mockSettings, 1.0),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.currentMode).toBe('type')

    await act(async () => {
      await result.current.submitAnswer('house')
    })

    expect(result.current.state.phase).toBe('feedback')
    expect(result.current.state.lastResult?.result).toBe('correct')
    expect(result.current.state.correctCount).toBe(1)
    expect(result.current.state.wordsCompleted).toBe(1)

    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage, 'w1', true, 'source-to-target', 'type',
    )
  })

  it('should accept a choice selection in choice mode', async () => {
    const word = makeWord('w1', 'māja', 'house')
    vi.mocked(mockStorage.getWords).mockResolvedValue([
      word,
      makeWord('w2', 'kaķis', 'cat'),
      makeWord('w3', 'suns', 'dog'),
      makeWord('w4', 'putns', 'bird'),
    ])
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    mockGenerateDistractors.mockReturnValue(mockDistr)
    mockRecordAttempt.mockResolvedValue(mockProgress)

    // Force choice mode by setting typeRatio=0.0
    const { result } = renderHook(
      () => useMixedQuizSession(mockPair, mockSettings, 0.0),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.currentMode).toBe('choice')
    expect(result.current.state.options).toEqual(mockDistr.options)

    await act(async () => {
      // correctIndex is 0, selecting 0 = correct
      await result.current.selectOption(0)
    })

    expect(result.current.state.phase).toBe('feedback')
    expect(result.current.state.lastChoiceCorrect).toBe(true)
    expect(result.current.state.correctCount).toBe(1)

    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage, 'w1', true, 'source-to-target', 'choice',
    )
  })

  it('should record incorrect choice selection', async () => {
    const word = makeWord('w1', 'māja', 'house')
    vi.mocked(mockStorage.getWords).mockResolvedValue([
      word,
      makeWord('w2', 'kaķis', 'cat'),
      makeWord('w3', 'suns', 'dog'),
      makeWord('w4', 'putns', 'bird'),
    ])
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    mockGenerateDistractors.mockReturnValue(mockDistr)
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useMixedQuizSession(mockPair, mockSettings, 0.0),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      // correctIndex=0, selecting index 1 = wrong
      await result.current.selectOption(1)
    })

    expect(result.current.state.lastChoiceCorrect).toBe(false)
    expect(result.current.state.correctCount).toBe(0)

    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage, 'w1', false, 'source-to-target', 'choice',
    )
  })

  it('should advance to next word after feedback', async () => {
    const word1 = makeWord('w1', 'māja', 'house')
    const word2 = makeWord('w2', 'kaķis', 'cat')
    vi.mocked(mockStorage.getWords).mockResolvedValue([word1, word2])
    mockGetNextWords.mockResolvedValue([
      { word: word1, direction: 'source-to-target', progress: null },
      { word: word2, direction: 'source-to-target', progress: null },
    ])
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useMixedQuizSession(mockPair, mockSettings, 1.0),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.currentWord?.id).toBe('w1')

    await act(async () => { await result.current.submitAnswer('house') })
    expect(result.current.state.phase).toBe('feedback')

    act(() => { result.current.advance() })

    expect(result.current.state.phase).toBe('question')
    expect(result.current.state.currentWord?.id).toBe('w2')
  })

  it('should finish when the daily goal is reached', async () => {
    const words = [
      { word: makeWord('w1', 'māja', 'house'), direction: 'source-to-target' as const, progress: null },
      { word: makeWord('w2', 'kaķis', 'cat'), direction: 'source-to-target' as const, progress: null },
      { word: makeWord('w3', 'suns', 'dog'), direction: 'source-to-target' as const, progress: null },
    ]
    vi.mocked(mockStorage.getWords).mockResolvedValue(words.map((w) => w.word))
    mockGetNextWords.mockResolvedValue(words)
    mockRecordAttempt.mockResolvedValue(mockProgress)

    // dailyGoal = 3 in mockSettings
    const { result } = renderHook(
      () => useMixedQuizSession(mockPair, mockSettings, 1.0),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => { await result.current.submitAnswer('house') })
    act(() => { result.current.advance() })
    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => { await result.current.submitAnswer('cat') })
    act(() => { result.current.advance() })
    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => { await result.current.submitAnswer('dog') })
    act(() => { result.current.advance() })

    expect(result.current.state.phase).toBe('finished')
    expect(result.current.state.wordsCompleted).toBe(3)
  })

  it('should end session when endSession is called', async () => {
    const word = makeWord('w1', 'māja', 'house')
    vi.mocked(mockStorage.getWords).mockResolvedValue([word])
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useMixedQuizSession(mockPair, mockSettings, 1.0),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    act(() => { result.current.endSession() })
    expect(result.current.state.phase).toBe('finished')
  })

  it('should finish immediately if pair is null', async () => {
    const { result } = renderHook(
      () => useMixedQuizSession(null, mockSettings),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => {
      expect(result.current.state.phase).toBe('finished')
    })
  })

  it('should assign mode from the session to each item', async () => {
    const word = makeWord('w1', 'māja', 'house')
    vi.mocked(mockStorage.getWords).mockResolvedValue([word, makeWord('w2', 'a', 'b'), makeWord('w3', 'c', 'd'), makeWord('w4', 'e', 'f')])
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    mockGenerateDistractors.mockReturnValue(mockDistr)
    mockRecordAttempt.mockResolvedValue(mockProgress)

    // typeRatio=0.0 → all choice
    const { result } = renderHook(
      () => useMixedQuizSession(mockPair, mockSettings, 0.0),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.currentMode).toBe('choice')
  })

  it('should not allow submitting a type answer in choice mode', async () => {
    const word = makeWord('w1', 'māja', 'house')
    vi.mocked(mockStorage.getWords).mockResolvedValue([
      word,
      makeWord('w2', 'a', 'b'),
      makeWord('w3', 'c', 'd'),
      makeWord('w4', 'e', 'f'),
    ])
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    mockGenerateDistractors.mockReturnValue(mockDistr)
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useMixedQuizSession(mockPair, mockSettings, 0.0),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.currentMode).toBe('choice')

    // Calling submitAnswer in choice mode should be a no-op
    await act(async () => { await result.current.submitAnswer('house') })
    expect(result.current.state.phase).toBe('question') // should not advance
  })

  it('should not allow selecting option in type mode', async () => {
    const word = makeWord('w1', 'māja', 'house')
    vi.mocked(mockStorage.getWords).mockResolvedValue([word])
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: null },
    ])
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(
      () => useMixedQuizSession(mockPair, mockSettings, 1.0),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.currentMode).toBe('type')

    // Calling selectOption in type mode should be a no-op
    await act(async () => { await result.current.selectOption(0) })
    expect(result.current.state.phase).toBe('question') // should not advance
  })
})

// ─── Consecutive mode constraint tests ────────────────────────────────────────

describe('selectModeForWord - consecutive constraint', () => {
  it('should never produce more than MAX_CONSECUTIVE_SAME_MODE type in a row', () => {
    const modes: ActiveQuizMode[] = []
    for (let i = 0; i < 30; i++) {
      const mode = selectModeForWord(0.5, modes, 0.5, true)
      modes.push(mode)
    }

    let consecutive = 1
    for (let i = 1; i < modes.length; i++) {
      if (modes[i] === modes[i - 1]) {
        consecutive++
        expect(consecutive).toBeLessThanOrEqual(MAX_CONSECUTIVE_SAME_MODE)
      } else {
        consecutive = 1
      }
    }
  })

  it('should never produce more than MAX_CONSECUTIVE_SAME_MODE choice in a row', () => {
    // Same test from choice perspective
    const modes: ActiveQuizMode[] = []
    for (let i = 0; i < 30; i++) {
      const mode = selectModeForWord(0.5, modes, 0.5, true)
      modes.push(mode)
    }

    let consecutive = 1
    for (let i = 1; i < modes.length; i++) {
      if (modes[i] === modes[i - 1]) {
        consecutive++
        expect(consecutive).toBeLessThanOrEqual(MAX_CONSECUTIVE_SAME_MODE)
      } else {
        consecutive = 1
      }
    }
  })
})
