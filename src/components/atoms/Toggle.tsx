/**
 * Toggle — iOS-style on/off switch.
 *
 * Dimensions: 51×31 pill rail, 27×27 white thumb, 2px inset from edges.
 *   - On  : ok token background, thumb at transform translateX(20px)
 *   - Off : rgba(120,120,128,0.32) background, thumb at translateX(0)
 *
 * Thumb transition uses `transform 200ms ease` (GPU-composited).
 * We deliberately use `transform` (not `left`) to keep the animation
 * off the main thread and away from backdrop-filter surfaces.
 *
 * The rail and thumb are plain <div>s — neither is a backdrop-filter surface —
 * so animating transform here does not violate the GPU constraint from Glass.
 *
 * Accessibility:
 *   role="switch" + aria-checked so assistive technologies report on/off state.
 *   aria-label is required when there is no visible label for the toggle.
 *
 * Tap target:
 *   The outer wrapper has minWidth/minHeight 44×44 (WCAG 2.5.5). The visual
 *   rail remains 51×31; the extra hit area is transparent padding that does
 *   not change the visual footprint at 100% zoom.
 */

import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassMotion } from '../../theme/liquidGlass'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToggleProps {
  readonly on: boolean
  readonly onChange?: (next: boolean) => void
  /** Accessible label — required when no surrounding text describes the control. */
  readonly 'aria-label'?: string
  /** id of an element that labels this switch (alternative to aria-label). */
  readonly 'aria-labelledby'?: string
  readonly disabled?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RAIL_WIDTH = 51
const RAIL_HEIGHT = 31
const THUMB_SIZE = 27
// Inset 2px from left edge when off; 2px from right edge when on
const THUMB_INSET = 2
// When off: translateX(0) + left:2px → thumb at 2px from left edge ✓
// When on:  translateX(20px) + left:2px → thumb at 22px from left edge → right edge at 22+27=49 → 2px from right ✓
const THUMB_TRANSLATE_ON = RAIL_WIDTH - THUMB_SIZE - THUMB_INSET * 2 // = 20
const OFF_BACKGROUND = 'rgba(120,120,128,0.32)'
const THUMB_SHADOW = '0 3px 8px rgba(0,0,0,0.15)'
// Vertical padding to reach 44px minimum hit area (WCAG 2.5.5)
const HIT_AREA_PAD_Y = Math.max(0, Math.floor((44 - RAIL_HEIGHT) / 2)) // = 6

// ─── Component ────────────────────────────────────────────────────────────────

export function Toggle({
  on,
  onChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  disabled = false,
}: ToggleProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const railBg = on ? tokens.color.ok : OFF_BACKGROUND
  const thumbTranslate = on ? `${THUMB_TRANSLATE_ON}px` : '0px'

  const handleClick = (): void => {
    if (!disabled && onChange) {
      onChange(!on)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (disabled) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onChange?.(!on)
    }
  }

  return (
    /*
     * Outer hit-area wrapper: transparent padding to reach ≥44×44 px.
     * Does NOT change the visual footprint of the 51×31 rail at 100% zoom.
     * role="switch" + ARIA on the outer element so the full tap area is
     * the accessible control boundary.
     */
    <Box
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Extend hit area to 44px height without changing visual rail height
        minWidth: RAIL_WIDTH,
        minHeight: 44,
        paddingTop: `${HIT_AREA_PAD_Y}px`,
        paddingBottom: `${HIT_AREA_PAD_Y}px`,
        flexShrink: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        background: 'none',
        border: 'none',
      }}
    >
      {/* Inner rail — the visible 51×31 element */}
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: RAIL_WIDTH,
          height: RAIL_HEIGHT,
          borderRadius: 99,
          backgroundColor: railBg,
          // Background does NOT use backdrop-filter, so this is safe to transition
          transition: `background-color ${glassMotion.toggle}`,
          flexShrink: 0,
          // Reduce Motion: turn off background colour transition
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            '& > div': { transition: 'none' },
          },
        }}
      >
        {/* Thumb — plain div, no backdrop-filter, safe to animate transform */}
        <Box
          sx={{
            position: 'absolute',
            top: THUMB_INSET,
            left: THUMB_INSET,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: 999,
            backgroundColor: '#ffffff',
            boxShadow: THUMB_SHADOW,
            // GPU-composited path: transform not left
            transform: `translateX(${thumbTranslate})`,
            transition: `transform ${glassMotion.toggle}`,
          }}
        />
      </Box>
    </Box>
  )
}
