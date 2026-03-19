/**
 * Shared mock StorageService factory.
 *
 * Returns a StorageService where every method is a vi.fn() with a sensible
 * default return value (empty arrays, null, etc.).
 *
 * Individual tests can override specific methods:
 *   const storage = createMockStorage({
 *     getWords: vi.fn().mockResolvedValue([createMockWord()]),
 *   })
 */

import { vi } from 'vitest'
import type { StorageService } from '@/services/storage/StorageService'

export function createMockStorage(overrides: Partial<StorageService> = {}): StorageService {
  return {
    getLanguagePairs: vi.fn().mockResolvedValue([]),
    getLanguagePair: vi.fn().mockResolvedValue(null),
    saveLanguagePair: vi.fn().mockResolvedValue(undefined),
    deleteLanguagePair: vi.fn().mockResolvedValue(undefined),
    getWords: vi.fn().mockResolvedValue([]),
    getWord: vi.fn().mockResolvedValue(null),
    saveWord: vi.fn().mockResolvedValue(undefined),
    saveWords: vi.fn().mockResolvedValue(undefined),
    deleteWord: vi.fn().mockResolvedValue(undefined),
    getWordProgress: vi.fn().mockResolvedValue(null),
    getAllProgress: vi.fn().mockResolvedValue([]),
    saveWordProgress: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue(null),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    getDailyStats: vi.fn().mockResolvedValue(null),
    getDailyStatsRange: vi.fn().mockResolvedValue([]),
    saveDailyStats: vi.fn().mockResolvedValue(undefined),
    getRecentDailyStats: vi.fn().mockResolvedValue([]),
    exportAll: vi.fn().mockResolvedValue('{}'),
    importAll: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}
