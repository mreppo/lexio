/**
 * SessionProgress - displays a progress bar, score, and current session streak
 * for the active quiz session.
 *
 * Visual polish:
 * - LinearProgress uses CSS transition for smooth fill animation
 * - Streak indicator shows a glow pulse when active
 * All animations respect `prefers-reduced-motion`.
 */

import { Box, LinearProgress, Typography } from '@mui/material'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import { GLOW_KEYFRAMES, REDUCED_MOTION_ANIMATION_NONE } from '@/utils/animation'

interface SessionProgressProps {
  /** Number of words completed so far. */
  readonly completed: number
  /** Total words in the session (daily goal). */
  readonly total: number
  /** Number of correct answers. */
  readonly correct: number
  /** Current streak of consecutive correct answers in this session. */
  readonly sessionStreak?: number
}

export function SessionProgress({
  completed,
  total,
  correct,
  sessionStreak = 0,
}: SessionProgressProps) {
  const progress = total > 0 ? Math.min(100, (completed / total) * 100) : 0
  const percentage = completed > 0 ? Math.round((correct / completed) * 100) : 0

  return (
    <>
      {/* Inject glow keyframes once */}
      <style>{GLOW_KEYFRAMES}</style>

      <Box sx={{ width: '100%', mb: 2 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
        >
          <Typography variant="caption" color="text.secondary">
            {completed} / {total}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {sessionStreak >= 2 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  color: 'warning.main',
                  borderRadius: 2,
                  px: 0.75,
                  py: 0.25,
                  animation: 'lexio-glow 1.5s ease-in-out infinite',
                  ...REDUCED_MOTION_ANIMATION_NONE,
                }}
                role="status"
                aria-label={`Session streak: ${sessionStreak} consecutive correct answers`}
              >
                <LocalFireDepartmentIcon sx={{ fontSize: 14 }} aria-hidden="true" />
                <Typography variant="caption" fontWeight={600} color="warning.main">
                  {sessionStreak}
                </Typography>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary">
              {correct} correct
              {completed > 0 && (
                <Typography
                  component="span"
                  variant="caption"
                  color="text.disabled"
                  sx={{ ml: 0.5 }}
                >
                  ({percentage}%)
                </Typography>
              )}
            </Typography>
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 3,
            // MUI LinearProgress uses CSS transitions internally.
            // We enhance the transition duration for a smoother feel and
            // disable it when the user prefers reduced motion.
            '& .MuiLinearProgress-bar': {
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              '@media (prefers-reduced-motion: reduce)': {
                transition: 'none',
              },
            },
          }}
          aria-label={`Session progress: ${completed} of ${total} words completed`}
        />
      </Box>
    </>
  )
}
