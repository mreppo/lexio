/**
 * QuizHub - the entry point for the quiz feature.
 *
 * Liquid Glass restyled (issue #148):
 *   - Wrapped in <PaperSurface> so the wallpaper gradient is the backdrop.
 *   - <NavBar large prominentTitle="Practice"> at the top when in 'select' phase.
 *   - Mode selector (QuizModeSelector) uses Glass pad=18 floating strong cards.
 *   - DailyProgressCard uses Glass pad=14 floating.
 *   - LevelFilterBar uses pill pattern: active=solid ink, inactive=Glass inline.
 *   - Empty state (dueCount=0) shows a celebratory message + "Browse library" CTA.
 *
 * Hub state machine:
 *   'select'  → user picks Typing / Multiple Choice
 *   'active'  → quiz is running
 *   'summary' → session ended, showing SessionSummary
 *
 * autoStart prop: when true, the hub skips the mode-selection screen and goes
 * straight to 'active' using the default quiz mode from settings.
 * The flag is consumed once — the hub resets to normal after the first session.
 * Used by the Dashboard "Start review" button.
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { LanguagePair, UserSettings, QuizMode, CefrLevel, Word, WordProgress } from '@/types'
import { useStorage } from '@/hooks/useStorage'
import { countWordsByLevel } from '@/utils/cefrFilter'
import {
  updateDailyStatsAfterSession,
  loadCurrentStreak,
  getTodayStats,
} from '@/services/streakService'
import { getWordsLearnedForPair } from '@/services/wordsLearnedService'
import { PaperSurface } from '@/components/primitives'
import { NavBar } from '@/components/composites'
import { getGlassTokens } from '@/theme/liquidGlass'
import { computeDueCount } from '@/features/words/utils/dueWords'
import { QuizModeSelector } from './QuizModeSelector'
import { SessionSummary } from './SessionSummary'
import { ActiveQuizView } from './ActiveQuizView'
import { GoalCelebration } from './GoalCelebration'

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuizHubProps {
  readonly pair: LanguagePair | null
  readonly settings: UserSettings
  /** Called when the user changes the quiz mode preference so it can be persisted. */
  readonly onSettingsChange: (updated: UserSettings) => void
  /**
   * Optional callback fired when a quiz session finishes.
   * Receives the number of questions answered in the session.
   */
  readonly onSessionComplete?: (questionsAnswered: number) => void
  /**
   * When true, the hub skips the mode-selection screen and goes straight to
   * the active quiz using the default quiz mode from settings.
   * The flag is consumed once — the hub resets to normal after the first session.
   * Used by the Dashboard "Start review" button.
   */
  readonly autoStart?: boolean
  /**
   * Called when the user taps "Browse library" in the empty state (dueCount=0).
   * Should switch the active tab to 'words'.
   */
  readonly onBrowseLibrary?: () => void
}

type HubPhase = 'select' | 'active' | 'summary'

interface SessionResult {
  readonly wordsReviewed: number
  readonly correctCount: number
  readonly bestSessionStreak: number
}

// ─── Bottom spacer ────────────────────────────────────────────────────────────

/** Height in px to clear the fixed TabBar at the bottom of the screen. */
const BOTTOM_SPACER_PX = 140

// ─── Component ────────────────────────────────────────────────────────────────

