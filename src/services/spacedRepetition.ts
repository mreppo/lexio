/**
 * Spaced repetition engine - core learning algorithm for Lexio.
 *
 * Implements a simplified SM-2-inspired algorithm that:
 * - Tracks confidence scores (0-1) per word
 * - Schedules next review based on confidence level
 * - Weights recent attempts more heavily than older ones
 * - Applies streak multipliers for accelerated spacing
 * - Selects words for quiz with priority: overdue > new > low confidence
 */

import type {
  Word,
  WordProgress,
  AttemptRecord,
  QuizDirection,
  QuizMode,
  DailyStats,
  CefrLevel,
} from '@/types'
import type { StorageService } from '@/services/storage/StorageService'
import { filterWordsByLevels } from '@/utils/cefrFilter'

// ─── Configuration ───────────────────────────────────────────────────────────
// All algorithm parameters are here - change these to tune behaviour.

export const SPACED_REPETITION_CONFIG = {
  /** Maximum number of attempt records to keep per word. */
  MAX_HISTORY_SIZE: 50,

  /** How many recent attempts to include in weighted confidence calculation. */
  WEIGHTED_WINDOW_SIZE: 10,

  /**
   * Weights applied to the most-recent attempt (index 0 = most recent).
   * The array length should equal WEIGHTED_WINDOW_SIZE.
   * Older attempts beyond this window are averaged with equal weight 1.
   */
  RECENCY_WEIGHTS: [10, 8, 6, 5, 4, 3, 2, 2, 1, 1] as readonly number[],

  /** Minimum streak length to start applying the streak multiplier. */
  STREAK_THRESHOLD: 3,

  /**
   * Confidence boost multiplier applied when streak >= STREAK_THRESHOLD.
   * Values > 1 accelerate confidence gain for strong streaks.
   */
  STREAK_MULTIPLIER: 1.15,

  // ─── Review interval schedule (milliseconds) ────────────────────────────
  // These map confidence ranges to review intervals.

  /** Confidence < 0.2 → review within 5 minutes (same session). */
  INTERVAL_VERY_LOW_MS: 5 * 60 * 1000,

  /** Confidence 0.2–0.4 → review within 4 hours. */
  INTERVAL_LOW_MS: 4 * 60 * 60 * 1000,

  /** Confidence 0.4–0.6 → review within 1.5 days. */
  INTERVAL_MEDIUM_MS: 1.5 * 24 * 60 * 60 * 1000,

  /** Confidence 0.6–0.8 → review within 5 days. */
  INTERVAL_HIGH_MS: 5 * 24 * 60 * 60 * 1000,

  /** Confidence >= 0.8 → review within 14 days. */
  INTERVAL_VERY_HIGH_MS: 14 * 24 * 60 * 60 * 1000,

  /**
   * Maximum number of new (never-reviewed) words to include per quiz batch.
   * New words are mixed in gradually to avoid overwhelming the learner.
   */
  MAX_NEW_WORDS_PER_BATCH: 3,
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

/** A word prepared for quiz, paired with the direction to quiz it in. */
export interface WordForQuiz {
  readonly word: Word
  readonly direction: QuizDirection
  readonly progress: WordProgress | null
}

// ─── Confidence Calculation ───────────────────────────────────────────────────

/**
 * Calculates a confidence score (0–1) from a word's attempt history.
 *
 * Uses exponentially-decayed weighting: the most recent attempt counts 10x
 * more than attempts from several sessions ago. A streak of 3+ correct answers
 * boosts confidence faster. A single incorrect answer after a long streak
 * doesn't completely reset progress.
 */
export function calculateConfidence(
  history: readonly AttemptRecord[],
  currentStreak: number,
): number {
  if (history.length === 0) return 0

  const cfg = SPACED_REPETITION_CONFIG
  const recentAttempts = [...history].slice(-cfg.WEIGHTED_WINDOW_SIZE).reverse()

  let weightedSum = 0
  let totalWeight = 0

  recentAttempts.forEach((attempt, index) => {
    const weight = index < cfg.RECENCY_WEIGHTS.length ? cfg.RECENCY_WEIGHTS[index] : 1
    weightedSum += weight * (attempt.correct ? 1 : 0)
    totalWeight += weight
  })

  // Include older attempts beyond the window with equal weight of 1
  const olderAttempts = history.slice(0, Math.max(0, history.length - cfg.WEIGHTED_WINDOW_SIZE))
  for (const attempt of olderAttempts) {
    weightedSum += attempt.correct ? 1 : 0
    totalWeight += 1
  }

  let confidence = totalWeight > 0 ? weightedSum / totalWeight : 0

  // Apply streak multiplier for sustained correct answers
  if (currentStreak >= cfg.STREAK_THRESHOLD) {
    confidence = Math.min(1, confidence * cfg.STREAK_MULTIPLIER)
  }

  return Math.max(0, Math.min(1, confidence))
}

// ─── Interval Scheduling ──────────────────────────────────────────────────────

/**
 * Determines the review interval in milliseconds based on the current
 * confidence score. Higher confidence = longer interval before next review.
 */
export function getReviewIntervalMs(confidence: number): number {
  const cfg = SPACED_REPETITION_CONFIG

  if (confidence < 0.2) return cfg.INTERVAL_VERY_LOW_MS
  if (confidence < 0.4) return cfg.INTERVAL_LOW_MS
  if (confidence < 0.6) return cfg.INTERVAL_MEDIUM_MS
  if (confidence < 0.8) return cfg.INTERVAL_HIGH_MS
  return cfg.INTERVAL_VERY_HIGH_MS
}

// ─── Progress Update ──────────────────────────────────────────────────────────

/**
 * Creates an updated WordProgress record after a quiz attempt.
 *
 * - Appends the attempt to history (capped at MAX_HISTORY_SIZE)
 * - Recalculates confidence from the full updated history
 * - Schedules the next review based on the new confidence
 * - Updates streak: increments on correct, resets to 0 on incorrect
 */
export function computeProgressAfterAttempt(
  existing: WordProgress | null,
  wordId: string,
  correct: boolean,
  direction: QuizDirection,
  mode: Exclude<QuizMode, 'mixed'>,
  now: number,
): WordProgress {
  const cfg = SPACED_REPETITION_CONFIG

  const prevHistory: readonly AttemptRecord[] = existing?.history ?? []
  const prevStreak = existing?.streak ?? 0
  const prevCorrectCount = existing?.correctCount ?? 0
  const prevIncorrectCount = existing?.incorrectCount ?? 0

  const newAttempt: AttemptRecord = { direction, mode, correct, timestamp: now }

  // Append attempt and cap history length
  const fullHistory = [...prevHistory, newAttempt]
  const trimmedHistory =
    fullHistory.length > cfg.MAX_HISTORY_SIZE
      ? fullHistory.slice(fullHistory.length - cfg.MAX_HISTORY_SIZE)
      : fullHistory

  // Calculate new streak
  const newStreak = correct ? prevStreak + 1 : 0

  // Recalculate confidence from updated history
  const newConfidence = calculateConfidence(trimmedHistory, newStreak)

  // Schedule next review
  const intervalMs = getReviewIntervalMs(newConfidence)
  const nextReview = now + intervalMs

  return {
    wordId,
    correctCount: prevCorrectCount + (correct ? 1 : 0),
    incorrectCount: prevIncorrectCount + (correct ? 0 : 1),
    streak: newStreak,
    lastReviewed: now,
    nextReview,
    confidence: newConfidence,
    history: trimmedHistory,
  }
}

// ─── Word Selection ───────────────────────────────────────────────────────────

/**
 * Returns the next N words to review for a given language pair.
 *
 * Priority order:
 * 1. Words past their nextReview timestamp (overdue), sorted most-overdue first
 * 2. New words (never reviewed), mixed in gradually up to MAX_NEW_WORDS_PER_BATCH
 * 3. Words with the lowest confidence (not yet overdue)
 *
 * Each word is assigned a direction (source→target or target→source) randomly,
 * so learners practise both directions over time.
 */
export async function getNextWords(
  storage: StorageService,
  pairId: string,
  count: number,
  now: number = Date.now(),
  selectedLevels: readonly CefrLevel[] = [],
): Promise<WordForQuiz[]> {
  const allWords = await storage.getWords(pairId)
  if (allWords.length === 0) return []

  // Apply CEFR level filter. Empty selectedLevels means "all words".
  const words = filterWordsByLevels(allWords, selectedLevels)
  if (words.length === 0) return []

  // Load all existing progress records for this pair's words
  const progressMap = new Map<string, WordProgress>()
  for (const word of words) {
    const p = await storage.getWordProgress(word.id)
    if (p !== null) progressMap.set(word.id, p)
  }

  const overdue: Array<{ word: Word; progress: WordProgress }> = []
  const newWords: Word[] = []
  const lowConfidence: Array<{ word: Word; progress: WordProgress }> = []

  for (const word of words) {
    const progress = progressMap.get(word.id)

    if (progress === undefined) {
      // Never reviewed
      newWords.push(word)
    } else if (progress.nextReview <= now) {
      overdue.push({ word, progress })
    } else {
      lowConfidence.push({ word, progress })
    }
  }

  // Sort overdue by how overdue they are (most overdue first)
  overdue.sort((a, b) => a.progress.nextReview - b.progress.nextReview)

  // Sort low-confidence by confidence ascending
  lowConfidence.sort((a, b) => a.progress.confidence - b.progress.confidence)

  const selected: WordForQuiz[] = []
  const cfg = SPACED_REPETITION_CONFIG

  // 1. Fill from overdue words
  for (const { word, progress } of overdue) {
    if (selected.length >= count) break
    selected.push({
      word,
      direction: randomDirection(),
      progress,
    })
  }

  // 2. Mix in new words gradually
  const newWordsToAdd = Math.min(
    cfg.MAX_NEW_WORDS_PER_BATCH,
    count - selected.length,
    newWords.length,
  )
  for (let i = 0; i < newWordsToAdd; i++) {
    selected.push({
      word: newWords[i],
      direction: randomDirection(),
      progress: null,
    })
  }

  // 3. Fill remaining slots with lowest-confidence words
  for (const { word, progress } of lowConfidence) {
    if (selected.length >= count) break
    selected.push({
      word,
      direction: randomDirection(),
      progress,
    })
  }

  // Shuffle presentation order so the quiz doesn't feel deterministic.
  // Selection is still priority-based - we picked the right words.
  // Only the order the user sees them changes.
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[selected[i], selected[j]] = [selected[j], selected[i]]
  }

  return selected
}

