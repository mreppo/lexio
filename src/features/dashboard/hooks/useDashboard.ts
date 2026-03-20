/**
 * useDashboard - loads all data required by the DashboardScreen.
 *
 * Fetches from StorageService:
 *   - today's DailyStats
 *   - recent 7-day DailyStats
 *   - current streak
 *   - word progress for the active pair
 *   - total word count for the active pair
 *
 * Refreshes whenever `activePairId` or `dailyGoal` changes.
 */

import { useState, useEffect, useCallback } from 'react'
import type { DailyStats, WordProgress } from '@/types'
import { useStorage } from '@/hooks/useStorage'
import { loadCurrentStreak, getTodayStats } from '@/services/streakService'

/** Number of recent days to fetch for the activity feed. */
const RECENT_DAYS = 7

export interface UseDashboardResult {
  readonly todayStats: DailyStats | null
  readonly recentStats: readonly DailyStats[]
  readonly streakDays: number
  readonly wordProgressList: readonly WordProgress[]
  readonly totalWords: number
  readonly loading: boolean
  /** Re-fetch all dashboard data. */
  readonly refresh: () => void
}

export function useDashboard(activePairId: string | null, dailyGoal: number): UseDashboardResult {
  const storage = useStorage()

  const [todayStats, setTodayStats] = useState<DailyStats | null>(null)
  const [recentStats, setRecentStats] = useState<readonly DailyStats[]>([])
  const [streakDays, setStreakDays] = useState(0)
  const [wordProgressList, setWordProgressList] = useState<readonly WordProgress[]>([])
  const [totalWords, setTotalWords] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const [today, recent, streak] = await Promise.all([
        getTodayStats(storage),
        storage.getRecentDailyStats(RECENT_DAYS),
        loadCurrentStreak(storage, dailyGoal),
      ])

      setTodayStats(today)
      // Sort newest first.
      setRecentStats([...recent].sort((a, b) => b.date.localeCompare(a.date)))
      setStreakDays(streak)

      if (activePairId !== null) {
        const [words, progress] = await Promise.all([
          storage.getWords(activePairId),
          storage.getAllProgress(activePairId),
        ])
        setTotalWords(words.length)
        setWordProgressList(progress)
      } else {
        setTotalWords(0)
        setWordProgressList([])
      }
    } finally {
      setLoading(false)
    }
  }, [storage, activePairId, dailyGoal])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return {
    todayStats,
    recentStats,
    streakDays,
    wordProgressList,
    totalWords,
    loading,
    refresh: () => void fetchData(),
  }
}
