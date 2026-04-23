/**
 * GlassRow — list row for use inside a Glass card.
 *
 * Anatomy (left to right):
 *   [icon square 34×34] [title + detail column, flex:1] [accessory] [chevron]
 *
 * Hairline divider at the bottom using rule2 token (0.5px height) unless isLast=true.
 * Divider left-inset: 64px when an icon is present (icon 34 + gap 14 + padding 16),
 * otherwise 16px.
 *
 * Props:
 *   icon    — lucide-react LucideIcon component
 *   iconBg  — CSS color for the 34×34 icon square background
 *   title   — required row label (17/500, ink, tracking -0.3)
 *   detail  — secondary line below title (13/inkSec)
 *   accessory — arbitrary ReactNode rendered before chevron (e.g. <Toggle>)
 *   chevron — show/hide the trailing chevron (default true)
 *   isLast  — when true, omits the hairline divider at the bottom
 *   onClick — optional click handler (adds cursor:pointer)
 *
 * The icon square uses the tinted-icon shadow from glassShadows.iconSquare.
 */

import { Box } from '@mui/material'
import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens, glassTypography, glassShadows } from '../../theme/liquidGlass'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlassRowProps {
  /** Lucide icon component to render inside the colored square. */
  readonly icon?: LucideIcon
  /** CSS color string for the icon square background. */
  readonly iconBg?: string
  /** Primary row label. Required. */
  readonly title: string
  /** Optional secondary label rendered below title. */
  readonly detail?: string
  /** Optional element rendered before the chevron (e.g. a Toggle). */
  readonly accessory?: React.ReactNode
  /** Whether to show the trailing chevron. Defaults to true. */
  readonly chevron?: boolean
  /** When true, omits the hairline bottom divider. */
  readonly isLast?: boolean
  /** Optional click handler. */
  readonly onClick?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GlassRow({
  icon: Icon,
  iconBg,
  title,
  detail,
  accessory,
  chevron = true,
  isLast = false,
  onClick,
}: GlassRowProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const hasIcon = Boolean(Icon)
  // Divider left inset: icon(34) + gap(14) + paddingLeft(16) = 64; else 16
  const dividerLeft = hasIcon ? '64px' : '16px'

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        minHeight: '56px',
        padding: '12px 16px',
        gap: '14px',
        cursor: onClick ? 'pointer' : 'default',
        // Hairline divider via ::after pseudo-element so it doesn't affect layout
        '&::after': isLast
          ? { display: 'none' }
          : {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: dividerLeft,
              right: '16px',
              height: '0.5px',
              backgroundColor: tokens.color.rule2,
              pointerEvents: 'none',
            },
      }}
    >
      {/* Icon square — 34×34, radius 10, tinted bg, white icon */}
      {hasIcon && Icon && (
        <Box
          aria-hidden="true"
          sx={{
            flexShrink: 0,
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            backgroundColor: iconBg ?? tokens.color.accentSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Tinted-icon shadow from tokens
            boxShadow: glassShadows.iconSquare,
          }}
        >
          <Icon
            size={18}
            strokeWidth={2.3}
            color="#ffffff"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          />
        </Box>
      )}

      {/* Text column: title + optional detail */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          component="span"
          sx={{
            display: 'block',
            fontFamily: glassTypography.body,
            fontSize: '17px',
            fontWeight: 500,
            letterSpacing: '-0.3px',
            lineHeight: 1.3,
            color: tokens.color.ink,
            // Truncate long titles
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </Box>

        {detail && (
          <Box
            component="span"
            sx={{
              display: 'block',
              fontFamily: glassTypography.body,
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '-0.1px',
              lineHeight: 1.3,
              color: tokens.color.inkSec,
              mt: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {detail}
          </Box>
        )}
      </Box>

      {/* Accessory slot (e.g. Toggle, Chip, score badge) */}
      {accessory && <Box sx={{ flexShrink: 0 }}>{accessory}</Box>}

      {/* Trailing chevron */}
      {chevron && (
        <Box aria-hidden="true" sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <ChevronRight
            size={16}
            strokeWidth={2}
            color={tokens.color.inkFaint}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Box>
      )}
    </Box>
  )
}
