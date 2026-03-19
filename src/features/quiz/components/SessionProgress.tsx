/**
 * SessionProgress - displays a progress bar and score for the current quiz session.
 */

import { Box, LinearProgress, Typography } from '@mui/material'

interface SessionProgressProps {
  /** Number of words completed so far. */
  readonly completed: number
  /** Total words in the session (daily goal). */
  readonly total: number
  /** Number of correct answers. */
  readonly correct: number
}

export function SessionProgress({ completed, total, correct }: SessionProgressProps) {
  const progress = total > 0 ? Math.min(100, (completed / total) * 100) : 0

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {completed} / {total}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {correct} correct
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ height: 6, borderRadius: 3 }}
        aria-label={`Session progress: ${completed} of ${total} words completed`}
      />
    </Box>
  )
}
