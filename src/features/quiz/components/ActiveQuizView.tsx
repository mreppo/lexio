/**
 * ActiveQuizView - renders the correct quiz content for the given mode
 * and surfaces the session result (stats) to the parent when the session ends.
 *
 * A single unified container uses useQuizSession for all three modes.
 * Content is switched based on session.state.currentMode (per-question mode).
 */

import { useEffect, useRef } from 'react'
import type { LanguagePair, UserSettings, QuizMode, CefrLevel } from '@/types'
import { useQuizSession } from '../useQuizSession'
import { TypeQuizContent } from './TypeQuizContent'
import { ChoiceQuizContent } from './ChoiceQuizContent'

interface ActiveQuizViewProps {
  readonly mode: QuizMode
  readonly pair: LanguagePair | null
  readonly settings: UserSettings
  /** Session-only CEFR level override (not persisted). Empty = use settings default. */
  readonly sessionLevels?: readonly CefrLevel[]
  /**
   * Called once when the session transitions to 'finished'.
   * Receives the final wordsReviewed, correctCount, and bestSessionStreak.
   */
  readonly onSessionFinished: (
    wordsReviewed: number,
    correctCount: number,
    bestSessionStreak: number,
  ) => void
}

export function ActiveQuizView({
  mode,
  pair,
  settings,
  sessionLevels,
  onSessionFinished,
}: ActiveQuizViewProps) {
  const session = useQuizSession(pair, settings, mode, sessionLevels)
  const { phase, wordsCompleted, correctCount, bestSessionStreak, currentMode } = session.state

  // Store onSessionFinished in a ref so the effect dep array only contains the
  // stable phase value — the callback itself is always current.
  const onFinishedRef = useRef(onSessionFinished)
  onFinishedRef.current = onSessionFinished

  useEffect(() => {
    if (phase === 'finished') {
      onFinishedRef.current(wordsCompleted, correctCount, bestSessionStreak)
    }
    // wordsCompleted, correctCount, and bestSessionStreak are stable at the moment
    // phase becomes 'finished', so including them is correct and avoids stale reads.
  }, [phase, wordsCompleted, correctCount, bestSessionStreak])

  if (currentMode === 'type') {
    return <TypeQuizContent session={session} pair={pair} settings={settings} />
  }

  return <ChoiceQuizContent session={session} pair={pair} />
}
