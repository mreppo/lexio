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

const CELL_SIZE = 12
const CELL_GAP = 2
const DAYS_PER_WEEK = 7

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
            height={DAYS_PER_WEEK * (CELL_SIZE + CELL_GAP)}
            sx={{ borderRadius: 1 }}
          />
        ) : (
          <>
            <Box
              sx={{ display: 'flex', gap: `${CELL_GAP}px`, overflowX: 'auto', py: 0.5 }}
              role="grid"
              aria-label="Activity calendar heatmap"
            >
              {weeks.map((week, weekIdx) => (
                <Box
                  key={weekIdx}
                  sx={{ display: 'flex', flexDirection: 'column', gap: `${CELL_GAP}px` }}
                  role="row"
                >
                  {week.map((day) => {
                    const bgColor =
                      day.level === 0 ? emptyColor : levelToColor(day.level, emptyColor, primaryHex)

                    return (
                      <Tooltip key={day.date} title={calendarTooltip(day)} placement="top" arrow>
                        <Box
                          role="gridcell"
                          aria-label={calendarTooltip(day)}
                          sx={{
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                            borderRadius: '2px',
                            backgroundColor: bgColor,
                            cursor: 'default',
                            transition: 'opacity 0.15s',
                            '&:hover': { opacity: 0.8 },
                            flexShrink: 0,
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
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderRadius: '2px',
                    backgroundColor:
                      level === 0 ? emptyColor : levelToColor(level, emptyColor, primaryHex),
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
