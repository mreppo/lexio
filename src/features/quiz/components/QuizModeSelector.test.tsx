/**
 * Tests for QuizModeSelector component.
 *
 * Covers:
 * - Renders all three modes
 * - Highlights the currently selected mode
 * - Calls onModeChange when user picks a mode
 * - Calls onStart when user clicks Start quiz
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material'
import { QuizModeSelector } from './QuizModeSelector'
import type { QuizMode, CefrLevel } from '@/types'

const EMPTY_WORD_COUNTS: Record<CefrLevel, number> = {
  A1: 0,
  A2: 0,
  B1: 0,
  B2: 0,
  C1: 0,
  C2: 0,
}

interface RenderOptions {
  selectedMode?: QuizMode
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
}

function renderSelector({
  selectedMode = 'type',
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
}: RenderOptions = {}) {
  return render(
    <ThemeProvider theme={createTheme()}>
      <QuizModeSelector
        selectedMode={selectedMode}
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
      />
    </ThemeProvider>,
  )
}

describe('QuizModeSelector', () => {
  it('should render all three mode options', () => {
    renderSelector()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Choice')).toBeInTheDocument()
    expect(screen.getByText('Mixed')).toBeInTheDocument()
  })

  it('should render mode descriptions', () => {
    renderSelector()
    expect(screen.getByText('Type the translation yourself')).toBeInTheDocument()
    expect(screen.getByText('Pick from four options')).toBeInTheDocument()
    expect(screen.getByText('Alternates type and choice')).toBeInTheDocument()
  })

  it('should render a Start quiz button', () => {
    renderSelector()
    expect(screen.getByRole('button', { name: /start.*quiz/i })).toBeInTheDocument()
  })

  it('should call onStart when Start quiz is clicked', async () => {
    const onStart = vi.fn()
    renderSelector({ onStart })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /start.*quiz/i }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('should call onModeChange with "choice" when Choice is clicked', async () => {
    const onModeChange = vi.fn()
    renderSelector({ onModeChange })
    const user = userEvent.setup()
    await user.click(screen.getByRole('radio', { name: /choice mode/i }))
    expect(onModeChange).toHaveBeenCalledWith('choice')
  })

  it('should call onModeChange with "mixed" when Mixed is clicked', async () => {
    const onModeChange = vi.fn()
    renderSelector({ onModeChange })
    const user = userEvent.setup()
    await user.click(screen.getByRole('radio', { name: /mixed mode/i }))
    expect(onModeChange).toHaveBeenCalledWith('mixed')
  })

  it('should call onModeChange with "type" when Type is clicked', async () => {
    const onModeChange = vi.fn()
    renderSelector({ selectedMode: 'choice', onModeChange })
    const user = userEvent.setup()
    await user.click(screen.getByRole('radio', { name: /type mode/i }))
    expect(onModeChange).toHaveBeenCalledWith('type')
  })

  it('should mark the selected mode as aria-checked', () => {
    renderSelector({ selectedMode: 'mixed' })
    const mixedOption = screen.getByRole('radio', { name: /mixed mode/i })
    expect(mixedOption).toHaveAttribute('aria-checked', 'true')
  })

  it('should not mark unselected modes as aria-checked', () => {
    renderSelector({ selectedMode: 'mixed' })
    const typeOption = screen.getByRole('radio', { name: /type mode/i })
    const choiceOption = screen.getByRole('radio', { name: /choice mode/i })
    expect(typeOption).toHaveAttribute('aria-checked', 'false')
    expect(choiceOption).toHaveAttribute('aria-checked', 'false')
  })
})
