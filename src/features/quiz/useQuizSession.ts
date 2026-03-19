/**
 * useQuizSession - unified hook that manages state and logic for a quiz session
 * across all three modes: 'type', 'choice', and 'mixed'.
 *
 * Responsibilities:
 * - Loads the next batch of words via the spaced repetition engine.
 * - For 'choice' and 'mixed' modes, loads all words to build a distractor pool
 *   and checks the MIN_WORDS_FOR_CHOICE guard.
 * - In 'mixed' mode, determines per-question mode using selectModeForWord (confidence
 *   heuristic + consecutive-mode cap).
 * - Manages both typed-answer submission and choice-option selection.
 * - Records each attempt through the spaced repetition engine.
 * - Tracks session progress against the daily goal.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Word, LanguagePair, UserSettings, QuizMode, QuizDirection } from '@/types'
import type { AnswerMatchResult } from '@/utils/matching'
import { matchAnswer } from '@/utils/matching'
import { useStorage } from '@/hooks/useStorage'
import { getNextWords, recordAttempt } from '@/services/spacedRepetition'
import type { WordForQuiz } from '@/services/spacedRepetition'
import { generateDistractors, MIN_WORDS_FOR_CHOICE } from '@/utils/distractorGenerator'
import type { DistractorResult } from '@/utils/distractorGenerator'

// ─── Public types ─────────────────────────────────────────────────────────────

export type SessionPhase =
  | 'loading'           // fetching words
  | 'not-enough-words'  // fewer than MIN_WORDS_FOR_CHOICE words (choice/mixed only)
  | 'question'          // showing a word, waiting for input
  | 'feedback'          // showing result, about to advance
  | 'finished'          // session complete

export type ActiveQuizMode = 'type' | 'choice'

export interface QuizSessionState {
  readonly phase: SessionPhase
  /** The current word being quizzed. */
  readonly currentWord: Word | null
  /** The direction for the current question. */
  readonly direction: QuizDirection | null
  /** The active language pair. */
  readonly pair: LanguagePair | null
  /** Which quiz mode is active for the current question (varies per-question in mixed). */
  readonly currentMode: ActiveQuizMode
  /** Number of words completed in this session. */
  readonly wordsCompleted: number
  /** Total words in this session (= daily goal). */
  readonly sessionGoal: number
  /** Number of correct answers this session. */
  readonly correctCount: number
  /** Error message if something went wrong. */
  readonly error: string | null
  // Type-mode state
  /** Result of the last typed answer (type mode only). */
  readonly lastResult: AnswerMatchResult | null
  // Choice-mode state
  /** Shuffled option strings for the current question (choice mode only). */
  readonly options: readonly string[]
  /** Index of the correct answer within options (choice mode only). */
  readonly correctIndex: number
  /** Index the user selected in choice mode (-1 if none yet). */
  readonly selectedIndex: number
  /** Whether the last choice selection was correct (choice mode only). */
  readonly lastChoiceCorrect: boolean | null
}

