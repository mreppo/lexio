/**
 * QuizTopBar — shared top-bar component used by both TypeQuizContent and
 * ChoiceQuizContent.
 *
 * Extracted from TypeQuizContent during issue #147 (Liquid Glass: Quiz MC).
 *
 * Layout (left → right):
 *   - GlassIcon close button
 *   - Glass pill (flex: 1) containing Progress bar (height 6, accent tone)
 *   - Glass pill containing N/M text (14/700, ink)
 *
 * The extraction is a pure refactor — the rendered output is identical to
 * what TypeQuizContent rendered inline before this component existed.
 */

import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Glass } from '@/components/primitives/Glass'
import { GlassIcon } from '@/components/atoms/GlassIcon'
import { Progress } from '@/components/atoms/Progress'
import { IconGlyph } from '@/components/atoms/IconGlyph'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface QuizTopBarProps {
  readonly progress: {
    /** Current word index (0-based completed count). */
    readonly current: number
    /** Total words in the session. */
    readonly total: number
  }
  readonly onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuizTopBar({ progress, onClose }: QuizTopBarProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const progressValue = progress.total > 0 ? Math.min(1, progress.current / progress.total) : 0

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '10px',
        padding: '56px 16px 10px',
      }}
    >
      {/* Close button */}
      <GlassIcon as="button" aria-label="Close quiz" onClick={onClose}>
        <IconGlyph name="close" size={18} color={tokens.color.inkSoft} decorative />
      </GlassIcon>

      {/* Progress pill — fills available space */}
      <Glass radius={22} floating pad={0} sx={{ flex: 1 }}>
        <Box sx={{ padding: '15px 18px' }}>
          <Progress
            value={progressValue}
            tone="accent"
            height={6}
            aria-label={`Session progress: ${progress.current} of ${progress.total} words completed`}
          />
        </Box>
      </Glass>

      {/* N/M count pill */}
      <Glass radius={22} floating pad={0}>
        <Box
          sx={{
            height: 44,
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: glassTypography.body,
            fontSize: glassTypography.roles.quizPill.size,
            fontWeight: glassTypography.roles.quizPill.weight,
            letterSpacing: glassTypography.roles.quizPill.tracking,
            color: tokens.color.ink,
            whiteSpace: 'nowrap',
          }}
        >
          {progress.current}/{progress.total}
        </Box>
      </Glass>
    </Box>
  )
}
