import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWords } from './useWords'
import type { StorageService } from '@/services/storage'
import type { Word, WordProgress, UserSettings } from '@/types'
import { StorageContext } from '@/hooks/useStorage'
import { createElement } from 'react'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: UserSettings = {
  activePairId: 'pair-1',
  quizMode: 'mixed',
  dailyGoal: 20,
  theme: 'dark',
  typoTolerance: 1,
}

function makeWord(overrides: Partial<Word> = {}): Word {
  return {
    id: 'word-1',
    pairId: 'pair-1',
    source: 'house',
    target: 'māja',
    notes: null,
    tags: [],
    createdAt: 1_000_000,
    isFromPack: false,
    ...overrides,
  }
}

function makeProgress(overrides: Partial<WordProgress> = {}): WordProgress {
  return {
    wordId: 'word-1',
    correctCount: 3,
    incorrectCount: 1,
    streak: 2,
    lastReviewed: 1_000_000,
    nextReview: 2_000_000,
    confidence: 0.6,
    history: [],
    ...overrides,
  }
}

function makeStorage(words: Word[] = [], progress: WordProgress[] = []): StorageService {
  const storedWords = [...words]
  const storedProgress = [...progress]

  return {
    getLanguagePairs: vi.fn().mockResolvedValue([]),
    getLanguagePair: vi.fn().mockResolvedValue(null),
    saveLanguagePair: vi.fn().mockResolvedValue(undefined),
    deleteLanguagePair: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue(DEFAULT_SETTINGS),
    saveSettings: vi.fn().mockResolvedValue(undefined),

    getWords: vi.fn().mockImplementation(async () => [...storedWords]),
    getWord: vi
      .fn()
      .mockImplementation(async (id: string) => storedWords.find((w) => w.id === id) ?? null),
    saveWord: vi.fn().mockImplementation(async (word: Word) => {
      const idx = storedWords.findIndex((w) => w.id === word.id)
      if (idx >= 0) storedWords[idx] = word
      else storedWords.push(word)
    }),
    saveWords: vi.fn().mockResolvedValue(undefined),
    deleteWord: vi.fn().mockImplementation(async (id: string) => {
      const idx = storedWords.findIndex((w) => w.id === id)
      if (idx >= 0) storedWords.splice(idx, 1)
    }),

    getWordProgress: vi.fn().mockResolvedValue(null),
    getAllProgress: vi.fn().mockImplementation(async () => [...storedProgress]),
    saveWordProgress: vi.fn().mockResolvedValue(undefined),

    getDailyStats: vi.fn().mockResolvedValue(null),
    getDailyStatsRange: vi.fn().mockResolvedValue([]),
    saveDailyStats: vi.fn().mockResolvedValue(undefined),
    getRecentDailyStats: vi.fn().mockResolvedValue([]),
    exportAll: vi.fn().mockResolvedValue('{}'),
    importAll: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
  } as StorageService
}

