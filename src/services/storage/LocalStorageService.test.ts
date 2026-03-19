import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageService } from './LocalStorageService'
import type { LanguagePair, Word, WordProgress, UserSettings } from '@/types'

describe('LocalStorageService', () => {
  let service: LocalStorageService

  beforeEach(() => {
    localStorage.clear()
    service = new LocalStorageService()
  })

  describe('getLanguagePairs', () => {
    it('should return an empty array when no pairs are stored', async () => {
      const pairs = await service.getLanguagePairs()
      expect(pairs).toEqual([])
    })
  })

  describe('saveLanguagePair', () => {
    it('should persist a new language pair', async () => {
      const pair: LanguagePair = {
        id: 'pair-1',
        sourceLang: 'Latvian',
        targetLang: 'English',
        sourceCode: 'lv',
        targetCode: 'en',
        createdAt: 1000000,
      }

      await service.saveLanguagePair(pair)
      const pairs = await service.getLanguagePairs()

      expect(pairs).toHaveLength(1)
      expect(pairs[0]).toEqual(pair)
    })

    it('should update an existing pair on re-save', async () => {
      const pair: LanguagePair = {
        id: 'pair-1',
        sourceLang: 'Latvian',
        targetLang: 'English',
        sourceCode: 'lv',
        targetCode: 'en',
        createdAt: 1000000,
      }
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
      const pair: LanguagePair = {
        id: 'pair-1',
        sourceLang: 'Latvian',
        targetLang: 'English',
        sourceCode: 'lv',
        targetCode: 'en',
        createdAt: 1000000,
      }

      await service.saveLanguagePair(pair)
      await service.deleteLanguagePair('pair-1')
      const pairs = await service.getLanguagePairs()

      expect(pairs).toHaveLength(0)
    })
  })

  describe('getWords / saveWord', () => {
    it('should return an empty array when no words exist for a pair', async () => {
      const words = await service.getWords('pair-1')
      expect(words).toEqual([])
    })

    it('should persist and retrieve a word', async () => {
      const word: Word = {
        id: 'word-1',
        pairId: 'pair-1',
        source: 'māja',
        target: 'house',
        notes: null,
        tags: [],
        createdAt: 1000000,
        isFromPack: false,
      }

      await service.saveWord(word)
      const words = await service.getWords('pair-1')

      expect(words).toHaveLength(1)
      expect(words[0]).toEqual(word)
    })

    it('should update a word on re-save', async () => {
      const word: Word = {
        id: 'word-1',
        pairId: 'pair-1',
        source: 'māja',
        target: 'house',
        notes: null,
        tags: [],
        createdAt: 1000000,
        isFromPack: false,
      }
      const updated: Word = { ...word, notes: 'a building' }

      await service.saveWord(word)
      await service.saveWord(updated)
      const words = await service.getWords('pair-1')

      expect(words).toHaveLength(1)
      expect(words[0]?.notes).toBe('a building')
    })
  })

  describe('saveWords', () => {
    it('should bulk-save multiple words', async () => {
      const words: Word[] = [
        {
          id: 'word-1',
          pairId: 'pair-1',
          source: 'māja',
          target: 'house',
          notes: null,
          tags: [],
          createdAt: 1000000,
          isFromPack: false,
        },
        {
          id: 'word-2',
          pairId: 'pair-1',
          source: 'suns',
          target: 'dog',
          notes: null,
          tags: [],
          createdAt: 1000001,
          isFromPack: false,
        },
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
      const pair: LanguagePair = {
        id: 'pair-1',
        sourceLang: 'Latvian',
        targetLang: 'English',
        sourceCode: 'lv',
        targetCode: 'en',
        createdAt: 1000000,
      }
      const word: Word = {
        id: 'word-1',
        pairId: 'pair-1',
        source: 'māja',
        target: 'house',
        notes: null,
        tags: [],
        createdAt: 1000000,
        isFromPack: false,
      }

      await service.saveLanguagePair(pair)
      await service.saveWord(word)
      await service.deleteWord('word-1')
      const words = await service.getWords('pair-1')

      expect(words).toHaveLength(0)
    })
  })

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

  describe('getSettings / saveSettings', () => {
    it('should return default settings when none are stored', async () => {
      const settings = await service.getSettings()
      expect(settings.activePairId).toBeNull()
      expect(settings.quizMode).toBe('mixed')
      expect(settings.dailyGoal).toBe(20)
      expect(settings.theme).toBe('dark')
    })

    it('should persist and retrieve custom settings', async () => {
      const settings: UserSettings = {
        activePairId: 'pair-1',
        quizMode: 'type',
        dailyGoal: 10,
        theme: 'light',
      }

      await service.saveSettings(settings)
      const retrieved = await service.getSettings()

      expect(retrieved).toEqual(settings)
    })
  })

  describe('getDailyStats / saveDailyStats', () => {
    it('should return null for a date with no stats', async () => {
      const stats = await service.getDailyStats('2026-01-01')
      expect(stats).toBeNull()
    })

    it('should persist and retrieve daily stats', async () => {
      const stats = {
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
})
