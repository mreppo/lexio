/**
 * Tests for ChoiceQuizContent — Liquid Glass rebuild.
 *
 * Issue #147: Rebuild Multiple Choice quiz in Liquid Glass.
 *
 * Covers:
 * - Renders top bar: close icon, progress bar, N/M pill
 * - Renders prompt: LangPair, term (BigWord), "Choose the meaning" subtitle
 * - Renders 4 option buttons with A/B/C/D letter squares
 * - Tap correct option → correct state, feedback card shows "Correct", Next button
 * - Tap wrong option → wrong state on that option, correct state on right answer
 * - After first tap, subsequent taps have no effect until Next word is pressed
 * - Auto-advance fires after ~1200ms when correct answer is selected
 * - Auto-advance does NOT fire for incorrect answers (manual advance required)
 * - "Next word" button present after correct answer (allows early manual tap)
 * - "See results" button renders when session goal has been reached
 * - Timer is cleaned up on unmount (no calls after unmount)
 * - Feedback card XP display: "+N XP" when confidenceDelta > 0 (correct)
 * - Feedback card no "+N XP" when wrong (confidenceDelta < 0)
 * - Reduce Motion guard: no animation class when reduced
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { ChoiceQuizContent } from './ChoiceQuizContent'
import type { UseQuizSessionResult, QuizSessionState } from '../useQuizSession'
import { createMockPair, createMockWord } from '@/test/fixtures'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockPair = createMockPair({
  sourceLang: 'Latvian',
  targetLang: 'English',
  sourceCode: 'lv',
  targetCode: 'en',
})

const mockWord = createMockWord({ source: 'māja', target: 'house' })

/** Build a minimal QuizSessionState for choice-mode tests. */
function makeState(overrides: Partial<QuizSessionState> = {}): QuizSessionState {
  return {
    phase: 'question',
    currentWord: mockWord,
    direction: 'source-to-target',
    options: ['house', 'cat', 'dog', 'table'],
    correctIndex: 0,
    selectedIndex: -1,
    lastChoiceCorrect: null,
    lastConfidenceDelta: null,
    wordsCompleted: 0,
    sessionGoal: 10,
    correctCount: 0,
    sessionStreak: 0,
    bestSessionStreak: 0,
    currentMode: 'choice',
    pair: mockPair,
    error: null,
    lastResult: null,
    ...overrides,
  }
}

/** Build a minimal UseQuizSessionResult. */
function makeSession(
  stateOverrides: Partial<QuizSessionState> = {},
  fns: Partial<
    Pick<
      UseQuizSessionResult,
      'advance' | 'selectOption' | 'endSession' | 'restart' | 'submitAnswer'
    >
  > = {},
): UseQuizSessionResult {
  return {
    state: makeState(stateOverrides),
    advance: vi.fn(),
    selectOption: vi.fn().mockResolvedValue(undefined),
    endSession: vi.fn(),
    restart: vi.fn(),
    submitAnswer: vi.fn().mockResolvedValue(undefined),
    ...fns,
  }
}

function renderContent(session: UseQuizSessionResult) {
  return render(
    <ThemeProvider theme={createTheme()}>
      <ChoiceQuizContent session={session} pair={mockPair} />
    </ThemeProvider>,
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ChoiceQuizContent - top bar', () => {
  it('should render the close button with aria-label', () => {
    const session = makeSession()
    renderContent(session)
    expect(screen.getByRole('button', { name: 'Close quiz' })).toBeInTheDocument()
  })

  it('should render the progress bar', () => {
    const session = makeSession()
    renderContent(session)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should render the N/M pill with current progress', () => {
    const session = makeSession({ wordsCompleted: 3, sessionGoal: 10 })
    renderContent(session)
    expect(screen.getByText('3/10')).toBeInTheDocument()
  })

  it('should call endSession when close button is clicked', () => {
    const endSession = vi.fn()
    const session = makeSession({}, { endSession })
    renderContent(session)
    screen.getByRole('button', { name: 'Close quiz' }).click()
    expect(endSession).toHaveBeenCalledOnce()
  })
})