export interface UseQuizSessionResult {
  readonly state: QuizSessionState
  /** Submit a typed answer. No-ops if currentMode !== 'type'. */
  readonly submitAnswer: (userAnswer: string) => Promise<void>
  /** Record a choice selection. No-ops if currentMode !== 'choice'. */
  readonly selectOption: (index: number) => Promise<void>
  /** Advance past the feedback screen to the next word. */
  readonly advance: () => void
  /** Manually end the session early. */
  readonly endSession: () => void
  /** Start a new session (reset everything). */
  readonly restart: () => void
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface QueueItem {
  readonly wordForQuiz: WordForQuiz
  readonly mode: ActiveQuizMode
  /** Pre-generated distractors for choice questions (null for type questions). */
  readonly distractors: DistractorResult | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** How many words to pre-fetch per batch. */
const BATCH_SIZE = 20

/** Maximum number of consecutive questions in the same mode before forcing a switch. */
export const MAX_CONSECUTIVE_SAME_MODE = 3

/** Default ratio of type questions in mixed mode. 0.5 = 50% type / 50% choice. */
const DEFAULT_TYPE_RATIO = 0.5

/**
 * Confidence threshold below which a word is considered low-confidence.
 * Low-confidence words get a slight nudge toward choice mode in mixed sessions.
 */
const LOW_CONFIDENCE_THRESHOLD = 0.3

// ─── Mode selection logic ─────────────────────────────────────────────────────

/**
 * Determines the quiz mode for a word given the ratio, recent mode history,
 * and the word's confidence score.
 *
 * Rules (in priority order):
 * 1. If choice is unavailable, always return 'type'.
 * 2. If MAX_CONSECUTIVE_SAME_MODE of the same mode have occurred, force the other.
 * 3. If the word's confidence is below LOW_CONFIDENCE_THRESHOLD, lean toward 'choice'.
 * 4. Otherwise, decide probabilistically based on typeRatio.
 */
export function selectModeForWord(
  typeRatio: number,
  recentModes: readonly ActiveQuizMode[],
  confidence: number,
  choiceAvailable: boolean,
): ActiveQuizMode {
  if (!choiceAvailable) return 'type'

  // Enforce max-consecutive cap
  if (recentModes.length >= MAX_CONSECUTIVE_SAME_MODE) {
    const tail = recentModes.slice(-MAX_CONSECUTIVE_SAME_MODE)
    const allSame = tail.every((m) => m === tail[0])
    if (allSame) {
      return tail[0] === 'type' ? 'choice' : 'type'
    }
  }

  // Confidence heuristic: nudge low-confidence words toward choice
  const effectiveTypeRatio =
    confidence < LOW_CONFIDENCE_THRESHOLD ? typeRatio * 0.5 : typeRatio

  return Math.random() < effectiveTypeRatio ? 'type' : 'choice'
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages a full quiz session for a given language pair and mode.
 *
 * @param pair     - The active language pair, or null if none selected.
 * @param settings - Current user settings (daily goal, typo tolerance).
 * @param mode     - The quiz mode: 'type', 'choice', or 'mixed'.
 */
export function useQuizSession(
  pair: LanguagePair | null,
  settings: UserSettings,
  mode: QuizMode,
): UseQuizSessionResult {
  const storage = useStorage()

  const [phase, setPhase] = useState<SessionPhase>('loading')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [lastResult, setLastResult] = useState<AnswerMatchResult | null>(null)
  const [lastChoiceCorrect, setLastChoiceCorrect] = useState<boolean | null>(null)
  const [wordsCompleted, setWordsCompleted] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Recent mode history for consecutive-mode enforcement in mixed mode.
  const recentModesRef = useRef<ActiveQuizMode[]>([])
  // Distractor IDs used in the previous choice question (avoid repetition).
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
      // For choice and mixed modes we need all words to build the distractor pool.
      const needsDistractors = mode === 'choice' || mode === 'mixed'
      const allWords = needsDistractors ? await storage.getWords(pair.id) : []
      const choiceAvailable = allWords.length >= MIN_WORDS_FOR_CHOICE

      // For pure choice mode, enforce the minimum word count guard.
      if (mode === 'choice' && !choiceAvailable) {
        if (mountedRef.current) setPhase('not-enough-words')
        return
      }

      const wordsForQuiz = await getNextWords(storage, pair.id, BATCH_SIZE)

      if (!mountedRef.current) return

      if (wordsForQuiz.length === 0) {
        setPhase('finished')
        return
      }

      // Build the queue with per-word mode assignments and pre-generated distractors.
      const items: QueueItem[] = []
      let recentModes = recentModesRef.current
      let recentDistractorIds = recentDistractorIdsRef.current

      for (const wfq of wordsForQuiz) {
        let itemMode: ActiveQuizMode

        if (mode === 'type') {
          itemMode = 'type'
        } else if (mode === 'choice') {
          itemMode = 'choice'
        } else {
          // mixed: use confidence heuristic + consecutive cap
          const confidence = wfq.progress?.confidence ?? 0
          itemMode = selectModeForWord(DEFAULT_TYPE_RATIO, recentModes, confidence, choiceAvailable)
        }

        let distractors: DistractorResult | null = null

        if (itemMode === 'choice') {
          const result = generateDistractors(
            wfq.word,
            wfq.direction,
            allWords,
            recentDistractorIds,
          )

          if (result === null) {
            // Fallback to type mode if distractors cannot be generated.
            items.push({ wordForQuiz: wfq, mode: 'type', distractors: null })
            recentModes = [...recentModes, 'type']
            continue
          }

          distractors = result

          // Track which word IDs were used as distractors to avoid repetition.
          recentDistractorIds = allWords
            .filter(
              (w) =>
                w.id !== wfq.word.id &&
                result.options.includes(
                  wfq.direction === 'source-to-target' ? w.target : w.source,
                ),
            )
            .map((w) => w.id)
        }

        items.push({ wordForQuiz: wfq, mode: itemMode, distractors })
        recentModes = [...recentModes, itemMode]
      }

      if (items.length === 0) {
        setPhase('finished')
        return
      }

      recentModesRef.current = recentModes
      recentDistractorIdsRef.current = recentDistractorIds
      setQueue(items)
      setQueueIndex(0)
      setSelectedIndex(-1)
      setLastResult(null)
      setLastChoiceCorrect(null)
      setPhase('question')
    } catch (err) {
      if (!mountedRef.current) return
      const message = err instanceof Error ? err.message : 'Failed to load words'
      setError(message)
      setPhase('finished')
    }
  }, [storage, pair, mode])

