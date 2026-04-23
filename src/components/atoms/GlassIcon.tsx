/**
 * GlassIcon — 44×44 floating glass square with a centered icon.
 *
 * Used for nav icon buttons, streak chips, and any tappable icon target.
 * Composed from the <Glass> primitive so the 3-layer blur/rim anatomy is
 * never duplicated. The tappable target is always 44×44 minimum (a11y).
 *
 * Renders as a <button> by default; pass `as="div"` for non-interactive use.
 */

import { Box } from '@mui/material'
import { Glass } from '../primitives/Glass'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlassIconProps {
  /** Icon or any element to centre inside the glass square. */
  readonly children: React.ReactNode
  /**
   * HTML element to render the interactive wrapper as.
   * Use "button" for clickable icons, "div" for purely decorative.
   * Default: "button".
   */
  readonly as?: 'button' | 'div'
  /** Click handler. */
  readonly onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLDivElement>
  /** Accessible label — required when `as="button"` and there is no visible text. */
  readonly 'aria-label'?: string
  /** Size in px for both width and height. Default 44. */
  readonly size?: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GlassIcon({
  children,
  as: Tag = 'button',
  onClick,
  'aria-label': ariaLabel,
  size = 44,
}: GlassIconProps): React.JSX.Element {
  // Radius 22 matches the spec: "44×44 floating glass square (radius 22)"
  const radius = size / 2

  return (
    <Box
      component={Tag}
      type={Tag === 'button' ? 'button' : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      sx={{
        // Reset button styles
        display: 'inline-block',
        padding: 0,
        border: 'none',
        background: 'none',
        cursor: Tag === 'button' ? 'pointer' : undefined,
        // Ensure tappable target is at least 44×44 (WCAG 2.5.5)
        minWidth: 44,
        minHeight: 44,
        width: size,
        height: size,
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      <Glass
        radius={radius}
        pad={0}
        floating
        sx={{
          width: size,
          height: size,
        }}
      >
        {/* Centre the icon within the 44×44 glass square */}
        <Box
          sx={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </Box>
      </Glass>
    </Box>
  )
}
