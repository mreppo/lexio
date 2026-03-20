/**
 * GoalCelebration - brief celebration overlay shown once when the user
 * meets their daily goal during a quiz session.
 *
 * Auto-closes after AUTO_CLOSE_MS, or immediately when the user taps Close.
 * Should feel rewarding but brief - the user may want to keep quizzing.
 */

import { useEffect } from 'react'
import { Dialog, DialogContent, Box, Button, Typography } from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Milliseconds before the overlay auto-closes. */
export const GOAL_CELEBRATION_AUTO_CLOSE_MS = 2500

// ─── Props ────────────────────────────────────────────────────────────────────

interface GoalCelebrationProps {
  /** Whether the overlay is visible. */
  readonly open: boolean
  /** Called when the overlay should close (auto-close or manual). */
  readonly onClose: () => void
  /** The daily goal that was just met. */
  readonly dailyGoal: number
  /** Current daily streak in days (after goal was met). */
  readonly streakDays: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GoalCelebration({ open, onClose, dailyGoal, streakDays }: GoalCelebrationProps) {
  // Auto-close after timeout.
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(onClose, GOAL_CELEBRATION_AUTO_CLOSE_MS)
    return () => clearTimeout(timer)
  }, [open, onClose])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="goal-celebration-title"
      aria-describedby="goal-celebration-desc"
      PaperProps={{
        sx: {
          borderRadius: 4,
          textAlign: 'center',
          px: 4,
          py: 4,
          maxWidth: 320,
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* Trophy icon */}
          <EmojiEventsIcon sx={{ fontSize: 64, color: 'primary.main' }} aria-hidden="true" />

          {/* Heading */}
          <Typography id="goal-celebration-title" variant="h5" fontWeight={700}>
            Daily goal met!
          </Typography>

          {/* Subtitle */}
          <Typography id="goal-celebration-desc" variant="body1" color="text.secondary">
            You reviewed {dailyGoal} words today.
          </Typography>

          {/* Streak badge - only shown when streak > 1 */}
          {streakDays > 1 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'warning.main',
              }}
              role="status"
              aria-label={`${streakDays} day streak`}
            >
              <LocalFireDepartmentIcon sx={{ fontSize: 20 }} aria-hidden="true" />
              <Typography variant="body2" fontWeight={600} color="warning.main">
                {streakDays} day streak — keep it going!
              </Typography>
            </Box>
          )}

          {/* Close button */}
          <Button variant="contained" size="large" fullWidth onClick={onClose} sx={{ mt: 1 }}>
            Keep going
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
