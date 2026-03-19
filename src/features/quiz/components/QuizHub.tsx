/**
 * QuizHub - the entry point for the quiz feature.
 *
 * Manages the pre-quiz mode selection screen, active quiz routing, and
 * the post-session summary. It persists the user's mode preference and
 * pulls the current streak from daily stats for the summary screen.
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
import { QuizModeSelector } from './QuizModeSelector'
import { SessionSummary } from './SessionSummary'
import { ActiveQuizView } from './ActiveQuizView'

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
}

export function QuizHub({ pair, settings, onSettingsChange }: QuizHubProps) {
  const storage = useStorage()
  const [hubPhase, setHubPhase] = useState<HubPhase>('select')
  const [selectedMode, setSelectedMode] = useState<QuizMode>(settings.quizMode)
  const [sessionResult, setSessionResult] = useState<SessionResult>({
    wordsReviewed: 0,
    correctCount: 0,
  })
  const [streakDays, setStreakDays] = useState(0)

  // Keep local selectedMode in sync when settings.quizMode changes externally.
  useEffect(() => {
    setSelectedMode(settings.quizMode)
  }, [settings.quizMode])

  // Load streak days from recent daily stats.
  useEffect(() => {
    void storage.getRecentDailyStats(7).then((stats) => {
      const latest = stats[stats.length - 1]
      if (latest !== undefined) {
        setStreakDays(latest.streakDays)
      }
    })
  }, [storage, hubPhase])

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
    setHubPhase('active')
  }, [])

  const handleSessionFinished = useCallback(
    (wordsReviewed: number, correctCount: number): void => {
      setSessionResult({ wordsReviewed, correctCount })
      setHubPhase('summary')
    },
    [],
  )

  const handleContinue = useCallback((): void => {
    setHubPhase('select')
  }, [])

  const handleGoHome = useCallback((): void => {
    // Return to mode selector (scoped to the quiz tab).
    setHubPhase('select')
  }, [])

  if (hubPhase === 'select') {
    return (
      <QuizModeSelector
        selectedMode={selectedMode}
        onModeChange={handleModeChange}
        onStart={handleStart}
      />
    )
  }

  if (hubPhase === 'summary') {
    return (
      <SessionSummary
        wordsReviewed={sessionResult.wordsReviewed}
        correctCount={sessionResult.correctCount}
        streakDays={streakDays}
        onContinue={handleContinue}
        onGoHome={handleGoHome}
      />
    )
  }

  return (
    <Box>
      <ActiveQuizView
        mode={selectedMode}
        pair={pair}
        settings={settings}
        onSessionFinished={handleSessionFinished}
      />
    </Box>
  )
}
