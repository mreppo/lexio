/**
 * DailyProgressCard - compact widget showing the user's daily goal progress.
 *
 * Displayed above the quiz mode selector so the user can see at a glance
 * how many words they have reviewed today before starting a session.
 *
 * Liquid Glass restyled (issue #148): wrapped in <Glass pad=14 floating>
 * so it matches the floating card aesthetic used across all redesigned screens.
 *
 * Visual states:
 *   - Not started:  empty ring, neutral colour
 *   - In progress:  ring fills with accent (primary) colour
 *   - Goal met:     full ring in success green, "Goal met!" label
 */

import { Box, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Check, Flame } from 'lucide-react'
import { Glass } from '@/components/primitives/Glass'
import { getGlassTokens, glassTypography } from '@/theme/liquidGlass'

// ─── Props ────────────────────────────────────────────────────────────────────

interface DailyProgressCardProps {
  /** Words already reviewed today (across all previous sessions). */
  readonly wordsReviewedToday: number
  /** Daily goal target. */
  readonly dailyGoal: number
  /** Current daily streak in days. */
  readonly streakDays: number
  /** Words whose confidence >= learned threshold in the active pair. */
  readonly wordsLearned: number
  /** Total words in the active pair. */
  readonly totalWords: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RING_SIZE = 72

// ─── Component ────────────────────────────────────────────────────────────────

export function DailyProgressCard({
  wordsReviewedToday,
  dailyGoal,
  streakDays,
  wordsLearned,
  totalWords,
}: DailyProgressCardProps) {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const goalMet = wordsReviewedToday >= dailyGoal
  const progressValue = dailyGoal > 0 ? Math.min(100, (wordsReviewedToday / dailyGoal) * 100) : 0
  const ringColour = goalMet ? tokens.color.ok : tokens.color.accent

  return (
    <Glass pad={14} floating>
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}
        role="region"
        aria-label="Daily goal progress"
      >
        {/* Circular progress ring */}
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          {/* Background track */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={RING_SIZE}
            thickness={4}
            sx={{ color: tokens.color.rule2, position: 'absolute' }}
            aria-hidden="true"
          />
          {/* Foreground progress */}
          <CircularProgress
            variant="determinate"
            value={progressValue}
            size={RING_SIZE}
            thickness={4}
            sx={{ color: ringColour }}
            aria-label={`Daily goal: ${wordsReviewedToday} of ${dailyGoal} words reviewed today`}
          />
          {/* Centre label */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden="true"
          >
            {goalMet ? (
              <Check size={20} color={tokens.color.ok} strokeWidth={2.5} />
            ) : (
              <>
                <Box
                  component="span"
                  sx={{
                    fontFamily: glassTypography.body,
                    fontSize: '15px',
                    fontWeight: 700,
                    lineHeight: 1,
                    color: tokens.color.ink,
                  }}
                >
                  {wordsReviewedToday}
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontFamily: glassTypography.body,
                    fontSize: '11px',
                    fontWeight: 500,
                    lineHeight: 1,
                    color: tokens.color.inkFaint,
                  }}
                >
                  / {dailyGoal}
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* Right-side info */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Box
            component="span"
            sx={{
              fontFamily: glassTypography.body,
              fontSize: '15px',
              fontWeight: 600,
              lineHeight: 1.2,
              color: goalMet ? tokens.color.ok : tokens.color.ink,
            }}
          >
            {goalMet ? 'Goal met!' : 'Daily goal'}
          </Box>

          <Box
            component="span"
            sx={{
              fontFamily: glassTypography.body,
              fontSize: '13px',
              fontWeight: 500,
              lineHeight: 1.3,
              color: tokens.color.inkSec,
            }}
          >
            {goalMet
              ? `${wordsReviewedToday} words today`
              : `${wordsReviewedToday} / ${dailyGoal} words today`}
          </Box>

          {/* Streak badge */}
          {streakDays >= 1 && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                mt: '2px',
              }}
              role="status"
              aria-label={`${streakDays} day streak`}
            >
              <Flame size={12} color={tokens.color.warn} strokeWidth={2} aria-hidden />
              <Box
                component="span"
                sx={{
                  fontFamily: glassTypography.body,
                  fontSize: '12px',
                  fontWeight: 600,
                  lineHeight: 1,
                  color: tokens.color.warn,
                }}
              >
                {streakDays} day{streakDays !== 1 ? 's' : ''}
              </Box>
            </Box>
          )}

          {/* Words learned — inkSec ensures WCAG AA contrast at 12px */}
          {totalWords > 0 && (
            <Box
              component="span"
              sx={{
                fontFamily: glassTypography.body,
                fontSize: '12px',
                fontWeight: 500,
                lineHeight: 1.2,
                color: tokens.color.inkSec,
              }}
            >
              {wordsLearned} / {totalWords} learned
            </Box>
          )}
        </Box>
      </Box>
    </Glass>
  )
}
