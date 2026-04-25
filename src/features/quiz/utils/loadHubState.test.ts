/**
 * Unit tests for the loadHubState utility.
 *
 * Verifies that the function correctly orchestrates storage calls and
 * assembles the HubState from their results. This replaces the need to
 * test 5 separate useEffect hooks in QuizHub through component rendering.
 *
 * Covers:
 * - null pair: returns safe empty defaults, still loads streak + today stats
 * - pair present: loads words, progress, learned counts, streak, today stats
 * - today stats absent (null): wordsReviewed defaults to 0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadHubState } from './loadHubState'
import { createMockStorage } from '@/test/mockStorage'
import {
  createMockPair,
  createMockWord,
  createMockProgress,
  createMockDailyStats,
} from '@/test/fixtures'

// Mock only the two functions we need to control; everything else (including
// the LEARNED_CONFIDENCE_THRESHOLD constant) is left as the real implementation
// so that wordsLearnedService can import it without breakage.
vi.mock('@/services/streakService', async () => {
  const actual = await vi.importActual('@/services/streakService')
  return {
    // Spread real exports first — preserves constants and other helpers.
    ...(actual as Record<string, unknown>),
    loadCurrentStreak: vi.fn().mockResolvedValue(3),
    getTodayStats: vi.fn().mockResolvedValue(null),
  }
})

import { loadCurrentStreak, getTodayStats } from '@/services/streakService'

const mockLoadCurrentStreak = vi.mocked(loadCurrentStreak)
const mockGetTodayStats = vi.mocked(getTodayStats)

describe('loadHubState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadCurrentStreak.mockResolvedValue(3)
    mockGetTodayStats.mockResolvedValue(null)
  })

  describe('when pair is null', () => {
    it('should return empty wordCountByLevel', async () => {
      const storage = createMockStorage()
      const result = await loadHubState(storage, null, 20)
      expect(result.wordCountByLevel).toEqual({ A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 })
    })

    it('should return empty pairWords and wordProgressList', async () => {
      const storage = createMockStorage()
      const result = await loadHubState(storage, null, 20)
      expect(result.pairWords).toEqual([])
      expect(result.wordProgressList).toEqual([])
    })

    it('should return zero wordsLearned and totalWords', async () => {
      const storage = createMockStorage()
      const result = await loadHubState(storage, null, 20)
      expect(result.wordsLearned).toBe(0)
      expect(result.totalWords).toBe(0)
    })

    it('should still load and return the current streak', async () => {
      const storage = createMockStorage()
      const result = await loadHubState(storage, null, 20)
      expect(result.streakDays).toBe(3)
      expect(mockLoadCurrentStreak).toHaveBeenCalledWith(storage, 20)
    })

    it('should return wordsReviewed from todayStats when present', async () => {
      const stats = createMockDailyStats({ wordsReviewed: 7 })
      mockGetTodayStats.mockResolvedValue(stats)
      const storage = createMockStorage()
      const result = await loadHubState(storage, null, 20)
      expect(result.wordsReviewed).toBe(7)
    })

    it('should return wordsReviewed 0 when todayStats is null', async () => {
      mockGetTodayStats.mockResolvedValue(null)
      const storage = createMockStorage()
      const result = await loadHubState(storage, null, 20)
      expect(result.wordsReviewed).toBe(0)
    })

    it('should not call getWords or getAllProgress when pair is null', async () => {
      const storage = createMockStorage()
      await loadHubState(storage, null, 20)
      expect(storage.getWords).not.toHaveBeenCalled()
      expect(storage.getAllProgress).not.toHaveBeenCalled()
    })
  })

  describe('when pair is present', () => {
    it('should load words for the pair and populate pairWords', async () => {
      const pair = createMockPair()
      const word = createMockWord({ pairId: pair.id })
      const storage = createMockStorage({
        getWords: vi.fn().mockResolvedValue([word]),
      })

      const result = await loadHubState(storage, pair, 20)

      expect(result.pairWords).toHaveLength(1)
      expect(result.totalWords).toBe(1)
    })

    it('should load progress records for the pair', async () => {
      const pair = createMockPair()
      const word = createMockWord({ pairId: pair.id })
      const progress = createMockProgress({ wordId: word.id, confidence: 0.9 })
      const storage = createMockStorage({
        getWords: vi.fn().mockResolvedValue([word]),
        getAllProgress: vi.fn().mockResolvedValue([progress]),
      })

      const result = await loadHubState(storage, pair, 20)

      expect(result.wordProgressList).toHaveLength(1)
    })

    it('should count learned words (confidence >= 0.8)', async () => {
      const pair = createMockPair()
      const learnedWord = createMockWord({ id: 'w1', pairId: pair.id })
      const unlearnedWord = createMockWord({ id: 'w2', pairId: pair.id })
      const learnedProgress = createMockProgress({ wordId: 'w1', confidence: 0.9 })
      const unlearnedProgress = createMockProgress({ wordId: 'w2', confidence: 0.4 })
      const storage = createMockStorage({
        getWords: vi.fn().mockResolvedValue([learnedWord, unlearnedWord]),
        getAllProgress: vi.fn().mockResolvedValue([learnedProgress, unlearnedProgress]),
      })

      const result = await loadHubState(storage, pair, 20)

      expect(result.wordsLearned).toBe(1)
      expect(result.totalWords).toBe(2)
    })

    it('should return streak from loadCurrentStreak', async () => {
      mockLoadCurrentStreak.mockResolvedValue(5)
      const pair = createMockPair()
      const storage = createMockStorage()
      const result = await loadHubState(storage, pair, 20)
      expect(result.streakDays).toBe(5)
    })

    it('should pass dailyGoal to loadCurrentStreak', async () => {
      const pair = createMockPair()
      const storage = createMockStorage()
      await loadHubState(storage, pair, 15)
      expect(mockLoadCurrentStreak).toHaveBeenCalledWith(storage, 15)
    })

    it('should return wordsReviewed from todayStats when present', async () => {
      const stats = createMockDailyStats({ wordsReviewed: 12 })
      mockGetTodayStats.mockResolvedValue(stats)
      const pair = createMockPair()
      const storage = createMockStorage()
      const result = await loadHubState(storage, pair, 20)
      expect(result.wordsReviewed).toBe(12)
    })

    it('should return wordsReviewed 0 when todayStats is null', async () => {
      mockGetTodayStats.mockResolvedValue(null)
      const pair = createMockPair()
      const storage = createMockStorage()
      const result = await loadHubState(storage, pair, 20)
      expect(result.wordsReviewed).toBe(0)
    })

    it('should call getAllProgress with the pair id', async () => {
      const pair = createMockPair({ id: 'pair-abc' })
      const storage = createMockStorage()
      await loadHubState(storage, pair, 20)
      expect(storage.getAllProgress).toHaveBeenCalledWith('pair-abc')
    })
  })
})
