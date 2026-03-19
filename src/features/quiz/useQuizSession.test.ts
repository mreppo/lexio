/**
 * Tests for the unified useQuizSession hook and selectModeForWord utility.
 *
 * Three describe blocks cover the three modes:
 * - Type mode: typed answer submission, correct/incorrect/almost, direction
 * - Choice mode: option selection, not-enough-words guard, distractor exposure
 * - Mixed mode: per-question mode assignment, consecutive cap, confidence heuristic
 *
 * Shared utilities (selectModeForWord, MAX_CONSECUTIVE_SAME_MODE) are tested
 * in their own describe block.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { StorageContext } from '@/hooks/useStorage'
import type { StorageService } from '@/services/storage/StorageService'
import type { Word, LanguagePair, UserSettings, WordProgress } from '@/types'
import { useQuizSession, selectModeForWord, MAX_CONSECUTIVE_SAME_MODE } from './useQuizSession'
import type { ActiveQuizMode } from './useQuizSession'

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

const mockDistractorResult = {
  options: ['cat', 'house', 'dog', 'table'],
  correctIndex: 1,
}

const fourWords = [
  makeWord('w1', 'māja', 'house'),
  makeWord('w2', 'kaķis', 'cat'),
  makeWord('w3', 'suns', 'dog'),
  makeWord('w4', 'galds', 'table'),
]

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
    getSettings: vi.fn(),
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
    expect(selectModeForWord(1.0, recentModes, 0.5, true)).toBe('choice')
  })

  it('should force switch after MAX_CONSECUTIVE_SAME_MODE choice questions', () => {
    const recentModes: ActiveQuizMode[] = Array(MAX_CONSECUTIVE_SAME_MODE).fill('choice')
    expect(selectModeForWord(0.0, recentModes, 0.5, true)).toBe('type')
  })

  it('should not force switch when last N modes are not all the same', () => {
    const recentModes: ActiveQuizMode[] = ['type', 'choice', 'type']
    expect(selectModeForWord(1.0, recentModes, 0.5, true)).toBe('type')
  })

  it('should reduce type probability for low-confidence words', () => {
    // With low confidence (< 0.3), effective type ratio halves.
    // typeRatio=1.0 -> effectiveRatio=0.5 -> both modes possible.
    const results = new Set<ActiveQuizMode>()
    for (let i = 0; i < 100; i++) {
      results.add(selectModeForWord(1.0, [], 0, true))
    }
    expect(results.has('type')).toBe(true)
    expect(results.has('choice')).toBe(true)
  })

  it('should not reduce type probability for high-confidence words', () => {
    for (let i = 0; i < 20; i++) {
      expect(selectModeForWord(1.0, [], 0.9, true)).toBe('type')
    }
  })

  it('should never produce more than MAX_CONSECUTIVE_SAME_MODE questions of the same mode', () => {
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

// ─── Type mode ────────────────────────────────────────────────────────────────

describe('useQuizSession - type mode', () => {
  const typeSettings: UserSettings = {
    activePairId: 'pair-1',
    quizMode: 'type',
    dailyGoal: 3,
    theme: 'dark',
    typoTolerance: 1,
  }

  let mockStorage: StorageService

  beforeEach(() => {
    mockStorage = makeMockStorage()
    vi.clearAllMocks()
    mockRecordAttempt.mockResolvedValue(mockProgress)
  })

  it('should start in loading phase and transition to question phase when words are available', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, typeSettings, 'type'), {
      wrapper: makeWrapper(mockStorage),
    })

    expect(result.current.state.phase).toBe('loading')

    await waitFor(() => {
      expect(result.current.state.phase).toBe('question')
    })

    expect(result.current.state.currentWord).toEqual(word)
    expect(result.current.state.currentMode).toBe('type')
  })

  it('should finish immediately if no words are available', async () => {
    mockGetNextWords.mockResolvedValue([])

    const { result } = renderHook(() => useQuizSession(mockPair, typeSettings, 'type'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe('finished')
    })
  })

  it('should finish immediately if pair is null', async () => {
    const { result } = renderHook(() => useQuizSession(null, typeSettings, 'type'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe('finished')
    })
  })

  it('should show the word to translate based on direction', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, typeSettings, 'type'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    expect(result.current.state.direction).toBe('source-to-target')
    expect(result.current.state.currentWord?.source).toBe('māja')
  })

  it('should transition to feedback after submitting an answer', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, typeSettings, 'type'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      await result.current.submitAnswer('house')
    })

    expect(result.current.state.phase).toBe('feedback')
  })

  it('should record a correct result for an exact match', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, typeSettings, 'type'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    await act(async () => {
      await result.current.submitAnswer('house')
    })

    expect(result.current.state.lastResult?.result).toBe('correct')
    expect(result.current.state.correctCount).toBe(1)
    expect(result.current.state.wordsCompleted).toBe(1)
    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage,
      'w1',
      true,
      'source-to-target',
      'type',
    )
  })

  it('should record an incorrect result for a wrong answer', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, typeSettings, 'type'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    await act(async () => {
      await result.current.submitAnswer('wrong')
    })

    expect(result.current.state.lastResult?.result).toBe('incorrect')
    expect(result.current.state.correctCount).toBe(0)
    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage,
      'w1',
      false,
      'source-to-target',
      'type',
    )
  })

  it('should record an almost result as a correct attempt', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(
      () => useQuizSession(mockPair, { ...typeSettings, typoTolerance: 1 }, 'type'),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    // 'hous' is 1 char off from 'house' - within tolerance 1
    await act(async () => {
      await result.current.submitAnswer('hous')
    })

    expect(result.current.state.lastResult?.result).toBe('almost')
    expect(result.current.state.correctCount).toBe(1)
    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage,
      'w1',
      true,
      'source-to-target',
      'type',
    )
  })

  it('should advance to the next word after feedback', async () => {
    const word1 = makeWord('w1', 'māja', 'house')
    const word2 = makeWord('w2', 'kaķis', 'cat')
    mockGetNextWords.mockResolvedValue([
      { word: word1, direction: 'source-to-target', progress: null },
      { word: word2, direction: 'source-to-target', progress: null },
    ])

    const { result } = renderHook(() => useQuizSession(mockPair, typeSettings, 'type'), {
      wrapper: makeWrapper(mockStorage),
    })

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

  it('should finish the session when the daily goal is reached', async () => {
    const words = [
      {
        word: makeWord('w1', 'māja', 'house'),
        direction: 'source-to-target' as const,
        progress: null,
      },
      {
        word: makeWord('w2', 'kaķis', 'cat'),
        direction: 'source-to-target' as const,
        progress: null,
      },
      {
        word: makeWord('w3', 'suns', 'dog'),
        direction: 'source-to-target' as const,
        progress: null,
      },
    ]
    mockGetNextWords.mockResolvedValue(words)

    const { result } = renderHook(() => useQuizSession(mockPair, typeSettings, 'type'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      await result.current.submitAnswer('house')
    })
    act(() => {
      result.current.advance()
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    await act(async () => {
      await result.current.submitAnswer('cat')
    })
    act(() => {
      result.current.advance()
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    await act(async () => {
      await result.current.submitAnswer('dog')
    })
    act(() => {
      result.current.advance()
    })

    expect(result.current.state.phase).toBe('finished')
    expect(result.current.state.wordsCompleted).toBe(3)
  })

  it('should finish when session is ended manually', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, typeSettings, 'type'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    act(() => {
      result.current.endSession()
    })

    expect(result.current.state.phase).toBe('finished')
  })

  it('should quiz in target-to-source direction', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'target-to-source', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, typeSettings, 'type'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.direction).toBe('target-to-source')
    expect(result.current.state.currentWord?.target).toBe('house')

    await act(async () => {
      await result.current.submitAnswer('māja')
    })

    expect(result.current.state.lastResult?.result).toBe('correct')
    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage,
      'w1',
      true,
      'target-to-source',
      'type',
    )
  })

  it('should provide session goal from settings dailyGoal', async () => {
    mockGetNextWords.mockResolvedValue([])

    const { result } = renderHook(
      () => useQuizSession(mockPair, { ...typeSettings, dailyGoal: 15 }, 'type'),
      { wrapper: makeWrapper(mockStorage) },
    )

    await waitFor(() => expect(result.current.state.phase).toBe('finished'))
    expect(result.current.state.sessionGoal).toBe(15)
  })

  it('should not advance when selectOption is called in type mode', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, typeSettings, 'type'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.currentMode).toBe('type')

    // selectOption should be a no-op in type mode
    await act(async () => {
      await result.current.selectOption(0)
    })
    expect(result.current.state.phase).toBe('question')
  })
})

// ─── Choice mode ──────────────────────────────────────────────────────────────

describe('useQuizSession - choice mode', () => {
  const choiceSettings: UserSettings = {
    activePairId: 'pair-1',
    quizMode: 'choice',
    dailyGoal: 3,
    theme: 'dark',
    typoTolerance: 1,
  }

  let mockStorage: StorageService

  beforeEach(() => {
    mockStorage = makeMockStorage(fourWords)
    vi.clearAllMocks()
    mockRecordAttempt.mockResolvedValue(mockProgress)
    mockGenerateDistractors.mockReturnValue(mockDistractorResult)
  })

  it('should start in loading phase and transition to question phase', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, choiceSettings, 'choice'), {
      wrapper: makeWrapper(mockStorage),
    })

    expect(result.current.state.phase).toBe('loading')

    await waitFor(() => {
      expect(result.current.state.phase).toBe('question')
    })

    expect(result.current.state.currentWord).toEqual(word)
    expect(result.current.state.currentMode).toBe('choice')
  })

  it('should show not-enough-words phase when fewer than MIN_WORDS_FOR_CHOICE words', async () => {
    const tinyStorage = makeMockStorage([
      makeWord('w1', 'māja', 'house'),
      makeWord('w2', 'kaķis', 'cat'),
      makeWord('w3', 'suns', 'dog'),
      // only 3 words - below MIN_WORDS_FOR_CHOICE (4)
    ])
    mockGetNextWords.mockResolvedValue([
      { word: makeWord('w1', 'māja', 'house'), direction: 'source-to-target', progress: null },
    ])

    const { result } = renderHook(() => useQuizSession(mockPair, choiceSettings, 'choice'), {
      wrapper: makeWrapper(tinyStorage),
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe('not-enough-words')
    })
  })

  it('should finish immediately if no words are returned by getNextWords', async () => {
    mockGetNextWords.mockResolvedValue([])

    const { result } = renderHook(() => useQuizSession(mockPair, choiceSettings, 'choice'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe('finished')
    })
  })

  it('should finish immediately if pair is null', async () => {
    const { result } = renderHook(() => useQuizSession(null, choiceSettings, 'choice'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe('finished')
    })
  })

  it('should expose options and correctIndex for the current question', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, choiceSettings, 'choice'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    expect(result.current.state.options).toEqual(mockDistractorResult.options)
    expect(result.current.state.correctIndex).toBe(mockDistractorResult.correctIndex)
    expect(result.current.state.selectedIndex).toBe(-1)
  })

  it('should transition to feedback after selecting an option', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, choiceSettings, 'choice'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      await result.current.selectOption(mockDistractorResult.correctIndex)
    })

    expect(result.current.state.phase).toBe('feedback')
    expect(result.current.state.selectedIndex).toBe(mockDistractorResult.correctIndex)
  })

  it('should record correct=true when user selects the correct option', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, choiceSettings, 'choice'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    await act(async () => {
      await result.current.selectOption(mockDistractorResult.correctIndex)
    })

    expect(result.current.state.lastChoiceCorrect).toBe(true)
    expect(result.current.state.correctCount).toBe(1)
    expect(result.current.state.wordsCompleted).toBe(1)
    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage,
      'w1',
      true,
      'source-to-target',
      'choice',
    )
  })

  it('should record correct=false when user selects a wrong option', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, choiceSettings, 'choice'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    // Select index 0 = 'cat', but correct is index 1 = 'house'
    await act(async () => {
      await result.current.selectOption(0)
    })

    expect(result.current.state.lastChoiceCorrect).toBe(false)
    expect(result.current.state.correctCount).toBe(0)
    expect(result.current.state.wordsCompleted).toBe(1)
    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage,
      'w1',
      false,
      'source-to-target',
      'choice',
    )
  })

  it('should not allow selecting again after an option is already selected', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, choiceSettings, 'choice'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      await result.current.selectOption(0)
    })
    expect(result.current.state.selectedIndex).toBe(0)

    // Attempt second selection - should be ignored
    await act(async () => {
      await result.current.selectOption(mockDistractorResult.correctIndex)
    })
    expect(result.current.state.selectedIndex).toBe(0)
    expect(mockRecordAttempt).toHaveBeenCalledTimes(1)
  })

  it('should advance to the next word after feedback', async () => {
    const word1 = makeWord('w1', 'māja', 'house')
    const word2 = makeWord('w2', 'kaķis', 'cat')
    mockGetNextWords.mockResolvedValue([
      { word: word1, direction: 'source-to-target', progress: null },
      { word: word2, direction: 'source-to-target', progress: null },
    ])

    const { result } = renderHook(() => useQuizSession(mockPair, choiceSettings, 'choice'), {
      wrapper: makeWrapper(mockStorage),
    })

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

  it('should finish the session when the daily goal is reached', async () => {
    const wordsForQuiz = [
      {
        word: makeWord('w1', 'māja', 'house'),
        direction: 'source-to-target' as const,
        progress: null,
      },
      {
        word: makeWord('w2', 'kaķis', 'cat'),
        direction: 'source-to-target' as const,
        progress: null,
      },
      {
        word: makeWord('w3', 'suns', 'dog'),
        direction: 'source-to-target' as const,
        progress: null,
      },
    ]
    mockGetNextWords.mockResolvedValue(wordsForQuiz)

    const { result } = renderHook(() => useQuizSession(mockPair, choiceSettings, 'choice'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      await result.current.selectOption(mockDistractorResult.correctIndex)
    })
    act(() => {
      result.current.advance()
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    await act(async () => {
      await result.current.selectOption(mockDistractorResult.correctIndex)
    })
    act(() => {
      result.current.advance()
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    await act(async () => {
      await result.current.selectOption(mockDistractorResult.correctIndex)
    })
    act(() => {
      result.current.advance()
    })

    expect(result.current.state.phase).toBe('finished')
    expect(result.current.state.wordsCompleted).toBe(3)
  })

  it('should end session when endSession is called', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, choiceSettings, 'choice'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    act(() => {
      result.current.endSession()
    })
    expect(result.current.state.phase).toBe('finished')
  })

  it('should handle target-to-source direction', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'target-to-source', progress: null }])
    mockGenerateDistractors.mockReturnValue({
      options: ['kaķis', 'māja', 'suns', 'galds'],
      correctIndex: 1,
    })

    const { result } = renderHook(() => useQuizSession(mockPair, choiceSettings, 'choice'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.direction).toBe('target-to-source')

    await act(async () => {
      await result.current.selectOption(1)
    })

    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage,
      'w1',
      true,
      'target-to-source',
      'choice',
    )
  })

  it('should not advance when submitAnswer is called in choice mode', async () => {
    const word = makeWord('w1', 'māja', 'house')
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, choiceSettings, 'choice'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.currentMode).toBe('choice')

    // submitAnswer should be a no-op in choice mode
    await act(async () => {
      await result.current.submitAnswer('house')
    })
    expect(result.current.state.phase).toBe('question')
  })
})

// ─── Mixed mode ───────────────────────────────────────────────────────────────

describe('useQuizSession - mixed mode', () => {
  const mixedSettings: UserSettings = {
    activePairId: 'pair-1',
    quizMode: 'mixed',
    dailyGoal: 3,
    theme: 'dark',
    typoTolerance: 1,
  }

  let mockStorage: StorageService

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage = makeMockStorage()
    mockRecordAttempt.mockResolvedValue(mockProgress)
  })

  it('should start in loading phase and move to question phase', async () => {
    const word = makeWord('w1', 'māja', 'house')
    vi.mocked(mockStorage.getWords).mockResolvedValue([
      word,
      makeWord('w2', 'a', 'b'),
      makeWord('w3', 'c', 'd'),
      makeWord('w4', 'e', 'f'),
    ])
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])
    mockGenerateDistractors.mockReturnValue(mockDistr)

    const { result } = renderHook(() => useQuizSession(mockPair, mixedSettings, 'mixed'), {
      wrapper: makeWrapper(mockStorage),
    })

    expect(result.current.state.phase).toBe('loading')

    await waitFor(() => {
      expect(result.current.state.phase).toBe('question')
    })

    expect(result.current.state.currentWord).toEqual(word)
  })

  it('should finish immediately if no words available', async () => {
    vi.mocked(mockStorage.getWords).mockResolvedValue([])
    mockGetNextWords.mockResolvedValue([])

    const { result } = renderHook(() => useQuizSession(mockPair, mixedSettings, 'mixed'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe('finished')
    })
  })

  it('should finish immediately if pair is null', async () => {
    const { result } = renderHook(() => useQuizSession(null, mixedSettings, 'mixed'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe('finished')
    })
  })

  it('should accept a typed answer in type mode', async () => {
    const word = makeWord('w1', 'māja', 'house')
    vi.mocked(mockStorage.getWords).mockResolvedValue([word])
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: { ...mockProgress, confidence: 0.9 } },
    ])
    // Force type mode by ensuring low word count (no choice available) or high confidence
    // Since only 1 word, choice is unavailable -> falls back to type
    mockRecordAttempt.mockResolvedValue(mockProgress)

    const { result } = renderHook(() => useQuizSession(mockPair, mixedSettings, 'mixed'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    // With only 1 word, choice is unavailable so mode must be type
    expect(result.current.state.currentMode).toBe('type')

    await act(async () => {
      await result.current.submitAnswer('house')
    })

    expect(result.current.state.phase).toBe('feedback')
    expect(result.current.state.lastResult?.result).toBe('correct')
    expect(result.current.state.correctCount).toBe(1)
    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage,
      'w1',
      true,
      'source-to-target',
      'type',
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
    // Provide a word with low confidence to nudge toward choice mode
    mockGetNextWords.mockResolvedValue([
      { word, direction: 'source-to-target', progress: { ...mockProgress, confidence: 0 } },
    ])
    mockGenerateDistractors.mockReturnValue(mockDistr)
    mockRecordAttempt.mockResolvedValue(mockProgress)

    // Use Math.random mock to force choice mode
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99) // > any typeRatio → choice

    const { result } = renderHook(() => useQuizSession(mockPair, mixedSettings, 'mixed'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.currentMode).toBe('choice')
    expect(result.current.state.options).toEqual(mockDistr.options)

    await act(async () => {
      await result.current.selectOption(0)
    }) // correctIndex is 0

    expect(result.current.state.phase).toBe('feedback')
    expect(result.current.state.lastChoiceCorrect).toBe(true)
    expect(result.current.state.correctCount).toBe(1)
    expect(mockRecordAttempt).toHaveBeenCalledWith(
      mockStorage,
      'w1',
      true,
      'source-to-target',
      'choice',
    )

    randomSpy.mockRestore()
  })

  it('should not allow submitting a type answer in choice mode', async () => {
    const word = makeWord('w1', 'māja', 'house')
    vi.mocked(mockStorage.getWords).mockResolvedValue([
      word,
      makeWord('w2', 'a', 'b'),
      makeWord('w3', 'c', 'd'),
      makeWord('w4', 'e', 'f'),
    ])
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])
    mockGenerateDistractors.mockReturnValue(mockDistr)

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99) // force choice

    const { result } = renderHook(() => useQuizSession(mockPair, mixedSettings, 'mixed'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.currentMode).toBe('choice')

    await act(async () => {
      await result.current.submitAnswer('house')
    })
    expect(result.current.state.phase).toBe('question') // should not advance

    randomSpy.mockRestore()
  })

  it('should not allow selecting option in type mode', async () => {
    const word = makeWord('w1', 'māja', 'house')
    vi.mocked(mockStorage.getWords).mockResolvedValue([word])
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])
    // With 1 word, choice unavailable → type mode forced

    const { result } = renderHook(() => useQuizSession(mockPair, mixedSettings, 'mixed'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))
    expect(result.current.state.currentMode).toBe('type')

    await act(async () => {
      await result.current.selectOption(0)
    })
    expect(result.current.state.phase).toBe('question') // should not advance
  })

  it('should advance to next word after feedback', async () => {
    const word1 = makeWord('w1', 'māja', 'house')
    const word2 = makeWord('w2', 'kaķis', 'cat')
    vi.mocked(mockStorage.getWords).mockResolvedValue([word1, word2])
    mockGetNextWords.mockResolvedValue([
      { word: word1, direction: 'source-to-target', progress: null },
      { word: word2, direction: 'source-to-target', progress: null },
    ])
    // Both words in pool - choice could be available but Math.random will decide
    // Force type mode for simplicity
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0) // 0 < typeRatio → type

    const { result } = renderHook(() => useQuizSession(mockPair, mixedSettings, 'mixed'), {
      wrapper: makeWrapper(mockStorage),
    })

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

    randomSpy.mockRestore()
  })

  it('should finish when the daily goal is reached', async () => {
    const words = [
      {
        word: makeWord('w1', 'māja', 'house'),
        direction: 'source-to-target' as const,
        progress: null,
      },
      {
        word: makeWord('w2', 'kaķis', 'cat'),
        direction: 'source-to-target' as const,
        progress: null,
      },
      {
        word: makeWord('w3', 'suns', 'dog'),
        direction: 'source-to-target' as const,
        progress: null,
      },
    ]
    vi.mocked(mockStorage.getWords).mockResolvedValue(words.map((w) => w.word))
    mockGetNextWords.mockResolvedValue(words)
    // Force type mode so we can use submitAnswer
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)

    const { result } = renderHook(() => useQuizSession(mockPair, mixedSettings, 'mixed'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      await result.current.submitAnswer('house')
    })
    act(() => {
      result.current.advance()
    })
    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      await result.current.submitAnswer('cat')
    })
    act(() => {
      result.current.advance()
    })
    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    await act(async () => {
      await result.current.submitAnswer('dog')
    })
    act(() => {
      result.current.advance()
    })

    expect(result.current.state.phase).toBe('finished')
    expect(result.current.state.wordsCompleted).toBe(3)

    randomSpy.mockRestore()
  })

  it('should end session when endSession is called', async () => {
    const word = makeWord('w1', 'māja', 'house')
    vi.mocked(mockStorage.getWords).mockResolvedValue([word])
    mockGetNextWords.mockResolvedValue([{ word, direction: 'source-to-target', progress: null }])

    const { result } = renderHook(() => useQuizSession(mockPair, mixedSettings, 'mixed'), {
      wrapper: makeWrapper(mockStorage),
    })

    await waitFor(() => expect(result.current.state.phase).toBe('question'))

    act(() => {
      result.current.endSession()
    })
    expect(result.current.state.phase).toBe('finished')
  })
})
