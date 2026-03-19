import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLanguagePairs } from './useLanguagePairs'
import type { StorageService } from '@/services/storage'
import type { LanguagePair, UserSettings, Word } from '@/types'
import { StorageContext } from '@/hooks/useStorage'
import { createElement } from 'react'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: UserSettings = {
  activePairId: null,
  quizMode: 'mixed',
  dailyGoal: 20,
  theme: 'dark',
  typoTolerance: 1,
}

function makePair(overrides: Partial<LanguagePair> = {}): LanguagePair {
  return {
    id: 'pair-1',
    sourceLang: 'English',
    sourceCode: 'en',
    targetLang: 'Latvian',
    targetCode: 'lv',
    createdAt: 1000000,
    ...overrides,
  }
}

function makeWord(overrides: Partial<Word> = {}): Word {
  return {
    id: 'word-1',
    pairId: 'pair-1',
    source: 'house',
    target: 'māja',
    notes: null,
    tags: [],
    createdAt: 1000000,
    isFromPack: false,
    ...overrides,
  }
}

function makeStorage(
  pairs: LanguagePair[] = [],
  settings: UserSettings = DEFAULT_SETTINGS,
): StorageService {
  const storedPairs = [...pairs]
  const storedSettings = { ...settings }

  return {
    getLanguagePairs: vi.fn().mockImplementation(async () => [...storedPairs]),
    getLanguagePair: vi.fn().mockImplementation(async (id: string) =>
      storedPairs.find((p) => p.id === id) ?? null,
    ),
    saveLanguagePair: vi.fn().mockImplementation(async (pair: LanguagePair) => {
      const idx = storedPairs.findIndex((p) => p.id === pair.id)
      if (idx >= 0) storedPairs[idx] = pair
      else storedPairs.push(pair)
    }),
    deleteLanguagePair: vi.fn().mockImplementation(async (id: string) => {
      const idx = storedPairs.findIndex((p) => p.id === id)
      if (idx >= 0) storedPairs.splice(idx, 1)
    }),
    getSettings: vi.fn().mockImplementation(async () => ({ ...storedSettings })),
    saveSettings: vi.fn().mockImplementation(async (s: UserSettings) => {
      Object.assign(storedSettings, s)
    }),
    getWords: vi.fn().mockResolvedValue([]),
    getWord: vi.fn().mockResolvedValue(null),
    saveWord: vi.fn().mockResolvedValue(undefined),
    saveWords: vi.fn().mockResolvedValue(undefined),
    deleteWord: vi.fn().mockResolvedValue(undefined),
    getWordProgress: vi.fn().mockResolvedValue(null),
    getAllProgress: vi.fn().mockResolvedValue([]),
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

describe('useLanguagePairs', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial load', () => {
    it('should start in loading state', () => {
      const storage = makeStorage()
      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })
      expect(result.current.loading).toBe(true)
    })

    it('should load pairs from storage on mount', async () => {
      const pair = makePair()
      const storage = makeStorage([pair])

      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      expect(result.current.loading).toBe(false)
      expect(result.current.pairs).toHaveLength(1)
      expect(result.current.pairs[0].id).toBe('pair-1')
    })

    it('should set activePair from settings on mount', async () => {
      const pair = makePair()
      const settings: UserSettings = { ...DEFAULT_SETTINGS, activePairId: 'pair-1' }
      const storage = makeStorage([pair], settings)

      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      expect(result.current.activePair?.id).toBe('pair-1')
    })

    it('should have null activePair when settings has no active pair', async () => {
      const storage = makeStorage()

      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      expect(result.current.activePair).toBeNull()
    })
  })

  describe('createPair', () => {
    it('should add a new pair to the list', async () => {
      const storage = makeStorage()
      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.createPair({
          sourceLang: 'English',
          sourceCode: 'en',
          targetLang: 'Latvian',
          targetCode: 'lv',
        })
      })

      expect(result.current.pairs).toHaveLength(1)
      expect(result.current.pairs[0].sourceLang).toBe('English')
      expect(result.current.pairs[0].targetLang).toBe('Latvian')
    })

    it('should set the new pair as active by default', async () => {
      const storage = makeStorage()
      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      let newPair: LanguagePair | undefined
      await act(async () => {
        newPair = await result.current.createPair({
          sourceLang: 'German',
          sourceCode: 'de',
          targetLang: 'French',
          targetCode: 'fr',
        })
      })

      expect(result.current.activePair?.id).toBe(newPair?.id)
    })

    it('should not set pair as active when setActive is false', async () => {
      const storage = makeStorage()
      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.createPair(
          {
            sourceLang: 'German',
            sourceCode: 'de',
            targetLang: 'French',
            targetCode: 'fr',
          },
          false,
        )
      })

      expect(result.current.activePair).toBeNull()
    })

    it('should persist the pair to storage', async () => {
      const storage = makeStorage()
      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.createPair({
          sourceLang: 'Spanish',
          sourceCode: 'es',
          targetLang: 'English',
          targetCode: 'en',
        })
      })

      expect(storage.saveLanguagePair).toHaveBeenCalledWith(
        expect.objectContaining({ sourceLang: 'Spanish', targetLang: 'English' }),
      )
    })

    it('should trim whitespace from inputs', async () => {
      const storage = makeStorage()
      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.createPair({
          sourceLang: '  English  ',
          sourceCode: '  EN  ',
          targetLang: '  Latvian  ',
          targetCode: '  LV  ',
        })
      })

      const saved = result.current.pairs[0]
      expect(saved.sourceLang).toBe('English')
      expect(saved.sourceCode).toBe('en') // lowercased
      expect(saved.targetLang).toBe('Latvian')
      expect(saved.targetCode).toBe('lv') // lowercased
    })
  })

  describe('switchPair', () => {
    it('should update activePair to the selected pair', async () => {
      const pair1 = makePair({ id: 'pair-1', sourceLang: 'English', targetLang: 'Latvian' })
      const pair2 = makePair({ id: 'pair-2', sourceLang: 'German', targetLang: 'French', sourceCode: 'de', targetCode: 'fr' })
      const settings: UserSettings = { ...DEFAULT_SETTINGS, activePairId: 'pair-1' }
      const storage = makeStorage([pair1, pair2], settings)

      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})
      expect(result.current.activePair?.id).toBe('pair-1')

      await act(async () => {
        await result.current.switchPair('pair-2')
      })

      expect(result.current.activePair?.id).toBe('pair-2')
    })

    it('should persist the new activePairId to settings', async () => {
      const pair = makePair()
      const storage = makeStorage([pair])

      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.switchPair('pair-1')
      })

      expect(storage.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ activePairId: 'pair-1' }),
      )
    })
  })

  describe('deletePair', () => {
    it('should remove the pair from the list', async () => {
      const pair = makePair()
      const storage = makeStorage([pair])

      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.deletePair('pair-1')
      })

      expect(result.current.pairs).toHaveLength(0)
    })

    it('should call deleteLanguagePair on storage', async () => {
      const pair = makePair()
      const storage = makeStorage([pair])

      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.deletePair('pair-1')
      })

      expect(storage.deleteLanguagePair).toHaveBeenCalledWith('pair-1')
    })

    it('should clear activePair when the active pair is deleted', async () => {
      const pair = makePair()
      const settings: UserSettings = { ...DEFAULT_SETTINGS, activePairId: 'pair-1' }
      const storage = makeStorage([pair], settings)

      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})
      expect(result.current.activePair?.id).toBe('pair-1')

      await act(async () => {
        await result.current.deletePair('pair-1')
      })

      expect(result.current.activePair).toBeNull()
    })

    it('should not clear activePair when a different pair is deleted', async () => {
      const pair1 = makePair({ id: 'pair-1' })
      const pair2 = makePair({ id: 'pair-2', sourceCode: 'de', targetCode: 'fr', sourceLang: 'German', targetLang: 'French' })
      const settings: UserSettings = { ...DEFAULT_SETTINGS, activePairId: 'pair-1' }
      const storage = makeStorage([pair1, pair2], settings)

      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.deletePair('pair-2')
      })

      expect(result.current.activePair?.id).toBe('pair-1')
    })

    it('should cascade delete all words for the pair', async () => {
      const pair = makePair()
      const word1 = makeWord({ id: 'w1' })
      const word2 = makeWord({ id: 'w2' })
      const storage = makeStorage([pair])
      vi.mocked(storage.getWords).mockResolvedValue([word1, word2])

      const { result } = renderHook(() => useLanguagePairs(), {
        wrapper: makeWrapper(storage),
      })

      await act(async () => {})

      await act(async () => {
        await result.current.deletePair('pair-1')
      })

      expect(storage.deleteWord).toHaveBeenCalledWith('w1')
      expect(storage.deleteWord).toHaveBeenCalledWith('w2')
    })
  })
})
