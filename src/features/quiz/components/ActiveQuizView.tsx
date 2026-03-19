/**
 * ActiveQuizView - renders the correct quiz screen for the given mode
 * and surfaces the session result (stats) to the parent when the session ends.
 *
 * Each quiz variant has its own hook that manages its state independently.
 * This component mounts the appropriate hook-driven view and captures the
 * final wordsCompleted / correctCount before handing them up to QuizHub.
 */

import { useEffect, useRef } from 'react'
import type { LanguagePair, UserSettings, QuizMode } from '@/types'
import { useQuizSession } from '../useQuizSession'
import { useChoiceQuizSession } from '../useChoiceQuizSession'
import { useMixedQuizSession } from '../useMixedQuizSession'
import { TypeQuizContent } from './TypeQuizContent'
import { ChoiceQuizContent } from './ChoiceQuizContent'
import { MixedQuizContent } from './MixedQuizContent'

interface ActiveQuizViewProps {
  readonly mode: QuizMode
  readonly pair: LanguagePair | null
  readonly settings: UserSettings
  /**
   * Called once when the session transitions to 'finished'.
   * Receives the final wordsReviewed and correctCount.
   */
  readonly onSessionFinished: (wordsReviewed: number, correctCount: number) => void
}

// ─── Per-mode containers ──────────────────────────────────────────────────────
// Each container runs the appropriate session hook and calls onSessionFinished
// exactly once when phase becomes 'finished'.
// We store onSessionFinished in a ref so the effect dep array only contains
// the stable `phase` value — the callback itself is always current.

interface TypeContainerProps {
  readonly pair: LanguagePair | null
  readonly settings: UserSettings
  readonly onSessionFinished: (wordsReviewed: number, correctCount: number) => void
}

function TypeContainer({ pair, settings, onSessionFinished }: TypeContainerProps) {
  const session = useQuizSession(pair, settings)
  const { phase, wordsCompleted, correctCount } = session.state

  const onFinishedRef = useRef(onSessionFinished)
  onFinishedRef.current = onSessionFinished

  useEffect(() => {
    if (phase === 'finished') {
      onFinishedRef.current(wordsCompleted, correctCount)
    }
  // wordsCompleted and correctCount are stable at the moment phase becomes
  // 'finished', so including them is correct and avoids stale reads.
  }, [phase, wordsCompleted, correctCount])

  return <TypeQuizContent session={session} pair={pair} settings={settings} />
}

interface ChoiceContainerProps {
  readonly pair: LanguagePair | null
  readonly settings: UserSettings
  readonly onSessionFinished: (wordsReviewed: number, correctCount: number) => void
}

function ChoiceContainer({ pair, settings, onSessionFinished }: ChoiceContainerProps) {
  const session = useChoiceQuizSession(pair, settings)
  const { phase, wordsCompleted, correctCount } = session.state

  const onFinishedRef = useRef(onSessionFinished)
  onFinishedRef.current = onSessionFinished

  useEffect(() => {
    if (phase === 'finished') {
      onFinishedRef.current(wordsCompleted, correctCount)
    }
  }, [phase, wordsCompleted, correctCount])

  return <ChoiceQuizContent session={session} pair={pair} />
}

interface MixedContainerProps {
  readonly pair: LanguagePair | null
  readonly settings: UserSettings
  readonly onSessionFinished: (wordsReviewed: number, correctCount: number) => void
}

function MixedContainer({ pair, settings, onSessionFinished }: MixedContainerProps) {
  const session = useMixedQuizSession(pair, settings)
  const { phase, wordsCompleted, correctCount } = session.state

  const onFinishedRef = useRef(onSessionFinished)
  onFinishedRef.current = onSessionFinished

  useEffect(() => {
    if (phase === 'finished') {
      onFinishedRef.current(wordsCompleted, correctCount)
    }
  }, [phase, wordsCompleted, correctCount])

  return <MixedQuizContent session={session} pair={pair} settings={settings} />
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ActiveQuizView({
  mode,
  pair,
  settings,
  onSessionFinished,
}: ActiveQuizViewProps) {
  if (mode === 'type') {
    return (
      <TypeContainer
        pair={pair}
        settings={settings}
        onSessionFinished={onSessionFinished}
      />
    )
  }

  if (mode === 'choice') {
    return (
      <ChoiceContainer
        pair={pair}
        settings={settings}
        onSessionFinished={onSessionFinished}
      />
    )
  }

  return (
    <MixedContainer
      pair={pair}
      settings={settings}
      onSessionFinished={onSessionFinished}
    />
  )
}
