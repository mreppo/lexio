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
 * Fetches the pack manifest and returns the list of available pack IDs.
 * The manifest lives at /starter-packs/manifest.json.
 */
export async function listPackIds(): Promise<readonly string[]> {
  const response = await fetch('/starter-packs/manifest.json')
  if (!response.ok) {
    throw new Error(`Failed to load pack manifest: ${response.status} ${response.statusText}`)
  }
  const manifest = (await response.json()) as { packs: string[] }
  return manifest.packs
}

/**
 * Loads a starter pack by ID from the public directory.
 * Fetches /starter-packs/<id>.json and returns the parsed StarterPack.
 */
export async function loadPack(id: string): Promise<StarterPack> {
  const response = await fetch(`/starter-packs/${id}.json`)
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
 * For each word in the pack:
 * - Checks for an exact duplicate by source+target (case-insensitive).
 * - If no duplicate exists, creates a Word with `isFromPack: true` and tag "starter-pack".
 * - Skips words that already exist.
 *
 * Returns the count of added and skipped words.
 */
export async function installPack(
  pack: StarterPack,
  pairId: string,
  storage: StorageService,
): Promise<InstallPackResult> {
  const existingWords = await storage.getWords(pairId)

  // Build a set of normalised source+target keys for duplicate detection.
  const existingKeys = new Set(
    existingWords.map((w) => `${w.source.toLowerCase()}|${w.target.toLowerCase()}`),
  )

  const wordsToAdd: Word[] = []
  let skipped = 0

  for (const entry of pack.words) {
    const key = `${entry.source.toLowerCase()}|${entry.target.toLowerCase()}`
    if (existingKeys.has(key)) {
      skipped++
      continue
    }

    const tags = [...entry.tags, 'starter-pack']
    wordsToAdd.push({
      id: generateId(),
      pairId,
      source: entry.source,
      target: entry.target,
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
