/**
 * WelcomeStep — Step 0 of the onboarding flow (Liquid Glass restyle, issue #153).
 *
 * Layout (top to bottom, centred):
 *   - Uppercase label "WELCOME TO LEXIO" (uppercaseLabel role: 13/700 tracking 1)
 *   - Headline "Learn any language, a word at a time." via <BigWord size=42>
 *   - Subhead 16/500 inkSoft max-width 320
 *   - CTA row: "Try it now" <Btn filled full lg> + "Set up my own" <Btn glass full lg>
 *
 * PaperSurface is NOT here — it wraps the whole OnboardingFlow in the parent.
 * All values flow from tokens. No hardcoded colours or spacing.
 */

import { Box, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'
import { BigWord } from '@/components/atoms/BigWord'
import { Btn } from '@/components/atoms/Btn'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WelcomeStepProps {
  readonly onDemo: () => void
  readonly onManualSetup: () => void
  /** True while the instant demo is being set up (pair + pack install). */
  readonly demoLoading?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Spec: 13/700 tracking 1 uppercase — matches the uppercaseLabel token. */
const LABEL_ROLE = glassTypography.roles.uppercaseLabel

/** Spec: BigWord size=42, headline text. */
const HEADLINE_SIZE = 42

/** Spec: subhead 16/500 inkSoft max-width 320. */
const SUBHEAD_MAX_WIDTH = 320

// ─── Component ────────────────────────────────────────────────────────────────

export function WelcomeStep({ onDemo, onManualSetup, demoLoading = false }: WelcomeStepProps) {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: '24px',
        textAlign: 'center',
        gap: '24px',
      }}
    >
      {/* Uppercase eyebrow label */}
      <Box
        component="span"
        sx={{
          display: 'block',
          fontFamily: glassTypography.body,
          fontSize: `${LABEL_ROLE.size}px`,
          fontWeight: LABEL_ROLE.weight,
          letterSpacing: `${LABEL_ROLE.tracking}px`,
          lineHeight: LABEL_ROLE.lineHeight,
          textTransform: LABEL_ROLE.transform ?? 'uppercase',
          color: tokens.color.inkSec,
        }}
      >
        Welcome to Lexio
      </Box>

      {/* Headline — BigWord size=42, h1 because it is the primary heading on this screen */}
      <BigWord size={HEADLINE_SIZE} component="h1">
        Learn any language, a word at a time.
      </BigWord>

      {/* Subhead 16/500 inkSoft max-width 320 */}
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
          maxWidth: `${SUBHEAD_MAX_WIDTH}px`,
        }}
      >
        Active recall and spaced repetition — the most effective way to build lasting vocabulary.
      </Box>

      {/* CTA buttons */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: `${SUBHEAD_MAX_WIDTH}px`,
        }}
      >
        <Btn
          kind="filled"
          size="lg"
          full
          onClick={onDemo}
          disabled={demoLoading}
          aria-label={demoLoading ? 'Setting up…' : 'Try it now'}
        >
          {demoLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CircularProgress size={18} sx={{ color: '#ffffff' }} />
              Setting up…
            </Box>
          ) : (
            'Try it now'
          )}
        </Btn>

        <Btn kind="glass" size="lg" full onClick={onManualSetup} disabled={demoLoading}>
          Set up my own
        </Btn>
      </Box>
    </Box>
  )
}
