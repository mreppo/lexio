/**
 * BigWord — display-font numeric or word component.
 *
 * Used for quiz target words, hero stat numbers, and any text
 * that must visually dominate the screen.
 *
 * Typography defaults:
 *   - size 44 / weight 800 / tracking -1.2 (for size ≥ 40)
 *   - size 44 / weight 800 / tracking -0.5 (for size < 40)
 *   - line-height 1.02
 *
 * Accepts `size`, `weight`, `color` overrides so screens can tune per design.
 * Color defaults to the ink token for the current theme mode.
 * All font values flow from glassTypography (display family, heroWord role).
 */

import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassTypography } from '../../theme/liquidGlass'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BigWordProps {
  readonly children: React.ReactNode
  /** Font size in px. Default 44. */
  readonly size?: number
  /** Font weight. Default 800. */
  readonly weight?: number
  /** Text color. Defaults to ink token. */
  readonly color?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Threshold above which tight tracking (-1.2) is applied. Matches spec. */
const LARGE_SIZE_THRESHOLD = 40

// ─── Component ────────────────────────────────────────────────────────────────

export function BigWord({
  children,
  size = 44,
  weight = 800,
  color,
}: BigWordProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  // Spec: -1.2 tracking for size >= 40, -0.5 for smaller sizes
  const letterSpacing = size >= LARGE_SIZE_THRESHOLD ? -1.2 : -0.5

  return (
    <Box
      component="span"
      sx={{
        display: 'block',
        fontFamily: glassTypography.display,
        fontSize: size,
        fontWeight: weight,
        letterSpacing,
        // heroWord line-height 1.02
        lineHeight: glassTypography.roles.heroWord.lineHeight,
        color: color ?? tokens.color.ink,
      }}
    >
      {children}
    </Box>
  )
}
