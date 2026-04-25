/**
 * Shared test data factories.
 *
 * Each factory returns a complete, valid object with sensible defaults.
 * Pass overrides to customise only the fields that matter for a specific test.
 *
 * Usage:
 *   const word = createMockWord({ source: 'māja' })
 *   const pair = createMockPair({ sourceCode: 'ru' })
 */

import type {
  LanguagePair,
  Word,
  WordProgress,
  UserSettings,
  DailyStats,
  StarterPack,
} from '@/types'

export function createMockPair(overrides: Partial<LanguagePair> = {}): LanguagePair {
  return {
    id: 'pair-1',
    sourceLang: 'English',
    sourceCode: 'en',
    targetLang: 'Latvian',
    targetCode: 'lv',
    createdAt: 1_000_000,
    ...overrides,
  }
}

export function createMockWord(overrides: Partial<Word> = {}): Word {
  return {
    id: 'word-1',
    pairId: 'pair-1',
    source: 'house',
    target: 'māja',
    notes: null,
    tags: [],
    createdAt: 1_000_000,
    isFromPack: false,
    ...overrides,
  }
}

export function createMockProgress(overrides: Partial<WordProgress> = {}): WordProgress {
  return {
    wordId: 'word-1',
    correctCount: 3,
    incorrectCount: 1,
    streak: 2,
    lastReviewed: 1_000_000,
    nextReview: 2_000_000,
    confidence: 0.6,
    history: [],
    ...overrides,
  }
}

export function createMockSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    activePairId: null,
    quizMode: 'mixed',
    dailyGoal: 20,
    theme: 'dark',
    typoTolerance: 1,
    selectedLevels: [],
    displayName: null,
    soundEffects: false,
    autoPlayPronunciation: false,
    showHintTimeout: 10,
    ...overrides,
  }
}

export function createMockDailyStats(overrides: Partial<DailyStats> = {}): DailyStats {
  return {
    date: '2026-03-20',
    wordsReviewed: 10,
    correctCount: 8,
    incorrectCount: 2,
    streakDays: 3,
    ...overrides,
  }
}

export function createMockStarterPack(overrides: Partial<StarterPack> = {}): StarterPack {
  return {
    id: 'test-pack',
    name: 'Test Pack',
    description: 'A pack for testing',
    sourceCode: 'en',
    targetCode: 'lv',
    level: 'B1',
    words: [
      { source: 'house', target: 'māja', tags: ['B1'] },
      { source: 'cat', target: 'kaķis', tags: ['B1'] },
    ],
    ...overrides,
  }
}
