/**
 * QuizScreen - the main quiz type-mode interface.
 *
 * Displays the word to translate, an input field, feedback, and session progress.
 * Handles keyboard submission (Enter key), auto-focus, and mobile input settings.
 */

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  KeyboardEvent,
} from 'react'
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Chip,
} from '@mui/material'
import type { LanguagePair, UserSettings } from '@/types'
import { useQuizSession } from '../useQuizSession'
import { SessionProgress } from './SessionProgress'
import { QuizFeedback } from './QuizFeedback'

interface QuizScreenProps {
  readonly pair: LanguagePair | null
  readonly settings: UserSettings
  /** Called when the user manually ends the session or session completes. */
  readonly onSessionEnd?: () => void
}

export function QuizScreen({ pair, settings, onSessionEnd }: QuizScreenProps) {
  const { state, submitAnswer, advance, endSession, restart } = useQuizSession(pair, settings)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { phase, currentWord, direction, lastResult, wordsCompleted, sessionGoal, correctCount, error } = state

  // Auto-focus the input whenever a new question is shown.
  useEffect(() => {
    if (phase === 'question' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [phase, currentWord])

  // Clear the input when a new question loads.
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

  const handleAdvance = useCallback((): void => {
    advance()
  }, [advance])

  const handleEndSession = useCallback((): void => {
    endSession()
    onSessionEnd?.()
  }, [endSession, onSessionEnd])

  // ─── No pair selected ──────────────────────────────────────────────────────

  if (pair === null) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Select a language pair to start quizzing.
        </Typography>
      </Box>
    )
  }

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="body1" color="text.secondary">
          Loading words...
        </Typography>
      </Box>
    )
  }

  // ─── Error ──────────────────────────────────────────────────────────────────

  if (phase === 'finished' && error !== null) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error.main" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={restart}>
          Try again
        </Button>
      </Box>
    )
  }

  // ─── Session finished ──────────────────────────────────────────────────────

  if (phase === 'finished') {
    const accuracy = wordsCompleted > 0
      ? Math.round((correctCount / wordsCompleted) * 100)
      : 0

    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Session complete!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          You reviewed <strong>{wordsCompleted}</strong> word{wordsCompleted !== 1 ? 's' : ''}.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Accuracy: <strong>{accuracy}%</strong> ({correctCount} / {wordsCompleted} correct)
        </Typography>
        <Button variant="contained" size="large" onClick={restart}>
          Start new session
        </Button>
      </Box>
    )
  }

  // ─── Direction indicator ────────────────────────────────────────────────────

  const fromLang = direction === 'source-to-target' ? pair.sourceLang : pair.targetLang
  const toLang = direction === 'source-to-target' ? pair.targetLang : pair.sourceLang
  const questionText = direction === 'source-to-target'
    ? currentWord?.source ?? ''
    : currentWord?.target ?? ''

  // ─── Quiz question / feedback ───────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Progress bar */}
      <SessionProgress
        completed={wordsCompleted}
        total={sessionGoal}
        correct={correctCount}
      />

      {/* Direction chip */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Chip
          label={`${fromLang} → ${toLang}`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600 }}
          aria-label={`Translating from ${fromLang} to ${toLang}`}
        />
      </Box>

      {/* Word card */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h4"
          component="p"
          fontWeight={700}
          sx={{ wordBreak: 'break-word' }}
          aria-label={`Translate: ${questionText}`}
        >
          {questionText}
        </Typography>
      </Paper>

      {/* Input / feedback area */}
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
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleAdvance}
            autoFocus
          >
            {wordsCompleted >= sessionGoal ? 'See results' : 'Next word'}
          </Button>
        </Box>
      )}

      {/* End session button - accessible but not prominent */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="text"
          size="small"
          color="inherit"
          onClick={handleEndSession}
          sx={{ color: 'text.disabled', fontSize: '0.75rem' }}
        >
          End session
        </Button>
      </Box>
    </Box>
  )
}
