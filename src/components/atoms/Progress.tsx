/**
 * Progress — horizontal progress bar.
 *
 * Track: rule2. Fill: ink / accent / ok (via `tone`).
 * Default height 8px; configurable via `height` prop.
 * Fill width animates with `width 300ms ease` (from glassMotion.progress).
 * Fill and track are plain <div>s — not on a backdrop-filter surface,
 * so the animation does NOT conflict with the GPU backdrop-filter constraint.
 *
 * Accessibility: renders with role="progressbar", aria-valuenow, aria-valuemin,
 * aria-valuemax so assistive technologies can report progress.
 */

import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassMotion } from '../../theme/liquidGlass'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProgressTone = 'ink' | 'accent' | 'ok'

export interface ProgressProps {
  /** Current progress, 0 to 1 inclusive. */
  readonly value: number
  readonly tone?: ProgressTone
  /** Bar height in px. Default 8. */
  readonly height?: number
  /** Accessible label describing what is progressing. */
  readonly 'aria-label'?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Progress({
  value,
  tone = 'accent',
  height = 8,
  'aria-label': ariaLabel,
}: ProgressProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const fillColor: string =
    tone === 'ink' ? tokens.color.ink : tone === 'ok' ? tokens.color.ok : tokens.color.accent

  // Clamp value to [0, 1] to guard against bad props
  const clamped = Math.min(1, Math.max(0, value))
  const percent = Math.round(clamped * 100)

  return (
    <Box
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      sx={{
        height,
        backgroundColor: tokens.color.rule2,
        borderRadius: 99,
        overflow: 'hidden',
        // Reduce Motion: skip animation
        '@media (prefers-reduced-motion: reduce)': {
          '& > div': { transition: 'none' },
        },
      }}
    >
      <Box
        sx={{
          width: `${percent}%`,
          height: '100%',
          backgroundColor: fillColor,
          borderRadius: 99,
          // glassMotion.progress = '300ms ease'
          transition: `width ${glassMotion.progress}`,
        }}
      />
    </Box>
  )
}
