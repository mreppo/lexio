import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LibraryScreen } from './LibraryScreen'
import type { Word, WordProgress } from '@/types'
import { createMockPair, createMockWord, createMockProgress } from '@/test/fixtures'
import { createMockStorage } from '@/test/mockStorage'
import { renderWithStorage } from '@/test/renderWithStorage'

const DEFAULT_PAIR = createMockPair({
  id: 'pair-1',
  sourceLang: 'English',
  sourceCode: 'en',
  targetLang: 'Latvian',
  targetCode: 'lv',
})

const NOOP_TAB_CHANGE = vi.fn()

function makeStorage(words: Word[] = [], progress: WordProgress[] = []) {
  return createMockStorage({
    getWords: vi.fn().mockResolvedValue([...words]),
    getAllProgress: vi.fn().mockResolvedValue([...progress]),
    saveWord: vi.fn().mockResolvedValue(undefined),
    deleteWord: vi.fn().mockResolvedValue(undefined),
  })
}

function renderLibrary(words: Word[] = [], progress: WordProgress[] = []) {
  return renderWithStorage(
    <LibraryScreen activePair={DEFAULT_PAIR} onTabChange={NOOP_TAB_CHANGE} />,
    makeStorage(words, progress),
  )
}

describe('LibraryScreen', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // ─── NavBar ────────────────────────────────────────────────────────────────

  describe('NavBar', () => {
    it('should render "Library" as the prominent title', async () => {
      renderLibrary()
      await waitFor(() => {
        expect(screen.getByText('Library')).toBeInTheDocument()
      })
    })

    it('should render a search icon button in the trailing slot', async () => {
      renderLibrary([createMockWord()])
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
      })
    })

    it('should render an add-word plus button in the trailing slot', async () => {
      renderLibrary([createMockWord()])
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add word/i })).toBeInTheDocument()
      })
    })
  })

  // ─── Search field ──────────────────────────────────────────────────────────

  describe('Search field', () => {
    it('should render a search input with total word count placeholder', async () => {
      const words = [
        createMockWord({ source: 'apple' }),
        createMockWord({ id: 'w2', source: 'banana' }),
      ]
      renderLibrary(words)
      await waitFor(() => {
        expect(screen.getByRole('searchbox')).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/search 2 words/i)).toBeInTheDocument()
      })
    })

    it('should filter word list when typing in the search box', async () => {
      const user = userEvent.setup()

      const words = [
        createMockWord({ id: 'w1', source: 'apple', target: 'ābols' }),
        createMockWord({ id: 'w2', source: 'banana', target: 'banāns' }),
      ]
      renderLibrary(words)

      await waitFor(() => {
        expect(screen.getByText('apple')).toBeInTheDocument()
        expect(screen.getByText('banana')).toBeInTheDocument()
      })

      const input = screen.getByRole('searchbox')
      await user.type(input, 'apple')

      // Wait for the 150ms debounce plus some buffer
      await waitFor(
        () => {
          expect(screen.getByText('apple')).toBeInTheDocument()
          expect(screen.queryByText('banana')).not.toBeInTheDocument()
        },
        { timeout: 1000 },
      )
    })

    it('should show no-results state when search matches nothing', async () => {
      const user = userEvent.setup()

      renderLibrary([createMockWord({ source: 'apple' })])

      await waitFor(() => {
        expect(screen.getByText('apple')).toBeInTheDocument()
      })

      const input = screen.getByRole('searchbox')
      await user.type(input, 'zzz')

      await waitFor(
        () => {
          expect(screen.getByText(/no words match/i)).toBeInTheDocument()
        },
        { timeout: 1000 },
      )
    })
  })

  // ─── Filter pills ──────────────────────────────────────────────────────────

  describe('Filter pills', () => {
    it('should render All / Due / Learning / Mastered pills', async () => {
      renderLibrary([createMockWord()])
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Filter: All/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /^Filter: Due/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /^Filter: Learning/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /^Filter: Mastered/i })).toBeInTheDocument()
      })
    })

    it('should show All as active by default', async () => {
      renderLibrary([createMockWord()])
      await waitFor(() => {
        const allPill = screen.getByRole('button', { name: /^Filter: All/i })
        expect(allPill).toHaveAttribute('aria-pressed', 'true')
      })
    })

    it('should switch active pill when Mastered is tapped', async () => {
      const user = userEvent.setup()
      const progress = createMockProgress({
        wordId: 'word-1',
        confidence: 0.9,
        nextReview: Date.now() + 999999,
      })
      renderLibrary([createMockWord()], [progress])

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Filter: All/i })).toHaveAttribute(
          'aria-pressed',
          'true',
        )
      })

      await user.click(screen.getByRole('button', { name: /^Filter: Mastered/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Filter: Mastered/i })).toHaveAttribute(
          'aria-pressed',
          'true',
        )
        expect(screen.getByRole('button', { name: /^Filter: All/i })).toHaveAttribute(
          'aria-pressed',
          'false',
        )
      })
    })

    it('should filter to mastered words only when Mastered pill is active', async () => {
      const user = userEvent.setup()
      const masteredWord = createMockWord({ id: 'w1', source: 'apple' })
      const learningWord = createMockWord({ id: 'w2', source: 'banana' })
      const masteredProgress = createMockProgress({
        wordId: 'w1',
        confidence: 0.9,
        nextReview: Date.now() + 999999,
      })
      const learningProgress = createMockProgress({
        wordId: 'w2',
        confidence: 0.2,
        nextReview: Date.now() + 999999,
      })

      renderLibrary([masteredWord, learningWord], [masteredProgress, learningProgress])

      await waitFor(() => {
        expect(screen.getByText('apple')).toBeInTheDocument()
        expect(screen.getByText('banana')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /^Filter: Mastered/i }))

      await waitFor(() => {
        expect(screen.getByText('apple')).toBeInTheDocument()
        expect(screen.queryByText('banana')).not.toBeInTheDocument()
      })
    })

    it('should filter to learning words when Learning pill is active', async () => {
      const user = userEvent.setup()
      const masteredWord = createMockWord({ id: 'w1', source: 'apple' })
      const learningWord = createMockWord({ id: 'w2', source: 'banana' })
      const masteredProgress = createMockProgress({
        wordId: 'w1',
        confidence: 0.9,
        nextReview: Date.now() + 999999,
      })
      const learningProgress = createMockProgress({
        wordId: 'w2',
        confidence: 0.2,
        nextReview: Date.now() + 999999,
      })

      renderLibrary([masteredWord, learningWord], [masteredProgress, learningProgress])

      await waitFor(() => {
        expect(screen.getByText('apple')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /^Filter: Learning/i }))

      await waitFor(() => {
        expect(screen.getByText('banana')).toBeInTheDocument()
        expect(screen.queryByText('apple')).not.toBeInTheDocument()
      })
    })

    it('should show pills as mutually exclusive (only one active at a time)', async () => {
      const user = userEvent.setup()
      renderLibrary([createMockWord()])

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Filter: All/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /^Filter: Learning/i }))

      await waitFor(() => {
        const pills = screen.getAllByRole('button', { name: /^Filter:/i })
        const activePills = pills.filter((p) => p.getAttribute('aria-pressed') === 'true')
        expect(activePills).toHaveLength(1)
        expect(activePills[0]).toHaveAttribute('aria-label', expect.stringContaining('Learning'))
      })
    })
  })

  // ─── Grouped word list ─────────────────────────────────────────────────────

  describe('Grouped word list', () => {
    it('should render words under their first-letter section header', async () => {
      const words = [
        createMockWord({ id: 'w1', source: 'apple' }),
        createMockWord({ id: 'w2', source: 'banana' }),
      ]
      renderLibrary(words)

      await waitFor(() => {
        expect(screen.getByText('A')).toBeInTheDocument()
        expect(screen.getByText('B')).toBeInTheDocument()
        expect(screen.getByText('apple')).toBeInTheDocument()
        expect(screen.getByText('banana')).toBeInTheDocument()
      })
    })

    it('should group words with the same first letter together', async () => {
      const words = [
        createMockWord({ id: 'w1', source: 'apple' }),
        createMockWord({ id: 'w2', source: 'avocado' }),
        createMockWord({ id: 'w3', source: 'banana' }),
      ]
      renderLibrary(words)

      await waitFor(() => {
        // Should have one A section and one B section
        const aHeaders = screen.getAllByText('A')
        expect(aHeaders).toHaveLength(1)
        const bHeaders = screen.getAllByText('B')
        expect(bHeaders).toHaveLength(1)
      })
    })

    it('should show word source as row title', async () => {
      renderLibrary([createMockWord({ source: 'house', target: 'māja' })])

      await waitFor(() => {
        expect(screen.getByText('house')).toBeInTheDocument()
      })
    })

    it('should show word target as row detail', async () => {
      renderLibrary([createMockWord({ source: 'house', target: 'māja' })])

      await waitFor(() => {
        expect(screen.getByText('māja')).toBeInTheDocument()
      })
    })

    it('should render a score chip for each word', async () => {
      const word = createMockWord({ id: 'w1' })
      const progress = createMockProgress({
        wordId: 'w1',
        confidence: 0.9,
        nextReview: Date.now() + 999999,
      })
      renderLibrary([word], [progress])

      await waitFor(() => {
        expect(screen.getByLabelText(/Score: Mastered/i)).toBeInTheDocument()
      })
    })

    it('should show Latvian diacritic terms correctly', async () => {
      renderLibrary([createMockWord({ source: 'ābols', target: 'apple' })])

      await waitFor(() => {
        expect(screen.getByText('ābols')).toBeInTheDocument()
      })
    })
  })

  // ─── Score chip colour mapping ─────────────────────────────────────────────

  describe('Score chip state-colour mapping', () => {
    it('should show "Mastered" chip for high confidence word', async () => {
      const word = createMockWord({ id: 'w1' })
      const progress = createMockProgress({
        wordId: 'w1',
        confidence: 0.9,
        nextReview: Date.now() + 999999,
      })
      renderLibrary([word], [progress])

      await waitFor(() => {
        expect(screen.getByLabelText('Score: Mastered')).toBeInTheDocument()
      })
    })

    it('should show "Familiar" chip for mid-confidence word', async () => {
      const word = createMockWord({ id: 'w1' })
      const progress = createMockProgress({
        wordId: 'w1',
        confidence: 0.65,
        nextReview: Date.now() + 999999,
      })
      renderLibrary([word], [progress])

      await waitFor(() => {
        expect(screen.getByLabelText('Score: Familiar')).toBeInTheDocument()
      })
    })

    it('should show "Learning" chip for low confidence word', async () => {
      const word = createMockWord({ id: 'w1' })
      const progress = createMockProgress({
        wordId: 'w1',
        confidence: 0.2,
        nextReview: Date.now() + 999999,
      })
      renderLibrary([word], [progress])

      await waitFor(() => {
        expect(screen.getByLabelText('Score: Learning')).toBeInTheDocument()
      })
    })

    it('should show "New" chip for word with no progress', async () => {
      renderLibrary([createMockWord({ id: 'w1' })], [])

      await waitFor(() => {
        expect(screen.getByLabelText('Score: New')).toBeInTheDocument()
      })
    })
  })

  // ─── Add word flow ─────────────────────────────────────────────────────────

  describe('Add word flow', () => {
    it('should open word form dialog when plus button is tapped', async () => {
      const user = userEvent.setup()
      renderLibrary([createMockWord()])

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add word/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add word/i }))

      // The WordFormDialog opens — it has an "Add word" heading
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /add word/i })).toBeInTheDocument()
      })
    })

    it('should open word form from empty state button', async () => {
      const user = userEvent.setup()
      renderLibrary([])

      await waitFor(() => {
        expect(screen.getByText(/no words yet/i)).toBeInTheDocument()
      })

      // In the empty state there are two "Add word" buttons (NavBar + empty state CTA).
      // Click the visible empty-state CTA button which contains the text "Add word".
      const addWordButtons = screen.getAllByRole('button', { name: /add word/i })
      // The empty-state button is the one that is NOT the NavBar GlassIcon
      // (the NavBar button has an aria-label, the empty state button contains visible text)
      const ctaButton = addWordButtons.find((btn) => btn.textContent?.trim() === 'Add word')
      expect(ctaButton).toBeDefined()
      await user.click(ctaButton!)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /add word/i })).toBeInTheDocument()
      })
    })
  })

  // ─── No active pair ────────────────────────────────────────────────────────

  describe('No active pair state', () => {
    it('should show a message when no language pair is selected', () => {
      renderWithStorage(
        <LibraryScreen activePair={null} onTabChange={NOOP_TAB_CHANGE} />,
        makeStorage(),
      )
      expect(screen.getByText(/select a language pair/i)).toBeInTheDocument()
    })
  })

  // ─── Empty state ───────────────────────────────────────────────────────────

  describe('Empty state', () => {
    it('should show "No words yet" when there are no words', async () => {
      renderLibrary([])

      await waitFor(() => {
        expect(screen.getByText(/no words yet/i)).toBeInTheDocument()
      })
    })
  })

  // ─── useWords hook unchanged ───────────────────────────────────────────────

  describe('useWords hook', () => {
    it('should call getWords with the active pair id', async () => {
      const getWords = vi.fn().mockResolvedValue([])
      const storage = createMockStorage({ getWords, getAllProgress: vi.fn().mockResolvedValue([]) })
      renderWithStorage(
        <LibraryScreen activePair={DEFAULT_PAIR} onTabChange={NOOP_TAB_CHANGE} />,
        storage,
      )

      await waitFor(() => {
        expect(getWords).toHaveBeenCalledWith('pair-1')
      })
    })
  })

  // ─── TabBar ────────────────────────────────────────────────────────────────

  describe('TabBar', () => {
    it('should render the TabBar with words tab as active', async () => {
      renderLibrary([createMockWord()])

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /app navigation/i })).toBeInTheDocument()
        const wordsTab = screen.getByRole('button', { name: /Navigate to Words/i })
        expect(wordsTab).toHaveAttribute('aria-current', 'page')
      })
    })

    it('should call onTabChange when a tab is tapped', async () => {
      const user = userEvent.setup()
      const onTabChange = vi.fn()

      renderWithStorage(
        <LibraryScreen activePair={DEFAULT_PAIR} onTabChange={onTabChange} />,
        makeStorage([createMockWord()]),
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Navigate to Home/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Navigate to Home/i }))

      expect(onTabChange).toHaveBeenCalledWith('home')
    })
  })
})
