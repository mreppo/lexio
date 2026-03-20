import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardScreen } from './DashboardScreen'
import type { DashboardScreenProps } from './DashboardScreen'
import type { LanguagePair, UserSettings, DailyStats, WordProgress } from '@/types'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const defaultSettings: UserSettings = {
  activePairId: 'pair-1',
  quizMode: 'type',
  dailyGoal: 20,
  theme: 'dark',
  typoTolerance: 1,
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

const wordProgress: WordProgress = {
  wordId: 'word-1',
  correctCount: 5,
  incorrectCount: 1,
  streak: 3,
  lastReviewed: 1700000000000,
  nextReview: 1700086400000,
  confidence: 0.85,
  history: [],
}

function buildProps(overrides: Partial<DashboardScreenProps> = {}): DashboardScreenProps {
  return {
    activePair,
    settings: defaultSettings,
    todayStats: null,
    wordProgressList: [],
    totalWords: 0,
    streakDays: 0,
    recentStats: [],
    loading: false,
    onStartQuiz: vi.fn(),
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardScreen', () => {
  describe('empty state (new user)', () => {
    it('should render without crashing with minimal props', () => {
      render(<DashboardScreen {...buildProps()} />)
      expect(screen.getByRole('main', { name: 'Dashboard' })).toBeInTheDocument()
    })

    it('should show "No sessions yet today" when todayStats is null', () => {
      render(<DashboardScreen {...buildProps({ todayStats: null })} />)
      expect(screen.getByText(/No sessions yet today/i)).toBeInTheDocument()
    })

    it('should show "No words added yet" when totalWords is 0', () => {
      render(<DashboardScreen {...buildProps({ totalWords: 0 })} />)
      expect(screen.getByText(/No words added yet/i)).toBeInTheDocument()
    })

    it('should show "No recent activity" when recentStats is empty', () => {
      render(<DashboardScreen {...buildProps({ recentStats: [] })} />)
      expect(screen.getByText(/No recent activity/i)).toBeInTheDocument()
    })

    it('should show "Quick start" section', () => {
      render(<DashboardScreen {...buildProps()} />)
      expect(screen.getByText('Quick start')).toBeInTheDocument()
    })

    it('should display the active language pair in quick start', () => {
      render(<DashboardScreen {...buildProps()} />)
      expect(screen.getByText(/Latvian.*English/i)).toBeInTheDocument()
    })
  })

  describe('populated state', () => {
    it('should show today stats when provided', () => {
      render(<DashboardScreen {...buildProps({ todayStats })} />)
      // 10 words reviewed — may appear in multiple places (hero ring + today section)
      const elements = screen.getAllByText('10')
      expect(elements.length).toBeGreaterThanOrEqual(1)
    })

    it('should show accuracy percentage', () => {
      render(<DashboardScreen {...buildProps({ todayStats })} />)
      // 8/10 = 80%
      expect(screen.getByText('80%')).toBeInTheDocument()
    })

    it('should show streak badge when streakDays >= 1', () => {
      render(<DashboardScreen {...buildProps({ streakDays: 5 })} />)
      expect(screen.getByRole('status', { name: /5 day streak/i })).toBeInTheDocument()
    })

    it('should not show streak badge when streakDays is 0', () => {
      render(<DashboardScreen {...buildProps({ streakDays: 0 })} />)
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('should show word buckets when totalWords > 0', () => {
      render(
        <DashboardScreen
          {...buildProps({
            totalWords: 3,
            wordProgressList: [wordProgress],
          })}
        />,
      )
      expect(screen.getByLabelText(/mastered words/i)).toBeInTheDocument()
    })

    it('should show recent activity entries', () => {
      const stats: DailyStats[] = [
        {
          date: '2026-03-19',
          wordsReviewed: 15,
          correctCount: 12,
          incorrectCount: 3,
          streakDays: 1,
        },
      ]
      render(<DashboardScreen {...buildProps({ recentStats: stats })} />)
      expect(screen.getByText('2026-03-19')).toBeInTheDocument()
      expect(screen.getByText('15 words')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should render skeleton elements when loading', () => {
      render(<DashboardScreen {...buildProps({ loading: true })} />)
      // The Start Quiz button should be disabled while loading
      const startButton = screen.getByRole('button', { name: /Start Quiz/i })
      expect(startButton).toBeDisabled()
    })
  })

  describe('interactions', () => {
    it('should call onStartQuiz when Start Quiz button is clicked', async () => {
      const user = userEvent.setup()
      const onStartQuiz = vi.fn()
      render(<DashboardScreen {...buildProps({ onStartQuiz })} />)

      await user.click(screen.getByRole('button', { name: /Start Quiz/i }))
      expect(onStartQuiz).toHaveBeenCalledTimes(1)
    })

    it('should disable Start Quiz button when activePair is null', () => {
      render(<DashboardScreen {...buildProps({ activePair: null })} />)
      expect(screen.getByRole('button', { name: /Start Quiz/i })).toBeDisabled()
    })
  })

  describe('no active pair', () => {
    it('should show "No language pair selected" in quick start', () => {
      render(<DashboardScreen {...buildProps({ activePair: null })} />)
      expect(screen.getByText('No language pair selected')).toBeInTheDocument()
    })
  })
})
