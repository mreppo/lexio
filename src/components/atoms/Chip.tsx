/**
 * Chip — inline pill label.
 *
 * Two tones:
 *   - neutral : glassBg fill, ink text
 *   - accent  : accentSoft fill, accentText
 *
 * Fixed dimensions: height 26, padding 0 12, radius 999, font 12/700 tracking -0.1.
 * Always carries a 0.5px glassBorder rim (via inline border; not via Glass primitive
 * because Chip is an inline span, not a positioned surface).
 */

import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassTypography } from '../../theme/liquidGlass'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChipTone = 'neutral' | 'accent'

export interface ChipProps {
  readonly tone?: ChipTone
  readonly children: React.ReactNode
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Chip({ tone = 'neutral', children }: ChipProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const toneStyles =
    tone === 'accent'
      ? { bg: tokens.color.accentSoft, fg: tokens.color.accentText }
      : { bg: tokens.glass.bg, fg: tokens.color.ink }

  // micro role: 12/700/-0.1
  const {
    size: fontSize,
    weight: fontWeight,
    tracking: letterSpacing,
  } = glassTypography.roles.micro

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        height: 26,
        padding: '0 12px',
        borderRadius: 999,
        backgroundColor: toneStyles.bg,
        color: toneStyles.fg,
        border: `0.5px solid ${tokens.glass.border}`,
        fontFamily: glassTypography.body,
        fontSize,
        fontWeight,
        letterSpacing,
        lineHeight: 1,
        // Chip is an inline-positioned surface so we apply backdrop-filter directly.
        // The -webkit- prefix is required for iOS Safari.
        backdropFilter: 'blur(10px) saturate(150%)',
        WebkitBackdropFilter: 'blur(10px) saturate(150%)',
        '@media (prefers-reduced-transparency: reduce)': {
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          backgroundColor: tokens.color.bg,
          border: `0.5px solid ${tokens.color.rule2}`,
        },
      }}
    >
      {children}
    </Box>
  )
}
