/**
 * Tests for ChoiceQuizContent component.
 *
 * Covers:
 * - Auto-advance fires after ~1200ms when correct answer is selected
 * - Auto-advance does NOT fire for incorrect answers (manual advance required)
 * - "Next word" button still renders after correct answer (allows early tap)
 * - "See results" button renders when session goal has been reached
 * - Tapping "Next word" before the timer fires calls advance without double-advance
 * - Timer is cleaned up on unmount (no calls after unmount)
 * - Auto-advance works when session goal is reached (final question)
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
      { selectedIndex: 0, correctIndex: 0, lastChoiceCorrect: true },
      { advance },
    )

    renderContent(session)

    // Timer has not fired yet.
    expect(advance).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(advance).toHaveBeenCalledOnce()
  })

  it('should NOT auto-advance after selecting an incorrect answer', () => {
    const advance = vi.fn()
    // selectedIndex=1 is wrong; correctIndex=0
    const session = makeSession(
      { selectedIndex: 1, correctIndex: 0, lastChoiceCorrect: false },
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
      { selectedIndex: 0, correctIndex: 0, lastChoiceCorrect: true },
      { advance },
    )

    const { unmount } = renderContent(session)
    unmount()

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(advance).not.toHaveBeenCalled()
  })

  it('should still render "Next word" button after a correct answer (manual early tap)', () => {
    const session = makeSession({
      selectedIndex: 0,
      correctIndex: 0,
      lastChoiceCorrect: true,
      wordsCompleted: 0,
      sessionGoal: 10,
    })

    renderContent(session)

    expect(screen.getByRole('button', { name: /next word/i })).toBeInTheDocument()
  })

  it('should render "See results" button instead of "Next word" when goal is reached', () => {
    const session = makeSession({
      selectedIndex: 0,
      correctIndex: 0,
      lastChoiceCorrect: true,
      // wordsCompleted equals sessionGoal means last question was just answered
      wordsCompleted: 10,
      sessionGoal: 10,
    })

    renderContent(session)

    expect(screen.getByRole('button', { name: /see results/i })).toBeInTheDocument()
  })

  it('should auto-advance on the final question (session goal reached)', () => {
    const advance = vi.fn()
    const session = makeSession(
      {
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
      { selectedIndex: 0, correctIndex: 0, lastChoiceCorrect: true },
      { advance },
    )

    const { rerender } = renderContent(session)

    // User taps "Next word" early (before 1200ms). Use fireEvent for synchronous click with fake timers.
    act(() => {
      screen.getByRole('button', { name: /next word/i }).click()
    })

    // Advance was called once from the button click.
    expect(advance).toHaveBeenCalledOnce()

    // Simulate the component receiving new state after advance() was called:
    // parent clears selectedIndex so the effect dependency changes and the timer
    // is cancelled. Re-render with selectedIndex=-1 to simulate that.
    const resetSession = makeSession({ selectedIndex: -1, lastChoiceCorrect: null }, { advance })
    rerender(
      <ThemeProvider theme={createTheme()}>
        <ChoiceQuizContent session={resetSession} pair={mockPair} />
      </ThemeProvider>,
    )

    // Advancing timers beyond 1200ms should NOT trigger a second advance call.
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(advance).toHaveBeenCalledOnce()
  })

  it('should show "Correct!" feedback text after correct selection', () => {
    const session = makeSession({
      selectedIndex: 0,
      correctIndex: 0,
      lastChoiceCorrect: true,
    })

    renderContent(session)

    expect(screen.getByText('Correct!')).toBeInTheDocument()
  })

  it('should show "Incorrect" feedback text after wrong selection', () => {
    const session = makeSession({
      selectedIndex: 1,
      correctIndex: 0,
      lastChoiceCorrect: false,
    })

    renderContent(session)

    expect(screen.getByText('Incorrect')).toBeInTheDocument()
  })
})
