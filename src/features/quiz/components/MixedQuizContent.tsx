/**
 * MixedQuizContent - renders the mixed-mode quiz UI.
 *
 * Accepts an already-running mixed session and does not render its own finished state.
 * Uses shared structural elements (SessionProgress, word card) for both type and
 * choice sub-modes so there is no jarring layout shift when the mode alternates.
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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import type { LanguagePair, UserSettings } from '@/types'
import type { UseMixedQuizSessionResult } from '../useMixedQuizSession'
import { SessionProgress } from './SessionProgress'
import { QuizFeedback } from './QuizFeedback'

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

interface MixedQuizContentProps {
  readonly session: UseMixedQuizSessionResult
  readonly pair: LanguagePair | null
  readonly settings: UserSettings
}

export function MixedQuizContent({ session, pair, settings }: MixedQuizContentProps) {
  // settings is available for future use (typo tolerance hint display, etc.)
  void settings

  const { state, submitAnswer, selectOption, advance, endSession } = session
  const {
    phase,
    currentWord,
    direction,
    currentMode,
    options,
    correctIndex,
    selectedIndex,
    lastResult,
    lastChoiceCorrect,
    wordsCompleted,
    sessionGoal,
    correctCount,
    error,
  } = state

  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phase === 'question' && currentMode === 'type' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [phase, currentWord, currentMode])

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
      if (e.key === 'Enter') void handleSubmit()
    },
    [handleSubmit],
  )

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

  const isChoiceAnswered = currentMode === 'choice' && selectedIndex !== -1

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <SessionProgress completed={wordsCompleted} total={sessionGoal} correct={correctCount} />

      {/* Direction chip + mode badge */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
        <Chip
          label={`${fromLang} → ${toLang}`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600 }}
          aria-label={`Translating from ${fromLang} to ${toLang}`}
        />
        <Chip
          label={currentMode === 'type' ? 'Type' : 'Choice'}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600 }}
          aria-label={`Quiz mode: ${currentMode}`}
        />
      </Box>

      {/* Word card */}
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

      {/* ── Type mode ──────────────────────────────────────────────────────── */}

      {currentMode === 'type' && phase === 'question' && (
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

      {currentMode === 'type' && phase === 'feedback' && lastResult !== null && (
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

      {/* ── Choice mode ────────────────────────────────────────────────────── */}

      {currentMode === 'choice' && (
        <>
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
                  disabled={isChoiceAnswered}
                  onClick={() => handleSelect(index)}
                  sx={getOptionSx(optionState)}
                  aria-label={`Option ${index + 1}: ${option}`}
                  aria-pressed={isSelected}
                  aria-describedby={
                    isChoiceAnswered && isCorrectOption ? 'correct-answer-label' : undefined
                  }
                  startIcon={
                    isChoiceAnswered && optionState === 'correct' ? <CheckCircleOutlineIcon /> :
                    isChoiceAnswered && optionState === 'incorrect' ? <CancelOutlinedIcon /> :
                    isChoiceAnswered && optionState === 'reveal' ? <CheckCircleOutlineIcon /> :
                    null
                  }
                >
                  {option}
                </Button>
              )
            })}
          </Box>

          {isChoiceAnswered && (
            <>
              <Box role="status" aria-live="polite" sx={{ textAlign: 'center' }}>
                {lastChoiceCorrect === true ? (
                  <Typography variant="h6" color="success.main" fontWeight={700}>Correct!</Typography>
                ) : (
                  <Typography variant="h6" color="error.main" fontWeight={700}>Incorrect</Typography>
                )}
              </Box>
              <Button variant="contained" size="large" fullWidth onClick={advance} autoFocus>
                {wordsCompleted >= sessionGoal ? 'See results' : 'Next word'}
              </Button>
            </>
          )}
        </>
      )}

      {/* End session */}
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
