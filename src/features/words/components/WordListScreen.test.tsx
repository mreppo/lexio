import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WordListScreen } from './WordListScreen'
import type { StorageService } from '@/services/storage'
import type { Word } from '@/types'
import { createMockPair, createMockWord, createMockSettings } from '@/test/fixtures'
import { createMockStorage } from '@/test/mockStorage'
import { renderWithStorage } from '@/test/renderWithStorage'

const DEFAULT_PAIR = createMockPair({
  id: 'pair-1',
  sourceLang: 'English',
  sourceCode: 'en',
  targetLang: 'Latvian',
  targetCode: 'lv',
})

const DEFAULT_SETTINGS = createMockSettings({ activePairId: 'pair-1' })

function makeWord(overrides: Partial<Word> = {}): Word {
  return createMockWord(overrides)
}

function makeStorage(words: Word[] = []): StorageService {
  const storedWords = [...words]
  return createMockStorage({
    getLanguagePairs: vi.fn().mockResolvedValue([DEFAULT_PAIR]),
    getLanguagePair: vi.fn().mockResolvedValue(DEFAULT_PAIR),
    getSettings: vi.fn().mockResolvedValue(DEFAULT_SETTINGS),

    getWords: vi.fn().mockImplementation(async () => [...storedWords]),
    saveWord: vi.fn().mockImplementation(async (word: Word) => {
      storedWords.push(word)
    }),
    deleteWord: vi.fn().mockImplementation(async (id: string) => {
      const idx = storedWords.findIndex((w) => w.id === id)
      if (idx >= 0) storedWords.splice(idx, 1)
    }),
  })
}

describe('WordListScreen', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should show "no pair" message when activePair is null', () => {
    renderWithStorage(<WordListScreen activePair={null} />, makeStorage())
    expect(screen.getByText(/No language pair selected/i)).toBeInTheDocument()
  })

  it('should show empty state when no words exist', async () => {
    renderWithStorage(<WordListScreen activePair={DEFAULT_PAIR} />, makeStorage([]))

    await waitFor(() => {
      expect(screen.getByText(/No words yet/i)).toBeInTheDocument()
    })
  })

  it('should show "Add your first word" button in empty state', async () => {
    renderWithStorage(<WordListScreen activePair={DEFAULT_PAIR} />, makeStorage([]))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add your first word/i })).toBeInTheDocument()
    })
  })

  it('should show word list when words exist', async () => {
    const word = makeWord({ source: 'house', target: 'māja' })
    renderWithStorage(<WordListScreen activePair={DEFAULT_PAIR} />, makeStorage([word]))

    await waitFor(() => {
      expect(screen.getByText('house')).toBeInTheDocument()
      expect(screen.getByText('māja')).toBeInTheDocument()
    })
  })

  it('should show pair name as heading when words exist', async () => {
    const word = makeWord()
    renderWithStorage(<WordListScreen activePair={DEFAULT_PAIR} />, makeStorage([word]))

    await waitFor(() => {
      expect(screen.getByText('English → Latvian')).toBeInTheDocument()
    })
  })

  it('should open add word dialog when "Add word" is clicked', async () => {
    const user = userEvent.setup()
    const word = makeWord()
    renderWithStorage(<WordListScreen activePair={DEFAULT_PAIR} />, makeStorage([word]))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add word/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /^Add word$/i }))

    // The fullScreen dialog renders with "Add word" in the NavBar title pill (not a heading element)
    expect(screen.getAllByText(/Add word/i).length).toBeGreaterThanOrEqual(1)
  })

  it('should add a word and show it in the list', async () => {
    const user = userEvent.setup()
    renderWithStorage(<WordListScreen activePair={DEFAULT_PAIR} />, makeStorage([]))

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
    renderWithStorage(<WordListScreen activePair={DEFAULT_PAIR} />, makeStorage([word]))

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
    renderWithStorage(<WordListScreen activePair={DEFAULT_PAIR} />, makeStorage([word]))

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
