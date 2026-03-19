/**
 * ChoiceQuizScreen - the multiple-choice quiz interface.
 *
 * Displays the word to translate, four option buttons, visual feedback on
 * selection, and session progress. Disables all buttons after a selection to
 * prevent double-tapping on mobile.
 */

import { useCallback } from 'react'
import {
  Box,
  Button,
  Paper,
  Typography,
  Chip,
  Alert,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import type { LanguagePair, UserSettings } from '@/types'
import { useChoiceQuizSession } from '../useChoiceQuizSession'
import { SessionProgress } from './SessionProgress'
import { MIN_WORDS_FOR_CHOICE } from '@/utils/distractorGenerator'

interface ChoiceQuizScreenProps {
  readonly pair: LanguagePair | null
  readonly settings: UserSettings
  /** Called when the user manually ends the session or session completes. */
  readonly onSessionEnd?: () => void
}

// ─── Option button styling ─────────────────────────────────────────────────

type OptionState = 'default' | 'correct' | 'incorrect' | 'reveal'

function getOptionSx(state: OptionState) {
  const base = {
    justifyContent: 'flex-start',
    textAlign: 'left' as const,
    minHeight: 56,
    px: 2,
    py: 1.5,
    fontWeight: 600,
    fontSize: '1rem',
    borderRadius: 2,
    transition: 'background-color 0.2s, border-color 0.2s',
    wordBreak: 'break-word' as const,
  }

  switch (state) {
    case 'correct':
      return {
        ...base,
        borderColor: 'success.main',
        color: 'success.main',
        backgroundColor: 'success.main',
        '&:hover': { backgroundColor: 'success.main' },
        '&.Mui-disabled': {
          color: 'success.contrastText',
          backgroundColor: 'success.main',
          borderColor: 'success.main',
          opacity: 1,
        },
      }
    case 'incorrect':
      return {
        ...base,
        borderColor: 'error.main',
        '&.Mui-disabled': {
          color: 'error.main',
          borderColor: 'error.main',
          opacity: 1,
        },
      }
    case 'reveal':
      return {
        ...base,
        borderColor: 'success.main',
        '&.Mui-disabled': {
          color: 'success.main',
          borderColor: 'success.main',
          opacity: 1,
        },
      }
    default:
      return base
  }
}

function getOptionState(
  index: number,
  correctIndex: number,
  selectedIndex: number,
): OptionState {
  // No selection yet
  if (selectedIndex === -1) return 'default'

  if (index === selectedIndex && index === correctIndex) return 'correct'
  if (index === selectedIndex && index !== correctIndex) return 'incorrect'
  // Reveal the correct answer when the user got it wrong
  if (index === correctIndex && selectedIndex !== correctIndex) return 'reveal'
  return 'default'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChoiceQuizScreen({ pair, settings, onSessionEnd }: ChoiceQuizScreenProps) {
  const { state, selectOption, advance, endSession, restart } = useChoiceQuizSession(pair, settings)

  const {
    phase,
    currentWord,
    direction,
    options,
    correctIndex,
    selectedIndex,
    lastCorrect,
    wordsCompleted,
    sessionGoal,
    correctCount,
    error,
  } = state

  const handleSelect = useCallback(
    (index: number): void => {
      void selectOption(index)
    },
    [selectOption],
  )

  const handleAdvance = useCallback((): void => {
    advance()
  }, [advance])

  const handleEndSession = useCallback((): void => {
    endSession()
    onSessionEnd?.()
  }, [endSession, onSessionEnd])

  // ─── No pair selected ────────────────────────────────────────────────────

  if (pair === null) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Select a language pair to start quizzing.
        </Typography>
      </Box>
    )
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="body1" color="text.secondary">
          Loading words...
        </Typography>
      </Box>
    )
  }

  // ─── Not enough words ─────────────────────────────────────────────────────

  if (phase === 'not-enough-words') {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Multiple choice mode requires at least {MIN_WORDS_FOR_CHOICE} words in
          this language pair. You currently have fewer words.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Add more words to your word list to use multiple choice mode, or switch
          to type mode in settings.
        </Typography>
      </Box>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────────

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

  // ─── Session finished ─────────────────────────────────────────────────────

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

  // ─── Direction indicator ──────────────────────────────────────────────────

  const fromLang = direction === 'source-to-target' ? pair.sourceLang : pair.targetLang
  const toLang = direction === 'source-to-target' ? pair.targetLang : pair.sourceLang
  const questionText = direction === 'source-to-target'
    ? currentWord?.source ?? ''
    : currentWord?.target ?? ''

  // ─── Quiz question / feedback ─────────────────────────────────────────────

  const isAnswered = selectedIndex !== -1

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
        {currentWord?.notes != null && currentWord.notes !== '' && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, fontStyle: 'italic' }}
          >
            {currentWord.notes}
          </Typography>
        )}
      </Paper>

      {/* Option buttons */}
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
        role="group"
        aria-label={`Choose the ${toLang} translation`}
      >
        {options.map((option, index) => {
          const optionState = getOptionState(index, correctIndex, selectedIndex)
          const isSelected = index === selectedIndex
          const isCorrectOption = index === correctIndex

          return (
            <Button
              key={`${option}-${index}`}
              variant="outlined"
              fullWidth
              disabled={isAnswered}
              onClick={() => handleSelect(index)}
              sx={getOptionSx(optionState)}
              aria-label={`Option ${index + 1}: ${option}`}
              aria-pressed={isSelected}
              aria-describedby={
                isAnswered && isCorrectOption ? 'correct-answer-label' : undefined
              }
              startIcon={
                isAnswered && optionState === 'correct' ? (
                  <CheckCircleOutlineIcon />
                ) : isAnswered && optionState === 'incorrect' ? (
                  <CancelOutlinedIcon />
                ) : isAnswered && optionState === 'reveal' ? (
                  <CheckCircleOutlineIcon />
                ) : null
              }
            >
              {option}
            </Button>
          )
        })}
      </Box>

      {/* Feedback message */}
      {isAnswered && (
        <Box
          role="status"
          aria-live="polite"
          sx={{ textAlign: 'center' }}
        >
          {lastCorrect === true ? (
            <Typography variant="h6" color="success.main" fontWeight={700}>
              Correct!
            </Typography>
          ) : (
            <Typography variant="h6" color="error.main" fontWeight={700}>
              Incorrect
            </Typography>
          )}
        </Box>
      )}

      {/* Next word / results button */}
      {isAnswered && (
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleAdvance}
          autoFocus
        >
          {wordsCompleted >= sessionGoal ? 'See results' : 'Next word'}
        </Button>
      )}

      {/* End session - accessible but not prominent */}
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