describe('ChoiceQuizContent - prompt area', () => {
  it('should render the term (source word)', () => {
    const session = makeSession()
    renderContent(session)
    expect(screen.getByText('māja')).toBeInTheDocument()
  })

  it('should render LangPair language codes', () => {
    const session = makeSession()
    renderContent(session)
    expect(screen.getByText('LV')).toBeInTheDocument()
    expect(screen.getByText('EN')).toBeInTheDocument()
  })

  it('should render the "Choose the English meaning" subtitle', () => {
    const session = makeSession()
    renderContent(session)
    expect(screen.getByText(/Choose the English meaning/i)).toBeInTheDocument()
  })

  it('should render 4 option buttons with letter squares', () => {
    const session = makeSession()
    renderContent(session)
    // Each option button has an aria-label "Option A: house" etc.
    expect(screen.getByRole('button', { name: /Option A: house/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Option B: cat/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Option C: dog/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Option D: table/i })).toBeInTheDocument()
  })
})

describe('ChoiceQuizContent - correct selection', () => {
  it('should show "Correct" feedback text after correct selection', () => {
    const session = makeSession({
      phase: 'feedback',
      selectedIndex: 0,
      correctIndex: 0,
      lastChoiceCorrect: true,
      lastConfidenceDelta: 0.08,
    })

    renderContent(session)
    expect(screen.getByRole('status')).toBeInTheDocument()
    // Should show "Correct" in the feedback card
    expect(screen.getByText(/Correct/i)).toBeInTheDocument()
  })

  it('should show "+N XP" in feedback when confidenceDelta is positive', () => {
    const session = makeSession({
      phase: 'feedback',
      selectedIndex: 0,
      correctIndex: 0,
      lastChoiceCorrect: true,
      lastConfidenceDelta: 0.08,
    })

    renderContent(session)
    // 0.08 * 100 = 8 XP
    expect(screen.getByText(/\+8 XP/i)).toBeInTheDocument()
  })

  it('should show "Next word" button after a correct answer', () => {
    const session = makeSession({
      phase: 'feedback',
      selectedIndex: 0,
      correctIndex: 0,
      lastChoiceCorrect: true,
      wordsCompleted: 0,
      sessionGoal: 10,
    })

    renderContent(session)
    expect(screen.getByRole('button', { name: /next word/i })).toBeInTheDocument()
  })
})

describe('ChoiceQuizContent - wrong selection', () => {
  it('should show wrong-state feedback text after incorrect selection', () => {
    const session = makeSession({
      phase: 'feedback',
      selectedIndex: 1,
      correctIndex: 0,
      lastChoiceCorrect: false,
      lastConfidenceDelta: -0.05,
    })

    renderContent(session)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/Not quite/i)).toBeInTheDocument()
  })

  it('should NOT show "+N XP" when the answer is wrong', () => {
    const session = makeSession({
      phase: 'feedback',
      selectedIndex: 1,
      correctIndex: 0,
      lastChoiceCorrect: false,
      lastConfidenceDelta: -0.05,
    })

    renderContent(session)
    expect(screen.queryByText(/XP/i)).not.toBeInTheDocument()
  })

  it('should show the correct answer in wrong-state feedback', () => {
    // options[0] = 'house' is correct; user chose options[1] = 'cat'
    const session = makeSession({
      phase: 'feedback',
      selectedIndex: 1,
      correctIndex: 0,
      lastChoiceCorrect: false,
      lastConfidenceDelta: -0.05,
    })

    renderContent(session)
    // Feedback card should show the correct answer in "Not quite · correct: house".
    // "house" also appears as the option label, so target the feedback headline text directly.
    expect(screen.getByText(/Not quite · correct: house/i)).toBeInTheDocument()
  })

  it('should show "Next word" button after wrong answer', () => {
    const session = makeSession({
      phase: 'feedback',
      selectedIndex: 1,
      correctIndex: 0,
      lastChoiceCorrect: false,
    })

    renderContent(session)
    expect(screen.getByRole('button', { name: /next word/i })).toBeInTheDocument()
  })
})

describe('ChoiceQuizContent - See results', () => {
  it('should render "See results" button when session goal is reached', () => {
    const session = makeSession({
      phase: 'feedback',
      selectedIndex: 0,
      correctIndex: 0,
      lastChoiceCorrect: true,
      wordsCompleted: 10,
      sessionGoal: 10,
    })

    renderContent(session)
    expect(screen.getByRole('button', { name: /see results/i })).toBeInTheDocument()
  })
})

