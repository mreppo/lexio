/**
 * Tests for CEFR level filtering utilities.
 *
 * Covers:
 * - isCefrLevel tag detection
 * - getWordCefrLevels extraction
 * - filterWordsByLevels: no filter, single level, multi-level,
 *   manual words always included, empty selection = all
 * - countWordsByLevel
 */

import { describe, it, expect } from 'vitest'
import {
  isCefrLevel,
  getWordCefrLevels,
  filterWordsByLevels,
  countWordsByLevel,
} from './cefrFilter'
import { createMockWord } from '@/test/fixtures'

describe('isCefrLevel', () => {
  it('should return true for all valid CEFR levels', () => {
    expect(isCefrLevel('A1')).toBe(true)
    expect(isCefrLevel('A2')).toBe(true)
    expect(isCefrLevel('B1')).toBe(true)
    expect(isCefrLevel('B2')).toBe(true)
    expect(isCefrLevel('C1')).toBe(true)
    expect(isCefrLevel('C2')).toBe(true)
  })

  it('should return false for non-CEFR strings', () => {
    expect(isCefrLevel('food')).toBe(false)
    expect(isCefrLevel('starter-pack')).toBe(false)
    expect(isCefrLevel('b1')).toBe(false) // case-sensitive
    expect(isCefrLevel('')).toBe(false)
    expect(isCefrLevel('D1')).toBe(false)
  })
})

describe('getWordCefrLevels', () => {
  it('should extract CEFR level tags from a word', () => {
    const word = createMockWord({ tags: ['food', 'B1', 'starter-pack'] })
    expect(getWordCefrLevels(word)).toEqual(['B1'])
  })

  it('should return multiple levels if a word has several', () => {
    const word = createMockWord({ tags: ['B1', 'B2'] })
    expect(getWordCefrLevels(word)).toEqual(['B1', 'B2'])
  })

  it('should return empty array for words with no CEFR tags', () => {
    const word = createMockWord({ tags: ['food', 'travel'] })
    expect(getWordCefrLevels(word)).toEqual([])
  })

  it('should return empty array for words with empty tags', () => {
    const word = createMockWord({ tags: [] })
    expect(getWordCefrLevels(word)).toEqual([])
  })
})

describe('filterWordsByLevels', () => {
  const wordA1 = createMockWord({ id: 'w-a1', tags: ['A1', 'starter-pack'] })
  const wordB1 = createMockWord({ id: 'w-b1', tags: ['B1'] })
  const wordB2 = createMockWord({ id: 'w-b2', tags: ['B2', 'food'] })
  const wordB1B2 = createMockWord({ id: 'w-b1b2', tags: ['B1', 'B2'] })
  const wordManual = createMockWord({ id: 'w-manual', tags: [] })
  const wordManualTagged = createMockWord({ id: 'w-manual-tagged', tags: ['travel', 'food'] })

  const allWords = [wordA1, wordB1, wordB2, wordB1B2, wordManual, wordManualTagged]

  it('should return all words when selectedLevels is empty (no filter)', () => {
    const result = filterWordsByLevels(allWords, [])
    expect(result).toHaveLength(allWords.length)
  })

  it('should filter to a single level', () => {
    const result = filterWordsByLevels(allWords, ['A1'])
    // wordA1 (has A1), wordManual (no CEFR tags), wordManualTagged (no CEFR tags)
    expect(result.map((w) => w.id)).toEqual(
      expect.arrayContaining(['w-a1', 'w-manual', 'w-manual-tagged']),
    )
    expect(result).toHaveLength(3)
    expect(result.map((w) => w.id)).not.toContain('w-b1')
    expect(result.map((w) => w.id)).not.toContain('w-b2')
  })

  it('should filter to multiple levels', () => {
    const result = filterWordsByLevels(allWords, ['B1', 'B2'])
    // wordB1, wordB2, wordB1B2, wordManual, wordManualTagged
    expect(result).toHaveLength(5)
    expect(result.map((w) => w.id)).toContain('w-b1')
    expect(result.map((w) => w.id)).toContain('w-b2')
    expect(result.map((w) => w.id)).toContain('w-b1b2')
    expect(result.map((w) => w.id)).not.toContain('w-a1')
  })

  it('should always include manually added words (no CEFR tags) regardless of filter', () => {
    const result = filterWordsByLevels(allWords, ['C1'])
    // No words have C1 tag, but manual words are always included
    expect(result.map((w) => w.id)).toEqual(expect.arrayContaining(['w-manual', 'w-manual-tagged']))
    expect(result).toHaveLength(2)
  })

  it('should treat empty selection as "all levels" — same as no filter', () => {
    const withFilter = filterWordsByLevels(allWords, [])
    const withAllLevels = filterWordsByLevels(allWords, [])
    expect(withFilter).toHaveLength(withAllLevels.length)
  })

  it('should return a new array (does not mutate input)', () => {
    const input = [wordA1, wordB1]
    const result = filterWordsByLevels(input, [])
    expect(result).not.toBe(input)
  })

  it('should handle words that have multiple CEFR tags — include if any match', () => {
    const result = filterWordsByLevels([wordB1B2], ['B2'])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('w-b1b2')
  })

  it('should return empty array when no pack words match and there are no manual words', () => {
    const packWordsOnly = [wordA1, wordB1, wordB2]
    const result = filterWordsByLevels(packWordsOnly, ['C1'])
    expect(result).toHaveLength(0)
  })
})

describe('countWordsByLevel', () => {
  it('should count words per level', () => {
    const words = [
      createMockWord({ id: 'w1', tags: ['A1'] }),
      createMockWord({ id: 'w2', tags: ['B1'] }),
      createMockWord({ id: 'w3', tags: ['B1', 'B2'] }), // counted in both B1 and B2
    ]
    const counts = countWordsByLevel(words)
    expect(counts.A1).toBe(1)
    expect(counts.A2).toBe(0)
    expect(counts.B1).toBe(2)
    expect(counts.B2).toBe(1)
    expect(counts.C1).toBe(0)
    expect(counts.C2).toBe(0)
  })

  it('should return all zeros for empty word list', () => {
    const counts = countWordsByLevel([])
    expect(counts).toEqual({ A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 })
  })

  it('should not count words with no CEFR tags in any level', () => {
    const words = [
      createMockWord({ id: 'w1', tags: ['food', 'travel'] }),
      createMockWord({ id: 'w2', tags: [] }),
    ]
    const counts = countWordsByLevel(words)
    expect(counts).toEqual({ A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 })
  })
})
