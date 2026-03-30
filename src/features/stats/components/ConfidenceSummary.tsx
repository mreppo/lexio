/**
 * ConfidenceSummary - displays word confidence bucket counts as summary cards
 * and a proportional progress bar.
 */

import { Box, LinearProgress, Skeleton, Typography } from '@mui/material'
import type { BucketCounts } from '../utils/confidenceBuckets'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ConfidenceSummaryProps {
  readonly buckets: BucketCounts
  readonly loading: boolean
}

// ─── Bucket config ────────────────────────────────────────────────────────────

interface BucketConfig {
  readonly key: keyof Omit<BucketCounts, 'total'>
  readonly label: string
  readonly color: string
  readonly bgColor: string
}

const BUCKET_CONFIG: readonly BucketConfig[] = [
  { key: 'learning', label: 'Learning', color: 'error.main', bgColor: 'error.main' },
  { key: 'familiar', label: 'Familiar', color: 'warning.main', bgColor: 'warning.main' },
  { key: 'mastered', label: 'Mastered', color: 'success.main', bgColor: 'success.main' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function ConfidenceSummary({ buckets, loading }: ConfidenceSummaryProps) {
  const { learning, familiar, mastered, total } = buckets

  const learningPct = total > 0 ? (learning / total) * 100 : 0
  const familiarPct = total > 0 ? (familiar / total) * 100 : 0
  const masteredPct = total > 0 ? (mastered / total) * 100 : 0

  return (
    <Box
      sx={{
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        borderRadius: 3,
        p: 2.5,
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Word confidence
      </Typography>

      {loading ? (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Skeleton width={90} height={72} sx={{ borderRadius: 2 }} />
            <Skeleton width={90} height={72} sx={{ borderRadius: 2 }} />
            <Skeleton width={90} height={72} sx={{ borderRadius: 2 }} />
          </Box>
          <Skeleton width="100%" height={12} sx={{ borderRadius: 1 }} />
        </Box>
      ) : total === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No words added yet. Add words and start quizzing to see your progress here.
        </Typography>
      ) : (
        <>
          {/* Summary cards */}
          <Box
            sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}
            role="list"
            aria-label="Confidence bucket summary"
          >
            {BUCKET_CONFIG.map(({ key, label, bgColor }) => (
              <Box
                key={key}
                role="listitem"
                aria-label={`${buckets[key]} ${label.toLowerCase()} words`}
                sx={{
                  flex: '1 1 80px',
                  p: 1.5,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: bgColor,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h5" fontWeight={700} sx={{ color: bgColor, lineHeight: 1 }}>
                  {buckets[key]}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Proportional stacked progress bar */}
          <Box
            sx={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', gap: '2px' }}
            role="progressbar"
            aria-label={`${masteredPct.toFixed(0)}% mastered`}
          >
            {learningPct > 0 && (
              <Box
                sx={{
                  width: `${learningPct}%`,
                  bgcolor: 'error.main',
                  borderRadius: '5px 0 0 5px',
                }}
                aria-hidden="true"
              />
            )}
            {familiarPct > 0 && (
              <Box sx={{ width: `${familiarPct}%`, bgcolor: 'warning.main' }} aria-hidden="true" />
            )}
            {masteredPct > 0 && (
              <Box
                sx={{
                  width: `${masteredPct}%`,
                  bgcolor: 'success.main',
                  borderRadius: '0 5px 5px 0',
                }}
                aria-hidden="true"
              />
            )}
          </Box>

          {/* Overall progress label */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {total} words total
            </Typography>
            <Typography variant="caption" color="success.main" fontWeight={600}>
              {masteredPct.toFixed(0)}% mastered
            </Typography>
          </Box>

          {/* Hidden accessible progress for screen readers */}
          <LinearProgress
            variant="determinate"
            value={masteredPct}
            sx={{ display: 'none' }}
            aria-hidden="true"
          />
        </>
      )}
    </Box>
  )
}
