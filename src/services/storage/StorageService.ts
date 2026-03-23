import type { LanguagePair, Word, WordProgress, UserSettings, DailyStats } from '@/types'

/**
 * Storage abstraction interface.
 * All storage access must go through this interface - never call localStorage directly.
 * This ensures the backing store can be swapped (IndexedDB, REST API, etc.) without
 * touching business logic.
 */
export interface StorageService {
  // Language pairs
  getLanguagePairs(): Promise<LanguagePair[]>
  getLanguagePair(id: string): Promise<LanguagePair | null>
  saveLanguagePair(pair: LanguagePair): Promise<void>
  deleteLanguagePair(id: string): Promise<void>

  // Words
  getWords(pairId: string): Promise<Word[]>
  getWord(id: string): Promise<Word | null>
  saveWord(word: Word): Promise<void>
  saveWords(words: Word[]): Promise<void>
  deleteWord(id: string): Promise<void>

  // Progress
  getWordProgress(wordId: string): Promise<WordProgress | null>
  getAllProgress(pairId: string): Promise<WordProgress[]>
  saveWordProgress(progress: WordProgress): Promise<void>

  // Settings
  getSettings(): Promise<UserSettings>
  saveSettings(settings: UserSettings): Promise<void>

  // Stats
  getDailyStats(date: string): Promise<DailyStats | null>
  getDailyStatsRange(from: string, to: string): Promise<DailyStats[]>
  saveDailyStats(stats: DailyStats): Promise<void>
  getRecentDailyStats(days: number): Promise<DailyStats[]>

  // Data management
  exportAll(): Promise<string>
  importAll(data: string): Promise<void>
  clearAll(): Promise<void>

  // Generic key-value storage for app-level metadata (e.g. install banner state).
  // Keys should be namespaced with a prefix (e.g. "lexio:meta:...").
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}
