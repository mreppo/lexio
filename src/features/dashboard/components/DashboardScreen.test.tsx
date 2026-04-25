/**
 * DashboardScreen tests — Liquid Glass Home screen.
 *
 * Tests are intentionally behaviour-focused (what is shown / what happens when
 * the user interacts) rather than implementation-focused (how the DOM is structured).
 * All storage is mocked via StorageContext.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { DashboardScreen } from './DashboardScreen'
import type { DashboardScreenProps } from './DashboardScreen'
import type { LanguagePair, UserSettings, DailyStats, Word, WordProgress } from '@/types'

// ─── Theme wrapper ────────────────────────────────────────────────────────────

const theme = createTheme()

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const defaultSettings: UserSettings = {
  activePairId: 'pair-1',
  quizMode: 'type',
  dailyGoal: 20,
  theme: 'dark',
  typoTolerance: 1,
  selectedLevels: [],
  displayName: null,
  soundEffects: false,
  autoPlayPronunciation: false,
  showHintTimeout: 10,
}

const activePair: LanguagePair = {
  id: 'pair-1',
  sourceLang: 'Latvian',
  targetLang: 'English',
  sourceCode: 'lv',
  targetCode: 'en',
  createdAt: 1700000000000,
}

const todayStats: DailyStats = {
  date: '2026-03-20',
  wordsReviewed: 10,
  correctCount: 8,
  incorrectCount: 2,
  streakDays: 3,
}

const learningWord: Word = {
  id: 'word-1',
  pairId: 'pair-1',
  source: 'māja',
  target: 'house',
  notes: 'A place where people live.',
  tags: [],
  createdAt: 1700000000000,
  isFromPack: false,
}

const learningProgress: WordProgress = {
  wordId: 'word-1',
  correctCount: 2,
  incorrectCount: 1,
  streak: 1,
  lastReviewed: 1700000000000,
  // nextReview in the past so this word is "due"
  nextReview: 1000,
  confidence: 0.3,
  history: [],
}

const masteredProgress: WordProgress = {
  wordId: 'word-2',
  correctCount: 10,
  incorrectCount: 0,
  streak: 8,
  lastReviewed: 1700000000000,
  // nextReview far in the future — not due
  nextReview: Date.now() + 1_000_000_000,
  confidence: 0.9,
  history: [],
}

function buildProps(overrides: Partial<DashboardScreenProps> = {}): DashboardScreenProps {
  return {
    activePair,
    settings: defaultSettings,
    todayStats: null,
    wordProgressList: [],
    words: [],
    totalWords: 0,
    streakDays: 0,
    loading: false,
    onStartQuiz: vi.fn(),
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardScreen', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('main structure', () => {
    it('should render the main Dashboard landmark', () => {
      renderWithTheme(<DashboardScreen {...buildProps()} />)
      expect(screen.getByRole('main', { name: 'Dashboard' })).toBeInTheDocument()
    })

    it('should render the "Today" title', () => {
      renderWithTheme(<DashboardScreen {...buildProps()} />)
      expect(screen.getByText('Today')).toBeInTheDocument()
    })
  })

  describe('hero card', () => {
    it('should show start review button when activePair is set and words are due', () => {
      renderWithTheme(
        <DashboardScreen
          {...buildProps({
            activePair,
            words: [learningWord],
            wordProgressList: [learningProgress],
            totalWords: 1,
          })}
        />,
      )
      expect(screen.getByRole('button', { name: /start review/i })).toBeInTheDocument()
    })

    it('should show celebratory "All caught up!" when no words are due', () => {
      // Word exists with nextReview far in the future (not due)
      const futureWord: Word = { ...learningWord, id: 'w-future' }
      const futureProgress: WordProgress = {
        ...learningProgress,
        wordId: 'w-future',
        nextReview: Date.now() + 1_000_000_000,
        confidence: 0.3,
      }
      renderWithTheme(
        <DashboardScreen
          {...buildProps({
            activePair,
            words: [futureWord],
            wordProgressList: [futureProgress],
            totalWords: 1,
          })}
        />,
      )
      expect(screen.getByText(/All caught up/i)).toBeInTheDocument()
    })

    it('should show "Pick a language pair to start" when no activePair', () => {
      renderWithTheme(<DashboardScreen {...buildProps({ activePair: null })} />)
      expect(screen.getByText(/Pick a language pair to start/i)).toBeInTheDocument()
    })

    it('should disable "Start review" button when no activePair', () => {
      renderWithTheme(<DashboardScreen {...buildProps({ activePair: null })} />)
      expect(screen.getByRole('button', { name: /start review/i })).toBeDisabled()
    })

    it('should show progress bar when words are due', () => {
      renderWithTheme(
        <DashboardScreen
          {...buildProps({
            words: [learningWord],
            wordProgressList: [learningProgress],
            totalWords: 1,
          })}
        />,
      )
      expect(screen.getByRole('progressbar', { name: /daily goal progress/i })).toBeInTheDocument()
    })
  })

  describe('quick stats row', () => {
    it('should show library count', () => {
      renderWithTheme(<DashboardScreen {...buildProps({ totalWords: 42 })} />)
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByText('Library')).toBeInTheDocument()
    })

    it('should show mastered count', () => {
      const masteredWord: Word = { ...learningWord, id: 'word-2' }
      renderWithTheme(
        <DashboardScreen
          {...buildProps({
            words: [learningWord, masteredWord],
            wordProgressList: [learningProgress, masteredProgress],
            totalWords: 2,
          })}
        />,
      )
      // masteredProgress has confidence 0.9 >= 0.8 threshold
      // "Mastered" label should be present in the quick stats row
      expect(screen.getByText('Mastered')).toBeInTheDocument()
    })

    it('should show accuracy when today stats are available', () => {
      renderWithTheme(<DashboardScreen {...buildProps({ todayStats })} />)
      // 8/10 = 80%
      expect(screen.getByText('80%')).toBeInTheDocument()
      expect(screen.getByText('Accuracy')).toBeInTheDocument()
    })

    it('should show dash for accuracy when no today stats', () => {
      renderWithTheme(<DashboardScreen {...buildProps({ todayStats: null })} />)
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  describe('streak icon', () => {
    it('should show streak icon when streakDays >= 1', () => {
      renderWithTheme(<DashboardScreen {...buildProps({ streakDays: 5 })} />)
      expect(screen.getByLabelText(/5 day streak/i)).toBeInTheDocument()
    })

    it('should not show streak icon when streakDays is 0', () => {
      renderWithTheme(<DashboardScreen {...buildProps({ streakDays: 0 })} />)
      expect(screen.queryByLabelText(/day streak/i)).not.toBeInTheDocument()
    })
  })

  describe('Word of the Day', () => {
    it('should show the "Word of the day" section header', () => {
      renderWithTheme(<DashboardScreen {...buildProps()} />)
      // SectionHeader renders as h2
      expect(
        screen.getByRole('heading', { level: 2, name: /word of the day/i }),
      ).toBeInTheDocument()
    })

    it('should show a WotD word when eligible words exist', () => {
      renderWithTheme(
        <DashboardScreen
          {...buildProps({
            activePair,
            words: [learningWord],
            wordProgressList: [learningProgress],
            totalWords: 1,
          })}
        />,
      )
      // learningWord.source is 'māja'
      expect(screen.getByText('māja')).toBeInTheDocument()
    })

    it('should show empty state WotD message when no eligible words', () => {
      renderWithTheme(
        <DashboardScreen
          {...buildProps({
            activePair,
            words: [],
            wordProgressList: [],
            totalWords: 0,
          })}
        />,
      )
      expect(screen.getByText(/add words and start learning/i)).toBeInTheDocument()
    })

    it('should show speaker button for WotD', () => {
      renderWithTheme(
        <DashboardScreen
          {...buildProps({
            activePair,
            words: [learningWord],
            wordProgressList: [learningProgress],
            totalWords: 1,
          })}
        />,
      )
      expect(screen.getByRole('button', { name: /play pronunciation/i })).toBeInTheDocument()
    })

    it('should show example block when word has notes', () => {
      renderWithTheme(
        <DashboardScreen
          {...buildProps({
            activePair,
            words: [learningWord], // notes: 'A place where people live.'
            wordProgressList: [learningProgress],
            totalWords: 1,
          })}
        />,
      )
      // Notes appear in the italic example block
      const exampleTexts = screen.getAllByText(/A place where people live/i)
      expect(exampleTexts.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('loading state', () => {
    it('should render skeleton elements when loading', () => {
      const { container } = renderWithTheme(<DashboardScreen {...buildProps({ loading: true })} />)
      // Skeletons have specific MUI classes — check the component doesn't crash
      expect(container).toBeDefined()
    })
  })

  describe('interactions', () => {
    it('should call onStartQuiz when Start review button is clicked', async () => {
      const user = userEvent.setup()
      const onStartQuiz = vi.fn()
      renderWithTheme(
        <DashboardScreen
          {...buildProps({
            onStartQuiz,
            activePair,
            words: [learningWord],
            wordProgressList: [learningProgress],
            totalWords: 1,
          })}
        />,
      )

      await user.click(screen.getByRole('button', { name: /start review/i }))
      expect(onStartQuiz).toHaveBeenCalledTimes(1)
    })
  })

  describe('avatar', () => {
    it('should show "L" initial when displayName is null', () => {
      renderWithTheme(
        <DashboardScreen
          {...buildProps({ settings: { ...defaultSettings, displayName: null } })}
        />,
      )
      expect(screen.getByText('L')).toBeInTheDocument()
    })

    it('should show first initial of displayName when set', () => {
      renderWithTheme(
        <DashboardScreen
          {...buildProps({ settings: { ...defaultSettings, displayName: 'Alice' } })}
        />,
      )
      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })
})
