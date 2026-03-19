/**
 * useQuizSession - manages the state and logic for a single quiz session.
 *
 * Responsibilities:
 * - Loads the next batch of words via the spaced repetition engine.
 * - Tracks per-word attempt results within the session.
 * - Records each attempt through the spaced repetition engine (which persists progress).
 * - Tracks session progress against the daily goal.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Word, LanguagePair, UserSettings } from '@/types'
import type { QuizDirection } from '@/types'
import { useStorage } from '@/hooks/useStorage'
import { getNextWords, recordAttempt } from '@/services/spacedRepetition'
import { matchAnswer } from '@/utils/matching'
import type { AnswerMatchResult } from '@/utils/matching'
import type { WordForQuiz } from '@/services/spacedRepetition'

// ─── Session State ────────────────────────────────────────────────────────────

export type SessionPhase =
  | 'loading'      // fetching words
  | 'question'     // showing a word, waiting for input
  | 'feedback'     // showing result, about to advance
  | 'finished'     // session complete

export interface QuizSessionState {
  readonly phase: SessionPhase
  /** The current word being quizzed. */
  readonly currentWord: Word | null
  /** The direction for the current word. */
  readonly direction: QuizDirection | null
  /** The active language pair. */
  readonly pair: LanguagePair | null
  /** Result of the last submitted answer. */
  readonly lastResult: AnswerMatchResult | null
  /** Number of words completed in this session. */
  readonly wordsCompleted: number
  /** Total words in this session (= daily goal). */
  readonly sessionGoal: number
  /** Number of correct answers this session. */
  readonly correctCount: number
  /** Error message if something went wrong. */
  readonly error: string | null
}

export interface UseQuizSessionResult {
  readonly state: QuizSessionState
  /** Submit the user's typed answer for the current word. */
  readonly submitAnswer: (userAnswer: string) => Promise<void>
  /** Advance past the feedback screen to the next word. */
  readonly advance: () => void
  /** Manually end the session early. */
  readonly endSession: () => void
  /** Start a new session (reset everything). */
  readonly restart: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** How many words to pre-fetch per batch. */
const BATCH_SIZE = 20

/** Duration (ms) to show feedback before auto-advancing. */
export const FEEDBACK_DELAY_MS = 1500

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Manages a full quiz session for a given language pair.
 *
 * @param pair     - The active language pair, or null if none selected.
 * @param settings - The current user settings (daily goal, typo tolerance).
 */
export function useQuizSession(
  pair: LanguagePair | null,
  settings: UserSettings,
): UseQuizSessionResult {
  const storage = useStorage()

  const [phase, setPhase] = useState<SessionPhase>('loading')
  const [queue, setQueue] = useState<WordForQuiz[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [lastResult, setLastResult] = useState<AnswerMatchResult | null>(null)
  const [wordsCompleted, setWordsCompleted] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Track if the component is still mounted to avoid state updates after unmount.
  const mountedRef = useRef(true)
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const sessionGoal = settings.dailyGoal

  // ─── Load words ────────────────────────────────────────────────────────────

  const loadWords = useCallback(async (): Promise<void> => {
    if (pair === null) {
      if (mountedRef.current) {
        setPhase('finished')
      }
      return
    }

    if (mountedRef.current) {
      setPhase('loading')
      setError(null)
    }

    try {
      const words = await getNextWords(storage, pair.id, BATCH_SIZE)

      if (!mountedRef.current) return

      if (words.length === 0) {
        setPhase('finished')
        return
      }

      setQueue(words)
      setQueueIndex(0)
      setPhase('question')
    } catch (err) {
      if (!mountedRef.current) return
      const message = err instanceof Error ? err.message : 'Failed to load words'
      setError(message)
      setPhase('finished')
    }
  }, [storage, pair])

  // Load words on mount and whenever the pair changes.
  useEffect(() => {
    void loadWords()
  }, [loadWords])

  // ─── Derived current word ──────────────────────────────────────────────────

  const currentItem = queueIndex < queue.length ? queue[queueIndex] : null
  const currentWord = currentItem?.word ?? null
  const direction = currentItem?.direction ?? null

  // ─── Submit answer ─────────────────────────────────────────────────────────

  const submitAnswer = useCallback(
    async (userAnswer: string): Promise<void> => {
      if (phase !== 'question' || currentWord === null || direction === null) return

      const correctText = direction === 'source-to-target'
        ? currentWord.target
        : currentWord.source

      const matchResult = matchAnswer(userAnswer, correctText, settings.typoTolerance)
      const isCorrect = matchResult.result === 'correct' || matchResult.result === 'almost'

      // Record attempt via spaced repetition engine.
      try {
        await recordAttempt(storage, currentWord.id, isCorrect, direction, 'type')
      } catch (err) {
        // Non-fatal: log but don't interrupt the quiz.
        console.error('Failed to record attempt:', err)
      }

      if (!mountedRef.current) return

      setLastResult(matchResult)
      setWordsCompleted((n) => n + 1)
      if (isCorrect) {
        setCorrectCount((n) => n + 1)
      }
      setPhase('feedback')
    },
    [phase, currentWord, direction, settings.typoTolerance, storage],
  )

  // ─── Advance ───────────────────────────────────────────────────────────────

  const advance = useCallback((): void => {
    if (phase !== 'feedback') return

    const nextIndex = queueIndex + 1
    const newWordsCompleted = wordsCompleted

    // Session ends when the daily goal is reached or queue is exhausted.
    if (newWordsCompleted >= sessionGoal || nextIndex >= queue.length) {
      setPhase('finished')
      return
    }

    setQueueIndex(nextIndex)
    setLastResult(null)
    setPhase('question')
  }, [phase, queueIndex, wordsCompleted, sessionGoal, queue.length])

  // ─── End session ───────────────────────────────────────────────────────────

  const endSession = useCallback((): void => {
    setPhase('finished')
  }, [])

  // ─── Restart ───────────────────────────────────────────────────────────────

  const restart = useCallback((): void => {
    setWordsCompleted(0)
    setCorrectCount(0)
    setLastResult(null)
    setQueue([])
    setQueueIndex(0)
    void loadWords()
  }, [loadWords])

  // ─── Return ────────────────────────────────────────────────────────────────

  const state: QuizSessionState = {
    phase,
    currentWord,
    direction,
    pair,
    lastResult,
    wordsCompleted,
    sessionGoal,
    correctCount,
    error,
  }

  return { state, submitAnswer, advance, endSession, restart }
}
