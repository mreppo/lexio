/**
 * build-packs.test.ts
 *
 * Tests for the build-packs.ts script logic.
 *
 * These tests verify that the normalized data structure correctly assembles
 * flat StarterPack output files, and that validation catches errors.
 *
 * Note: These tests operate on the actual data/ directory produced by
 * extract-normalized-data.ts. Run that script first if data/ is missing.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'data')
const OUTPUT_DIR = join(ROOT, 'public', 'starter-packs')

// ---------------------------------------------------------------------------
// Types matching the data structures
// ---------------------------------------------------------------------------

interface ConceptEntry {
  tags: string[]
}
interface ConceptRegistry {
  [id: string]: ConceptEntry
}
interface TranslationMap {
  [id: string]: string[]
}
interface PackDefinition {
  id: string
  name: string
  description: string
  sourceCode: string
  targetCode: string
  level: string
  concepts: string[]
}
interface OutputWord {
  source: string
  target: string
  tags: string[]
}
interface OutputPack {
  id: string
  name: string
  description: string
  sourceCode: string
  targetCode: string
  level: string
  words: OutputWord[]
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T
}

// ---------------------------------------------------------------------------
// Guards - skip tests if data directory is not yet generated
// ---------------------------------------------------------------------------

const dataExists = existsSync(join(DATA_DIR, 'concepts.json'))
const outputExists = existsSync(join(OUTPUT_DIR, 'manifest.json'))

// ---------------------------------------------------------------------------
// Tests: concepts.json structure
// ---------------------------------------------------------------------------

describe('data/concepts.json', () => {
  it.skipIf(!dataExists)('exists and is valid JSON', () => {
    expect(existsSync(join(DATA_DIR, 'concepts.json'))).toBe(true)
    const concepts = readJson<ConceptRegistry>(join(DATA_DIR, 'concepts.json'))
    expect(typeof concepts).toBe('object')
    expect(Object.keys(concepts).length).toBeGreaterThan(0)
  })

  it.skipIf(!dataExists)('all concept IDs are snake_case strings', () => {
    const concepts = readJson<ConceptRegistry>(join(DATA_DIR, 'concepts.json'))
    const snakeCasePattern = /^[a-z0-9_]+$/
    for (const id of Object.keys(concepts)) {
      expect(id).toMatch(snakeCasePattern)
    }
  })

  it.skipIf(!dataExists)('every concept has a non-empty tags array', () => {
    const concepts = readJson<ConceptRegistry>(join(DATA_DIR, 'concepts.json'))
    for (const [id, entry] of Object.entries(concepts)) {
      expect(Array.isArray(entry.tags), `concept ${id} should have tags array`).toBe(true)
      expect(entry.tags.length, `concept ${id} should have at least one tag`).toBeGreaterThan(0)
    }
  })

  it.skipIf(!dataExists)('concept tags do not include CEFR level tags', () => {
    const concepts = readJson<ConceptRegistry>(join(DATA_DIR, 'concepts.json'))
    const cefrPattern = /^(A1|A2|B1|B2|C1|C2)$/
    for (const [id, entry] of Object.entries(concepts)) {
      for (const tag of entry.tags) {
        expect(
          cefrPattern.test(tag),
          `concept ${id} should not have CEFR tag "${tag}" in global tags`,
        ).toBe(false)
      }
    }
  })

  it.skipIf(!dataExists)('has at least 800 concepts (covers all 18 packs)', () => {
    const concepts = readJson<ConceptRegistry>(join(DATA_DIR, 'concepts.json'))
    expect(Object.keys(concepts).length).toBeGreaterThanOrEqual(800)
  })
})

// ---------------------------------------------------------------------------
// Tests: translation files
// ---------------------------------------------------------------------------

describe('data/translations/', () => {
  const LANGS = ['en', 'lv', 'ru'] as const

  it.skipIf(!dataExists)('all three language files exist', () => {
    for (const lang of LANGS) {
      expect(existsSync(join(DATA_DIR, 'translations', `${lang}.json`))).toBe(true)
    }
  })

  it.skipIf(!dataExists)('every concept in concepts.json has an English translation', () => {
    const concepts = readJson<ConceptRegistry>(join(DATA_DIR, 'concepts.json'))
    const enTrans = readJson<TranslationMap>(join(DATA_DIR, 'translations', 'en.json'))
    for (const id of Object.keys(concepts)) {
      const hasEn = enTrans[id] && enTrans[id].length > 0
      // Concepts anchored on LV words (no EN pair) are allowed to have no EN translation
      if (!id.startsWith('general_lv_') && !id.includes('_lv_')) {
        expect(hasEn, `concept "${id}" should have an EN translation`).toBe(true)
      }
    }
  })

  it.skipIf(!dataExists)('every translation entry maps to a valid concept', () => {
    const concepts = readJson<ConceptRegistry>(join(DATA_DIR, 'concepts.json'))
    for (const lang of LANGS) {
      const trans = readJson<TranslationMap>(join(DATA_DIR, 'translations', `${lang}.json`))
      for (const id of Object.keys(trans)) {
        expect(concepts[id], `${lang}.json has entry for unknown concept "${id}"`).toBeDefined()
      }
    }
  })

  it.skipIf(!dataExists)('all translation values are non-empty string arrays', () => {
    for (const lang of LANGS) {
      const trans = readJson<TranslationMap>(join(DATA_DIR, 'translations', `${lang}.json`))
      for (const [id, values] of Object.entries(trans)) {
        expect(Array.isArray(values), `${lang}[${id}] should be an array`).toBe(true)
        expect(values.length, `${lang}[${id}] should have at least one value`).toBeGreaterThan(0)
        for (const v of values) {
          expect(typeof v, `${lang}[${id}] values should be strings`).toBe('string')
          expect(v.length, `${lang}[${id}] values should be non-empty`).toBeGreaterThan(0)
        }
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Tests: pack definition files
// ---------------------------------------------------------------------------

describe('data/packs/', () => {
  const EXPECTED_PACK_IDS = [
    'en-lv-a1',
    'en-lv-a2',
    'en-lv-b1',
    'en-lv-b2',
    'en-lv-c1',
    'en-lv-c2',
    'ru-en-a1',
    'ru-en-a2',
    'ru-en-b1',
    'ru-en-b2',
    'ru-en-c1',
    'ru-en-c2',
    'ru-lv-a1',
    'ru-lv-a2',
    'ru-lv-b1',
    'ru-lv-b2',
    'ru-lv-c1',
    'ru-lv-c2',
  ]

  it.skipIf(!dataExists)('all 18 pack definition files exist', () => {
    for (const id of EXPECTED_PACK_IDS) {
      expect(existsSync(join(DATA_DIR, 'packs', `${id}.json`))).toBe(true)
    }
  })

  it.skipIf(!dataExists)('every pack definition has required metadata fields', () => {
    const concepts = readJson<ConceptRegistry>(join(DATA_DIR, 'concepts.json'))
    for (const id of EXPECTED_PACK_IDS) {
      const def = readJson<PackDefinition>(join(DATA_DIR, 'packs', `${id}.json`))
      expect(def.id).toBe(id)
      expect(typeof def.name).toBe('string')
      expect(def.name.length).toBeGreaterThan(0)
      expect(typeof def.description).toBe('string')
      expect(typeof def.sourceCode).toBe('string')
      expect(typeof def.targetCode).toBe('string')
      expect(typeof def.level).toBe('string')
      expect(Array.isArray(def.concepts)).toBe(true)
      expect(def.concepts.length).toBeGreaterThan(0)
      // All concept IDs must be in concepts.json
      for (const cid of def.concepts) {
        expect(concepts[cid], `pack ${id} references unknown concept "${cid}"`).toBeDefined()
      }
    }
  })

  it.skipIf(!dataExists)('en-lv packs have sourceCode=lv and targetCode=en', () => {
    for (const level of ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']) {
      const def = readJson<PackDefinition>(join(DATA_DIR, 'packs', `en-lv-${level}.json`))
      expect(def.sourceCode).toBe('lv')
      expect(def.targetCode).toBe('en')
    }
  })

  it.skipIf(!dataExists)('ru-en packs have sourceCode=ru and targetCode=en', () => {
    for (const level of ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']) {
      const def = readJson<PackDefinition>(join(DATA_DIR, 'packs', `ru-en-${level}.json`))
      expect(def.sourceCode).toBe('ru')
      expect(def.targetCode).toBe('en')
    }
  })

  it.skipIf(!dataExists)('ru-lv packs have sourceCode=ru and targetCode=lv', () => {
    for (const level of ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']) {
      const def = readJson<PackDefinition>(join(DATA_DIR, 'packs', `ru-lv-${level}.json`))
      expect(def.sourceCode).toBe('ru')
      expect(def.targetCode).toBe('lv')
    }
  })

  it.skipIf(!dataExists)('concept IDs are not duplicated within a pack definition', () => {
    for (const id of EXPECTED_PACK_IDS) {
      const def = readJson<PackDefinition>(join(DATA_DIR, 'packs', `${id}.json`))
      const seen = new Set<string>()
      for (const cid of def.concepts) {
        expect(seen.has(cid), `pack ${id} has duplicate concept "${cid}"`).toBe(false)
        seen.add(cid)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Tests: output pack files (generated by build-packs.ts)
// ---------------------------------------------------------------------------

describe('public/starter-packs/ (build output)', () => {
  const EXPECTED_PACK_IDS = [
    'en-lv-a1',
    'en-lv-a2',
    'en-lv-b1',
    'en-lv-b2',
    'en-lv-c1',
    'en-lv-c2',
    'ru-en-a1',
    'ru-en-a2',
    'ru-en-b1',
    'ru-en-b2',
    'ru-en-c1',
    'ru-en-c2',
    'ru-lv-a1',
    'ru-lv-a2',
    'ru-lv-b1',
    'ru-lv-b2',
    'ru-lv-c1',
    'ru-lv-c2',
  ]

  it.skipIf(!outputExists)('all 18 output pack files exist', () => {
    for (const id of EXPECTED_PACK_IDS) {
      expect(existsSync(join(OUTPUT_DIR, `${id}.json`))).toBe(true)
    }
  })

  it.skipIf(!outputExists)('manifest.json lists all 18 packs', () => {
    const manifest = readJson<{ packs: string[] }>(join(OUTPUT_DIR, 'manifest.json'))
    expect(manifest.packs.length).toBe(18)
    for (const id of EXPECTED_PACK_IDS) {
      expect(manifest.packs).toContain(id)
    }
  })

  it.skipIf(!outputExists)('every output pack has correct structure', () => {
    for (const id of EXPECTED_PACK_IDS) {
      const pack = readJson<OutputPack>(join(OUTPUT_DIR, `${id}.json`))
      expect(pack.id).toBe(id)
      expect(typeof pack.name).toBe('string')
      expect(typeof pack.description).toBe('string')
      expect(typeof pack.sourceCode).toBe('string')
      expect(typeof pack.targetCode).toBe('string')
      expect(typeof pack.level).toBe('string')
      expect(Array.isArray(pack.words)).toBe(true)
      expect(pack.words.length).toBeGreaterThan(0)
    }
  })

  it.skipIf(!outputExists)('every word has source, target, and tags', () => {
    for (const id of EXPECTED_PACK_IDS) {
      const pack = readJson<OutputPack>(join(OUTPUT_DIR, `${id}.json`))
      for (const word of pack.words) {
        expect(typeof word.source).toBe('string')
        expect(word.source.length).toBeGreaterThan(0)
        expect(typeof word.target).toBe('string')
        expect(word.target.length).toBeGreaterThan(0)
        expect(Array.isArray(word.tags)).toBe(true)
        expect(word.tags.length).toBeGreaterThan(0)
      }
    }
  })

  it.skipIf(!outputExists)('every word has the pack-level CEFR tag in its tags', () => {
    for (const id of EXPECTED_PACK_IDS) {
      const pack = readJson<OutputPack>(join(OUTPUT_DIR, `${id}.json`))
      for (const word of pack.words) {
        expect(
          word.tags,
          `word "${word.source}->${word.target}" in ${id} should have level tag "${pack.level}"`,
        ).toContain(pack.level)
      }
    }
  })

  it.skipIf(!outputExists)('words within a pack are not duplicated', () => {
    for (const id of EXPECTED_PACK_IDS) {
      const pack = readJson<OutputPack>(join(OUTPUT_DIR, `${id}.json`))
      const seen = new Set<string>()
      for (const word of pack.words) {
        const key = `${word.source}|${word.target}`
        expect(
          seen.has(key),
          `pack ${id} has duplicate word "${word.source}->${word.target}"`,
        ).toBe(false)
        seen.add(key)
      }
    }
  })

  it.skipIf(!outputExists)('en-lv packs have lv source and en target words', () => {
    // Spot-check: known LV words should be present in en-lv packs
    const a1 = readJson<OutputPack>(join(OUTPUT_DIR, 'en-lv-a1.json'))
    const sources = a1.words.map((w) => w.source)
    expect(sources).toContain('sveiki') // LV "hello"
    expect(sources).toContain('māte') // LV "mother"
  })

  it.skipIf(!outputExists)('en-lv-a1 round-trip: known words are present', () => {
    const pack = readJson<OutputPack>(join(OUTPUT_DIR, 'en-lv-a1.json'))
    const hello = pack.words.find((w) => w.target === 'hello')
    expect(hello).toBeDefined()
    expect(hello?.source).toBe('sveiki')
    expect(hello?.tags).toContain('greetings')
    expect(hello?.tags).toContain('A1')
  })

  it.skipIf(!outputExists)('word counts match expected sizes', () => {
    // These should match the original pack sizes
    const expected: Record<string, number> = {
      'en-lv-a1': 187,
      'en-lv-a2': 143,
      'en-lv-b1': 125,
      'en-lv-b2': 128,
      'en-lv-c1': 147,
      'en-lv-c2': 130,
    }
    for (const [id, count] of Object.entries(expected)) {
      const pack = readJson<OutputPack>(join(OUTPUT_DIR, `${id}.json`))
      expect(pack.words.length, `${id} should have ${count} words`).toBe(count)
    }
  })
})