  // Load words on mount and whenever pair or mode changes.
  useEffect(() => {
    void loadWords()
  }, [loadWords])

  // ─── Derived current item ──────────────────────────────────────────────────

  const currentItem = queueIndex < queue.length ? queue[queueIndex] : null
  const currentWord = currentItem?.wordForQuiz.word ?? null
  const direction = currentItem?.wordForQuiz.direction ?? null
  const currentMode: ActiveQuizMode = currentItem?.mode ?? 'type'
  const options = currentItem?.distractors?.options ?? []
  const correctIndex = currentItem?.distractors?.correctIndex ?? 0

  // ─── Submit answer (type mode) ─────────────────────────────────────────────

  const submitAnswer = useCallback(
    async (userAnswer: string): Promise<void> => {
      if (phase !== 'question' || currentWord === null || direction === null) return
      if (currentMode !== 'type') return

      const correctText =
        direction === 'source-to-target' ? currentWord.target : currentWord.source

      const matchResult = matchAnswer(userAnswer, correctText, settings.typoTolerance)
      const isCorrect = matchResult.result === 'correct' || matchResult.result === 'almost'

      try {
        await recordAttempt(storage, currentWord.id, isCorrect, direction, 'type')
      } catch (err) {
        console.error('Failed to record attempt:', err)
      }

      if (!mountedRef.current) return

      setLastResult(matchResult)
      setWordsCompleted((n) => n + 1)
      if (isCorrect) setCorrectCount((n) => n + 1)
      setPhase('feedback')
    },
    [phase, currentWord, direction, currentMode, settings.typoTolerance, storage],
  )

  // ─── Select option (choice mode) ───────────────────────────────────────────

  const selectOption = useCallback(
    async (index: number): Promise<void> => {
      if (phase !== 'question' || currentWord === null || direction === null) return
      if (currentMode !== 'choice') return
      // Prevent double-tap / selecting again after already selecting.
      if (selectedIndex !== -1) return

      const isCorrect = index === correctIndex

      try {
        await recordAttempt(storage, currentWord.id, isCorrect, direction, 'choice')
      } catch (err) {
        console.error('Failed to record attempt:', err)
      }

      if (!mountedRef.current) return

      setSelectedIndex(index)
      setLastChoiceCorrect(isCorrect)
      setWordsCompleted((n) => n + 1)
      if (isCorrect) setCorrectCount((n) => n + 1)
      setPhase('feedback')
    },
    [phase, currentWord, direction, currentMode, selectedIndex, correctIndex, storage],
  )

  // ─── Advance ───────────────────────────────────────────────────────────────

  const advance = useCallback((): void => {
    if (phase !== 'feedback') return

    const nextIndex = queueIndex + 1

    if (wordsCompleted >= sessionGoal || nextIndex >= queue.length) {
      setPhase('finished')
      return
    }

    setQueueIndex(nextIndex)
    setSelectedIndex(-1)
    setLastResult(null)
    setLastChoiceCorrect(null)
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
    setLastResult(null)
    setLastChoiceCorrect(null)
    setQueue([])
    setQueueIndex(0)
    recentModesRef.current = []
    recentDistractorIdsRef.current = []
    void loadWords()
  }, [loadWords])

  // ─── Return ────────────────────────────────────────────────────────────────

  const state: QuizSessionState = {
    phase,
    currentWord,
    direction,
    pair,
    currentMode,
    wordsCompleted,
    sessionGoal,
    correctCount,
    error,
    lastResult,
    options,
    correctIndex,
    selectedIndex,
    lastChoiceCorrect,
  }

  return { state, submitAnswer, selectOption, advance, endSession, restart }
}
