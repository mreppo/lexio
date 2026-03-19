/**
 * SessionSummary - displayed when a quiz session ends.
 *
 * Shows words reviewed, accuracy, streak info, and an encouraging message.
 * Provides options to start a new session or return to the dashboard (home).
 */

import { Box, Button, Paper, Typography, Divider } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'

interface SessionSummaryProps {
  /** Total words reviewed in this session. */
  readonly wordsReviewed: number
  /** Total correct answers. */
  readonly correctCount: number
  /** Current streak in days (consecutive days meeting the daily goal). */
  readonly streakDays: number
  /** Called when user wants to start another session. */
  readonly onContinue: () => void
  /** Called when user wants to go back to the dashboard / home view. */
  readonly onGoHome: () => void
}

// ─── Encouraging messages ─────────────────────────────────────────────────────

function getEncouragingMessage(accuracy: number, wordsReviewed: number): string {
  if (wordsReviewed === 0) return 'Ready to start? Let\'s go!'
  if (accuracy >= 90) return 'Outstanding work! You\'re on fire!'
  if (accuracy >= 75) return 'Great job! Keep it up!'
  if (accuracy >= 50) return 'Good effort! Practice makes perfect.'
  return 'Keep going — every review builds your memory!'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SessionSummary({
  wordsReviewed,
  correctCount,
  streakDays,
  onContinue,
  onGoHome,
}: SessionSummaryProps) {
  const incorrectCount = wordsReviewed - correctCount
  const accuracy =
    wordsReviewed > 0 ? Math.round((correctCount / wordsReviewed) * 100) : 0
  const message = getEncouragingMessage(accuracy, wordsReviewed)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        py: 4,
      }}
      role="region"
      aria-label="Session summary"
    >
      {/* Encouraging header */}
      <Box sx={{ textAlign: 'center' }}>
        <CheckCircleOutlineIcon
          sx={{ fontSize: 56, color: 'success.main', mb: 1 }}
          aria-hidden="true"
        />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Session complete!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </Box>

      {/* Stats card */}
      <Paper
        elevation={2}
        sx={{ width: '100%', borderRadius: 3, overflow: 'hidden' }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            textAlign: 'center',
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography
              variant="h4"
              fontWeight={700}
              color="primary.main"
              aria-label={`${wordsReviewed} words reviewed`}
            >
              {wordsReviewed}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Words reviewed
            </Typography>
          </Box>

          <Box
            sx={{
              p: 3,
              borderLeft: 1,
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="h4"
              fontWeight={700}
              color="primary.main"
              aria-label={`${accuracy}% accuracy`}
            >
              {accuracy}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Accuracy
            </Typography>
          </Box>
        </Box>

        <Divider />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            textAlign: 'center',
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography
              variant="h5"
              fontWeight={600}
              color="success.main"
              aria-label={`${correctCount} correct`}
            >
              {correctCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Correct
            </Typography>
          </Box>

          <Box
            sx={{
              p: 2,
              borderLeft: 1,
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="h5"
              fontWeight={600}
              color={incorrectCount > 0 ? 'error.main' : 'text.secondary'}
              aria-label={`${incorrectCount} incorrect`}
            >
              {incorrectCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Incorrect
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Streak info */}
      {streakDays > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'warning.main',
          }}
          role="status"
          aria-label={`${streakDays} day streak`}
        >
          <EmojiEventsOutlinedIcon aria-hidden="true" />
          <Typography variant="body2" fontWeight={600}>
            {streakDays} day streak — keep it going!
          </Typography>
        </Box>
      )}

      {/* Action buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={onContinue}
        >
          Start new session
        </Button>
        <Button
          variant="outlined"
          size="large"
          fullWidth
          onClick={onGoHome}
        >
          Back to dashboard
        </Button>
      </Box>
    </Box>
  )
}
