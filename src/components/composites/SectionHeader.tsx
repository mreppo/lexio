/**
 * SectionHeader — iOS-style uppercase section label.
 *
 * Renders children as uppercase, letter-spaced small-caps text.
 * Typography: 13px / weight 600 / inkSec / text-transform uppercase / letter-spacing 0.6px.
 * Padding: 20px top, 30px horizontal, 8px bottom (verbatim from design spec).
 *
 * Usage:
 *   <SectionHeader>Daily practice</SectionHeader>
 *   → renders "DAILY PRACTICE" in inkSec style
 */

import { Box, type SxProps, type Theme } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassTypography } from '../../theme/liquidGlass'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SectionHeaderProps {
  readonly children: React.ReactNode
  /** Optional sx overrides for positioning / margin. */
  readonly sx?: SxProps<Theme>
  /**
   * HTML element rendered by the Box. Defaults to 'h2'.
   * All callers currently land on h2 (correct after a LargeTitle h1).
   * Override to 'h3' when nesting inside a section that already has an h2.
   */
  readonly component?: React.ElementType
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SectionHeader({
  children,
  sx,
  component = 'h2',
}: SectionHeaderProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Box
      component={component}
      sx={{
        // Reset heading margin (browser default adds top margin)
        margin: 0,
        // Padding: 20 top, 30 horizontal, 8 bottom per spec
        padding: '20px 30px 8px',
        fontFamily: glassTypography.body,
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.6px',
        lineHeight: 1,
        color: tokens.color.inkSec,
        textTransform: 'uppercase',
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}
