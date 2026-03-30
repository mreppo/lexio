/**
 * SessionSummary - displayed when a quiz session ends.
 *
 * Shows words reviewed, accuracy, streak info, words learned, and an
 * encouraging message. Provides options to start a new session or return
 * to the mode selector.
 */

import { Box, Button, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'

interface SessionSummaryProps {
  /** Total words reviewed in this session. */
  readonly wordsReviewed: number
  /** Total correct answers. */
  readonly correctCount: number
  /** Current daily streak in days (consecutive days meeting the daily goal). */
  readonly streakDays: number
  /** Best consecutive-correct streak achieved within this session. */
  readonly bestSessionStreak: number
  /** Number of words learned (confidence >= threshold) in the active pair. */
  readonly wordsLearned: number
  /** Total words in the active pair. */
  readonly totalWords: number
  /** Whether the daily goal was met (including today's previous sessions). */
  readonly dailyGoalMet: boolean
  /** Total words reviewed today (including this session). */
  readonly wordsReviewedToday: number
  /** The daily goal target. */
  readonly dailyGoal: number
  /** Called when user wants to start another session. */
  readonly onContinue: () => void
  /** Called when user wants to go back to the mode selector. */
  readonly onGoHome: () => void
}

// ─── Encouraging messages ─────────────────────────────────────────────────────

function getEncouragingMessage(accuracy: number, wordsReviewed: number): string {
  if (wordsReviewed === 0) return "Ready to start? Let's go!"
  if (accuracy >= 90) return "Outstanding work! You're on fire!"
  if (accuracy >= 75) return 'Great job! Keep it up!'
  if (accuracy >= 50) return 'Good effort! Practice makes perfect.'
  return 'Keep going — every review builds your memory!'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SessionSummary({
  wordsReviewed,
  correctCount,
  streakDays,
  bestSessionStreak,
  wordsLearned,
  totalWords,
  dailyGoalMet,
  wordsReviewedToday,
  dailyGoal,
  onContinue,
  onGoHome,
}: SessionSummaryProps) {
  const incorrectCount = wordsReviewed - correctCount
  const accuracy = wordsReviewed > 0 ? Math.round((correctCount / wordsReviewed) * 100) : 0
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

      {/* Stats grid */}
      <Box
        sx={{
          width: '100%',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            textAlign: 'center',
            gap: '1px',
          }}
        >
          <Box
            sx={{
              p: 3,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            }}
          >
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
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
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

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            textAlign: 'center',
            gap: '1px',
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            }}
          >
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
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
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

        {/* Best in-session streak row */}
        {bestSessionStreak >= 2 && (
          <Box
            sx={{
              p: 2,
              textAlign: 'center',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <LocalFireDepartmentIcon
                sx={{ color: 'warning.main', fontSize: 20 }}
                aria-hidden="true"
              />
              <Typography
                variant="h5"
                fontWeight={600}
                color="warning.main"
                aria-label={`Best in-session streak: ${bestSessionStreak} correct in a row`}
              >
                {bestSessionStreak}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Best streak this session
            </Typography>
          </Box>
        )}

        {/* Words learned row */}
        {totalWords > 0 && (
          <Box
            sx={{
              p: 2,
              textAlign: 'center',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            }}
          >
            <Typography
              variant="h5"
              fontWeight={600}
              color="primary.main"
              aria-label={`${wordsLearned} of ${totalWords} words learned`}
            >
              {wordsLearned} / {totalWords}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Words learned
            </Typography>
          </Box>
        )}
      </Box>

      {/* Daily goal status */}
      {dailyGoalMet ? (
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          role="status"
          aria-label="Daily goal met"
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              bgcolor: 'success.main',
              color: 'success.contrastText',
              borderRadius: 2,
              px: 2,
              py: 0.5,
              fontWeight: 700,
              fontSize: '0.875rem',
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: 18 }} aria-hidden="true" />
            Daily goal met!
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {dailyGoal - wordsReviewedToday > 0
            ? `${dailyGoal - wordsReviewedToday} more word${dailyGoal - wordsReviewedToday !== 1 ? 's' : ''} to reach your daily goal`
            : 'Keep reviewing to reach your daily goal'}
        </Typography>
      )}

      {/* Daily streak info */}
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
        <Button variant="contained" size="large" fullWidth onClick={onContinue}>
          Start new session
        </Button>
        <Button
          variant="text"
          size="large"
          fullWidth
          onClick={onGoHome}
          sx={{
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          }}
        >
          Back to dashboard
        </Button>
      </Box>
    </Box>
  )
}
