/**
 * StepPagination — capsule progress dots for the onboarding flow.
 *
 * Displays one dot per step. The active dot is wider (24px) and accent-filled.
 * Inactive dots are narrow (8px) and rule2-filled. Both use radius 99 (pill).
 * Height 4px throughout — matches the `<Progress height=4>` aesthetic.
 *
 * All values flow from glassTypography / glassColors tokens. No hardcoded magic.
 *
 * A11y: the container is `role="tablist"` with a descriptive aria-label.
 * Each dot is `role="tab"` with `aria-selected` and `aria-label="Step N of {total}"`.
 * The dots are not interactive — they are presentation-only.
 *
 * Used by:
 *   - OnboardingFlow (3 steps, label "Onboarding progress")
 *   - TutorialStep (4 slides, label "Tutorial slides")
 */

import { Box, type SxProps, type Theme } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassMotion } from '@/theme/liquidGlass'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default step count — 3 for the manual onboarding flow (LanguagePair → Tutorial). */
const DEFAULT_STEP_COUNT = 3

/** Width of the active capsule dot in px. */
const ACTIVE_WIDTH = 24

/** Width of an inactive capsule dot in px. */
const INACTIVE_WIDTH = 8

/** Height of every dot in px. */
const DOT_HEIGHT = 4

/** Gap between dots in px. */
const DOT_GAP = 6

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StepPaginationProps {
  /**
   * Zero-based index of the currently active step within the range 0–(totalSteps-1).
   * The parent maps its own step numbering before passing this.
   */
  readonly activeStep: number
  /**
   * Total number of dots to render.
   * Defaults to 3 (the manual onboarding flow has 3 steps after Welcome).
   */
  readonly totalSteps?: number
  /**
   * Accessible label for the tablist container.
   * Defaults to "Onboarding progress".
   */
  readonly label?: string
  /** Optional sx overrides for the container. */
  readonly sx?: SxProps<Theme>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StepPagination({
  activeStep,
  totalSteps = DEFAULT_STEP_COUNT,
  label = 'Onboarding progress',
  sx,
}: StepPaginationProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    <Box
      role="tablist"
      aria-label={label}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${DOT_GAP}px`,
        py: '12px',
        ...sx,
      }}
    >
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === activeStep
        return (
          <Box
            key={index}
            role="tab"
            aria-selected={isActive}
            aria-label={`Step ${index + 1} of ${totalSteps}`}
            sx={{
              width: isActive ? `${ACTIVE_WIDTH}px` : `${INACTIVE_WIDTH}px`,
              height: `${DOT_HEIGHT}px`,
              borderRadius: '99px',
              backgroundColor: isActive ? tokens.color.accent : tokens.color.rule2,
              transition: `width ${glassMotion.toggle}, background-color ${glassMotion.toggle}`,
              // Reduce Motion: disable width transition
              '@media (prefers-reduced-motion: reduce)': {
                transition: 'none',
              },
            }}
          />
        )
      })}
    </Box>
  )
}
