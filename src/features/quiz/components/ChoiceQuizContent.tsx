/**
 * ChoiceQuizContent - renders the choice-mode quiz UI.
 *
 * Accepts an already-running session and does not render its own finished state.
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
import type { LanguagePair } from '@/types'
import type { UseChoiceQuizSessionResult } from '../useChoiceQuizSession'
import { SessionProgress } from './SessionProgress'
import { MIN_WORDS_FOR_CHOICE } from '@/utils/distractorGenerator'

type OptionState = 'default' | 'correct' | 'incorrect' | 'reveal'

function getOptionState(index: number, correctIndex: number, selectedIndex: number): OptionState {
  if (selectedIndex === -1) return 'default'
  if (index === selectedIndex && index === correctIndex) return 'correct'
  if (index === selectedIndex && index !== correctIndex) return 'incorrect'
  if (index === correctIndex && selectedIndex !== correctIndex) return 'reveal'
  return 'default'
}

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
        '&.Mui-disabled': { color: 'error.main', borderColor: 'error.main', opacity: 1 },
      }
    case 'reveal':
      return {
        ...base,
        borderColor: 'success.main',
        '&.Mui-disabled': { color: 'success.main', borderColor: 'success.main', opacity: 1 },
      }
    default:
      return base
  }
}

interface ChoiceQuizContentProps {
  readonly session: UseChoiceQuizSessionResult
  readonly pair: LanguagePair | null
}

export function ChoiceQuizContent({ session, pair }: ChoiceQuizContentProps) {
  const { state, selectOption, advance, endSession } = session
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
    (index: number): void => { void selectOption(index) },
    [selectOption],
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
        <Typography variant="body1" color="text.secondary">Loading words...</Typography>
      </Box>
    )
  }

  if (phase === 'not-enough-words') {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Multiple choice mode requires at least {MIN_WORDS_FOR_CHOICE} words in
          this language pair.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Add more words to your word list to use multiple choice mode.
        </Typography>
      </Box>
    )
  }

  if (phase === 'finished' && error !== null) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error.main" gutterBottom>Something went wrong</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{error}</Typography>
      </Box>
    )
  }

  // Finished without error: parent handles transition.
  if (phase === 'finished') return null

  const fromLang = direction === 'source-to-target' ? pair.sourceLang : pair.targetLang
  const toLang = direction === 'source-to-target' ? pair.targetLang : pair.sourceLang
  const questionText =
    direction === 'source-to-target' ? currentWord?.source ?? '' : currentWord?.target ?? ''
  const isAnswered = selectedIndex !== -1

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <SessionProgress completed={wordsCompleted} total={sessionGoal} correct={correctCount} />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Chip
          label={`${fromLang} → ${toLang}`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600 }}
          aria-label={`Translating from ${fromLang} to ${toLang}`}
        />
      </Box>

      <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
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
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
            {currentWord.notes}
          </Typography>
        )}
      </Paper>

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
              aria-describedby={isAnswered && isCorrectOption ? 'correct-answer-label' : undefined}
              startIcon={
                isAnswered && optionState === 'correct' ? <CheckCircleOutlineIcon /> :
                isAnswered && optionState === 'incorrect' ? <CancelOutlinedIcon /> :
                isAnswered && optionState === 'reveal' ? <CheckCircleOutlineIcon /> :
                null
              }
            >
              {option}
            </Button>
          )
        })}
      </Box>

      {isAnswered && (
        <Box role="status" aria-live="polite" sx={{ textAlign: 'center' }}>
          {lastCorrect === true ? (
            <Typography variant="h6" color="success.main" fontWeight={700}>Correct!</Typography>
          ) : (
            <Typography variant="h6" color="error.main" fontWeight={700}>Incorrect</Typography>
          )}
        </Box>
      )}

      {isAnswered && (
        <Button variant="contained" size="large" fullWidth onClick={advance} autoFocus>
          {wordsCompleted >= sessionGoal ? 'See results' : 'Next word'}
        </Button>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="text"
          size="small"
          color="inherit"
          onClick={endSession}
          sx={{ color: 'text.disabled', fontSize: '0.75rem' }}
        >
          End session
        </Button>
      </Box>
    </Box>
  )
}
