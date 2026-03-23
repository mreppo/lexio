/**
 * StreakCalendar - GitHub-style contribution heatmap showing activity
 * over the last ~3 months (91 days).
 *
 * Each cell is colour-coded by intensity:
 *   Level 0 = no activity (background colour)
 *   Level 1 = low       (10% of goal)
 *   Level 2 = moderate  (25% of goal)
 *   Level 3 = good      (50%+ of goal)
 *   Level 4 = excellent (100%+ of goal / goal met)
 *
 * Layout uses CSS Grid with `1fr` columns so the calendar fills the full
 * card width at any container size. Each cell has `aspect-ratio: 1` so the
 * grid rows stay square without fixed pixel dimensions.
 */

import { Box, Card, CardContent, Skeleton, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { CalendarDay } from '../utils/activityData'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StreakCalendarProps {
  readonly days: readonly CalendarDay[]
  readonly loading: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_PER_WEEK = 7

/**
 * Fixed size (px) used only for legend swatches and the loading skeleton.
 * The actual calendar cells scale with the container via CSS Grid.
 */
const LEGEND_SWATCH_SIZE = 12

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Maps an intensity level to a colour using the theme. */
function levelToColor(level: 0 | 1 | 2 | 3 | 4, emptyColor: string, primaryColor: string): string {
  if (level === 0) return emptyColor
  // Use opacity to build the gradient from primary colour.
  const opacities = [0, 0.25, 0.45, 0.7, 1] as const
  // Decompose primary hex colour to apply alpha manually via MUI sx
  return `${primaryColor}${Math.round(opacities[level] * 255)
    .toString(16)
    .padStart(2, '0')}`
}

/** Returns a human-readable tooltip label for a calendar day. */
function calendarTooltip(day: CalendarDay): string {
  const d = new Date(`${day.date}T00:00:00`)
  const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  if (!day.hasData || day.wordsReviewed === 0) return `${label}: No activity`
  return `${label}: ${day.wordsReviewed} word${day.wordsReviewed !== 1 ? 's' : ''} reviewed`
}

/** Groups calendar days into week columns for rendering. */
function groupIntoWeeks(days: readonly CalendarDay[]): CalendarDay[][] {
  const weeks: CalendarDay[][] = []
  let week: CalendarDay[] = []

  for (const day of days) {
    week.push(day)
    if (week.length === DAYS_PER_WEEK) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) weeks.push(week)

  return weeks
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StreakCalendar({ days, loading }: StreakCalendarProps) {
  const theme = useTheme()
  const weeks = groupIntoWeeks(days)

  const emptyColor = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const primaryHex = theme.palette.primary.main // e.g. "#f59e0b"

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Activity calendar
        </Typography>

        {loading ? (
          <Skeleton
            width="100%"
            height={DAYS_PER_WEEK * (LEGEND_SWATCH_SIZE + 2)}
            sx={{ borderRadius: 1 }}
          />
        ) : (
          <>
            {/*
             * Responsive grid: each week is a column of equal width (1fr).
             * Cells use aspect-ratio:1 so they remain square at any width.
             * gap is expressed in pixels because it needs to be consistent
             * regardless of the container width.
             */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
                gap: '2px',
                width: '100%',
              }}
              role="grid"
              aria-label="Activity calendar heatmap"
            >
              {weeks.map((week, weekIdx) => (
                <Box
                  key={weekIdx}
                  sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
                  role="row"
                >
                  {week.map((day) => {
                    const bgColor =
                      day.level === 0 ? emptyColor : levelToColor(day.level, emptyColor, primaryHex)
                    const tooltipText = calendarTooltip(day)

                    return (
                      <Tooltip key={day.date} title={tooltipText} placement="top" arrow>
                        <Box
                          role="gridcell"
                          aria-label={tooltipText}
                          sx={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: '2px',
                            backgroundColor: bgColor,
                            cursor: 'default',
                            transition: 'opacity 0.15s',
                            '&:hover': { opacity: 0.8 },
                          }}
                        />
                      </Tooltip>
                    )
                  })}
                </Box>
              ))}
            </Box>

            {/* Legend */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Less
              </Typography>
              {([0, 1, 2, 3, 4] as const).map((level) => (
                <Box
                  key={level}
                  sx={{
                    width: LEGEND_SWATCH_SIZE,
                    height: LEGEND_SWATCH_SIZE,
                    borderRadius: '2px',
                    backgroundColor:
                      level === 0 ? emptyColor : levelToColor(level, emptyColor, primaryHex),
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
              ))}
              <Typography variant="caption" color="text.secondary">
                More
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}
