/**
 * NavBar — Liquid Glass floating navigation bar.
 *
 * Two layout variants:
 *
 * Compact (large=false, default):
 *   - 52px top padding (room for status bar)
 *   - Row: [leading] [Glass pill h=44 with title 16/700] [trailing]
 *   - If no title provided the center pill is omitted
 *
 * Large (large=true):
 *   - 52px top padding + leading/trailing row (no center pill)
 *   - <LargeTitle> rendered below at padding 14 22 8
 *   - prominentTitle takes precedence over title in large mode
 *
 * Props are all optional so NavBar can be used without any content.
 *
 * A11y: wraps in <header> landmark. Trailing/leading are rendered as-is;
 * caller is responsible for accessible labels on those elements.
 */

import { Box, type SxProps, type Theme } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Glass } from '../primitives/Glass'
import { LargeTitle } from '../atoms/LargeTitle'
import { getGlassTokens, glassTypography } from '../../theme/liquidGlass'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavBarProps {
  /** Title displayed in the compact center pill (or used as fallback for large mode). */
  readonly title?: string
  /** Leading element (e.g. back button, avatar). Rendered left of center pill. */
  readonly leading?: React.ReactNode
  /** Trailing element(s) (e.g. icon buttons). Rendered right of center pill. */
  readonly trailing?: React.ReactNode
  /**
   * Large mode: hides the center pill and renders a LargeTitle below the row.
   * Defaults to false.
   */
  readonly large?: boolean
  /**
   * Title shown in large mode (overrides `title`).
   * Allows "prominentTitle" to differ from the compact pill title.
   */
  readonly prominentTitle?: string
  /** Optional sx overrides for the outermost wrapper. */
  readonly sx?: SxProps<Theme>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NavBar({
  title,
  leading,
  trailing,
  large = false,
  prominentTitle,
  sx,
}: NavBarProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const displayTitle = large ? (prominentTitle ?? title) : title

  return (
    <Box
      component="header"
      sx={{
        // 52px top offset: leaves room for the device status bar + visual breathing room
        paddingTop: '52px',
        ...sx,
      }}
    >
      {/* Icon row: leading — [compact pill] — trailing */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: '16px',
          gap: '10px',
          height: '50px',
        }}
      >
        {/* Leading slot — empty div preserves layout when nothing is provided */}
        <Box sx={{ flexShrink: 0 }}>{leading}</Box>

        {/* Compact center pill — only rendered when NOT in large mode and title is provided */}
        {!large && title && (
          <Glass radius={22} pad={0} floating sx={{ flex: 1, maxWidth: 260 }}>
            <Box
              sx={{
                height: '44px',
                px: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: glassTypography.body,
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '-0.3px',
                color: tokens.color.ink,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </Box>
          </Glass>
        )}

        {/* When large or no title: spacer keeps trailing pushed right */}
        {(large || !title) && <Box sx={{ flex: 1 }} />}

        {/* Trailing slot */}
        <Box sx={{ display: 'flex', gap: '8px', flexShrink: 0 }}>{trailing}</Box>
      </Box>

      {/* Large-mode title block */}
      {large && displayTitle && (
        <Box sx={{ padding: '14px 22px 8px' }}>
          <LargeTitle>{displayTitle}</LargeTitle>
        </Box>
      )}
    </Box>
  )
}
