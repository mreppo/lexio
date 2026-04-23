import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageService } from './LocalStorageService'
import type { LanguagePair, Word, WordProgress, UserSettings, DailyStats } from '@/types'

describe('LocalStorageService', () => {
  let service: LocalStorageService

  const makePair = (id = 'pair-1'): LanguagePair => ({
    id,
    sourceLang: 'Latvian',
    targetLang: 'English',
    sourceCode: 'lv',
    targetCode: 'en',
    createdAt: 1000000,
  })

  const makeWord = (id = 'word-1', pairId = 'pair-1'): Word => ({
    id,
    pairId,
    source: 'māja',
    target: 'house',
    notes: null,
    tags: [],
    createdAt: 1000000,
    isFromPack: false,
  })

  beforeEach(() => {
    localStorage.clear()
    service = new LocalStorageService()
  })

  // --- Language pairs ---

  describe('getLanguagePairs', () => {
    it('should return an empty array when no pairs are stored', async () => {
      const pairs = await service.getLanguagePairs()
      expect(pairs).toEqual([])
    })
  })

  describe('getLanguagePair', () => {
    it('should return a pair by id', async () => {
      const pair = makePair()
      await service.saveLanguagePair(pair)
      const found = await service.getLanguagePair('pair-1')
      expect(found).toEqual(pair)
    })

    it('should return null for a non-existent id', async () => {
      const found = await service.getLanguagePair('no-such-id')
      expect(found).toBeNull()
    })
  })

  describe('saveLanguagePair', () => {
    it('should persist a new language pair', async () => {
      const pair = makePair()
      await service.saveLanguagePair(pair)
      const pairs = await service.getLanguagePairs()
      expect(pairs).toHaveLength(1)
      expect(pairs[0]).toEqual(pair)
    })

    it('should update an existing pair on re-save', async () => {
      const pair = makePair()
      const updated: LanguagePair = { ...pair, targetLang: 'German' }
      await service.saveLanguagePair(pair)
      await service.saveLanguagePair(updated)
      const pairs = await service.getLanguagePairs()
      expect(pairs).toHaveLength(1)
      expect(pairs[0]?.targetLang).toBe('German')
    })
  })

  describe('deleteLanguagePair', () => {
    it('should remove the specified pair', async () => {
      await service.saveLanguagePair(makePair())
      await service.deleteLanguagePair('pair-1')
      const pairs = await service.getLanguagePairs()
      expect(pairs).toHaveLength(0)
    })
  })

  // --- Words ---

  describe('getWords / saveWord', () => {
    it('should return an empty array when no words exist for a pair', async () => {
      const words = await service.getWords('pair-1')
      expect(words).toEqual([])
    })

    it('should persist and retrieve a word', async () => {
      const word = makeWord()
      await service.saveWord(word)
      const words = await service.getWords('pair-1')
      expect(words).toHaveLength(1)
      expect(words[0]).toEqual(word)
    })

    it('should update a word on re-save', async () => {
      const word = makeWord()
      const updated: Word = { ...word, notes: 'a building' }
      await service.saveWord(word)
      await service.saveWord(updated)
      const words = await service.getWords('pair-1')
      expect(words).toHaveLength(1)
      expect(words[0]?.notes).toBe('a building')
    })
  })

  describe('getWord', () => {
    it('should find a word by id across pairs', async () => {
      await service.saveLanguagePair(makePair('pair-1'))
      await service.saveLanguagePair(makePair('pair-2'))
      const word = makeWord('word-x', 'pair-2')
      await service.saveWord(word)
      const found = await service.getWord('word-x')
      expect(found).toEqual(word)
    })

    it('should return null for a non-existent word', async () => {
      await service.saveLanguagePair(makePair())
      const found = await service.getWord('no-such-word')
      expect(found).toBeNull()
    })
  })

  describe('saveWords', () => {
    it('should bulk-save multiple words', async () => {
      const words: Word[] = [
        makeWord('word-1'),
        { ...makeWord('word-2'), source: 'suns', target: 'dog' },
      ]
      await service.saveWords(words)
      const retrieved = await service.getWords('pair-1')
      expect(retrieved).toHaveLength(2)
    })

    it('should handle an empty array without error', async () => {
      await expect(service.saveWords([])).resolves.toBeUndefined()
    })
  })

  describe('deleteWord', () => {
    it('should remove a word by id', async () => {
      await service.saveLanguagePair(makePair())
      await service.saveWord(makeWord())
      await service.deleteWord('word-1')
      const words = await service.getWords('pair-1')
      expect(words).toHaveLength(0)
    })
  })

  // --- Progress ---

  describe('getWordProgress / saveWordProgress', () => {
    it('should return null for a word with no progress', async () => {
      const progress = await service.getWordProgress('word-1')
      expect(progress).toBeNull()
    })

    it('should persist and retrieve word progress', async () => {
      const progress: WordProgress = {
        wordId: 'word-1',
        correctCount: 5,
        incorrectCount: 2,
        streak: 3,
        lastReviewed: 1000000,
        nextReview: 2000000,
        confidence: 0.7,
        history: [],
      }
      await service.saveWordProgress(progress)
      const retrieved = await service.getWordProgress('word-1')
      expect(retrieved).toEqual(progress)
    })
  })

  // --- Settings ---

  describe('getSettings / saveSettings', () => {
    it('should return default settings when none are stored', async () => {
      const settings = await service.getSettings()
      expect(settings.activePairId).toBeNull()
      expect(settings.quizMode).toBe('mixed')
      expect(settings.dailyGoal).toBe(20)
      expect(settings.theme).toBe('dark')
      expect(settings.typoTolerance).toBe(1)
    })

    it('should persist and retrieve custom settings', async () => {
      const settings: UserSettings = {
        activePairId: 'pair-1',
        quizMode: 'type',
        dailyGoal: 10,
        theme: 'light',
        typoTolerance: 2,
        selectedLevels: ['B1', 'B2'],
        displayName: null,
      }
      await service.saveSettings(settings)
      const retrieved = await service.getSettings()
      expect(retrieved).toEqual(settings)
    })
  })

  // --- Daily stats ---

  describe('getDailyStats / saveDailyStats', () => {
    it('should return null for a date with no stats', async () => {
      const stats = await service.getDailyStats('2026-01-01')
      expect(stats).toBeNull()
    })

    it('should persist and retrieve daily stats', async () => {
      const stats: DailyStats = {
        date: '2026-01-01',
        wordsReviewed: 15,
        correctCount: 12,
        incorrectCount: 3,
        streakDays: 5,
      }
      await service.saveDailyStats(stats)
      const retrieved = await service.getDailyStats('2026-01-01')
      expect(retrieved).toEqual(stats)
    })
  })

  describe('getDailyStatsRange', () => {
    it('should return stats within the given date range', async () => {
      await service.saveDailyStats({
        date: '2026-01-01',
        wordsReviewed: 10,
        correctCount: 8,
        incorrectCount: 2,
        streakDays: 1,
      })
      await service.saveDailyStats({
        date: '2026-01-02',
        wordsReviewed: 15,
        correctCount: 12,
        incorrectCount: 3,
        streakDays: 2,
      })
      await service.saveDailyStats({
        date: '2026-01-04',
        wordsReviewed: 5,
        correctCount: 5,
        incorrectCount: 0,
        streakDays: 1,
      })

      const stats = await service.getDailyStatsRange('2026-01-01', '2026-01-03')
      expect(stats).toHaveLength(2)
      expect(stats[0]?.date).toBe('2026-01-01')
      expect(stats[1]?.date).toBe('2026-01-02')
    })

    it('should return an empty array when no stats exist in range', async () => {
      const stats = await service.getDailyStatsRange('2026-06-01', '2026-06-07')
      expect(stats).toEqual([])
    })
  })

  describe('getRecentDailyStats', () => {
    it('should return only stats that exist for the given window', async () => {
      const today = new Date().toISOString().slice(0, 10)
      await service.saveDailyStats({
        date: today,
        wordsReviewed: 10,
        correctCount: 8,
        incorrectCount: 2,
        streakDays: 1,
      })
      const stats = await service.getRecentDailyStats(7)
      expect(stats).toHaveLength(1)
      expect(stats[0]?.date).toBe(today)
    })

    it('should return an empty array when no stats exist', async () => {
      const stats = await service.getRecentDailyStats(7)
      expect(stats).toEqual([])
    })
  })

  // --- Data management ---

  describe('exportAll / importAll', () => {
    it('should roundtrip all data through export and import', async () => {
      const pair = makePair()
      const word = makeWord()
      const progress: WordProgress = {
        wordId: 'word-1',
        correctCount: 3,
        incorrectCount: 1,
        streak: 2,
        lastReviewed: 1000000,
        nextReview: 2000000,
        confidence: 0.6,
        history: [],
      }
      const settings: UserSettings = {
        activePairId: 'pair-1',
        quizMode: 'choice',
        dailyGoal: 30,
        theme: 'light',
        typoTolerance: 0,
        selectedLevels: [],
        displayName: null,
      }
      const dailyStats: DailyStats = {
        date: '2026-03-01',
        wordsReviewed: 20,
        correctCount: 18,
        incorrectCount: 2,
        streakDays: 7,
      }

      await service.saveLanguagePair(pair)
      await service.saveWord(word)
      await service.saveWordProgress(progress)
      await service.saveSettings(settings)
      await service.saveDailyStats(dailyStats)

      const exported = await service.exportAll()

      // Clear and re-import
      await service.clearAll()
      expect(await service.getLanguagePairs()).toEqual([])

      await service.importAll(exported)

      expect(await service.getLanguagePairs()).toEqual([pair])
      expect(await service.getWords('pair-1')).toEqual([word])
      expect(await service.getWordProgress('word-1')).toEqual(progress)
      expect(await service.getSettings()).toEqual(settings)
      expect(await service.getDailyStats('2026-03-01')).toEqual(dailyStats)
    })

    it('should produce valid JSON from exportAll', async () => {
      await service.saveLanguagePair(makePair())
      const exported = await service.exportAll()
      const parsed = JSON.parse(exported)
      expect(parsed.version).toBe(1)
      expect(parsed.exportedAt).toBeDefined()
      expect(parsed.languagePairs).toHaveLength(1)
    })
  })

  describe('importAll - error handling', () => {
    it('should throw on invalid JSON', async () => {
      await expect(service.importAll('not valid json')).rejects.toThrow()
    })

    it('should handle partial data gracefully', async () => {
      await service.importAll(JSON.stringify({ languagePairs: [makePair()] }))
      const pairs = await service.getLanguagePairs()
      expect(pairs).toHaveLength(1)
      // Settings should fall back to defaults since they were cleared
      const settings = await service.getSettings()
      expect(settings.dailyGoal).toBe(20)
    })
  })

  describe('clearAll', () => {
    it('should remove all lexio: keys from localStorage', async () => {
      await service.saveLanguagePair(makePair())
      await service.saveWord(makeWord())
      await service.saveSettings({
        activePairId: 'pair-1',
        quizMode: 'type',
        dailyGoal: 10,
        theme: 'light',
        typoTolerance: 1,
        selectedLevels: [],
      })
      // Add a non-lexio key to ensure it survives
      localStorage.setItem('other-app:key', 'should-survive')

      await service.clearAll()

      expect(await service.getLanguagePairs()).toEqual([])
      expect(await service.getWords('pair-1')).toEqual([])
      expect(localStorage.getItem('other-app:key')).toBe('should-survive')
    })
  })

  // --- Error handling ---

  describe('corrupted data handling', () => {
    it('should return defaults when stored JSON is corrupted', async () => {
      localStorage.setItem('lexio:settings', '{invalid json')
      const settings = await service.getSettings()
      expect(settings).toEqual({
        activePairId: null,
        quizMode: 'mixed',
        dailyGoal: 20,
        theme: 'dark',
        typoTolerance: 1,
        selectedLevels: [],
        displayName: null,
      })
    })

    it('should return empty array when language pairs JSON is corrupted', async () => {
      localStorage.setItem('lexio:language-pairs', 'broken')
      const pairs = await service.getLanguagePairs()
      expect(pairs).toEqual([])
    })

    it('should return null when word progress JSON is corrupted', async () => {
      localStorage.setItem('lexio:progress:word-1', 'not-json')
      const progress = await service.getWordProgress('word-1')
      expect(progress).toBeNull()
    })
  })
})
