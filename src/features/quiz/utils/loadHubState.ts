/**
 * Hub state loader utility.
 *
 * Extracted from QuizHub.tsx to keep the component file clean and to allow
 * the load-orchestration logic to be unit-tested independently.
 *
 * This function replaces the 5 separate storage-loading useEffect hooks that
 * previously existed in QuizHub. Consolidating into a single async function
 * means there is one dependency array to maintain and a single call site to
 * extend when new hub state is needed.
 */

import type { LanguagePair, CefrLevel, Word, WordProgress } from '@/types'
import type { StorageService } from '@/services/storage/StorageService'
import { countWordsByLevel } from '@/utils/cefrFilter'
import { loadCurrentStreak, getTodayStats } from '@/services/streakService'
import { getWordsLearnedForPair } from '@/services/wordsLearnedService'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The combined async state loaded from storage on each hub phase transition.
 * Returned by `loadHubState` and applied in a single useEffect in QuizHub.
 */
export interface HubState {
  readonly wordCountByLevel: Record<CefrLevel, number>
  readonly pairWords: readonly Word[]
  readonly wordProgressList: readonly WordProgress[]
  readonly streakDays: number
  readonly wordsLearned: number
  readonly totalWords: number
  /** Only meaningful when hubPhase === 'select'; otherwise irrelevant. */
  readonly wordsReviewed: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_WORD_COUNT_BY_LEVEL: Record<CefrLevel, number> = {
  A1: 0,
  A2: 0,
  B1: 0,
  B2: 0,
  C1: 0,
  C2: 0,
}

// ─── Loader ───────────────────────────────────────────────────────────────────

/**
 * Loads all hub display state from storage in a single async pass.
 *
 * When `pair` is null (no active pair selected) the function returns safe empty
 * defaults so the hub renders correctly without a pair. Streak and today's stats
 * are always loaded regardless of whether a pair is selected.
 *
 * @param storage    - The storage service instance.
 * @param pair       - The active language pair, or null if none is selected.
 * @param dailyGoal  - Daily goal (words reviewed) for streak computation.
 */
export async function loadHubState(
  storage: StorageService,
  pair: LanguagePair | null,
  dailyGoal: number,
): Promise<HubState> {
  // Streak and today's stats are always needed regardless of pair.
  const [streakDays, todayStats] = await Promise.all([
    loadCurrentStreak(storage, dailyGoal),
    getTodayStats(storage),
  ])

  if (pair === null) {
    return {
      wordCountByLevel: EMPTY_WORD_COUNT_BY_LEVEL,
      pairWords: [],
      wordProgressList: [],
      streakDays,
      wordsLearned: 0,
      totalWords: 0,
      wordsReviewed: todayStats?.wordsReviewed ?? 0,
    }
  }

  // Pair-specific data: words + progress + learned counts, fetched in parallel.
  const [words, progressList, learnedResult] = await Promise.all([
    storage.getWords(pair.id),
    storage.getAllProgress(pair.id),
    getWordsLearnedForPair(storage, pair.id),
  ])

  return {
    wordCountByLevel: countWordsByLevel(words),
    pairWords: words,
    wordProgressList: progressList,
    streakDays,
    wordsLearned: learnedResult.learned,
    totalWords: learnedResult.total,
    wordsReviewed: todayStats?.wordsReviewed ?? 0,
  }
}
