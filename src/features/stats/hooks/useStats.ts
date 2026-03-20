/**
 * useStats - loads all data required by the StatsScreen.
 *
 * Fetches from StorageService:
 *   - words and progress records for the active pair
 *   - daily stats history (last 90+ days)
 *   - user settings (daily goal)
 *   - current streak and best streak
 *
 * Refreshes whenever activePairId changes.
 */

import { useState, useEffect, useCallback } from 'react'
import type { DailyStats, Word, WordProgress } from '@/types'
import { useStorage } from '@/hooks/useStorage'
import { loadCurrentStreak, loadBestStreak } from '@/services/streakService'
import { CALENDAR_DAYS } from '../utils/activityData'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseStatsResult {
  readonly words: readonly Word[]
  readonly progress: readonly WordProgress[]
  readonly dailyStats: readonly DailyStats[]
  readonly streakDays: number
  readonly bestStreak: number
  readonly dailyGoal: number
  readonly loading: boolean
  readonly refresh: () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStats(activePairId: string | null): UseStatsResult {
  const storage = useStorage()

  const [words, setWords] = useState<readonly Word[]>([])
  const [progress, setProgress] = useState<readonly WordProgress[]>([])
  const [dailyStats, setDailyStats] = useState<readonly DailyStats[]>([])
  const [streakDays, setStreakDays] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [dailyGoal, setDailyGoal] = useState(20)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const [settings, stats] = await Promise.all([
        storage.getSettings(),
        storage.getRecentDailyStats(CALENDAR_DAYS + 10),
      ])

      // Compute streaks after settings are loaded so we have the dailyGoal.
      const [currentStreak, best] = await Promise.all([
        loadCurrentStreak(storage, settings.dailyGoal),
        loadBestStreak(storage, settings.dailyGoal),
      ])

      setDailyGoal(settings.dailyGoal)
      setDailyStats(stats)
      setStreakDays(currentStreak)
      setBestStreak(best)

      if (activePairId !== null) {
        const [ws, ps] = await Promise.all([
          storage.getWords(activePairId),
          storage.getAllProgress(activePairId),
        ])
        setWords(ws)
        setProgress(ps)
      } else {
        setWords([])
        setProgress([])
      }
    } finally {
      setLoading(false)
    }
  }, [storage, activePairId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return {
    words,
    progress,
    dailyStats,
    streakDays,
    bestStreak,
    dailyGoal,
    loading,
    refresh: () => void fetchData(),
  }
}
