/**
 * useMixedQuizSession - manages state and logic for a mixed-mode quiz session.
 *
 * Responsibilities:
 * - Loads the next batch of words via the spaced repetition engine.
 * - For each word, determines whether to use 'type' or 'choice' mode based on:
 *   - A configurable type/choice ratio (default 50/50).
 *   - A consecutive-mode cap: no more than MAX_CONSECUTIVE_SAME_MODE questions
 *     of the same mode in a row.
 *   - An optional confidence heuristic: lower-confidence words lean toward choice.
 * - Manages both type-mode answer submission and choice-mode option selection.
 * - Records each attempt through the spaced repetition engine.
 * - Tracks session progress against the daily goal.
 * - Handles the "not enough words for choice" fallback gracefully.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Word, LanguagePair, UserSettings, QuizDirection } from '@/types'
import type { AnswerMatchResult } from '@/utils/matching'
import { matchAnswer } from '@/utils/matching'
import { useStorage } from '@/hooks/useStorage'
import { getNextWords, recordAttempt } from '@/services/spacedRepetition'
import type { WordForQuiz } from '@/services/spacedRepetition'
import { generateDistractors, MIN_WORDS_FOR_CHOICE } from '@/utils/distractorGenerator'
import type { DistractorResult } from '@/utils/distractorGenerator'

// ─── Public types ────────────────────────────────────────────────────────────

export type MixedSessionPhase =
  | 'loading'
  | 'question'
  | 'feedback'
  | 'finished'

export type ActiveQuizMode = 'type' | 'choice'

export interface MixedQuizSessionState {
  readonly phase: MixedSessionPhase
  /** The current word being quizzed. */
  readonly currentWord: Word | null
  /** Direction for the current question. */
  readonly direction: QuizDirection | null
  /** The active language pair. */
  readonly pair: LanguagePair | null
  /** Which quiz mode is active for the current question. */
  readonly currentMode: ActiveQuizMode
  /** Options for choice mode (empty when currentMode === 'type'). */
  readonly options: readonly string[]
  /** Index of the correct answer within options (choice mode only). */
  readonly correctIndex: number
  /** Index the user selected in choice mode (-1 if none yet). */
  readonly selectedIndex: number
  /** Result of the last typed answer (type mode only). */
  readonly lastResult: AnswerMatchResult | null
  /** Whether the last choice selection was correct (choice mode only). */
  readonly lastChoiceCorrect: boolean | null
  /** Number of words completed this session. */
  readonly wordsCompleted: number
  /** Total words in this session (= daily goal). */
  readonly sessionGoal: number
  /** Number of correct answers this session. */
  readonly correctCount: number
  /** Error message if something went wrong. */
  readonly error: string | null
}

