/**
 * StatsScreen - the main statistics view.
 *
 * Sections:
 *   1. Overall summary - aggregate metrics (words, reviews, accuracy, streaks)
 *   2. Word confidence - confidence bucket counts + proportional bar
 *   3. Activity chart  - daily bar chart (last 7 / 30 days)
 *   4. Streak calendar - GitHub-style heatmap (last ~3 months)
 *   5. Word progress   - per-word sortable/filterable table
 *
 * Accepts an optional activePairId prop. When not provided, it loads the
 * active pair from UserSettings (backward-compatible with the existing
 * no-prop call in App.tsx).
 */

import { useState, useEffect, useMemo } from 'react'
import { Box } from '@mui/material'
import { useStorage } from '@/hooks/useStorage'
import { useStats } from '../hooks/useStats'
import { buildWordStatsList, computeBucketCounts } from '../utils/confidenceBuckets'
import { buildActivityDays, buildCalendarDays, computeOverallMetrics } from '../utils/activityData'
import { ConfidenceSummary } from './ConfidenceSummary'
import { ActivityChart } from './ActivityChart'
import { StreakCalendar } from './StreakCalendar'
import { WordStatsTable } from './WordStatsTable'
import { OverallSummary } from './OverallSummary'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StatsScreenProps {
  /** The currently active language pair ID, or null if none. */
  readonly activePairId?: string | null
}

// ─── Inner component ──────────────────────────────────────────────────────────

interface StatsContentProps {
  readonly activePairId: string | null
}

function StatsContent({ activePairId }: StatsContentProps) {
  const { words, progress, dailyStats, streakDays, bestStreak, dailyGoal, loading } =
    useStats(activePairId)

  const wordStats = useMemo(() => buildWordStatsList(words, progress), [words, progress])
  const buckets = useMemo(() => computeBucketCounts(wordStats), [wordStats])
  const days7 = useMemo(() => buildActivityDays(dailyStats, 7), [dailyStats])
  const days30 = useMemo(() => buildActivityDays(dailyStats, 30), [dailyStats])
  const calendarDays = useMemo(
    () => buildCalendarDays(dailyStats, dailyGoal),
    [dailyStats, dailyGoal],
  )
  const metrics = useMemo(() => computeOverallMetrics(dailyStats), [dailyStats])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} role="main" aria-label="Stats">
      <OverallSummary
        buckets={buckets}
        metrics={metrics}
        streakDays={streakDays}
        bestStreak={bestStreak}
        loading={loading}
      />

      <ConfidenceSummary buckets={buckets} loading={loading} />

      <ActivityChart days7={days7} days30={days30} loading={loading} />

      <StreakCalendar days={calendarDays} loading={loading} />

      <WordStatsTable wordStats={wordStats} loading={loading} />
    </Box>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function StatsScreen({ activePairId: propPairId }: StatsScreenProps = {}) {
  const storage = useStorage()
  const [settingsPairId, setSettingsPairId] = useState<string | null>(null)

  // When no activePairId prop is provided, fall back to loading it from settings.
  useEffect(() => {
    if (propPairId !== undefined) return
    void storage.getSettings().then((s) => setSettingsPairId(s.activePairId))
  }, [storage, propPairId])

  const resolvedPairId = propPairId !== undefined ? propPairId : settingsPairId

  return <StatsContent activePairId={resolvedPairId} />
}