export function QuizHub({
  pair,
  settings,
  onSettingsChange,
  onSessionComplete,
  autoStart = false,
  onBrowseLibrary,
}: QuizHubProps) {
  const storage = useStorage()
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  // When autoStart is true, skip directly to 'active' phase using the default mode
  const [hubPhase, setHubPhase] = useState<HubPhase>(autoStart ? 'active' : 'select')
  const [selectedMode, setSelectedMode] = useState<QuizMode>(settings.quizMode)
  const [sessionResult, setSessionResult] = useState<SessionResult>({
    wordsReviewed: 0,
    correctCount: 0,
    bestSessionStreak: 0,
  })
  const [streakDays, setStreakDays] = useState(0)
  const [wordsLearned, setWordsLearned] = useState(0)
  const [totalWords, setTotalWords] = useState(0)
  const [wordsReviewedToday, setWordsReviewedToday] = useState(0)

  // Whether the goal was already met before the current session started.
  // Used to decide whether to show the celebration at session end.
  const [goalMetBeforeSession, setGoalMetBeforeSession] = useState(false)

  // Whether to show the goal celebration overlay.
  const [showCelebration, setShowCelebration] = useState(false)

  // Words reviewed today at session end (before updating summary).
  // Stored so SessionSummary can show accurate post-session totals.
  const [wordsReviewedTodayAtEnd, setWordsReviewedTodayAtEnd] = useState(0)

  // Session-only level override. Initialised from settings on each 'select' phase.
  // Reset to settings default when the user goes back to the select screen.
  const [sessionLevels, setSessionLevels] = useState<readonly CefrLevel[]>(settings.selectedLevels)

  // Word count per CEFR level for the active pair (used in LevelFilterBar).
  const [wordCountByLevel, setWordCountByLevel] = useState<Record<CefrLevel, number>>({
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
    C1: 0,
    C2: 0,
  })

  // All words in the pair — needed to compute due count.
  const [pairWords, setPairWords] = useState<readonly Word[]>([])

  // All word progress records — needed to compute due count.
  const [wordProgressList, setWordProgressList] = useState<readonly WordProgress[]>([])

  // Keep local selectedMode in sync when settings.quizMode changes externally.
  useEffect(() => {
    setSelectedMode(settings.quizMode)
  }, [settings.quizMode])

  // Reset session levels to settings default when returning to select screen.
  useEffect(() => {
    if (hubPhase === 'select') {
      setSessionLevels(settings.selectedLevels)
    }
  }, [hubPhase, settings.selectedLevels])

  // Load word counts for the LevelFilterBar AND pairWords for due-count whenever the active pair changes.
  useEffect(() => {
    if (pair === null) {
      setWordCountByLevel({ A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 })
      setPairWords([])
      return
    }
    void storage.getWords(pair.id).then((words) => {
      setWordCountByLevel(countWordsByLevel(words))
      setPairWords(words)
    })
  }, [storage, pair])

  // Load word progress records to compute due count.
  useEffect(() => {
    if (pair === null) {
      setWordProgressList([])
      return
    }
    void storage.getAllProgress(pair.id).then((progress) => {
      setWordProgressList(progress)
    })
  }, [storage, pair, hubPhase])

  // Reload streak from storage whenever the hub phase changes (e.g. after session).
  useEffect(() => {
    void loadCurrentStreak(storage, settings.dailyGoal).then(setStreakDays)
  }, [storage, hubPhase, settings.dailyGoal])

  // Reload today's stats whenever the hub phase changes to 'select'.
  useEffect(() => {
    if (hubPhase !== 'select') return
    void getTodayStats(storage).then((stats) => {
      setWordsReviewedToday(stats?.wordsReviewed ?? 0)
    })
  }, [storage, hubPhase])

  // Reload words learned whenever the hub phase changes or the pair changes.
  useEffect(() => {
    if (pair === null) {
      setWordsLearned(0)
      setTotalWords(0)
      return
    }
    void getWordsLearnedForPair(storage, pair.id).then((result) => {
      setWordsLearned(result.learned)
      setTotalWords(result.total)
    })
  }, [storage, pair, hubPhase])

  // Compute due count from current pair words + progress.
  const dueCount = useMemo(
    () => computeDueCount(pairWords, wordProgressList),
    [pairWords, wordProgressList],
  )

  const handleModeChange = useCallback(
    (mode: QuizMode): void => {
      setSelectedMode(mode)
      const updated: UserSettings = { ...settings, quizMode: mode }
      onSettingsChange(updated)
      void storage.saveSettings(updated)
    },
    [settings, onSettingsChange, storage],
  )

  const handleStart = useCallback((): void => {
    // Record whether the goal was already met before this session.
    setGoalMetBeforeSession(wordsReviewedToday >= settings.dailyGoal)
    setHubPhase('active')
  }, [wordsReviewedToday, settings.dailyGoal])

  const handleSessionFinished = useCallback(
    (wordsReviewed: number, correctCount: number, bestSessionStreak: number): void => {
      setSessionResult({ wordsReviewed, correctCount, bestSessionStreak })
      // Notify parent about the completed session (used for install-banner engagement tracking).
      onSessionComplete?.(wordsReviewed)

      // Persist daily stats in the background - do not block UI transition.
      void updateDailyStatsAfterSession(
        storage,
        wordsReviewed,
        correctCount,
        settings.dailyGoal,
      ).then(setStreakDays)

      // Calculate post-session total for today.
      const newTotal = wordsReviewedToday + wordsReviewed
      setWordsReviewedTodayAtEnd(newTotal)

      // Show celebration only if the user just crossed the goal for the first time today.
      const justCrossedGoal = !goalMetBeforeSession && newTotal >= settings.dailyGoal
      if (justCrossedGoal) {
        setShowCelebration(true)
        // Transition to summary happens after celebration closes.
      } else {
        setHubPhase('summary')
      }
    },
    [storage, settings.dailyGoal, wordsReviewedToday, goalMetBeforeSession, onSessionComplete],
  )

  const handleCelebrationClose = useCallback((): void => {
    setShowCelebration(false)
    setHubPhase('summary')
  }, [])

  const handleContinue = useCallback((): void => {
    setHubPhase('select')
  }, [])

  const handleGoHome = useCallback((): void => {
    // Return to mode selector (scoped to the quiz tab).
    setHubPhase('select')
  }, [])

  const dailyGoalMet = wordsReviewedTodayAtEnd >= settings.dailyGoal

  if (hubPhase === 'select') {
    return (
      <PaperSurface
        sx={{
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <Box role="main" aria-label="Practice" sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* NavBar — large mode with "Practice" prominent title */}
          <NavBar large prominentTitle="Practice" />

          {/* Mode selector content — padded to screen edges */}
          <Box
            sx={{
              px: `${16}px`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <QuizModeSelector
              selectedMode={selectedMode}
              onModeChange={handleModeChange}
              onStart={handleStart}
              wordsReviewedToday={wordsReviewedToday}
              dailyGoal={settings.dailyGoal}
              streakDays={streakDays}
              wordsLearned={wordsLearned}
              totalWords={totalWords}
              sessionLevels={sessionLevels}
              wordCountByLevel={wordCountByLevel}
              onSessionLevelsChange={setSessionLevels}
              dueCount={dueCount}
              onBrowseLibrary={onBrowseLibrary ?? (() => undefined)}
            />
          </Box>

          {/* Bottom spacer — clears the fixed TabBar */}
          <Box sx={{ height: `${BOTTOM_SPACER_PX}px`, flexShrink: 0 }} aria-hidden="true" />
        </Box>

        <GoalCelebration
          open={showCelebration}
          onClose={handleCelebrationClose}
          dailyGoal={settings.dailyGoal}
          streakDays={streakDays}
        />
      </PaperSurface>
    )
  }

  if (hubPhase === 'summary') {
    return (
      <SessionSummary
        wordsReviewed={sessionResult.wordsReviewed}
        correctCount={sessionResult.correctCount}
        streakDays={streakDays}
        bestSessionStreak={sessionResult.bestSessionStreak}
        wordsLearned={wordsLearned}
        totalWords={totalWords}
        dailyGoalMet={dailyGoalMet}
        wordsReviewedToday={wordsReviewedTodayAtEnd}
        dailyGoal={settings.dailyGoal}
        onContinue={handleContinue}
        onGoHome={handleGoHome}
      />
    )
  }

  // hubPhase === 'active'
  return (
    <>
      <Box sx={{ color: tokens.color.ink }}>
        <ActiveQuizView
          mode={selectedMode}
          pair={pair}
          settings={settings}
          sessionLevels={sessionLevels}
          onSessionFinished={handleSessionFinished}
        />
      </Box>
      <GoalCelebration
        open={showCelebration}
        onClose={handleCelebrationClose}
        dailyGoal={settings.dailyGoal}
        streakDays={streakDays}
      />
    </>
  )
}
