/**
 * extract-normalized-data.ts
 *
 * One-time migration script that reads all 18 existing flat starter-pack JSON
 * files from public/starter-packs/ and produces the normalized three-layer
 * data structure in data/.
 *
 * Concept identity: each unique (lv_source, en_target) pair from en-lv packs
 * becomes one concept. This ensures exact round-trip fidelity because the LV
 * word uniquely identifies which concept is meant at which level.
 *
 * Usage:
 *   npx tsx scripts/extract-normalized-data.ts
 *
 * Output:
 *   data/concepts.json
 *   data/translations/en.json
 *   data/translations/lv.json
 *   data/translations/ru.json
 *   data/packs/<id>.json  (18 files)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawWord {
  source: string
  target: string
  tags: string[]
}

interface RawPack {
  id: string
  name: string
  description: string
  sourceCode: string
  targetCode: string
  level: string
  words: RawWord[]
}

interface ConceptEntry {
  tags: string[]
}

interface ConceptRegistry {
  [conceptId: string]: ConceptEntry
}

interface TranslationMap {
  [conceptId: string]: string[]
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PACKS_DIR = join(ROOT, 'public', 'starter-packs')
const DATA_DIR = join(ROOT, 'data')

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T
}

function writeJson(path: string, data: unknown): void {
  const dir = dirname(path)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

/** Convert a string to a safe snake_case segment for use in concept IDs. */
function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

/** Extract the topic tag (first non-CEFR tag) from a word's tags. */
function extractTopicTag(tags: string[]): string {
  const cefrPattern = /^(A1|A2|B1|B2|C1|C2)$/
  const topic = tags.find((t) => !cefrPattern.test(t))
  return topic ?? 'general'
}

/** Strip CEFR level tags from a tag array. */
function stripCefrTags(tags: string[]): string[] {
  return tags.filter((t) => !/^(A1|A2|B1|B2|C1|C2)$/.test(t))
}

// ---------------------------------------------------------------------------
// Pack ID list
// ---------------------------------------------------------------------------