// ─── Attempt Recording ────────────────────────────────────────────────────────

/**
 * Records a quiz attempt for a word and persists the updated progress.
 * Also updates DailyStats for today.
 *
 * This is the main entry point for the quiz engine to call after each answer.
 */
export async function recordAttempt(
  storage: StorageService,
  wordId: string,
  correct: boolean,
  direction: QuizDirection,
  mode: Exclude<QuizMode, 'mixed'>,
  now: number = Date.now(),
): Promise<WordProgress> {
  const existing = await storage.getWordProgress(wordId)
  const updatedProgress = computeProgressAfterAttempt(
    existing,
    wordId,
    correct,
    direction,
    mode,
    now,
  )

  await storage.saveWordProgress(updatedProgress)
  await updateDailyStats(storage, correct, now)

  return updatedProgress
}

// ─── Daily Stats Update ───────────────────────────────────────────────────────

/**
 * Updates the DailyStats record for today after an attempt is recorded.
 * Creates a new record if none exists for today.
 */
async function updateDailyStats(
  storage: StorageService,
  correct: boolean,
  now: number,
): Promise<void> {
  const dateStr = new Date(now).toISOString().slice(0, 10)
  const existing = await storage.getDailyStats(dateStr)

  const updated: DailyStats = {
    date: dateStr,
    wordsReviewed: (existing?.wordsReviewed ?? 0) + 1,
    correctCount: (existing?.correctCount ?? 0) + (correct ? 1 : 0),
    incorrectCount: (existing?.incorrectCount ?? 0) + (correct ? 0 : 1),
    // streakDays is managed separately (based on daily goal completion)
    streakDays: existing?.streakDays ?? 0,
  }

  await storage.saveDailyStats(updated)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Randomly picks a quiz direction for a word. */
function randomDirection(): QuizDirection {
  return Math.random() < 0.5 ? 'source-to-target' : 'target-to-source'
}
