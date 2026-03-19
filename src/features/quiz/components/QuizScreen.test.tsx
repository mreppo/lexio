/**
 * Tests for QuizScreen component.
 *
 * We mock useQuizSession to control session state without hitting storage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '@/theme'
import type { LanguagePair, UserSettings } from '@/types'
import { QuizScreen } from './QuizScreen'
import type { UseQuizSessionResult, QuizSessionState } from '../useQuizSession'

// ─── Mock useQuizSession ───────────────────────────────────────────────────────

vi.mock('../useQuizSession', () => ({
  useQuizSession: vi.fn(),
}))

import { useQuizSession } from '../useQuizSession'
const mockUseQuizSession = vi.mocked(useQuizSession)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockPair: LanguagePair = {
  id: 'pair-1',
  sourceLang: 'Latvian',
  targetLang: 'English',
  sourceCode: 'lv',
  targetCode: 'en',
  createdAt: 1000,
}

const mockSettings: UserSettings = {
  activePairId: 'pair-1',
  quizMode: 'type',
  dailyGoal: 20,
  theme: 'dark',
  typoTolerance: 1,
}

const mockWord = {
  id: 'w1',
  pairId: 'pair-1',
  source: 'māja',
  target: 'house',
  notes: null,
  tags: [],
  createdAt: 1000,
  isFromPack: false,
}

function makeQuestionState(): QuizSessionState {
  return {
    phase: 'question',
    currentWord: mockWord,
    direction: 'source-to-target',
    pair: mockPair,
    lastResult: null,
    wordsCompleted: 2,
    sessionGoal: 20,
    correctCount: 1,
    error: null,
  }
}

function makeMockSession(state: QuizSessionState): UseQuizSessionResult {
  return {
    state,
    submitAnswer: vi.fn().mockResolvedValue(undefined),
    advance: vi.fn(),
    endSession: vi.fn(),
    restart: vi.fn(),
  }
}

function renderQuiz(pair: LanguagePair | null = mockPair) {
  const theme = createAppTheme('dark')
  return render(
    <ThemeProvider theme={theme}>
      <QuizScreen pair={pair} settings={mockSettings} />
    </ThemeProvider>,
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('QuizScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show a message when no pair is selected', () => {
    // useQuizSession still called even with null pair
    mockUseQuizSession.mockReturnValue(makeMockSession({
      phase: 'finished',
      currentWord: null,
      direction: null,
      pair: null,
      lastResult: null,
      wordsCompleted: 0,
      sessionGoal: 20,
      correctCount: 0,
      error: null,
    }))

    renderQuiz(null)
    expect(screen.getByText(/select a language pair/i)).toBeInTheDocument()
  })

  it('should show loading message when phase is loading', () => {
    mockUseQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      phase: 'loading',
      currentWord: null,
      direction: null,
    }))

    renderQuiz()
    expect(screen.getByText(/loading words/i)).toBeInTheDocument()
  })

  it('should render the word and direction indicator in question phase', () => {
    mockUseQuizSession.mockReturnValue(makeMockSession(makeQuestionState()))

    renderQuiz()

    // Word displayed
    expect(screen.getByText('māja')).toBeInTheDocument()

    // Direction chip
    expect(screen.getByText('Latvian → English')).toBeInTheDocument()
  })

  it('should render the text input and submit button in question phase', () => {
    mockUseQuizSession.mockReturnValue(makeMockSession(makeQuestionState()))

    renderQuiz()

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('should have correct input attributes for mobile keyboard handling', () => {
    mockUseQuizSession.mockReturnValue(makeMockSession(makeQuestionState()))

    renderQuiz()

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('autocomplete', 'off')
    expect(input).toHaveAttribute('autocorrect', 'off')
    expect(input).toHaveAttribute('autocapitalize', 'none')
    expect(input).toHaveAttribute('spellcheck', 'false')
  })

  it('should submit the answer when clicking the submit button', async () => {
    const session = makeMockSession(makeQuestionState())
    mockUseQuizSession.mockReturnValue(session)

    renderQuiz()

    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'house')

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await userEvent.click(submitBtn)

    expect(session.submitAnswer).toHaveBeenCalledWith('house')
  })

  it('should submit on Enter key press', async () => {
    const session = makeMockSession(makeQuestionState())
    mockUseQuizSession.mockReturnValue(session)

    renderQuiz()

    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'house')
    await userEvent.keyboard('{Enter}')

    expect(session.submitAnswer).toHaveBeenCalledWith('house')
  })

  it('should not submit if input is empty', async () => {
    const session = makeMockSession(makeQuestionState())
    mockUseQuizSession.mockReturnValue(session)

    renderQuiz()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    expect(submitBtn).toBeDisabled()
  })

  it('should show correct feedback when result is correct', () => {
    mockUseQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      phase: 'feedback',
      lastResult: { result: 'correct', correctAnswer: 'house', distance: 0 },
    }))

    renderQuiz()
    expect(screen.getByText(/correct!/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next word/i })).toBeInTheDocument()
  })

  it('should show incorrect feedback with the correct answer', () => {
    mockUseQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      phase: 'feedback',
      lastResult: { result: 'incorrect', correctAnswer: 'house', distance: 5 },
    }))

    renderQuiz()
    expect(screen.getByText(/incorrect/i)).toBeInTheDocument()
    expect(screen.getByText('house')).toBeInTheDocument()
  })

  it('should show almost feedback with exact spelling', () => {
    mockUseQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      phase: 'feedback',
      lastResult: { result: 'almost', correctAnswer: 'house', distance: 1 },
    }))

    renderQuiz()
    expect(screen.getByText(/almost!/i)).toBeInTheDocument()
    expect(screen.getByText('house')).toBeInTheDocument()
  })

  it('should call advance when Next word button is clicked', async () => {
    const session = makeMockSession({
      ...makeQuestionState(),
      phase: 'feedback',
      lastResult: { result: 'correct', correctAnswer: 'house', distance: 0 },
    })
    mockUseQuizSession.mockReturnValue(session)

    renderQuiz()

    const nextBtn = screen.getByRole('button', { name: /next word/i })
    await userEvent.click(nextBtn)

    expect(session.advance).toHaveBeenCalled()
  })

  it('should show session progress bar', () => {
    mockUseQuizSession.mockReturnValue(makeMockSession(makeQuestionState()))

    renderQuiz()
    // Progress shows "2 / 20"
    expect(screen.getByText('2 / 20')).toBeInTheDocument()
  })

  it('should show session complete screen when finished', () => {
    mockUseQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      phase: 'finished',
      currentWord: null,
      direction: null,
      wordsCompleted: 5,
      correctCount: 4,
    }))

    renderQuiz()
    expect(screen.getByText(/session complete/i)).toBeInTheDocument()
    expect(screen.getByText(/you reviewed/i)).toBeInTheDocument()
  })

  it('should call endSession when end session button is clicked', async () => {
    const session = makeMockSession(makeQuestionState())
    mockUseQuizSession.mockReturnValue(session)

    renderQuiz()

    const endBtn = screen.getByRole('button', { name: /end session/i })
    await userEvent.click(endBtn)

    expect(session.endSession).toHaveBeenCalled()
  })

  it('should show the word from target when direction is target-to-source', () => {
    mockUseQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      direction: 'target-to-source',
    }))

    renderQuiz()

    // In target-to-source, the question shows the target word ("house")
    // and the direction is "English → Latvian"
    expect(screen.getByText('house')).toBeInTheDocument()
    expect(screen.getByText('English → Latvian')).toBeInTheDocument()
  })

  it('should show error state with a retry button', () => {
    const session = makeMockSession({
      ...makeQuestionState(),
      phase: 'finished',
      currentWord: null,
      direction: null,
      error: 'Failed to load words',
    })
    mockUseQuizSession.mockReturnValue(session)

    renderQuiz()

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/failed to load words/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('should call restart when try again button is clicked after error', async () => {
    const session = makeMockSession({
      ...makeQuestionState(),
      phase: 'finished',
      currentWord: null,
      direction: null,
      error: 'Failed to load words',
    })
    mockUseQuizSession.mockReturnValue(session)

    renderQuiz()

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(session.restart).toHaveBeenCalled()
  })
})
