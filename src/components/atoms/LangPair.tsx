/**
 * LangPair — inline FROM → TO language code display.
 *
 * Renders two 2-letter language codes with a small arrow SVG between them.
 * Typography: 13/600, inkSec color, tracking -0.1 (caption role).
 * All values sourced from glassTypography.roles.caption + color tokens.
 */

import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassTypography } from '../../theme/liquidGlass'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LangPairProps {
  /** Source language 2-letter code (e.g. "ES", "LV"). */
  readonly from: string
  /** Target language 2-letter code (e.g. "EN", "DE"). */
  readonly to: string
}

// ─── Arrow SVG ────────────────────────────────────────────────────────────────

/** Small 12×8 right-pointing arrow to keep the icon design-spec faithful. */
function Arrow({ color }: { readonly color: string }): React.JSX.Element {
  return (
    <svg
      width="12"
      height="8"
      viewBox="0 0 12 8"
      fill="none"
      aria-hidden="true"
      style={{ opacity: 0.7 }}
    >
      <path
        d="M0 4h10m0 0l-3-3m3 3l-3 3"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LangPair({ from, to }: LangPairProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  // Spec: 13/600 inkSec tracking -0.1
  // Using caption role size (13) with weight bumped to 600 per spec
  const { size: fontSize, tracking: letterSpacing } = glassTypography.roles.caption

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: glassTypography.body,
        fontSize,
        fontWeight: 600,
        letterSpacing,
        color: tokens.color.inkSec,
        lineHeight: 1,
      }}
    >
      <span>{from}</span>
      <Arrow color={tokens.color.inkSec} />
      <span>{to}</span>
    </Box>
  )
}
