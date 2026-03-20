/**
 * QuizHub - the entry point for the quiz feature.
 *
 * Manages the pre-quiz mode selection screen, active quiz routing, and
 * the post-session summary. It persists the user's mode preference, updates
 * DailyStats after each session, and shows streak + words-learned data.
 *
 * Hub state machine:
 *   'select'  → user picks Type / Choice / Mixed
 *   'active'  → quiz is running
 *   'summary' → session ended, showing SessionSummary
 */

import { useState, useCallback, useEffect } from 'react'
import { Box } from '@mui/material'
import type { LanguagePair, UserSettings, QuizMode } from '@/types'
import { useStorage } from '@/hooks/useStorage'
import {
  updateDailyStatsAfterSession,
  loadCurrentStreak,
  getTodayStats,
} from '@/services/streakService'
import { getWordsLearnedForPair } from '@/services/wordsLearnedService'
import { QuizModeSelector } from './QuizModeSelector'
import { SessionSummary } from './SessionSummary'
import { ActiveQuizView } from './ActiveQuizView'
import { GoalCelebration } from './GoalCelebration'

interface QuizHubProps {
  readonly pair: LanguagePair | null
  readonly settings: UserSettings
  /** Called when the user changes the quiz mode preference so it can be persisted. */
  readonly onSettingsChange: (updated: UserSettings) => void
}

type HubPhase = 'select' | 'active' | 'summary'

interface SessionResult {
  readonly wordsReviewed: number
  readonly correctCount: number
  readonly bestSessionStreak: number
}

export function QuizHub({ pair, settings, onSettingsChange }: QuizHubProps) {
  const storage = useStorage()
  const [hubPhase, setHubPhase] = useState<HubPhase>('select')
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

  // Keep local selectedMode in sync when settings.quizMode changes externally.
  useEffect(() => {
    setSelectedMode(settings.quizMode)
  }, [settings.quizMode])

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
    [storage, settings.dailyGoal, wordsReviewedToday, goalMetBeforeSession],
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
      <>
        <QuizModeSelector
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          onStart={handleStart}
          wordsReviewedToday={wordsReviewedToday}
          dailyGoal={settings.dailyGoal}
          streakDays={streakDays}
          wordsLearned={wordsLearned}
          totalWords={totalWords}
        />
        <GoalCelebration
          open={showCelebration}
          onClose={handleCelebrationClose}
          dailyGoal={settings.dailyGoal}
          streakDays={streakDays}
        />
      </>
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

  return (
    <>
      <Box>
        <ActiveQuizView
          mode={selectedMode}
          pair={pair}
          settings={settings}
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
