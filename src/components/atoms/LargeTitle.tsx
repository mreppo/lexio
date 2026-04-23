/**
 * LargeTitle — iOS-style large-title heading.
 *
 * Used by NavBar in large mode and any section heading that should anchor
 * a screen hierarchy.
 *
 * Typography: 36/800, tracking -1, line-height 1.05, color ink.
 * All values sourced from glassTypography.roles.largeTitle + color tokens.
 */

import { Box, type SxProps, type Theme } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassTypography } from '../../theme/liquidGlass'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LargeTitleProps {
  readonly children: React.ReactNode
  /** Optional sx overrides for positioning / margin. */
  readonly sx?: SxProps<Theme>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LargeTitle({ children, sx }: LargeTitleProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const { size, weight, tracking, lineHeight } = glassTypography.roles.largeTitle

  return (
    <Box
      component="h1"
      sx={{
        margin: 0,
        fontFamily: glassTypography.display,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: tracking,
        lineHeight,
        color: tokens.color.ink,
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}
