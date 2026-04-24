/**
 * Btn — Liquid Glass pill button.
 *
 * Three kinds:
 *   - filled  : accent background, white text, accent drop shadow
 *   - white   : white fill, accent text (700), white drop shadow
 *   - glass   : Glass primitive (strong + floating), ink-colored text
 *
 * Three sizes:
 *   - sm : height 36, font 15/600, h-padding 14
 *   - md : height 50, font 17/600, h-padding 20
 *   - lg : height 56, font 17/600, h-padding 24
 *
 * Border-radius is always height/2 (true pill).
 * `full` stretches to 100% width.
 */

import { useTheme } from '@mui/material/styles'
import { Box } from '@mui/material'
import { getGlassTokens, glassShadows, glassTypography } from '../../theme/liquidGlass'
import { Glass } from '../primitives/Glass'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BtnKind = 'filled' | 'white' | 'glass'
export type BtnSize = 'sm' | 'md' | 'lg'

export interface BtnProps {
  readonly kind?: BtnKind
  readonly size?: BtnSize
  /** Stretch to 100% container width. */
  readonly full?: boolean
  readonly children?: React.ReactNode
  readonly onClick?: React.MouseEventHandler<HTMLButtonElement>
  readonly disabled?: boolean
  readonly type?: 'button' | 'submit' | 'reset'
  /** Accessible label override — use when children is not plain text. */
  readonly 'aria-label'?: string
}

// ─── Size config ──────────────────────────────────────────────────────────────

interface SizeConfig {
  readonly height: number
  readonly fontSize: number
  readonly paddingX: number
}

const SIZE_CONFIG: Readonly<Record<BtnSize, SizeConfig>> = {
  // sm height is 36px visually; min-height 44 extends the tap target to meet
  // WCAG 2.5.5 without changing the visual appearance at 100% zoom.
  // The filled/white variants add extra top/bottom padding via min-height.
  // The glass variant wraps in a Glass primitive — the button inside gets min-height.
  sm: { height: 36, fontSize: 15, paddingX: 14 },
  md: { height: 50, fontSize: 17, paddingX: 20 },
  lg: { height: 56, fontSize: 17, paddingX: 24 },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Btn({
  kind = 'glass',
  size = 'md',
  full = false,
  children,
  onClick,
  disabled = false,
  type = 'button',
  'aria-label': ariaLabel,
}: BtnProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const { height, fontSize, paddingX } = SIZE_CONFIG[size]
  const borderRadius = height / 2

  // Shared typography from glassTypography.roles.button tracking
  const letterSpacing = glassTypography.roles.button.tracking

  const sharedTextSx = {
    fontFamily: glassTypography.body,
    fontSize,
    fontWeight: 600,
    letterSpacing,
    lineHeight: 1,
  }

  if (kind === 'filled') {
    return (
      <Box
        component="button"
        type={type}
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          height,
          // sm (36px) is below 44px — enforce minimum tap target height.
          // md/lg are already ≥44px so minHeight has no visual effect there.
          minHeight: 44,
          width: full ? '100%' : 'auto',
          paddingX: `${paddingX}px`,
          backgroundColor: tokens.color.accent,
          color: '#ffffff',
          border: 'none',
          borderRadius,
          boxShadow: glassShadows.accentBtn,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          ...sharedTextSx,
          // Pressed state: slight scale-down
          '&:active:not(:disabled)': {
            transform: 'scale(0.97)',
            transition: 'transform 80ms ease',
          },
        }}
      >
        {children}
      </Box>
    )
  }

  if (kind === 'white') {
    return (
      <Box
        component="button"
        type={type}
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          height,
          // sm (36px) is below 44px — enforce minimum tap target height.
          minHeight: 44,
          width: full ? '100%' : 'auto',
          paddingX: `${paddingX}px`,
          backgroundColor: '#ffffff',
          color: tokens.color.accent,
          border: 'none',
          borderRadius,
          boxShadow: glassShadows.whiteBtn,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          ...sharedTextSx,
          // White button uses 700 weight per spec (override shared 600)
          fontWeight: 700,
          '&:active:not(:disabled)': {
            transform: 'scale(0.97)',
            transition: 'transform 80ms ease',
          },
        }}
      >
        {children}
      </Box>
    )
  }

  // kind === 'glass' — compose <Glass> so we never re-implement the blur layer
  return (
    <Box
      sx={{
        display: full ? 'block' : 'inline-block',
        width: full ? '100%' : 'auto',
      }}
    >
      <Glass radius={borderRadius} pad={0} strong floating>
        <Box
          component="button"
          type={type}
          disabled={disabled}
          onClick={onClick}
          aria-label={ariaLabel}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height,
            // sm (36px) is below 44px — enforce minimum tap target height.
            minHeight: 44,
            width: '100%',
            paddingX: `${paddingX}px`,
            backgroundColor: 'transparent',
            color: tokens.color.ink,
            border: 'none',
            borderRadius,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            ...sharedTextSx,
            '&:active:not(:disabled)': {
              transform: 'scale(0.97)',
              transition: 'transform 80ms ease',
            },
          }}
        >
          {children}
        </Box>
      </Glass>
    </Box>
  )
}
