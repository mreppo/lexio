import type { StorageService } from './StorageService'
import type {
  LanguagePair,
  Word,
  WordProgress,
  UserSettings,
  DailyStats,
} from '@/types'

const KEYS = {
  LANGUAGE_PAIRS: 'lexio:language-pairs',
  WORDS_PREFIX: 'lexio:words:',
  PROGRESS_PREFIX: 'lexio:progress:',
  ALL_PROGRESS_PREFIX: 'lexio:all-progress:',
  SETTINGS: 'lexio:settings',
  DAILY_STATS_PREFIX: 'lexio:daily-stats:',
} as const

const DEFAULT_SETTINGS: UserSettings = {
  activePairId: null,
  quizMode: 'mixed',
  dailyGoal: 20,
  theme: 'dark',
}

function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

/**
 * localStorage-backed implementation of StorageService.
 * This is the only place in the codebase that calls localStorage directly.
 */
export class LocalStorageService implements StorageService {
  async getLanguagePairs(): Promise<LanguagePair[]> {
    return readJson<LanguagePair[]>(KEYS.LANGUAGE_PAIRS) ?? []
  }

  async saveLanguagePair(pair: LanguagePair): Promise<void> {
    const pairs = await this.getLanguagePairs()
    const idx = pairs.findIndex((p) => p.id === pair.id)
    const updated = idx >= 0
      ? pairs.map((p) => (p.id === pair.id ? pair : p))
      : [...pairs, pair]
    writeJson(KEYS.LANGUAGE_PAIRS, updated)
  }

  async deleteLanguagePair(id: string): Promise<void> {
    const pairs = await this.getLanguagePairs()
    writeJson(KEYS.LANGUAGE_PAIRS, pairs.filter((p) => p.id !== id))
  }

  async getWords(pairId: string): Promise<Word[]> {
    return readJson<Word[]>(`${KEYS.WORDS_PREFIX}${pairId}`) ?? []
  }

  async saveWord(word: Word): Promise<void> {
    const words = await this.getWords(word.pairId)
    const idx = words.findIndex((w) => w.id === word.id)
    const updated = idx >= 0
      ? words.map((w) => (w.id === word.id ? word : w))
      : [...words, word]
    writeJson(`${KEYS.WORDS_PREFIX}${word.pairId}`, updated)
  }

  async saveWords(words: Word[]): Promise<void> {
    if (words.length === 0) return
    // Group by pairId for efficiency
    const byPair = new Map<string, Word[]>()
    for (const word of words) {
      const existing = byPair.get(word.pairId) ?? []
      existing.push(word)
      byPair.set(word.pairId, existing)
    }
    for (const [pairId, newWords] of byPair) {
      const existing = await this.getWords(pairId)
      const existingMap = new Map(existing.map((w) => [w.id, w]))
      for (const word of newWords) {
        existingMap.set(word.id, word)
      }
      writeJson(`${KEYS.WORDS_PREFIX}${pairId}`, Array.from(existingMap.values()))
    }
  }

  async deleteWord(id: string): Promise<void> {
    // We need to search across all pairs - find by scanning keys
    const pairs = await this.getLanguagePairs()
    for (const pair of pairs) {
      const words = await this.getWords(pair.id)
      const filtered = words.filter((w) => w.id !== id)
      if (filtered.length !== words.length) {
        writeJson(`${KEYS.WORDS_PREFIX}${pair.id}`, filtered)
        return
      }
    }
  }

  async getWordProgress(wordId: string): Promise<WordProgress | null> {
    return readJson<WordProgress>(`${KEYS.PROGRESS_PREFIX}${wordId}`)
  }

  async getAllProgress(pairId: string): Promise<WordProgress[]> {
    const words = await this.getWords(pairId)
    const progressList: WordProgress[] = []
    for (const word of words) {
      const p = await this.getWordProgress(word.id)
      if (p !== null) progressList.push(p)
    }
    return progressList
  }

  async saveWordProgress(progress: WordProgress): Promise<void> {
    writeJson(`${KEYS.PROGRESS_PREFIX}${progress.wordId}`, progress)
  }

  async getSettings(): Promise<UserSettings> {
    return readJson<UserSettings>(KEYS.SETTINGS) ?? DEFAULT_SETTINGS
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    writeJson(KEYS.SETTINGS, settings)
  }

  async getDailyStats(date: string): Promise<DailyStats | null> {
    return readJson<DailyStats>(`${KEYS.DAILY_STATS_PREFIX}${date}`)
  }

  async saveDailyStats(stats: DailyStats): Promise<void> {
    writeJson(`${KEYS.DAILY_STATS_PREFIX}${stats.date}`, stats)
  }

  async getRecentDailyStats(days: number): Promise<DailyStats[]> {
    const result: DailyStats[] = []
    const now = new Date()
    for (let i = 0; i < days; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const stats = await this.getDailyStats(dateStr)
      if (stats !== null) result.push(stats)
    }
    return result
  }
}
