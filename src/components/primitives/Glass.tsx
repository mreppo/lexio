/**
 * Glass — the core Liquid Glass surface primitive.
 *
 * Every glass surface in Lexio is built from this component. It implements the
 * 3-layer anatomy described in docs/design/liquid-glass/README.md:
 *
 *   1. Fill layer  — backdrop-filter + background fill (glassBg / glassBgStrong)
 *   2. Rim layer   — 0.5px border + inner-highlight box-shadow
 *   3. Content layer — relative positioned slot with padding
 *
 * All three layers share border-radius via `border-radius: inherit`.
 *
 * Reduce Transparency fallback:
 *   When `@media (prefers-reduced-transparency: reduce)` matches, the blur is
 *   removed and the surface becomes solid (bg token) with a rule2-coloured
 *   0.5px border. This ensures legibility for users who have disabled
 *   transparency in their OS accessibility settings.
 *
 * GPU note: do NOT animate properties on blurred surfaces. Enter/exit
 * transitions should use opacity/transform only (no animating background,
 * backdrop-filter, or box-shadow).
 */

import { Box, type SxProps, type Theme } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassRadius } from '../../theme/liquidGlass'

/** Named radius presets matching tokens.json. */
type RadiusPreset = 'card' | 'btn' | 'glass' | 'pill'

export interface GlassProps {
  /** Use glassBgStrong instead of glassBg for the fill layer. */
  readonly strong?: boolean
  /** Add the outer drop shadow (glassShadow). */
  readonly floating?: boolean
  /**
   * Border-radius override.
   * - number: explicit pixel value
   * - 'card' | 'btn' | 'glass' | 'pill': token preset
   * Defaults to glassRadius.card (22px).
   */
  readonly radius?: number | RadiusPreset
  /** Content padding override in px. Defaults to 16. */
  readonly pad?: number
  readonly children?: React.ReactNode
  readonly sx?: SxProps<Theme>
  readonly className?: string
  /** HTML element to render as (default: 'div'). */
  readonly component?: React.ElementType
}

function resolveRadius(radius: number | RadiusPreset | undefined): number {
  if (radius === undefined) return glassRadius.card
  if (typeof radius === 'number') return radius
  return glassRadius[radius]
}

export function Glass({
  strong = false,
  floating = false,
  radius,
  pad = 16,
  children,
  sx,
  className,
  component = 'div',
}: GlassProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)
  const r = resolveRadius(radius)

  const fillBg = strong ? tokens.glass.bgStrong : tokens.glass.bg
  const outerShadow = floating ? tokens.glass.shadow : undefined

  return (
    // Outer wrapper — establishes the border-radius context that all layers inherit
    <Box
      component={component}
      className={className}
      sx={{
        position: 'relative',
        borderRadius: `${r}px`,
        // Outer drop shadow when floating
        boxShadow: outerShadow,
        // Pass through any caller overrides
        ...sx,
      }}
    >
      {/* Layer 1: Fill — backdrop-filter + glass background */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          // Backdrop blur + saturate — requires -webkit- prefix for iOS Safari
          backdropFilter: tokens.glass.backdropFilter,
          WebkitBackdropFilter: tokens.glass.backdropFilter,
          backgroundColor: fillBg,
          // Reduce Transparency fallback: solid bg, no blur
          '@media (prefers-reduced-transparency: reduce)': {
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            backgroundColor: tokens.color.bg,
          },
        }}
      />

      {/* Layer 2: Rim + inner highlight — pointer-events: none so it never blocks interaction */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          border: `0.5px solid ${tokens.glass.border}`,
          boxShadow: tokens.glass.inner,
          pointerEvents: 'none',
          // Reduce Transparency fallback: swap rim to rule2 hairline, remove inner highlight
          '@media (prefers-reduced-transparency: reduce)': {
            border: `0.5px solid ${tokens.color.rule2}`,
            boxShadow: 'none',
          },
        }}
      />

      {/* Layer 3: Content — relative so it sits above the absolute fill/rim layers */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: 'inherit',
          padding: `${pad}px`,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