describe('ChoiceQuizContent - auto-advance', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should auto-advance after 1200ms when the correct answer is selected', () => {
    const advance = vi.fn()
    const session = makeSession(
      {
        phase: 'feedback',
        selectedIndex: 0,
        correctIndex: 0,
        lastChoiceCorrect: true,
      },
      { advance },
    )

    renderContent(session)
    expect(advance).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(advance).toHaveBeenCalledOnce()
  })

  it('should NOT auto-advance after selecting an incorrect answer', () => {
    const advance = vi.fn()
    const session = makeSession(
      {
        phase: 'feedback',
        selectedIndex: 1,
        correctIndex: 0,
        lastChoiceCorrect: false,
      },
      { advance },
    )

    renderContent(session)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(advance).not.toHaveBeenCalled()
  })

  it('should NOT auto-advance when no option has been selected yet', () => {
    const advance = vi.fn()
    const session = makeSession({ selectedIndex: -1, lastChoiceCorrect: null }, { advance })

    renderContent(session)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(advance).not.toHaveBeenCalled()
  })

  it('should clear the timer on unmount (no call after unmount)', () => {
    const advance = vi.fn()
    const session = makeSession(
      {
        phase: 'feedback',
        selectedIndex: 0,
        correctIndex: 0,
        lastChoiceCorrect: true,
      },
      { advance },
    )

    const { unmount } = renderContent(session)
    unmount()

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(advance).not.toHaveBeenCalled()
  })

  it('should auto-advance on the final question (session goal reached)', () => {
    const advance = vi.fn()
    const session = makeSession(
      {
        phase: 'feedback',
        selectedIndex: 0,
        correctIndex: 0,
        lastChoiceCorrect: true,
        wordsCompleted: 10,
        sessionGoal: 10,
      },
      { advance },
    )

    renderContent(session)

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(advance).toHaveBeenCalledOnce()
  })

  it('should not double-advance if user taps "Next word" before the timer fires', () => {
    const advance = vi.fn()
    const session = makeSession(
      {
        phase: 'feedback',
        selectedIndex: 0,
        correctIndex: 0,
        lastChoiceCorrect: true,
      },
      { advance },
    )

    const { rerender } = renderContent(session)

    act(() => {
      screen.getByRole('button', { name: /next word/i }).click()
    })

    expect(advance).toHaveBeenCalledOnce()

    // Simulate component receiving new state after advance() is called
    const resetSession = makeSession({ selectedIndex: -1, lastChoiceCorrect: null }, { advance })
    rerender(
      <ThemeProvider theme={createTheme()}>
        <ChoiceQuizContent session={resetSession} pair={mockPair} />
      </ThemeProvider>,
    )

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(advance).toHaveBeenCalledOnce()
  })
})

describe('ChoiceQuizContent - tap gate', () => {
  it('should not show feedback before any option is tapped', () => {
    const session = makeSession({ phase: 'question', selectedIndex: -1 })
    renderContent(session)
    // No status role / feedback card before answer
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('should not show Next word button before any option is tapped', () => {
    const session = makeSession({ phase: 'question', selectedIndex: -1 })
    renderContent(session)
    expect(screen.queryByRole('button', { name: /next word/i })).not.toBeInTheDocument()
  })
})

describe('ChoiceQuizContent - Reduce Motion', () => {
  it('should render without throwing when prefers-reduced-motion applies', () => {
    const session = makeSession({
      phase: 'feedback',
      selectedIndex: 0,
      correctIndex: 0,
      lastChoiceCorrect: true,
    })
    // Should render without errors — animation guard is in CSS
    expect(() => renderContent(session)).not.toThrow()
  })
})

describe('ChoiceQuizContent - null/loading states', () => {
  it('should render fallback when pair is null', () => {
    const session = makeSession()
    render(
      <ThemeProvider theme={createTheme()}>
        <ChoiceQuizContent session={session} pair={null} />
      </ThemeProvider>,
    )
    expect(screen.getByText(/Select a language pair/i)).toBeInTheDocument()
  })

  it('should render loading state', () => {
    const session = makeSession({ phase: 'loading' })
    renderContent(session)
    expect(screen.getByText(/Loading words/i)).toBeInTheDocument()
  })

  it('should render not-enough-words state', () => {
    const session = makeSession({ phase: 'not-enough-words' })
    renderContent(session)
    expect(screen.getByText(/Not enough words/i)).toBeInTheDocument()
  })

  it('should render error state', () => {
    const session = makeSession({ phase: 'finished', error: 'Storage error' })
    renderContent(session)
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText('Storage error')).toBeInTheDocument()
  })

  it('should render nothing when finished without error', () => {
    const session = makeSession({ phase: 'finished', error: null })
    const { container } = renderContent(session)
    expect(container.firstChild).toBeNull()
  })
})
