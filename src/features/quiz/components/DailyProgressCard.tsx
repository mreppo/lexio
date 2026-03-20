/**
 * DailyProgressCard - compact widget showing the user's daily goal progress.
 *
 * Displayed above the quiz mode selector so the user can see at a glance
 * how many words they have reviewed today before starting a session.
 *
 * Visual states:
 *   - Not started:  empty ring, neutral colour
 *   - In progress:  ring fills with accent (primary) colour
 *   - Goal met:     full ring in success green, "Goal met!" label
 */

import { Box, CircularProgress, Typography } from '@mui/material'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

// ─── Props ────────────────────────────────────────────────────────────────────

interface DailyProgressCardProps {
  /** Words already reviewed today (across all previous sessions). */
  readonly wordsReviewedToday: number
  /** Daily goal target. */
  readonly dailyGoal: number
  /** Current daily streak in days. */
  readonly streakDays: number
  /** Words whose confidence >= learned threshold in the active pair. */
  readonly wordsLearned: number
  /** Total words in the active pair. */
  readonly totalWords: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RING_SIZE = 88

// ─── Component ────────────────────────────────────────────────────────────────

export function DailyProgressCard({
  wordsReviewedToday,
  dailyGoal,
  streakDays,
  wordsLearned,
  totalWords,
}: DailyProgressCardProps) {
  const goalMet = wordsReviewedToday >= dailyGoal
  const progressValue = dailyGoal > 0 ? Math.min(100, (wordsReviewedToday / dailyGoal) * 100) : 0

  const ringColour = goalMet ? 'success.main' : 'primary.main'

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        p: 2,
        borderRadius: 3,
        border: 1,
        borderColor: goalMet ? 'success.main' : 'divider',
        bgcolor: goalMet ? 'success.main' : 'background.paper',
        transition: 'border-color 0.2s, background-color 0.2s',
      }}
      role="region"
      aria-label="Daily goal progress"
    >
      {/* Circular progress ring */}
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        {/* Background track */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={RING_SIZE}
          thickness={4}
          sx={{ color: goalMet ? 'rgba(255,255,255,0.3)' : 'action.hover', position: 'absolute' }}
          aria-hidden="true"
        />
        {/* Foreground progress */}
        <CircularProgress
          variant="determinate"
          value={progressValue}
          size={RING_SIZE}
          thickness={4}
          sx={{ color: goalMet ? 'white' : ringColour }}
          aria-label={`Daily goal: ${wordsReviewedToday} of ${dailyGoal} words reviewed today`}
        />
        {/* Centre label */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          {goalMet ? (
            <CheckCircleOutlineIcon sx={{ fontSize: 28, color: 'white' }} />
          ) : (
            <>
              <Typography
                variant="caption"
                fontWeight={700}
                lineHeight={1}
                sx={{ color: 'text.primary', fontSize: '0.85rem' }}
              >
                {wordsReviewedToday}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', fontSize: '0.65rem', lineHeight: 1 }}
              >
                / {dailyGoal}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {/* Right-side info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {goalMet ? (
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'white' }}>
            Goal met!
          </Typography>
        ) : (
          <Typography variant="subtitle2" fontWeight={600} color="text.primary">
            Daily goal
          </Typography>
        )}

        <Typography
          variant="caption"
          sx={{ color: goalMet ? 'rgba(255,255,255,0.85)' : 'text.secondary', display: 'block' }}
        >
          {goalMet
            ? `${wordsReviewedToday} words today`
            : `${wordsReviewedToday} / ${dailyGoal} words today`}
        </Typography>

        {/* Streak badge */}
        {streakDays >= 1 && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              mt: 0.5,
              color: goalMet ? 'rgba(255,255,255,0.9)' : 'warning.main',
            }}
            role="status"
            aria-label={`${streakDays} day streak`}
          >
            <LocalFireDepartmentIcon sx={{ fontSize: 13 }} aria-hidden="true" />
            <Typography variant="caption" fontWeight={600} sx={{ lineHeight: 1 }}>
              {streakDays} day{streakDays !== 1 ? 's' : ''} streak
            </Typography>
          </Box>
        )}

        {/* Words learned */}
        {totalWords > 0 && (
          <Typography
            variant="caption"
            sx={{
              color: goalMet ? 'rgba(255,255,255,0.75)' : 'text.disabled',
              display: 'block',
              mt: 0.25,
            }}
          >
            {wordsLearned} of {totalWords} words learned
          </Typography>
        )}
      </Box>
    </Box>
  )
}
