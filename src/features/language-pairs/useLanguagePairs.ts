import { useState, useEffect, useCallback } from 'react'
import type { LanguagePair } from '@/types'
import { useStorage } from '@/hooks/useStorage'
import { generateId } from '@/utils/id'

export interface CreatePairInput {
  readonly sourceLang: string
  readonly sourceCode: string
  readonly targetLang: string
  readonly targetCode: string
}

export interface UseLanguagePairsResult {
  /** All stored language pairs. */
  readonly pairs: readonly LanguagePair[]
  /** The currently active pair, or null if none selected. */
  readonly activePair: LanguagePair | null
  /** True while the initial load is in progress. */
  readonly loading: boolean
  /** Create a new language pair and optionally set it as active. */
  readonly createPair: (input: CreatePairInput, setActive?: boolean) => Promise<LanguagePair>
  /** Switch the active pair. */
  readonly switchPair: (pairId: string) => Promise<void>
  /** Delete a pair and all associated words and progress. */
  readonly deletePair: (pairId: string) => Promise<void>
}

/**
 * Custom hook that manages language pairs via StorageService.
 * All mutations go through the storage abstraction - no direct localStorage access.
 */
export function useLanguagePairs(): UseLanguagePairsResult {
  const storage = useStorage()
  const [pairs, setPairs] = useState<LanguagePair[]>([])
  const [activePairId, setActivePairId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load pairs and settings on mount.
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const [loadedPairs, settings] = await Promise.all([
        storage.getLanguagePairs(),
        storage.getSettings(),
      ])

      if (!cancelled) {
        setPairs(loadedPairs)
        setActivePairId(settings.activePairId)
        setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [storage])

  const activePair = pairs.find((p) => p.id === activePairId) ?? null

  const createPair = useCallback(
    async (input: CreatePairInput, setActive = true): Promise<LanguagePair> => {
      const newPair: LanguagePair = {
        id: generateId(),
        sourceLang: input.sourceLang.trim(),
        sourceCode: input.sourceCode.trim().toLowerCase(),
        targetLang: input.targetLang.trim(),
        targetCode: input.targetCode.trim().toLowerCase(),
        createdAt: Date.now(),
      }

      await storage.saveLanguagePair(newPair)
      setPairs((prev) => [...prev, newPair])

      if (setActive) {
        const settings = await storage.getSettings()
        await storage.saveSettings({ ...settings, activePairId: newPair.id })
        setActivePairId(newPair.id)
      }

      return newPair
    },
    [storage],
  )

  const switchPair = useCallback(
    async (pairId: string): Promise<void> => {
      const settings = await storage.getSettings()
      await storage.saveSettings({ ...settings, activePairId: pairId })
      setActivePairId(pairId)
    },
    [storage],
  )

  const deletePair = useCallback(
    async (pairId: string): Promise<void> => {
      // Cascade: delete all words for the pair, which will also clean up progress.
      const words = await storage.getWords(pairId)
      for (const word of words) {
        await storage.deleteWord(word.id)
      }

      await storage.deleteLanguagePair(pairId)
      setPairs((prev) => prev.filter((p) => p.id !== pairId))

      // If the deleted pair was active, clear the active pair.
      if (activePairId === pairId) {
        const settings = await storage.getSettings()
        await storage.saveSettings({ ...settings, activePairId: null })
        setActivePairId(null)
      }
    },
    [storage, activePairId],
  )

  return { pairs, activePair, loading, createPair, switchPair, deletePair }
}
