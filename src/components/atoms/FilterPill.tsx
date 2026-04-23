/**
 * FilterPill — reusable pill toggle for filter rows.
 *
 * Liquid Glass pill pattern (issue #149 Library, derived from §148 QuizHub):
 *   - Active:   solid `ink` fill, `bg` text, pillActive shadow, 14/700
 *   - Inactive: <Glass> inline, `ink` text, 14/600
 *
 * Dimensions: height auto, padding 8 14, radius 999 (pill).
 * The parent owns selection semantics (mutually-exclusive or multi-select).
 *
 * A11y: renders as <button type="button"> with aria-pressed.
 */

import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Glass } from '../primitives/Glass'
import { getGlassTokens, glassTypography, glassRadius, glassShadows } from '../../theme/liquidGlass'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterPillProps {
  /** Whether this pill is in the active/selected state. */
  readonly active: boolean
  /** Visible label text. */
  readonly children: React.ReactNode
  /** Click handler — parent toggles selection. */
  readonly onClick: () => void
  /** Accessible label (falls back to the text content if not provided). */
  readonly 'aria-label'?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FilterPill({
  active,
  children,
  onClick,
  'aria-label': ariaLabel,
}: FilterPillProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  if (active) {
    return (
      <Box
        component="button"
        type="button"
        aria-pressed={true}
        aria-label={ariaLabel}
        onClick={onClick}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '8px 14px',
          borderRadius: `${glassRadius.pill}px`,
          // Solid ink fill — dark text in light mode (#000 in dark, ink token is white)
          backgroundColor: tokens.color.ink,
          // In dark mode, ink is white, so text must be black for contrast
          color: theme.palette.mode === 'dark' ? '#000000' : tokens.color.bg,
          border: 'none',
          cursor: 'pointer',
          boxShadow: glassShadows.pillActive,
          fontFamily: glassTypography.body,
          fontSize: '14px',
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '-0.1px',
          transition: 'opacity 150ms ease, transform 150ms ease',
          '&:active': { opacity: 0.8, transform: 'scale(0.95)' },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            '&:active': { transform: 'none' },
          },
        }}
      >
        {children}
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <Glass radius={glassRadius.pill} pad={0} floating={false}>
        <Box
          component="button"
          type="button"
          aria-pressed={false}
          aria-label={ariaLabel}
          onClick={onClick}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 14px',
            backgroundColor: 'transparent',
            color: tokens.color.ink,
            border: 'none',
            cursor: 'pointer',
            fontFamily: glassTypography.body,
            fontSize: '14px',
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: '-0.1px',
            borderRadius: `${glassRadius.pill}px`,
            transition: 'opacity 150ms ease, transform 150ms ease',
            '&:active': { opacity: 0.8, transform: 'scale(0.95)' },
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'none',
              '&:active': { transform: 'none' },
            },
          }}
        >
          {children}
        </Box>
      </Glass>
    </Box>
  )
}