export interface UseMixedQuizSessionResult {
  readonly state: MixedQuizSessionState
  /** Submit typed answer (for type mode). */
  readonly submitAnswer: (userAnswer: string) => Promise<void>
  /** Record option selection (for choice mode). */
  readonly selectOption: (index: number) => Promise<void>
  /** Advance past feedback to the next word. */
  readonly advance: () => void
  /** Manually end the session. */
  readonly endSession: () => void
  /** Start a new session (reset everything). */
  readonly restart: () => void
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface MixedItem {
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

/** Default ratio of type questions. 0.5 = 50% type / 50% choice. */
const DEFAULT_TYPE_RATIO = 0.5

/**
 * Confidence threshold below which a word is considered low-confidence.
 * Low-confidence words get a slight nudge toward choice mode.
 */
const LOW_CONFIDENCE_THRESHOLD = 0.3

// ─── Mode selection logic ─────────────────────────────────────────────────────

/**
 * Determines the quiz mode for a word given the ratio, recent mode history,
 * and the word's confidence score.
 *
 * Rules (in priority order):
 * 1. If MAX_CONSECUTIVE_SAME_MODE of the same mode have occurred, force the other.
 * 2. If the word's confidence is below LOW_CONFIDENCE_THRESHOLD, lean toward 'choice'.
 * 3. Otherwise, decide probabilistically based on typeRatio.
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
 * Manages a full mixed-mode quiz session for a given language pair.
 *
 * @param pair     - The active language pair, or null if none selected.
 * @param settings - Current user settings (daily goal, typo tolerance).
 * @param typeRatio - Fraction of questions that should be type mode (0–1). Default 0.5.
 */
export function useMixedQuizSession(
  pair: LanguagePair | null,
  settings: UserSettings,
  typeRatio: number = DEFAULT_TYPE_RATIO,
): UseMixedQuizSessionResult {
  const storage = useStorage()

  const [phase, setPhase] = useState<MixedSessionPhase>('loading')
  const [queue, setQueue] = useState<MixedItem[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [lastResult, setLastResult] = useState<AnswerMatchResult | null>(null)
  const [lastChoiceCorrect, setLastChoiceCorrect] = useState<boolean | null>(null)
  const [wordsCompleted, setWordsCompleted] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Recent mode history for consecutive-mode enforcement.
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

  // ─── Load words ──────────────────────────────────────────────────────────

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
      const allWords = await storage.getWords(pair.id)
      const choiceAvailable = allWords.length >= MIN_WORDS_FOR_CHOICE

      const wordsForQuiz = await getNextWords(storage, pair.id, BATCH_SIZE)

      if (!mountedRef.current) return

      if (wordsForQuiz.length === 0) {
        setPhase('finished')
        return
      }

      const items: MixedItem[] = []
      let recentModes = recentModesRef.current
      let recentDistractorIds = recentDistractorIdsRef.current

      for (const wfq of wordsForQuiz) {
        const confidence = wfq.progress?.confidence ?? 0
        const mode = selectModeForWord(typeRatio, recentModes, confidence, choiceAvailable)

        let distractors: DistractorResult | null = null

        if (mode === 'choice') {
          const result = generateDistractors(
            wfq.word,
            wfq.direction,
            allWords,
            recentDistractorIds,
          )

          if (result === null) {
            // Fallback to type mode if distractors can't be generated.
            items.push({ wordForQuiz: wfq, mode: 'type', distractors: null })
            recentModes = [...recentModes, 'type']
            continue
          }

          distractors = result

          // Track which word IDs were used as distractors.
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

        items.push({ wordForQuiz: wfq, mode, distractors })
        recentModes = [...recentModes, mode]
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
  }, [storage, pair, typeRatio])

  // Load words on mount and whenever the pair changes.
  useEffect(() => {
    void loadWords()
  }, [loadWords])

  // ─── Derived current item ────────────────────────────────────────────────

  const currentItem = queueIndex < queue.length ? queue[queueIndex] : null
  const currentWord = currentItem?.wordForQuiz.word ?? null
  const direction = currentItem?.wordForQuiz.direction ?? null
  const currentMode: ActiveQuizMode = currentItem?.mode ?? 'type'
  const options = currentItem?.distractors?.options ?? []
  const correctIndex = currentItem?.distractors?.correctIndex ?? 0

  // ─── Submit answer (type mode) ────────────────────────────────────────────

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

  // ─── Select option (choice mode) ──────────────────────────────────────────

  const selectOption = useCallback(
    async (index: number): Promise<void> => {
      if (phase !== 'question' || currentWord === null || direction === null) return
      if (currentMode !== 'choice') return
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

  // ─── Advance ──────────────────────────────────────────────────────────────

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

  // ─── End session ──────────────────────────────────────────────────────────

  const endSession = useCallback((): void => {
    setPhase('finished')
  }, [])

  // ─── Restart ──────────────────────────────────────────────────────────────

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

  // ─── Return ───────────────────────────────────────────────────────────────

  const state: MixedQuizSessionState = {
    phase,
    currentWord,
    direction,
    pair,
    currentMode,
    options,
    correctIndex,
    selectedIndex,
    lastResult,
    lastChoiceCorrect,
    wordsCompleted,
    sessionGoal,
    correctCount,
    error,
  }

  return { state, submitAnswer, selectOption, advance, endSession, restart }
}
