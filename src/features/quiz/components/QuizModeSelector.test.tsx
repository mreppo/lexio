/**
 * Tests for QuizModeSelector component.
 *
 * Covers:
 * - Renders two mode cards: Typing and Multiple Choice
 * - Each card has the correct label, helper text, and icon
 * - Tapping a mode card calls both onModeChange AND onStart immediately
 * - DailyProgressCard renders within the component
 * - LevelFilterBar renders when wordCountByLevel has entries
 * - Empty state: when dueCount=0, mode cards hidden; celebratory message shown;
 *   "Browse library" button visible and calls onBrowseLibrary
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { QuizModeSelector } from './QuizModeSelector'
import type { CefrLevel } from '@/types'

const EMPTY_WORD_COUNTS: Record<CefrLevel, number> = {
  A1: 0,
  A2: 0,
  B1: 0,
  B2: 0,
  C1: 0,
  C2: 0,
}

interface RenderOptions {
  onModeChange?: ReturnType<typeof vi.fn>
  onStart?: ReturnType<typeof vi.fn>
  wordsReviewedToday?: number
  dailyGoal?: number
  streakDays?: number
  wordsLearned?: number
  totalWords?: number
  sessionLevels?: readonly CefrLevel[]
  wordCountByLevel?: Record<CefrLevel, number>
  onSessionLevelsChange?: ReturnType<typeof vi.fn>
  dueCount?: number
  onBrowseLibrary?: ReturnType<typeof vi.fn>
}

function renderSelector({
  onModeChange = vi.fn(),
  onStart = vi.fn(),
  wordsReviewedToday = 0,
  dailyGoal = 20,
  streakDays = 0,
  wordsLearned = 0,
  totalWords = 0,
  sessionLevels = [],
  wordCountByLevel = EMPTY_WORD_COUNTS,
  onSessionLevelsChange = vi.fn(),
  dueCount = 10,
  onBrowseLibrary = vi.fn(),
}: RenderOptions = {}) {
  return render(
    <ThemeProvider theme={createTheme()}>
      <QuizModeSelector
        selectedMode="type"
        onModeChange={onModeChange}
        onStart={onStart}
        wordsReviewedToday={wordsReviewedToday}
        dailyGoal={dailyGoal}
        streakDays={streakDays}
        wordsLearned={wordsLearned}
        totalWords={totalWords}
        sessionLevels={sessionLevels}
        wordCountByLevel={wordCountByLevel}
        onSessionLevelsChange={onSessionLevelsChange}
        dueCount={dueCount}
        onBrowseLibrary={onBrowseLibrary}
      />
    </ThemeProvider>,
  )
}

describe('QuizModeSelector', () => {
  describe('Normal state (dueCount > 0)', () => {
    it('should render the Typing mode card', () => {
      renderSelector()
      expect(screen.getByText('Typing')).toBeInTheDocument()
    })

    it('should render the Multiple Choice mode card', () => {
      renderSelector()
      expect(screen.getByText('Multiple Choice')).toBeInTheDocument()
    })

    it('should render helper text for Typing', () => {
      renderSelector()
      expect(screen.getByText('Type the translation yourself')).toBeInTheDocument()
    })

    it('should render helper text for Multiple Choice', () => {
      renderSelector()
      expect(screen.getByText('Pick from four options')).toBeInTheDocument()
    })

    it('should call onModeChange with "type" when Typing card is tapped', async () => {
      const onModeChange = vi.fn()
      renderSelector({ onModeChange })
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /Typing:/i }))
      expect(onModeChange).toHaveBeenCalledWith('type')
    })

    it('should call onStart when Typing card is tapped', async () => {
      const onStart = vi.fn()
      renderSelector({ onStart })
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /Typing:/i }))
      expect(onStart).toHaveBeenCalledOnce()
    })

    it('should call onModeChange with "choice" when Multiple Choice card is tapped', async () => {
      const onModeChange = vi.fn()
      renderSelector({ onModeChange })
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /Multiple Choice:/i }))
      expect(onModeChange).toHaveBeenCalledWith('choice')
    })

    it('should call onStart when Multiple Choice card is tapped', async () => {
      const onStart = vi.fn()
      renderSelector({ onStart })
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /Multiple Choice:/i }))
      expect(onStart).toHaveBeenCalledOnce()
    })

    it('should render the DailyProgressCard region', () => {
      renderSelector({ wordsReviewedToday: 5, dailyGoal: 20 })
      expect(screen.getByRole('region', { name: /daily goal progress/i })).toBeInTheDocument()
    })

    it('should render LevelFilterBar when levels have words', () => {
      renderSelector({ wordCountByLevel: { A1: 5, A2: 0, B1: 3, B2: 0, C1: 0, C2: 0 } })
      expect(screen.getByLabelText(/session level filter/i)).toBeInTheDocument()
    })
  })

  describe('Empty state (dueCount === 0)', () => {
    it('should hide mode cards when dueCount is 0', () => {
      renderSelector({ dueCount: 0 })
      expect(screen.queryByText('Typing')).not.toBeInTheDocument()
      expect(screen.queryByText('Multiple Choice')).not.toBeInTheDocument()
    })

    it('should show celebratory message when dueCount is 0', () => {
      renderSelector({ dueCount: 0 })
      expect(screen.getByText('All caught up!')).toBeInTheDocument()
    })

    it('should show the Browse library button when dueCount is 0', () => {
      renderSelector({ dueCount: 0 })
      expect(screen.getByRole('button', { name: /browse library/i })).toBeInTheDocument()
    })

    it('should call onBrowseLibrary when Browse library is clicked', async () => {
      const onBrowseLibrary = vi.fn()
      renderSelector({ dueCount: 0, onBrowseLibrary })
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /browse library/i }))
      expect(onBrowseLibrary).toHaveBeenCalledOnce()
    })

    it('should still show DailyProgressCard in empty state', () => {
      renderSelector({ dueCount: 0, wordsReviewedToday: 20, dailyGoal: 20 })
      expect(screen.getByRole('region', { name: /daily goal progress/i })).toBeInTheDocument()
    })
  })
})
