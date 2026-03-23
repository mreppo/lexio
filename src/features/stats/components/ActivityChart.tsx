/**
 * ActivityChart - SVG bar chart showing words reviewed per day.
 *
 * Supports a 7-day and 30-day toggle. Each bar is colour-coded by the
 * correct/incorrect ratio for that day. Uses pure SVG — no chart library.
 *
 * The viewBox is calculated to exactly match the content bounds so the SVG
 * scales uniformly with `preserveAspectRatio="xMidYMid meet"`.
 */

import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { ActivityDay, ActivityRange } from '../utils/activityData'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ActivityChartProps {
  readonly days7: readonly ActivityDay[]
  readonly days30: readonly ActivityDay[]
  readonly loading: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Intrinsic chart height (SVG units). Wide enough to give bars visual weight. */
const CHART_HEIGHT = 120

/** Gap between bars in SVG units. */
const BAR_GAP = 2

/**
 * Bar width per range.
 * 7-day bars are wider so they fill the chart area without crowding.
 * 30-day bars are narrower to fit 30 columns comfortably.
 */
const BAR_WIDTH: Record<ActivityRange, number> = {
  7: 16,
  30: 6,
}

/**
 * Font size for day labels relative to bar width.
 * Must be proportional so text doesn't appear oversized next to bars.
 */
const LABEL_FONT_SIZE: Record<ActivityRange, number> = {
  7: 10,
  30: 5,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Single-letter day abbreviations (locale-independent). */
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

/**
 * Short label for a date.
 * For 7-day view: single-letter day abbreviation (M, T, W…) to prevent overlap.
 * For 30-day view: day-of-month number (1, 2, 3…).
 */
function dayLabel(dateStr: string, range: ActivityRange): string {
  const d = new Date(`${dateStr}T00:00:00`)
  if (range === 7) {
    return DAY_LETTERS[d.getDay()] ?? 'D'
  }
  return String(d.getDate())
}

// ─── Sub-component: SVG bars ──────────────────────────────────────────────────

interface SvgBarsProps {
  readonly days: readonly ActivityDay[]
  readonly range: ActivityRange
  readonly correctColor: string
  readonly incorrectColor: string
  readonly emptyColor: string
}

function SvgBars({ days, range, correctColor, incorrectColor, emptyColor }: SvgBarsProps) {
  const maxReviewed = Math.max(...days.map((d) => d.wordsReviewed), 1)

  const barWidth = BAR_WIDTH[range]
  const fontSize = LABEL_FONT_SIZE[range]

  // Total width of all bars plus gaps — the SVG viewBox is sized to match exactly
  // so every pixel of width is used and bars are evenly distributed.
  const totalWidth = days.length * (barWidth + BAR_GAP) - BAR_GAP
  // Extra vertical room for x-axis labels below the bars
  const labelAreaHeight = fontSize + 6
  const viewBoxHeight = CHART_HEIGHT + labelAreaHeight

  // For 30-day range only show every 5th x-axis label to avoid clutter.
  const labelEvery = range === 30 ? 5 : 1

  return (
    <Box sx={{ width: '100%' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${totalWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label={`Activity bar chart showing last ${range} days`}
        role="img"
        style={{ display: 'block' }}
      >
        {days.map((day, idx) => {
          const barHeight = (day.wordsReviewed / maxReviewed) * CHART_HEIGHT
          const x = idx * (barWidth + BAR_GAP)
          const y = CHART_HEIGHT - barHeight

          // Colour by accuracy ratio
          const barColor =
            day.wordsReviewed === 0
              ? emptyColor
              : day.accuracy !== null && day.accuracy >= 0.7
                ? correctColor
                : incorrectColor

          const label = dayLabel(day.date, range)
          const showLabel = idx % labelEvery === 0

          return (
            <g key={day.date}>
              <title>
                {day.date}: {day.wordsReviewed} reviewed
                {day.accuracy !== null ? `, ${Math.round(day.accuracy * 100)}% accuracy` : ''}
              </title>
              <rect
                x={x}
                y={day.wordsReviewed === 0 ? CHART_HEIGHT - 2 : y}
                width={barWidth}
                height={day.wordsReviewed === 0 ? 2 : barHeight}
                fill={barColor}
                rx={1}
              />
              {showLabel && (
                <text
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT + labelAreaHeight - 2}
                  fontSize={fontSize}
                  textAnchor="middle"
                  fill={emptyColor}
                >
                  {label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </Box>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ActivityChart({ days7, days30, loading }: ActivityChartProps) {
  const [range, setRange] = useState<ActivityRange>(7)
  const theme = useTheme()

  const days = range === 7 ? days7 : days30
  const totalReviewed = days.reduce((s, d) => s + d.wordsReviewed, 0)

  const handleRangeChange = (_: React.MouseEvent<HTMLElement>, value: ActivityRange | null) => {
    if (value !== null) setRange(value)
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Activity
          </Typography>
          <ToggleButtonGroup
            value={range}
            exclusive
            onChange={handleRangeChange}
            size="small"
            aria-label="Activity range"
          >
            <ToggleButton value={7} aria-label="Last 7 days">
              7d
            </ToggleButton>
            <ToggleButton value={30} aria-label="Last 30 days">
              30d
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loading ? (
          <Skeleton width="100%" height={CHART_HEIGHT + 20} sx={{ borderRadius: 1 }} />
        ) : totalReviewed === 0 ? (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No activity in the last {range} days. Complete a quiz to see your chart!
            </Typography>
          </Box>
        ) : (
          <>
            <SvgBars
              days={days}
              range={range}
              correctColor={theme.palette.success.main}
              incorrectColor={theme.palette.warning.main}
              emptyColor={theme.palette.action.disabled}
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: 'success.main' }} />
                <Typography variant="caption" color="text.secondary">
                  ≥70% accuracy
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: 'warning.main' }} />
                <Typography variant="caption" color="text.secondary">
                  {'<70% accuracy'}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}
