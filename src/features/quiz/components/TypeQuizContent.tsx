/**
 * TypeQuizContent - renders the type-mode quiz UI.
 *
 * Unlike QuizScreen (which is self-contained with its own hook and finished state),
 * this component accepts an already-running session and does not render its own
 * finished state — the parent (ActiveQuizView → QuizHub) handles that transition.
 */

import { useState, useCallback, useEffect, useRef, type KeyboardEvent } from 'react'
import { Box, Button, TextField, Typography } from '@mui/material'
import type { LanguagePair, UserSettings } from '@/types'
import type { UseQuizSessionResult } from '../useQuizSession'
import { QuizLayout } from './QuizLayout'
import { QuizFeedback } from './QuizFeedback'

interface TypeQuizContentProps {
  readonly session: UseQuizSessionResult
  readonly pair: LanguagePair | null
  readonly settings: UserSettings
}

export function TypeQuizContent({ session, pair, settings }: TypeQuizContentProps) {
  // settings is reserved for future use (e.g. showing typo tolerance hint)
  void settings

  const { state, submitAnswer, advance, endSession } = session
  const {
    phase,
    currentWord,
    direction,
    lastResult,
    wordsCompleted,
    sessionGoal,
    correctCount,
    error,
  } = state

  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phase === 'question' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [phase, currentWord])

  useEffect(() => {
    if (phase === 'question') {
      setInputValue('')
    }
  }, [phase, currentWord])

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (inputValue.trim() === '') return
    await submitAnswer(inputValue)
  }, [inputValue, submitAnswer])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        void handleSubmit()
      }
    },
    [handleSubmit],
  )

  if (pair === null) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Select a language pair to start quizzing.
        </Typography>
      </Box>
    )
  }

  if (phase === 'loading') {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="body1" color="text.secondary">
          Loading words...
        </Typography>
      </Box>
    )
  }

  if (phase === 'finished' && error !== null) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error.main" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {error}
        </Typography>
      </Box>
    )
  }

  // Phase 'finished' without error: parent takes over, render nothing.
  if (phase === 'finished') return null

  const fromLang = direction === 'source-to-target' ? pair.sourceLang : pair.targetLang
  const toLang = direction === 'source-to-target' ? pair.targetLang : pair.sourceLang
  const questionText =
    direction === 'source-to-target' ? (currentWord?.source ?? '') : (currentWord?.target ?? '')

  return (
    <QuizLayout
      fromLang={fromLang}
      toLang={toLang}
      questionText={questionText}
      wordsCompleted={wordsCompleted}
      sessionGoal={sessionGoal}
      correctCount={correctCount}
      onEndSession={endSession}
    >
      {phase === 'question' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            label={`Type the ${toLang} translation`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            inputProps={{
              'aria-label': `Type the ${toLang} translation`,
              lang: direction === 'source-to-target' ? pair.targetCode : pair.sourceCode,
              autoCorrect: 'off',
              autoCapitalize: 'none',
              spellCheck: false,
            }}
          />
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => void handleSubmit()}
            disabled={inputValue.trim() === ''}
          >
            Submit
          </Button>
        </Box>
      )}

      {phase === 'feedback' && lastResult !== null && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <QuizFeedback
            result={lastResult.result}
            correctAnswer={lastResult.correctAnswer}
            userAnswer={inputValue}
          />
          <Button variant="contained" size="large" fullWidth onClick={advance} autoFocus>
            {wordsCompleted >= sessionGoal ? 'See results' : 'Next word'}
          </Button>
        </Box>
      )}
    </QuizLayout>
  )
}
