import type { StorageService } from './StorageService'
import type { LanguagePair, Word, WordProgress, UserSettings, DailyStats } from '@/types'

const KEYS = {
  LANGUAGE_PAIRS: 'lexio:language-pairs',
  WORDS_PREFIX: 'lexio:words:',
  PROGRESS_PREFIX: 'lexio:progress:',
  SETTINGS: 'lexio:settings',
  DAILY_STATS_PREFIX: 'lexio:daily-stats:',
} as const

const DEFAULT_SETTINGS: UserSettings = {
  activePairId: null,
  quizMode: 'mixed',
  dailyGoal: 20,
  theme: 'dark',
  typoTolerance: 1,
  selectedLevels: [],
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
  // --- Language pairs ---

  async getLanguagePairs(): Promise<LanguagePair[]> {
    return readJson<LanguagePair[]>(KEYS.LANGUAGE_PAIRS) ?? []
  }

  async getLanguagePair(id: string): Promise<LanguagePair | null> {
    const pairs = await this.getLanguagePairs()
    return pairs.find((p) => p.id === id) ?? null
  }

  async saveLanguagePair(pair: LanguagePair): Promise<void> {
    const pairs = await this.getLanguagePairs()
    const idx = pairs.findIndex((p) => p.id === pair.id)
    const updated = idx >= 0 ? pairs.map((p) => (p.id === pair.id ? pair : p)) : [...pairs, pair]
    writeJson(KEYS.LANGUAGE_PAIRS, updated)
  }

  async deleteLanguagePair(id: string): Promise<void> {
    const pairs = await this.getLanguagePairs()
    writeJson(
      KEYS.LANGUAGE_PAIRS,
      pairs.filter((p) => p.id !== id),
    )
  }

  // --- Words ---

  async getWords(pairId: string): Promise<Word[]> {
    return readJson<Word[]>(`${KEYS.WORDS_PREFIX}${pairId}`) ?? []
  }

  async getWord(id: string): Promise<Word | null> {
    const pairs = await this.getLanguagePairs()
    for (const pair of pairs) {
      const words = await this.getWords(pair.id)
      const found = words.find((w) => w.id === id)
      if (found) return found
    }
    return null
  }

  async saveWord(word: Word): Promise<void> {
    const words = await this.getWords(word.pairId)
    const idx = words.findIndex((w) => w.id === word.id)
    const updated = idx >= 0 ? words.map((w) => (w.id === word.id ? word : w)) : [...words, word]
    writeJson(`${KEYS.WORDS_PREFIX}${word.pairId}`, updated)
  }

  async saveWords(words: Word[]): Promise<void> {
    if (words.length === 0) return
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

  // --- Progress ---

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

  // --- Settings ---

  async getSettings(): Promise<UserSettings> {
    const stored = readJson<Partial<UserSettings>>(KEYS.SETTINGS)
    if (stored === null) return DEFAULT_SETTINGS
    // Migrate existing settings that predate the selectedLevels field.
    return { ...DEFAULT_SETTINGS, ...stored }
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    writeJson(KEYS.SETTINGS, settings)
  }

  // --- Daily stats ---

  async getDailyStats(date: string): Promise<DailyStats | null> {
    return readJson<DailyStats>(`${KEYS.DAILY_STATS_PREFIX}${date}`)
  }

  async getDailyStatsRange(from: string, to: string): Promise<DailyStats[]> {
    const result: DailyStats[] = []
    const current = new Date(from)
    const end = new Date(to)
    while (current <= end) {
      const dateStr = current.toISOString().slice(0, 10)
      const stats = await this.getDailyStats(dateStr)
      if (stats !== null) result.push(stats)
      current.setDate(current.getDate() + 1)
    }
    return result
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

  // --- Data management ---

  async exportAll(): Promise<string> {
    const pairs = await this.getLanguagePairs()
    const words: Record<string, Word[]> = {}
    const progress: Record<string, WordProgress> = {}

    for (const pair of pairs) {
      const pairWords = await this.getWords(pair.id)
      words[pair.id] = pairWords
      for (const word of pairWords) {
        const p = await this.getWordProgress(word.id)
        if (p !== null) progress[word.id] = p
      }
    }

    const settings = await this.getSettings()

    // Collect all daily stats from localStorage keys
    const dailyStats: DailyStats[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(KEYS.DAILY_STATS_PREFIX)) {
        const stats = readJson<DailyStats>(key)
        if (stats !== null) dailyStats.push(stats)
      }
    }

    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      languagePairs: pairs,
      words,
      progress,
      settings,
      dailyStats,
    })
  }

  async importAll(data: string): Promise<void> {
    const parsed = JSON.parse(data) as {
      languagePairs?: LanguagePair[]
      words?: Record<string, Word[]>
      progress?: Record<string, WordProgress>
      settings?: UserSettings
      dailyStats?: DailyStats[]
    }

    await this.clearAll()

    if (parsed.languagePairs) {
      writeJson(KEYS.LANGUAGE_PAIRS, parsed.languagePairs)
    }

    if (parsed.words) {
      for (const [pairId, pairWords] of Object.entries(parsed.words)) {
        writeJson(`${KEYS.WORDS_PREFIX}${pairId}`, pairWords)
      }
    }

    if (parsed.progress) {
      for (const [wordId, wordProgress] of Object.entries(parsed.progress)) {
        writeJson(`${KEYS.PROGRESS_PREFIX}${wordId}`, wordProgress)
      }
    }

    if (parsed.settings) {
      writeJson(KEYS.SETTINGS, parsed.settings)
    }

    if (parsed.dailyStats) {
      for (const stats of parsed.dailyStats) {
        writeJson(`${KEYS.DAILY_STATS_PREFIX}${stats.date}`, stats)
      }
    }
  }

  async clearAll(): Promise<void> {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('lexio:')) {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key)
    }
  }
}
