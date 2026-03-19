import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { WordListScreen } from './WordListScreen'
import { StorageContext } from '@/hooks/useStorage'
import type { StorageService } from '@/services/storage'
import type { LanguagePair, Word, UserSettings } from '@/types'

const DEFAULT_SETTINGS: UserSettings = {
  activePairId: 'pair-1',
  quizMode: 'mixed',
  dailyGoal: 20,
  theme: 'dark',
  typoTolerance: 1,
}

const DEFAULT_PAIR: LanguagePair = {
  id: 'pair-1',
  sourceLang: 'English',
  sourceCode: 'en',
  targetLang: 'Latvian',
  targetCode: 'lv',
  createdAt: 1_000_000,
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

function makeStorage(words: Word[] = []): StorageService {
  const storedWords = [...words]
  return {
    getLanguagePairs: vi.fn().mockResolvedValue([DEFAULT_PAIR]),
    getLanguagePair: vi.fn().mockResolvedValue(DEFAULT_PAIR),
    saveLanguagePair: vi.fn().mockResolvedValue(undefined),
    deleteLanguagePair: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue(DEFAULT_SETTINGS),
    saveSettings: vi.fn().mockResolvedValue(undefined),

    getWords: vi.fn().mockImplementation(async () => [...storedWords]),
    getWord: vi.fn().mockResolvedValue(null),
    saveWord: vi.fn().mockImplementation(async (word: Word) => {
      storedWords.push(word)
    }),
    saveWords: vi.fn().mockResolvedValue(undefined),
    deleteWord: vi.fn().mockImplementation(async (id: string) => {
      const idx = storedWords.findIndex((w) => w.id === id)
      if (idx >= 0) storedWords.splice(idx, 1)
    }),

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

describe('WordListScreen', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should show "no pair" message when activePair is null', () => {
    render(<WordListScreen activePair={null} />, { wrapper: makeWrapper(makeStorage()) })
    expect(screen.getByText(/No language pair selected/i)).toBeInTheDocument()
  })

  it('should show empty state when no words exist', async () => {
    render(<WordListScreen activePair={DEFAULT_PAIR} />, { wrapper: makeWrapper(makeStorage([])) })

    await waitFor(() => {
      expect(screen.getByText(/No words yet/i)).toBeInTheDocument()
    })
  })

  it('should show "Add your first word" button in empty state', async () => {
    render(<WordListScreen activePair={DEFAULT_PAIR} />, { wrapper: makeWrapper(makeStorage([])) })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add your first word/i })).toBeInTheDocument()
    })
  })

  it('should show word list when words exist', async () => {
    const word = makeWord({ source: 'house', target: 'māja' })
    render(<WordListScreen activePair={DEFAULT_PAIR} />, {
      wrapper: makeWrapper(makeStorage([word])),
    })

    await waitFor(() => {
      expect(screen.getByText('house')).toBeInTheDocument()
      expect(screen.getByText('māja')).toBeInTheDocument()
    })
  })

  it('should show pair name as heading when words exist', async () => {
    const word = makeWord()
    render(<WordListScreen activePair={DEFAULT_PAIR} />, {
      wrapper: makeWrapper(makeStorage([word])),
    })

    await waitFor(() => {
      expect(screen.getByText('English → Latvian')).toBeInTheDocument()
    })
  })

  it('should open add word dialog when "Add word" is clicked', async () => {
    const user = userEvent.setup()
    const word = makeWord()
    render(<WordListScreen activePair={DEFAULT_PAIR} />, {
      wrapper: makeWrapper(makeStorage([word])),
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add word/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /^Add word$/i }))

    expect(screen.getByRole('heading', { name: /Add word/i })).toBeInTheDocument()
  })

  it('should add a word and show it in the list', async () => {
    const user = userEvent.setup()
    render(<WordListScreen activePair={DEFAULT_PAIR} />, { wrapper: makeWrapper(makeStorage([])) })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add your first word/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Add your first word/i }))

    await user.type(screen.getByLabelText(/Source word/i), 'cat')
    await user.type(screen.getByLabelText(/Target word/i), 'kaķis')
    await user.click(screen.getByRole('button', { name: /Add word/i }))

    await waitFor(() => {
      expect(screen.getByText('cat')).toBeInTheDocument()
      expect(screen.getByText('kaķis')).toBeInTheDocument()
    })
  })

  it('should open edit dialog when edit button is clicked', async () => {
    const user = userEvent.setup()
    const word = makeWord({ source: 'house', target: 'māja' })
    render(<WordListScreen activePair={DEFAULT_PAIR} />, {
      wrapper: makeWrapper(makeStorage([word])),
    })

    await waitFor(() => {
      expect(screen.getByText('house')).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText(/Edit house/i))

    expect(screen.getByText('Edit word')).toBeInTheDocument()
    expect(screen.getByDisplayValue('house')).toBeInTheDocument()
  })

  it('should delete a word when confirmed', async () => {
    const user = userEvent.setup()
    const word = makeWord({ source: 'house', target: 'māja' })
    render(<WordListScreen activePair={DEFAULT_PAIR} />, {
      wrapper: makeWrapper(makeStorage([word])),
    })

    await waitFor(() => {
      expect(screen.getByText('house')).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText(/Delete house/i))
    await user.click(screen.getByRole('button', { name: /^Delete$/i }))

    await waitFor(() => {
      expect(screen.queryByText('house')).not.toBeInTheDocument()
    })
  })
})