function makeWrapper(storage: StorageService) {
  return ({ children }: { children: ReactNode }) =>
    createElement(StorageContext.Provider, { value: storage }, children)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useWords', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial load', () => {
    it('should start in loading state when pairId is provided', () => {
      const storage = makeStorage()
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })
      expect(result.current.loading).toBe(true)
    })

    it('should immediately be not loading when pairId is null', async () => {
      const storage = makeStorage()
      const { result } = renderHook(() => useWords(null), {
        wrapper: makeWrapper(storage),
      })
      await act(async () => {})
      expect(result.current.loading).toBe(false)
      expect(result.current.words).toHaveLength(0)
    })

    it('should load words for the given pairId', async () => {
      const word = makeWord()
      const storage = makeStorage([word])

      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      expect(result.current.loading).toBe(false)
      expect(result.current.words).toHaveLength(1)
      expect(result.current.words[0].id).toBe('word-1')
    })

    it('should load progress into progressMap', async () => {
      const word = makeWord()
      const progress = makeProgress()
      const storage = makeStorage([word], [progress])

      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      expect(result.current.progressMap.get('word-1')).toEqual(progress)
    })

    it('should clear words when pairId becomes null', async () => {
      const word = makeWord()
      const storage = makeStorage([word])

      const { result, rerender } = renderHook(
        ({ pairId }: { pairId: string | null }) => useWords(pairId),
        {
          wrapper: makeWrapper(storage),
          initialProps: { pairId: 'pair-1' as string | null },
        },
      )

      await act(async () => {})
      expect(result.current.words).toHaveLength(1)

      rerender({ pairId: null })
      await act(async () => {})
      expect(result.current.words).toHaveLength(0)
    })
  })

  describe('addWord', () => {
    it('should add a new word and return it', async () => {
      const storage = makeStorage()
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      let added: Word | null = null
      await act(async () => {
        added = await result.current.addWord('pair-1', {
          source: 'cat',
          target: 'kaķis',
          notes: null,
          tags: [],
        })
      })

      expect(added).not.toBeNull()
      expect(added!.source).toBe('cat')
      expect(added!.target).toBe('kaķis')
      expect(result.current.words).toHaveLength(1)
    })

    it('should save the word to storage', async () => {
      const storage = makeStorage()
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.addWord('pair-1', {
          source: 'dog',
          target: 'suns',
          notes: null,
          tags: [],
        })
      })

      expect(storage.saveWord).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'dog', target: 'suns' }),
      )
    })

    it('should prevent exact duplicates (case-insensitive) and return null', async () => {
      const word = makeWord({ source: 'Cat', target: 'Kaķis' })
      const storage = makeStorage([word])
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      let added: Word | null = null
      await act(async () => {
        added = await result.current.addWord('pair-1', {
          source: 'cat',
          target: 'kaķis',
          notes: null,
          tags: [],
        })
      })

      expect(added).toBeNull()
      expect(result.current.words).toHaveLength(1)
    })

    it('should allow words with same source but different target', async () => {
      const word = makeWord({ source: 'cat', target: 'kaķis' })
      const storage = makeStorage([word])
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      let added: Word | null = null
      await act(async () => {
        added = await result.current.addWord('pair-1', {
          source: 'cat',
          target: 'kaķēns',
          notes: null,
          tags: [],
        })
      })

      expect(added).not.toBeNull()
      expect(result.current.words).toHaveLength(2)
    })

    it('should trim whitespace from source and target', async () => {
      const storage = makeStorage()
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.addWord('pair-1', {
          source: '  cat  ',
          target: '  kaķis  ',
          notes: null,
          tags: [],
        })
      })

      expect(result.current.words[0].source).toBe('cat')
      expect(result.current.words[0].target).toBe('kaķis')
    })

    it('should set isFromPack to false for user-added words', async () => {
      const storage = makeStorage()
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.addWord('pair-1', {
          source: 'cat',
          target: 'kaķis',
          notes: null,
          tags: [],
        })
      })

      expect(result.current.words[0].isFromPack).toBe(false)
    })
  })

  describe('updateWord', () => {
    it('should update an existing word in state', async () => {
      const word = makeWord({ source: 'house', target: 'māja' })
      const storage = makeStorage([word])
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.updateWord('word-1', {
          source: 'home',
          target: 'mājvieta',
          notes: 'updated',
          tags: ['B1'],
        })
      })

      const updated = result.current.words.find((w) => w.id === 'word-1')
      expect(updated?.source).toBe('home')
      expect(updated?.target).toBe('mājvieta')
      expect(updated?.notes).toBe('updated')
      expect(updated?.tags).toEqual(['B1'])
    })

    it('should persist the updated word to storage', async () => {
      const word = makeWord()
      const storage = makeStorage([word])
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.updateWord('word-1', {
          source: 'home',
          target: 'mājvieta',
          notes: null,
          tags: [],
        })
      })

      expect(storage.saveWord).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'word-1', source: 'home' }),
      )
    })

    it('should do nothing when wordId does not exist', async () => {
      const storage = makeStorage()
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.updateWord('non-existent', {
          source: 'foo',
          target: 'bar',
          notes: null,
          tags: [],
        })
      })

      expect(storage.saveWord).not.toHaveBeenCalled()
    })
  })

  describe('deleteWord', () => {
    it('should remove the word from state', async () => {
      const word = makeWord()
      const storage = makeStorage([word])
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})
      expect(result.current.words).toHaveLength(1)

      await act(async () => {
        await result.current.deleteWord('word-1')
      })

      expect(result.current.words).toHaveLength(0)
    })

    it('should call storage.deleteWord', async () => {
      const word = makeWord()
      const storage = makeStorage([word])
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.deleteWord('word-1')
      })

      expect(storage.deleteWord).toHaveBeenCalledWith('word-1')
    })

    it('should remove progress entry from progressMap', async () => {
      const word = makeWord()
      const progress = makeProgress()
      const storage = makeStorage([word], [progress])
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})
      expect(result.current.progressMap.has('word-1')).toBe(true)

      await act(async () => {
        await result.current.deleteWord('word-1')
      })

      expect(result.current.progressMap.has('word-1')).toBe(false)
    })
  })

  describe('deleteWords', () => {
    it('should remove multiple words from state', async () => {
      const words = [
        makeWord({ id: 'w1', source: 'cat' }),
        makeWord({ id: 'w2', source: 'dog' }),
        makeWord({ id: 'w3', source: 'bird' }),
      ]
      const storage = makeStorage(words)
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})
      expect(result.current.words).toHaveLength(3)

      await act(async () => {
        await result.current.deleteWords(['w1', 'w2'])
      })

      expect(result.current.words).toHaveLength(1)
      expect(result.current.words[0].id).toBe('w3')
    })

    it('should call storage.deleteWord for each id', async () => {
      const words = [makeWord({ id: 'w1' }), makeWord({ id: 'w2' })]
      const storage = makeStorage(words)
      const { result } = renderHook(() => useWords('pair-1'), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.deleteWords(['w1', 'w2'])
      })

      expect(storage.deleteWord).toHaveBeenCalledWith('w1')
      expect(storage.deleteWord).toHaveBeenCalledWith('w2')
    })
  })
})
