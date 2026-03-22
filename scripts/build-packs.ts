/**
 * build-packs.ts
 *
 * Build script that assembles flat StarterPack JSON files (consumed by the app)
 * from the normalized three-layer data structure in data/.
 *
 * Usage:
 *   npx tsx scripts/build-packs.ts
 *
 * Reads:
 *   data/concepts.json
 *   data/translations/en.json
 *   data/translations/lv.json
 *   data/translations/ru.json
 *   data/packs/<id>.json
 *
 * Writes:
 *   public/starter-packs/<id>.json
 *   public/starter-packs/manifest.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface Manifest {
  packs: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'data')
const OUTPUT_DIR = join(ROOT, 'public', 'starter-packs')

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

// ---------------------------------------------------------------------------
// Load normalized data
// ---------------------------------------------------------------------------

console.log('Loading normalized data…')

const concepts = readJson<ConceptRegistry>(join(DATA_DIR, 'concepts.json'))
const translations: Record<string, TranslationMap> = {
  en: readJson<TranslationMap>(join(DATA_DIR, 'translations', 'en.json')),
  lv: readJson<TranslationMap>(join(DATA_DIR, 'translations', 'lv.json')),
  ru: readJson<TranslationMap>(join(DATA_DIR, 'translations', 'ru.json')),
}

// Read all pack definition files from data/packs/
const packDefFiles = readdirSync(join(DATA_DIR, 'packs')).filter((f) => f.endsWith('.json'))

const packDefs: PackDefinition[] = packDefFiles.map((f) =>
  readJson<PackDefinition>(join(DATA_DIR, 'packs', f)),
)

console.log(`Loaded ${Object.keys(concepts).length} concepts, ${packDefs.length} pack definitions`)

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

console.log('Validating normalized data…')

let validationErrors = 0
let validationWarnings = 0

// Check all translations reference valid concepts
for (const [langCode, translationMap] of Object.entries(translations)) {
  for (const conceptId of Object.keys(translationMap)) {
    if (!concepts[conceptId]) {
      console.error(
        `  ERROR: Translation in ${langCode}.json references unknown concept: ${conceptId}`,
      )
      validationErrors++
    }
  }
}

// Check orphan concepts (exist in concepts.json but not referenced by any pack)
const referencedConcepts = new Set<string>()
for (const def of packDefs) {
  for (const cid of def.concepts) {
    referencedConcepts.add(cid)
  }
}
for (const cid of Object.keys(concepts)) {
  if (!referencedConcepts.has(cid)) {
    console.warn(`  WARN: Orphan concept (not referenced by any pack): ${cid}`)
    validationWarnings++
  }
}

// Check orphan translations (in translation files but not in concepts.json)
for (const [langCode, translationMap] of Object.entries(translations)) {
  for (const cid of Object.keys(translationMap)) {
    if (!concepts[cid]) {
      console.warn(`  WARN: Orphan translation in ${langCode}.json (not in concepts.json): ${cid}`)
      validationWarnings++
    }
  }
}

if (validationErrors > 0) {
  console.error(`\nValidation failed with ${validationErrors} error(s). Aborting.`)
  process.exit(1)
}
if (validationWarnings > 0) {
  console.warn(`  ${validationWarnings} warning(s) noted above.`)
}

// ---------------------------------------------------------------------------
// Assemble and write output packs
// ---------------------------------------------------------------------------

console.log('\nAssembling output packs…')

const assembledPackIds: string[] = []
let packErrors = 0

for (const def of packDefs) {
  const sourceLang = def.sourceCode
  const targetLang = def.targetCode

  const sourceTrans = translations[sourceLang]
  const targetTrans = translations[targetLang]

  if (!sourceTrans) {
    console.error(
      `  ERROR: No translations found for source language "${sourceLang}" (pack ${def.id})`,
    )
    packErrors++
    continue
  }
  if (!targetTrans) {
    console.error(
      `  ERROR: No translations found for target language "${targetLang}" (pack ${def.id})`,
    )
    packErrors++
    continue
  }

  const words: OutputWord[] = []

  for (const conceptId of def.concepts) {
    if (!concepts[conceptId]) {
      console.error(`  ERROR: Pack ${def.id} references unknown concept: ${conceptId}`)
      packErrors++
      continue
    }

    const sourceWords = sourceTrans[conceptId]
    const targetWords = targetTrans[conceptId]

    if (!sourceWords || sourceWords.length === 0) {
      console.error(
        `  ERROR: Pack ${def.id}: concept "${conceptId}" has no translation for source language "${sourceLang}"`,
      )
      packErrors++
      continue
    }
    if (!targetWords || targetWords.length === 0) {
      console.error(
        `  ERROR: Pack ${def.id}: concept "${conceptId}" has no translation for target language "${targetLang}"`,
      )
      packErrors++
      continue
    }

    // Use first translation (primary form)
    const sourceWord = sourceWords[0]
    const targetWord = targetWords[0]

    // Build tags: concept's global tags + the level tag from the pack definition
    const tags = [...concepts[conceptId].tags, def.level]

    words.push({ source: sourceWord, target: targetWord, tags })
  }

  const outputPack: OutputPack = {
    id: def.id,
    name: def.name,
    description: def.description,
    sourceCode: def.sourceCode,
    targetCode: def.targetCode,
    level: def.level,
    words,
  }

  writeJson(join(OUTPUT_DIR, `${def.id}.json`), outputPack)
  assembledPackIds.push(def.id)
  console.log(`  Wrote ${def.id}.json (${words.length} words)`)
}

if (packErrors > 0) {
  console.error(`\nBuild failed with ${packErrors} pack error(s). Aborting.`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Write manifest
// ---------------------------------------------------------------------------

// Sort pack IDs for deterministic manifest output
assembledPackIds.sort()
const manifest: Manifest = { packs: assembledPackIds }
writeJson(join(OUTPUT_DIR, 'manifest.json'), manifest)
console.log(`\nWrote manifest.json with ${assembledPackIds.length} packs`)

console.log('\nBuild complete. All packs assembled successfully.')
