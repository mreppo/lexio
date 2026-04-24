/**
 * StepHeader — shared heading block for manual onboarding steps.
 *
 * Renders a large title (28/800) and a subhead (16/500 inkSoft) with
 * consistent top padding (72px) and horizontal padding (24px by default).
 * Used by LanguagePairStep, AddWordsStep, and TutorialStep.
 *
 * All values flow from tokens. No hardcoded colours or spacing.
 */

import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StepHeaderProps {
  readonly title: string
  readonly subtitle: string
  /** Horizontal padding override in px. Defaults to 24. */
  readonly paddingX?: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StepHeader({ title, subtitle, paddingX = 24 }: StepHeaderProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Box sx={{ pt: '72px', px: `${paddingX}px`, mb: '28px' }}>
      <Box
        component="h1"
        sx={{
          margin: 0,
          fontFamily: glassTypography.display,
          fontSize: '28px',
          fontWeight: 800,
          letterSpacing: '-0.6px',
          lineHeight: 1.1,
          color: tokens.color.ink,
          mb: '8px',
        }}
      >
        {title}
      </Box>
      <Box
        component="p"
        sx={{
          margin: 0,
          fontFamily: glassTypography.body,
          fontSize: '16px',
          fontWeight: 500,
          letterSpacing: '-0.2px',
          lineHeight: 1.5,
          color: tokens.color.inkSoft,
        }}
      >
        {subtitle}
      </Box>
    </Box>
  )
}
