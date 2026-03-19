/**
 * Tests for distractorGenerator utility.
 */

import { describe, it, expect } from 'vitest'
import {
  generateDistractors,
  MIN_WORDS_FOR_CHOICE,
  CHOICE_COUNT,
  DISTRACTOR_COUNT,
} from './distractorGenerator'
import type { Word } from '@/types'
import type { QuizDirection } from '@/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeWord = (id: string, source: string, target: string): Word => ({
  id,
  pairId: 'pair-1',
  source,
  target,
  notes: null,
  tags: [],
  createdAt: 1000,
  isFromPack: false,
})

// A pool of distinct words with no shared prefixes on the target side.
const poolWords: readonly Word[] = [
  makeWord('w1', 'māja', 'house'),
  makeWord('w2', 'kaķis', 'cat'),
  makeWord('w3', 'suns', 'dog'),
  makeWord('w4', 'galds', 'table'),
  makeWord('w5', 'krēsls', 'chair'),
  makeWord('w6', 'lapa', 'leaf'),
]

// ─── generateDistractors ──────────────────────────────────────────────────────

describe('generateDistractors', () => {
  it('should return null when pool has fewer than MIN_WORDS_FOR_CHOICE words', () => {
    const tinyPool = poolWords.slice(0, MIN_WORDS_FOR_CHOICE - 1)
    const result = generateDistractors(poolWords[0], 'source-to-target', tinyPool)
    expect(result).toBeNull()
  })

  it('should return null when pool has exactly MIN_WORDS_FOR_CHOICE - 1 words', () => {
    const pool = poolWords.slice(0, CHOICE_COUNT - 1) // 3 words
    const result = generateDistractors(pool[0], 'source-to-target', pool)
    expect(result).toBeNull()
  })

  it('should return a result when pool has exactly MIN_WORDS_FOR_CHOICE words', () => {
    const pool = poolWords.slice(0, CHOICE_COUNT) // exactly 4 words
    const result = generateDistractors(pool[0], 'source-to-target', pool)
    expect(result).not.toBeNull()
  })

  it('should return exactly CHOICE_COUNT options', () => {
    const result = generateDistractors(poolWords[0], 'source-to-target', poolWords)
    expect(result).not.toBeNull()
    expect(result!.options).toHaveLength(CHOICE_COUNT)
  })

  it('should include exactly DISTRACTOR_COUNT distractors (i.e. all options except correct)', () => {
    const correctWord = poolWords[0]
    const direction: QuizDirection = 'source-to-target'
    const result = generateDistractors(correctWord, direction, poolWords)
    expect(result).not.toBeNull()

    const correctText = correctWord.target
    const distractors = result!.options.filter((o) => o !== correctText)
    expect(distractors).toHaveLength(DISTRACTOR_COUNT)
  })

  it('should include the correct answer in the options', () => {
    const correctWord = poolWords[0] // 'māja' -> 'house'
    const result = generateDistractors(correctWord, 'source-to-target', poolWords)
    expect(result).not.toBeNull()
    expect(result!.options).toContain('house')
  })

  it('should set correctIndex to the position of the correct answer', () => {
    const correctWord = poolWords[0] // target = 'house'
    const result = generateDistractors(correctWord, 'source-to-target', poolWords)
    expect(result).not.toBeNull()
    expect(result!.options[result!.correctIndex]).toBe('house')
  })

  it('should not include the correct word itself as a distractor', () => {
    const correctWord = poolWords[0] // target = 'house'
    const result = generateDistractors(correctWord, 'source-to-target', poolWords)
    expect(result).not.toBeNull()

    const distractorOptions = [...result!.options]
    distractorOptions.splice(result!.correctIndex, 1)
    expect(distractorOptions).not.toContain('house')
  })

  it('should use target text for source-to-target direction', () => {
    const correctWord = makeWord('w1', 'māja', 'house')
    const pool = [
      correctWord,
      makeWord('w2', 'kaķis', 'cat'),
      makeWord('w3', 'suns', 'dog'),
      makeWord('w4', 'galds', 'table'),
    ]
    const result = generateDistractors(correctWord, 'source-to-target', pool)
    expect(result).not.toBeNull()
    // All options should be target-language words
    for (const opt of result!.options) {
      const matchedWord = pool.find((w) => w.target === opt)
      expect(matchedWord).toBeDefined()
    }
  })

  it('should use source text for target-to-source direction', () => {
    const correctWord = makeWord('w1', 'māja', 'house')
    const pool = [
      correctWord,
      makeWord('w2', 'kaķis', 'cat'),
      makeWord('w3', 'suns', 'dog'),
      makeWord('w4', 'galds', 'table'),
    ]
    const result = generateDistractors(correctWord, 'target-to-source', pool)
    expect(result).not.toBeNull()
    // All options should be source-language words
    for (const opt of result!.options) {
      const matchedWord = pool.find((w) => w.source === opt)
      expect(matchedWord).toBeDefined()
    }
    // Correct answer should be source of the correct word
    expect(result!.options[result!.correctIndex]).toBe('māja')
  })

  it('should not produce duplicate options', () => {
    const result = generateDistractors(poolWords[0], 'source-to-target', poolWords)
    expect(result).not.toBeNull()
    const unique = new Set(result!.options)
    expect(unique.size).toBe(result!.options.length)
  })

  it('should produce different option orderings over multiple calls (randomness test)', () => {
    // Run 20 times and expect at least 2 different orderings.
    const orderings = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const r = generateDistractors(poolWords[0], 'source-to-target', poolWords)
      if (r !== null) {
        orderings.add(r.options.join(','))
      }
    }
    // With 4 options there are 24 possible orderings - highly unlikely to get
    // only 1 ordering in 20 tries if shuffle is working.
    expect(orderings.size).toBeGreaterThan(1)
  })

  it('should vary the correct answer position over multiple calls', () => {
    const positions = new Set<number>()
    for (let i = 0; i < 40; i++) {
      const r = generateDistractors(poolWords[0], 'source-to-target', poolWords)
      if (r !== null) {
        positions.add(r.correctIndex)
      }
    }
    // The correct answer should appear in multiple positions across 40 runs.
    expect(positions.size).toBeGreaterThan(1)
  })

  it('should still work with only MIN_WORDS_FOR_CHOICE words even if all share prefix', () => {
    // All words share the first 3 letters of their target ('cat', 'can', 'cap', 'car')
    // Tier 1 and 2 may be empty, but tier 3 fallback should still produce a result.
    const tightPool = [
      makeWord('a', 'vārds1', 'cat'),
      makeWord('b', 'vārds2', 'can'),
      makeWord('c', 'vārds3', 'cap'),
      makeWord('d', 'vārds4', 'car'),
    ]
    const result = generateDistractors(tightPool[0], 'source-to-target', tightPool)
    expect(result).not.toBeNull()
    expect(result!.options).toHaveLength(CHOICE_COUNT)
    expect(result!.options[result!.correctIndex]).toBe('cat')
  })

  it('should avoid recently used distractors when possible', () => {
    // Provide recent distractor IDs and verify those words are avoided
    // when there are enough alternatives.
    const recentIds = ['w2'] // 'cat' should be avoided if possible
    const result = generateDistractors(
      poolWords[0], // correct = 'house'
      'source-to-target',
      poolWords,
      recentIds,
    )
    expect(result).not.toBeNull()
    // There are enough other words (w3, w4, w5, w6) to fill 3 distractors
    // without using w2 ('cat').
    expect(result!.options).not.toContain('cat')
  })

  it('should fall back to recently used distractors when no alternatives exist', () => {
    // Pool has exactly 4 words. One is correct, and the remaining 3 are all "recent".
    const smallPool = poolWords.slice(0, 4)
    const recentIds = ['w2', 'w3', 'w4']
    const result = generateDistractors(smallPool[0], 'source-to-target', smallPool, recentIds)
    // Should still succeed (fallback to all candidates).
    expect(result).not.toBeNull()
    expect(result!.options).toHaveLength(CHOICE_COUNT)
  })

  it('should handle Latvian diacritics in word text', () => {
    const pool = [
      makeWord('a', 'māja', 'māja-en'),
      makeWord('b', 'ūdens', 'ūdens-en'),
      makeWord('c', 'šķūnis', 'šķūnis-en'),
      makeWord('d', 'žāvēt', 'žāvēt-en'),
    ]
    const result = generateDistractors(pool[0], 'source-to-target', pool)
    expect(result).not.toBeNull()
    expect(result!.options[result!.correctIndex]).toBe('māja-en')
  })
})