const PACK_IDS = [
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

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const

// ---------------------------------------------------------------------------
// Step 1: Read all raw packs
// ---------------------------------------------------------------------------

console.log('Reading raw pack files…')
const rawPacks = new Map<string, RawPack>()
for (const id of PACK_IDS) {
  rawPacks.set(id, readJson<RawPack>(join(PACKS_DIR, `${id}.json`)))
}

// ---------------------------------------------------------------------------
// Step 2: Build concept registry from en-lv packs.
//
// Concept key: (lv_source_word, en_target_word) from en-lv pack entries.
// Each unique LV word in en-lv maps to exactly one concept (LV word uniqueness
// is guaranteed within a single pack; the same LV word appearing across levels
// with different EN targets = different concepts, and vice versa).
//
// Concept ID format: {topic}_{en_word_snake_case}
// Disambiguation suffix _2, _3, … is added when the same (topic, en_word)
// combination appears more than once (e.g. "orange" as colour vs fruit).
// ---------------------------------------------------------------------------

console.log('Building concept registry from en-lv packs…')

const concepts: ConceptRegistry = {}
const enTranslations: TranslationMap = {}
const lvTranslations: TranslationMap = {}
const ruTranslations: TranslationMap = {}

// Primary lookup: lv_word -> conceptId  (built from all en-lv packs)
// When a LV word maps to multiple concepts, this holds the first one seen.
const lvWordToConceptId = new Map<string, string>()

// Multi-map: lv_word -> [conceptId, ...]  (for disambiguation in ru-lv packs)
const lvWordToConceptIds = new Map<string, string[]>()

// Secondary lookup: en_word -> [conceptId, ...]  (for resolving ru-en words)
const enWordToConceptIds = new Map<string, string[]>()

// Used to avoid duplicate concept IDs
const usedConceptIds = new Set<string>()

function allocateConceptId(enWord: string, topic: string): string {
  const base = `${toSnakeCase(topic)}_${toSnakeCase(enWord)}`
  if (!usedConceptIds.has(base)) {
    usedConceptIds.add(base)
    return base
  }
  let counter = 2
  while (usedConceptIds.has(`${base}_${counter}`)) {
    counter++
  }
  const id = `${base}_${counter}`
  usedConceptIds.add(id)
  return id
}

// Secondary key: (lv_word, en_word) -> conceptId to handle cases where the
// same LV word maps to two different EN words (e.g. "būt" = "to be" and
// "būt" = "to have" in Latvian, since the same verb covers both meanings).
const lvEnPairToConceptId = new Map<string, string>()

for (const level of LEVELS) {
  const pack = rawPacks.get(`en-lv-${level}`)!
  for (const word of pack.words) {
    const lvWord = word.source // Latvian
    const enWord = word.target // English
    const topic = extractTopicTag(word.tags)
    const pairKey = `${lvWord}\0${enWord}`

    if (lvEnPairToConceptId.has(pairKey)) {
      // This exact (lv, en) pair was seen before; reuse the existing concept.
      // Also ensure the primary LV lookup points here (first one wins).
      if (!lvWordToConceptId.has(lvWord)) {
        lvWordToConceptId.set(lvWord, lvEnPairToConceptId.get(pairKey)!)
      }
      continue
    }

    // Create a new concept for this (lv_word, en_word) pair.
    const conceptId = allocateConceptId(enWord, topic)

    concepts[conceptId] = { tags: stripCefrTags(word.tags) }
    enTranslations[conceptId] = [enWord]
    lvTranslations[conceptId] = [lvWord]

    lvEnPairToConceptId.set(pairKey, conceptId)
    // Primary LV lookup: first EN word seen for this LV word wins
    if (!lvWordToConceptId.has(lvWord)) {
      lvWordToConceptId.set(lvWord, conceptId)
    }
    // Multi-map: track all concepts for this LV word
    const existingLvIds = lvWordToConceptIds.get(lvWord)
    if (existingLvIds) {
      if (!existingLvIds.includes(conceptId)) {
        existingLvIds.push(conceptId)
      }
    } else {
      lvWordToConceptIds.set(lvWord, [conceptId])
    }

    const existingEnIds = enWordToConceptIds.get(enWord)
    if (existingEnIds) {
      existingEnIds.push(conceptId)
    } else {
      enWordToConceptIds.set(enWord, [conceptId])
    }
  }
}

// ---------------------------------------------------------------------------
// Step 3: Add Russian translations from ru-en packs.
//
// For each (ru_source, en_target) in a ru-en pack:
//   - Look up conceptId(s) by en_target
//   - If one concept → assign ru_source to it
//   - If multiple concepts with same EN word (disambiguation): pick the one
//     that shares the topic tag with the ru-en word, or the first without a
//     RU translation yet
//   - If no concept exists for this EN word → create a new concept (this EN
//     word didn't appear in any en-lv pack)
// ---------------------------------------------------------------------------

console.log('Adding Russian translations from ru-en packs…')

for (const level of LEVELS) {
  const pack = rawPacks.get(`ru-en-${level}`)!
  for (const word of pack.words) {
    const ruWord = word.source // Russian
    const enWord = word.target // English
    const topic = extractTopicTag(word.tags)

    const ids = enWordToConceptIds.get(enWord)

    if (!ids || ids.length === 0) {
      // EN word not in any en-lv pack → create a new concept
      const conceptId = allocateConceptId(enWord, topic)
      concepts[conceptId] = { tags: stripCefrTags(word.tags) }
      enTranslations[conceptId] = [enWord]
      ruTranslations[conceptId] = [ruWord]
      enWordToConceptIds.set(enWord, [conceptId])
    } else if (ids.length === 1) {
      if (!ruTranslations[ids[0]]) {
        ruTranslations[ids[0]] = [ruWord]
      }
    } else {
      // Multiple concepts for the same EN word.
      // Strategy: prefer the concept whose topic matches, then the first
      // concept that does not yet have a RU translation.
      const byTopic = ids.find((id) => concepts[id]?.tags.includes(topic))
      const withoutRu = ids.find((id) => !ruTranslations[id])
      const targetId = byTopic ?? withoutRu ?? ids[0]
      if (!ruTranslations[targetId]) {
        ruTranslations[targetId] = [ruWord]
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Step 4: Process ru-lv packs.
//
// For each (ru_source, lv_target) in a ru-lv pack:
//   - Look up conceptId by lv_target (using global lvWordToConceptId)
//   - Fill in missing RU translation if not yet assigned
//   - If the LV word isn't in any en-lv pack → create a new concept
// ---------------------------------------------------------------------------

console.log('Processing ru-lv packs to fill gaps and discover new concepts…')

for (const level of LEVELS) {
  const pack = rawPacks.get(`ru-lv-${level}`)!
  for (const word of pack.words) {
    const ruWord = word.source // Russian
    const lvWord = word.target // Latvian
    const topic = extractTopicTag(word.tags)

    const existingId = lvWordToConceptId.get(lvWord)

    if (existingId) {
      if (!ruTranslations[existingId]) {
        ruTranslations[existingId] = [ruWord]
      }
    } else {
      // LV word not in any en-lv pack → create a new concept anchored on LV
      // Use a prefix to avoid collisions with EN-keyed concept IDs
      const conceptId = allocateConceptId(`lv_${toSnakeCase(lvWord)}`, topic)
      concepts[conceptId] = { tags: stripCefrTags(word.tags) }
      lvTranslations[conceptId] = [lvWord]
      ruTranslations[conceptId] = [ruWord]
      lvWordToConceptId.set(lvWord, conceptId)
      // Register in multi-map too
      const existingIds = lvWordToConceptIds.get(lvWord)
      if (existingIds) {
        if (!existingIds.includes(conceptId)) {
          existingIds.push(conceptId)
        }
      } else {
        lvWordToConceptIds.set(lvWord, [conceptId])
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Step 5: Build pack definition files.
//
// For each raw pack, look up the conceptId for every word and assemble the
// ordered list of concept IDs.
// ---------------------------------------------------------------------------

console.log('Building pack definitions…')

const packDefinitions = new Map<string, PackDefinition>()

for (const id of PACK_IDS) {
  const raw = rawPacks.get(id)!
  const conceptIds: string[] = []
  const seen = new Set<string>()

  for (const word of raw.words) {
    let conceptId: string | undefined

    if (raw.targetCode === 'en') {
      // en-lv and ru-en: target is English, source is LV or RU
      const enWord = word.target
      const ids = enWordToConceptIds.get(enWord)
      if (ids && ids.length > 0) {
        if (ids.length === 1) {
          conceptId = ids[0]
        } else {
          // Multiple concepts share the same English word.
          // For en-lv packs, first try to match via the (lv_source, en_target) pair key.
          // For ru-en packs, disambiguate by topic tag.
          if (raw.sourceCode === 'lv') {
            const pairKey = `${word.source}\0${enWord}`
            conceptId = lvEnPairToConceptId.get(pairKey)
          }
          if (!conceptId) {
            const topic = extractTopicTag(word.tags)
            conceptId = ids.find((cid) => concepts[cid]?.tags.includes(topic)) ?? ids[0]
          }
        }
      }
    } else {
      // ru-lv: target is Latvian
      const lvIds = lvWordToConceptIds.get(word.target)
      if (lvIds && lvIds.length > 0) {
        if (lvIds.length === 1) {
          conceptId = lvIds[0]
        } else {
          // Multiple concepts share this LV word - pick by matching RU source
          const matchedByRu = lvIds.find(
            (cid) => ruTranslations[cid] && ruTranslations[cid].includes(word.source),
          )
          conceptId = matchedByRu ?? lvIds[0]
        }
      }
    }

    if (!conceptId) {
      console.warn(`  WARNING: No concept for "${word.source}" → "${word.target}" in ${id}`)
      continue
    }

    if (!seen.has(conceptId)) {
      seen.add(conceptId)
      conceptIds.push(conceptId)
    }
  }

  packDefinitions.set(id, {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    sourceCode: raw.sourceCode,
    targetCode: raw.targetCode,
    level: raw.level,
    concepts: conceptIds,
  })
}

// ---------------------------------------------------------------------------
// Step 6: Write output files
// ---------------------------------------------------------------------------

console.log('Writing output files…')

writeJson(join(DATA_DIR, 'concepts.json'), concepts)
console.log(`  Wrote data/concepts.json (${Object.keys(concepts).length} concepts)`)

writeJson(join(DATA_DIR, 'translations', 'en.json'), enTranslations)
console.log(`  Wrote data/translations/en.json (${Object.keys(enTranslations).length} entries)`)

writeJson(join(DATA_DIR, 'translations', 'lv.json'), lvTranslations)
console.log(`  Wrote data/translations/lv.json (${Object.keys(lvTranslations).length} entries)`)

writeJson(join(DATA_DIR, 'translations', 'ru.json'), ruTranslations)
console.log(`  Wrote data/translations/ru.json (${Object.keys(ruTranslations).length} entries)`)

for (const [packId, def] of packDefinitions) {
  writeJson(join(DATA_DIR, 'packs', `${packId}.json`), def)
}
console.log(`  Wrote ${packDefinitions.size} pack definition files to data/packs/`)

// ---------------------------------------------------------------------------
// Step 7: Validation summary
// ---------------------------------------------------------------------------

console.log('\nValidation summary:')

// Concepts referenced by at least one pack
const referencedConcepts = new Set<string>()
for (const def of packDefinitions.values()) {
  for (const cid of def.concepts) {
    referencedConcepts.add(cid)
  }
}

let orphanConcepts = 0
let orphanTranslations = 0
let missingEn = 0
let missingLv = 0
let missingRu = 0

for (const cid of Object.keys(concepts)) {
  if (!referencedConcepts.has(cid)) {
    console.warn(`  WARN: Orphan concept (not used in any pack): ${cid}`)
    orphanConcepts++
  }
  if (!enTranslations[cid]) missingEn++
  if (!lvTranslations[cid]) missingLv++
  if (!ruTranslations[cid]) missingRu++
}

const allTranslationIds = new Set([
  ...Object.keys(enTranslations),
  ...Object.keys(lvTranslations),
  ...Object.keys(ruTranslations),
])
for (const cid of allTranslationIds) {
  if (!concepts[cid]) {
    console.warn(`  WARN: Orphan translation (not in concepts.json): ${cid}`)
    orphanTranslations++
  }
}

console.log(`  Total concepts: ${Object.keys(concepts).length}`)
console.log(`  Concepts missing EN translation: ${missingEn}`)
console.log(`  Concepts missing LV translation: ${missingLv}`)
console.log(`  Concepts missing RU translation: ${missingRu}`)
console.log(`  Orphan concepts: ${orphanConcepts}`)
console.log(`  Orphan translations: ${orphanTranslations}`)

console.log("\nDone. Run 'npx tsx scripts/build-packs.ts' to verify round-trip.")
