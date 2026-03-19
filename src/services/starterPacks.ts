import type { StarterPack, Word } from '@/types'
import type { StorageService } from './storage/StorageService'
import { generateId } from '@/utils/id'

/**
 * Result of installing a starter pack into storage.
 */
export interface InstallPackResult {
  readonly added: number
  readonly skipped: number
}

/**
 * Describes how a starter pack's language codes relate to a given pair's codes.
 *
 * - 'same'     – pack codes match the pair exactly (no swap needed)
 * - 'reversed' – pack codes are the mirror of the pair (swap source/target on install)
 * - 'none'     – pack is for a completely different language combination
 */
export type PackMatchResult = 'same' | 'reversed' | 'none'

/**
 * Determines whether a starter pack is compatible with the given language pair,
 * and in which direction.
 *
 * A pack with sourceCode="lv" / targetCode="en" matches both:
 *   - an LV-EN pair  → 'same'
 *   - an EN-LV pair  → 'reversed'
 */
export function packMatchesPair(
  pack: StarterPack,
  pairSourceCode: string,
  pairTargetCode: string,
): PackMatchResult {
  if (pack.sourceCode === pairSourceCode && pack.targetCode === pairTargetCode) return 'same'
  if (pack.sourceCode === pairTargetCode && pack.targetCode === pairSourceCode) return 'reversed'
  return 'none'
}

/**
 * Fetches the pack manifest and returns the list of available pack IDs.
 * The manifest lives at <BASE_URL>starter-packs/manifest.json.
 * BASE_URL is provided by Vite and equals '/lexio/' in production, '/' in dev.
 */
export async function listPackIds(): Promise<readonly string[]> {
  const base = import.meta.env.BASE_URL
  const response = await fetch(`${base}starter-packs/manifest.json`)
  if (!response.ok) {
    throw new Error(`Failed to load pack manifest: ${response.status} ${response.statusText}`)
  }
  const manifest = (await response.json()) as { packs: string[] }
  return manifest.packs
}

/**
 * Loads a starter pack by ID from the public directory.
 * Fetches <BASE_URL>starter-packs/<id>.json and returns the parsed StarterPack.
 * BASE_URL is provided by Vite and equals '/lexio/' in production, '/' in dev.
 */
export async function loadPack(id: string): Promise<StarterPack> {
  const base = import.meta.env.BASE_URL
  const response = await fetch(`${base}starter-packs/${id}.json`)
  if (!response.ok) {
    throw new Error(`Failed to load pack "${id}": ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as StarterPack
}

/**
 * Loads all available starter packs listed in the manifest.
 * Packs that fail to load are silently skipped.
 */
export async function listPacks(): Promise<readonly StarterPack[]> {
  const ids = await listPackIds()
  const results = await Promise.allSettled(ids.map((id) => loadPack(id)))
  return results
    .filter((r): r is PromiseFulfilledResult<StarterPack> => r.status === 'fulfilled')
    .map((r) => r.value)
}

/**
 * Installs a starter pack into storage for the given language pair.
 *
 * The pairSourceCode and pairTargetCode parameters are used to determine the
 * install direction via packMatchesPair:
 * - 'same'     – words are installed as-is
 * - 'reversed' – source and target values are swapped so they match the pair direction
 * - 'none'     – throws an error (the UI should never call this for an incompatible pack)
 *
 * For each word in the pack (after any swap):
 * - Checks for an exact duplicate by source+target (case-insensitive).
 * - If no duplicate exists, creates a Word with `isFromPack: true` and tag "starter-pack".
 * - Skips words that already exist.
 *
 * Returns the count of added and skipped words.
 */
export async function installPack(
  pack: StarterPack,
  pairId: string,
  pairSourceCode: string,
  pairTargetCode: string,
  storage: StorageService,
): Promise<InstallPackResult> {
  const direction = packMatchesPair(pack, pairSourceCode, pairTargetCode)

  if (direction === 'none') {
    throw new Error(
      `Pack "${pack.id}" (${pack.sourceCode}-${pack.targetCode}) is not compatible with pair ${pairSourceCode}-${pairTargetCode}`,
    )
  }

  const existingWords = await storage.getWords(pairId)

  // Build a set of normalised source+target keys for duplicate detection.
  const existingKeys = new Set(
    existingWords.map((w) => `${w.source.toLowerCase()}|${w.target.toLowerCase()}`),
  )

  const wordsToAdd: Word[] = []
  let skipped = 0

  for (const entry of pack.words) {
    // Swap source and target when installing in the reversed direction.
    const wordSource = direction === 'reversed' ? entry.target : entry.source
    const wordTarget = direction === 'reversed' ? entry.source : entry.target

    const key = `${wordSource.toLowerCase()}|${wordTarget.toLowerCase()}`
    if (existingKeys.has(key)) {
      skipped++
      continue
    }

    const tags = [...entry.tags, 'starter-pack']
    wordsToAdd.push({
      id: generateId(),
      pairId,
      source: wordSource,
      target: wordTarget,
      notes: null,
      tags,
      createdAt: Date.now(),
      isFromPack: true,
    })

    // Add the key to avoid duplicates within the pack itself.
    existingKeys.add(key)
  }

  if (wordsToAdd.length > 0) {
    await storage.saveWords(wordsToAdd)
  }

  return { added: wordsToAdd.length, skipped }
}
