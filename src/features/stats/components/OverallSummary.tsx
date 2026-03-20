/**
 * OverallSummary - displays aggregate stats metrics for the active pair.
 *
 * Metrics shown:
 *   - Total words in active pair
 *   - Words learned (confidence > threshold)
 *   - Total reviews all time
 *   - Average accuracy
 *   - Current streak / best streak
 */

import { Box, Card, CardContent, Divider, Skeleton, Typography } from '@mui/material'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import type { BucketCounts } from '../utils/confidenceBuckets'
import type { OverallMetrics } from '../utils/activityData'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OverallSummaryProps {
  readonly buckets: BucketCounts
  readonly metrics: OverallMetrics
  readonly streakDays: number
  readonly bestStreak: number
  readonly loading: boolean
}

// ─── Sub-component: single stat cell ─────────────────────────────────────────

interface StatCellProps {
  readonly value: string | number
  readonly label: string
  readonly icon?: React.ReactNode
  readonly color?: string
}

function StatCell({ value, label, icon, color }: StatCellProps) {
  return (
    <Box sx={{ textAlign: 'center', p: 1 }}>
      {icon && <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.25 }}>{icon}</Box>}
      <Typography
        variant="h5"
        fontWeight={700}
        lineHeight={1}
        sx={{ color: color ?? 'text.primary' }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OverallSummary({
  buckets,
  metrics,
  streakDays,
  bestStreak,
  loading,
}: OverallSummaryProps) {
  const learnedCount = buckets.mastered
  const accuracyLabel = metrics.averageAccuracy !== null ? `${metrics.averageAccuracy}%` : '—'

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Overall summary
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} width={60} height={52} sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))',
              gap: 0.5,
            }}
            role="list"
            aria-label="Overall statistics"
          >
            <Box role="listitem">
              <StatCell value={buckets.total} label="Total words" />
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Box role="listitem">
              <StatCell value={learnedCount} label="Mastered" color="success.main" />
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Box role="listitem">
              <StatCell value={metrics.totalReviews} label="Reviews" />
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Box role="listitem">
              <StatCell value={accuracyLabel} label="Avg accuracy" />
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Box role="listitem">
              <StatCell
                value={streakDays}
                label="Streak"
                color="warning.main"
                icon={
                  <LocalFireDepartmentIcon
                    sx={{ fontSize: 16, color: 'warning.main' }}
                    aria-hidden="true"
                  />
                }
              />
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Box role="listitem">
              <StatCell
                value={bestStreak}
                label="Best streak"
                color="primary.main"
                icon={
                  <EmojiEventsIcon
                    sx={{ fontSize: 16, color: 'primary.main' }}
                    aria-hidden="true"
                  />
                }
              />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
