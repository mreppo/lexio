/**
 * useChoiceQuizSession - manages state and logic for a multiple-choice quiz session.
 *
 * Responsibilities:
 * - Loads the next batch of words via the spaced repetition engine.
 * - For each word, generates 4 options (1 correct + 3 distractors).
 * - Tracks selection state and feedback within the session.
 * - Records each attempt through the spaced repetition engine.
 * - Tracks session progress against the daily goal.
 * - Handles the "not enough words" case gracefully.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Word, LanguagePair, UserSettings, QuizDirection } from '@/types'
import { useStorage } from '@/hooks/useStorage'
import { getNextWords, recordAttempt } from '@/services/spacedRepetition'
import {
  generateDistractors,
  MIN_WORDS_FOR_CHOICE,
} from '@/utils/distractorGenerator'
import type { DistractorResult } from '@/utils/distractorGenerator'
import type { WordForQuiz } from '@/services/spacedRepetition'

// ─── Session State ────────────────────────────────────────────────────────────

export type ChoiceSessionPhase =
  | 'loading'         // fetching words from storage
  | 'not-enough-words' // fewer than 4 words in the pair
  | 'question'        // showing options, waiting for selection
  | 'feedback'        // showing result, about to advance
  | 'finished'        // session complete

export interface ChoiceQuizSessionState {
  readonly phase: ChoiceSessionPhase
  /** The current word being quizzed. */
  readonly currentWord: Word | null
  /** The direction for the current question. */
  readonly direction: QuizDirection | null
  /** The active language pair. */
  readonly pair: LanguagePair | null
  /** Shuffled option strings for the current question. */
  readonly options: readonly string[]
  /** Index of the correct answer within `options`. */
  readonly correctIndex: number
  /** Index the user selected (-1 if none yet). */
  readonly selectedIndex: number
  /** Whether the user's last selection was correct. */
  readonly lastCorrect: boolean | null
  /** Number of words completed in this session. */
  readonly wordsCompleted: number
  /** Total words in this session (= daily goal). */
  readonly sessionGoal: number
  /** Number of correct answers this session. */
  readonly correctCount: number
  /** Error message if something went wrong. */
  readonly error: string | null
}

export interface UseChoiceQuizSessionResult {
  readonly state: ChoiceQuizSessionState
  /** Record the user's option selection for the current word. */
  readonly selectOption: (index: number) => Promise<void>
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

// ─── Internal item type ───────────────────────────────────────────────────────

interface ChoiceItem {
  readonly wordForQuiz: WordForQuiz
  readonly distractors: DistractorResult
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages a full multiple-choice quiz session for a given language pair.
 *
 * @param pair     - The active language pair, or null if none selected.
 * @param settings - The current user settings (daily goal).
 */
export function useChoiceQuizSession(
  pair: LanguagePair | null,
  settings: UserSettings,
): UseChoiceQuizSessionResult {
  const storage = useStorage()

  const [phase, setPhase] = useState<ChoiceSessionPhase>('loading')
  const [queue, setQueue] = useState<ChoiceItem[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [wordsCompleted, setWordsCompleted] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  // IDs of distractors used in the previous question (avoid repetition)
  const recentDistractorIdsRef = useRef<readonly string[]>([])

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
      if (mountedRef.current) setPhase('finished')
      return
    }

    if (mountedRef.current) {
      setPhase('loading')
      setError(null)
    }

    try {
      // We need all words in the pair to generate distractors.
      const allWords = await storage.getWords(pair.id)

      if (!mountedRef.current) return

      if (allWords.length < MIN_WORDS_FOR_CHOICE) {
        setPhase('not-enough-words')
        return
      }

      const wordsForQuiz = await getNextWords(storage, pair.id, BATCH_SIZE)

      if (!mountedRef.current) return

      if (wordsForQuiz.length === 0) {
        setPhase('finished')
        return
      }

      // Build ChoiceItems - generate distractors for each word upfront.
      const items: ChoiceItem[] = []
      let recentIds: readonly string[] = recentDistractorIdsRef.current

      for (const wfq of wordsForQuiz) {
        const result = generateDistractors(
          wfq.word,
          wfq.direction,
          allWords,
          recentIds,
        )

        if (result === null) {
          // Shouldn't happen (we checked length above) but handle gracefully.
          continue
        }

        items.push({ wordForQuiz: wfq, distractors: result })

        // The distractor IDs for this question become "recent" for the next.
        recentIds = allWords
          .filter(
            (w) =>
              w.id !== wfq.word.id &&
              result.options.includes(
                wfq.direction === 'source-to-target' ? w.target : w.source,
              ),
          )
          .map((w) => w.id)
      }

      if (items.length === 0) {
        setPhase('finished')
        return
      }

      recentDistractorIdsRef.current = recentIds
      setQueue(items)
      setQueueIndex(0)
      setSelectedIndex(-1)
      setLastCorrect(null)
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

  // ─── Derived current item ──────────────────────────────────────────────────

  const currentItem = queueIndex < queue.length ? queue[queueIndex] : null
  const currentWord = currentItem?.wordForQuiz.word ?? null
  const direction = currentItem?.wordForQuiz.direction ?? null
  const options = currentItem?.distractors.options ?? []
  const correctIndex = currentItem?.distractors.correctIndex ?? 0

  // ─── Select option ─────────────────────────────────────────────────────────

  const selectOption = useCallback(
    async (index: number): Promise<void> => {
      if (phase !== 'question' || currentWord === null || direction === null) return
      // Prevent double-tap / selecting again after already selecting
      if (selectedIndex !== -1) return

      const isCorrect = index === correctIndex

      // Record attempt via spaced repetition engine.
      try {
        await recordAttempt(storage, currentWord.id, isCorrect, direction, 'choice')
      } catch (err) {
        // Non-fatal: log but don't interrupt the quiz.
        console.error('Failed to record attempt:', err)
      }

      if (!mountedRef.current) return

      setSelectedIndex(index)
      setLastCorrect(isCorrect)
      setWordsCompleted((n) => n + 1)
      if (isCorrect) {
        setCorrectCount((n) => n + 1)
      }
      setPhase('feedback')
    },
    [phase, currentWord, direction, correctIndex, selectedIndex, storage],
  )

  // ─── Advance ───────────────────────────────────────────────────────────────

  const advance = useCallback((): void => {
    if (phase !== 'feedback') return

    const nextIndex = queueIndex + 1
    const newWordsCompleted = wordsCompleted

    if (newWordsCompleted >= sessionGoal || nextIndex >= queue.length) {
      setPhase('finished')
      return
    }

    setQueueIndex(nextIndex)
    setSelectedIndex(-1)
    setLastCorrect(null)
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
    setSelectedIndex(-1)
    setLastCorrect(null)
    setQueue([])
    setQueueIndex(0)
    recentDistractorIdsRef.current = []
    void loadWords()
  }, [loadWords])

  // ─── Return ────────────────────────────────────────────────────────────────

  const state: ChoiceQuizSessionState = {
    phase,
    currentWord,
    direction,
    pair,
    options,
    correctIndex,
    selectedIndex,
    lastCorrect,
    wordsCompleted,
    sessionGoal,
    correctCount,
    error,
  }

  return { state, selectOption, advance, endSession, restart }
}
