/**
 * StatsScreen - placeholder for the progress stats feature.
 *
 * The full stats implementation will be built in a future issue.
 * This scaffold ensures navigation to this tab works correctly.
 */

import { Box, Typography } from '@mui/material'
import BarChartIcon from '@mui/icons-material/BarChart'

export function StatsScreen() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2,
        textAlign: 'center',
      }}
      role="main"
      aria-label="Stats"
    >
      <BarChartIcon sx={{ fontSize: 64, color: 'text.disabled' }} aria-hidden="true" />
      <Typography variant="h6" fontWeight={700}>
        Progress Stats
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Detailed stats and charts are coming soon.
      </Typography>
    </Box>
  )
}
