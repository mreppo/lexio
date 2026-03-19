/**
 * Tests for ChoiceQuizScreen component.
 *
 * We mock useChoiceQuizSession to control session state without hitting storage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { createAppTheme } from '@/theme'
import type { LanguagePair, UserSettings } from '@/types'
import { ChoiceQuizScreen } from './ChoiceQuizScreen'
import type { UseChoiceQuizSessionResult, ChoiceQuizSessionState } from '../useChoiceQuizSession'

// ─── Mock useChoiceQuizSession ─────────────────────────────────────────────────

vi.mock('../useChoiceQuizSession', () => ({
  useChoiceQuizSession: vi.fn(),
}))

import { useChoiceQuizSession } from '../useChoiceQuizSession'
const mockUseChoiceQuizSession = vi.mocked(useChoiceQuizSession)

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
  quizMode: 'choice',
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

const mockOptions = ['cat', 'house', 'dog', 'table']
const mockCorrectIndex = 1 // 'house'

function makeQuestionState(): ChoiceQuizSessionState {
  return {
    phase: 'question',
    currentWord: mockWord,
    direction: 'source-to-target',
    pair: mockPair,
    options: mockOptions,
    correctIndex: mockCorrectIndex,
    selectedIndex: -1,
    lastCorrect: null,
    wordsCompleted: 2,
    sessionGoal: 20,
    correctCount: 1,
    error: null,
  }
}

function makeMockSession(state: ChoiceQuizSessionState): UseChoiceQuizSessionResult {
  return {
    state,
    selectOption: vi.fn().mockResolvedValue(undefined),
    advance: vi.fn(),
    endSession: vi.fn(),
    restart: vi.fn(),
  }
}

function renderQuiz(pair: LanguagePair | null = mockPair) {
  const theme = createAppTheme('dark')
  return render(
    <ThemeProvider theme={theme}>
      <ChoiceQuizScreen pair={pair} settings={mockSettings} />
    </ThemeProvider>,
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ChoiceQuizScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show a message when no pair is selected', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession({
      phase: 'finished',
      currentWord: null,
      direction: null,
      pair: null,
      options: [],
      correctIndex: 0,
      selectedIndex: -1,
      lastCorrect: null,
      wordsCompleted: 0,
      sessionGoal: 20,
      correctCount: 0,
      error: null,
    }))

    renderQuiz(null)
    expect(screen.getByText(/select a language pair/i)).toBeInTheDocument()
  })

  it('should show loading message when phase is loading', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      phase: 'loading',
      currentWord: null,
      direction: null,
    }))

    renderQuiz()
    expect(screen.getByText(/loading words/i)).toBeInTheDocument()
  })

  it('should show not-enough-words message when there are fewer than 4 words', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      phase: 'not-enough-words',
      currentWord: null,
      direction: null,
    }))

    renderQuiz()
    expect(screen.getByText(/multiple choice mode requires at least/i)).toBeInTheDocument()
  })

  it('should render the word and direction indicator in question phase', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession(makeQuestionState()))

    renderQuiz()

    expect(screen.getByText('māja')).toBeInTheDocument()
    expect(screen.getByText('Latvian → English')).toBeInTheDocument()
  })

  it('should render exactly 4 option buttons', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession(makeQuestionState()))

    renderQuiz()

    // Each option rendered as a button - use aria-label pattern
    const buttons = screen.getAllByRole('button', { name: /option \d/i })
    expect(buttons).toHaveLength(4)
  })

  it('should display all option text values', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession(makeQuestionState()))

    renderQuiz()

    for (const option of mockOptions) {
      expect(screen.getByText(option)).toBeInTheDocument()
    }
  })

  it('should call selectOption with the button index when an option is clicked', async () => {
    const session = makeMockSession(makeQuestionState())
    mockUseChoiceQuizSession.mockReturnValue(session)

    renderQuiz()

    // Click the first option (index 0 = 'cat')
    await userEvent.click(screen.getByRole('button', { name: /option 1/i }))

    expect(session.selectOption).toHaveBeenCalledWith(0)
  })

  it('should call selectOption with the correct index when the correct option is clicked', async () => {
    const session = makeMockSession(makeQuestionState())
    mockUseChoiceQuizSession.mockReturnValue(session)

    renderQuiz()

    // Click the second option (index 1 = 'house', the correct answer)
    await userEvent.click(screen.getByRole('button', { name: /option 2/i }))

    expect(session.selectOption).toHaveBeenCalledWith(1)
  })

  it('should disable all option buttons after a selection', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      phase: 'feedback',
      selectedIndex: 0,
      lastCorrect: false,
    }))

    renderQuiz()

    const buttons = screen.getAllByRole('button', { name: /option \d/i })
    for (const btn of buttons) {
      expect(btn).toBeDisabled()
    }
  })

  it('should show Correct! feedback after selecting the correct option', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      phase: 'feedback',
      selectedIndex: mockCorrectIndex,
      lastCorrect: true,
    }))

    renderQuiz()

    expect(screen.getByText(/correct!/i)).toBeInTheDocument()
  })

  it('should show Incorrect feedback after selecting a wrong option', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      phase: 'feedback',
      selectedIndex: 0, // 'cat' - wrong
      lastCorrect: false,
    }))

    renderQuiz()

    expect(screen.getByText(/incorrect/i)).toBeInTheDocument()
  })

  it('should show Next word button after a selection', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      phase: 'feedback',
      selectedIndex: 0,
      lastCorrect: false,
    }))

    renderQuiz()

    expect(screen.getByRole('button', { name: /next word/i })).toBeInTheDocument()
  })

  it('should not show Next word button before a selection', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession(makeQuestionState()))

    renderQuiz()

    expect(screen.queryByRole('button', { name: /next word/i })).not.toBeInTheDocument()
  })

  it('should call advance when Next word button is clicked', async () => {
    const session = makeMockSession({
      ...makeQuestionState(),
      phase: 'feedback',
      selectedIndex: mockCorrectIndex,
      lastCorrect: true,
    })
    mockUseChoiceQuizSession.mockReturnValue(session)

    renderQuiz()

    await userEvent.click(screen.getByRole('button', { name: /next word/i }))
    expect(session.advance).toHaveBeenCalled()
  })

  it('should show "See results" instead of "Next word" when goal is reached', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      phase: 'feedback',
      selectedIndex: mockCorrectIndex,
      lastCorrect: true,
      wordsCompleted: 20,
      sessionGoal: 20,
    }))

    renderQuiz()

    expect(screen.getByRole('button', { name: /see results/i })).toBeInTheDocument()
  })

  it('should show session progress bar', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession(makeQuestionState()))

    renderQuiz()

    expect(screen.getByText('2 / 20')).toBeInTheDocument()
  })

  it('should show session complete screen when finished', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession({
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
    mockUseChoiceQuizSession.mockReturnValue(session)

    renderQuiz()

    await userEvent.click(screen.getByRole('button', { name: /end session/i }))
    expect(session.endSession).toHaveBeenCalled()
  })

  it('should show error state with retry button', () => {
    const session = makeMockSession({
      ...makeQuestionState(),
      phase: 'finished',
      currentWord: null,
      direction: null,
      error: 'Failed to load words',
    })
    mockUseChoiceQuizSession.mockReturnValue(session)

    renderQuiz()

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('should call restart when try again button is clicked', async () => {
    const session = makeMockSession({
      ...makeQuestionState(),
      phase: 'finished',
      currentWord: null,
      direction: null,
      error: 'Failed to load words',
    })
    mockUseChoiceQuizSession.mockReturnValue(session)

    renderQuiz()

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(session.restart).toHaveBeenCalled()
  })

  it('should show the word in reverse direction correctly', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      direction: 'target-to-source',
    }))

    renderQuiz()

    // In target-to-source, the question card shows the target word via aria-label
    expect(screen.getByLabelText(/translate: house/i)).toBeInTheDocument()
    expect(screen.getByText('English → Latvian')).toBeInTheDocument()
  })

  it('should display word notes when present', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession({
      ...makeQuestionState(),
      currentWord: {
        ...mockWord,
        notes: 'used for a building',
      },
    }))

    renderQuiz()
    expect(screen.getByText('used for a building')).toBeInTheDocument()
  })

  it('should have accessible aria-labels on option buttons', () => {
    mockUseChoiceQuizSession.mockReturnValue(makeMockSession(makeQuestionState()))

    renderQuiz()

    expect(screen.getByRole('button', { name: /option 1: cat/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /option 2: house/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /option 3: dog/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /option 4: table/i })).toBeInTheDocument()
  })
})
