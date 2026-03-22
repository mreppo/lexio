/**
 * QuizFeedback - shows the result of a submitted answer.
 *
 * States:
 *  - correct  → green, pulse animation, encouraging message
 *  - almost   → amber, gentle fade-in, show exact spelling
 *  - incorrect → red, fade-in, show correct answer
 *
 * All animations respect `prefers-reduced-motion`.
 */

import { Box, Typography, Fade } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import type { MatchResult } from '@/utils/matching'
import {
  PULSE_KEYFRAMES,
  FEEDBACK_FLASH_MS,
  REDUCED_MOTION_ANIMATION_NONE,
} from '@/utils/animation'

interface QuizFeedbackProps {
  readonly result: MatchResult
  readonly correctAnswer: string
  readonly userAnswer: string
}

export function QuizFeedback({ result, correctAnswer, userAnswer }: QuizFeedbackProps) {
  if (result === 'correct') {
    return (
      <>
        <style>{PULSE_KEYFRAMES}</style>
        <Fade in timeout={250}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              py: 2,
              animation: `lexio-pulse ${FEEDBACK_FLASH_MS}ms ease-out`,
              ...REDUCED_MOTION_ANIMATION_NONE,
            }}
            role="status"
            aria-live="polite"
          >
            <CheckCircleOutlineIcon
              sx={{
                fontSize: 48,
                color: 'success.main',
              }}
            />
            <Typography variant="h6" color="success.main" fontWeight={700}>
              Correct!
            </Typography>
          </Box>
        </Fade>
      </>
    )
  }

  if (result === 'almost') {
    return (
      <Fade in timeout={300}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            py: 2,
          }}
          role="status"
          aria-live="polite"
        >
          <ErrorOutlineIcon sx={{ fontSize: 48, color: 'warning.main' }} />
          <Typography variant="h6" color="warning.main" fontWeight={700}>
            Almost!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You typed: <strong>{userAnswer}</strong>
          </Typography>
          <Typography variant="body1" color="text.primary" sx={{ mt: 0.5 }}>
            Exact spelling:{' '}
            <Box component="span" sx={{ color: 'warning.main', fontWeight: 700 }}>
              {correctAnswer}
            </Box>
          </Typography>
        </Box>
      </Fade>
    )
  }

  // incorrect
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          py: 2,
        }}
        role="status"
        aria-live="polite"
      >
        <CancelOutlinedIcon sx={{ fontSize: 48, color: 'error.main' }} />
        <Typography variant="h6" color="error.main" fontWeight={700}>
          Incorrect
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You typed: <strong>{userAnswer}</strong>
        </Typography>
        <Typography variant="body1" color="text.primary" sx={{ mt: 0.5 }}>
          Correct answer:{' '}
          <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>
            {correctAnswer}
          </Box>
        </Typography>
      </Box>
    </Fade>
  )
}
