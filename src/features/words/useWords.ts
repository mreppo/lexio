import { useState, useEffect, useCallback } from 'react'
import type { Word, WordProgress } from '@/types'
import { useStorage } from '@/hooks/useStorage'
import { generateId } from '@/utils/id'

export interface CreateWordInput {
  readonly source: string
  readonly target: string
  readonly notes: string | null
  readonly tags: readonly string[]
}

export interface UseWordsResult {
  /** All words for the active pair. */
  readonly words: readonly Word[]
  /** Progress keyed by word id. */
  readonly progressMap: ReadonlyMap<string, WordProgress>
  /** True while the initial load is in progress. */
  readonly loading: boolean
  /** Create a new word for the given pair. Returns null if duplicate. */
  readonly addWord: (pairId: string, input: CreateWordInput) => Promise<Word | null>
  /** Update an existing word. */
  readonly updateWord: (wordId: string, input: CreateWordInput) => Promise<void>
  /** Delete a single word by id. */
  readonly deleteWord: (wordId: string) => Promise<void>
  /** Delete multiple words by id. */
  readonly deleteWords: (wordIds: readonly string[]) => Promise<void>
  /** Re-fetch words and progress from storage (e.g. after a pack install). */
  readonly refresh: () => void
}

/**
 * Custom hook that manages words for the active language pair.
 * All mutations go through StorageService - no direct localStorage access.
 */
export function useWords(activePairId: string | null): UseWordsResult {
  const storage = useStorage()
  const [words, setWords] = useState<Word[]>([])
  const [progressMap, setProgressMap] = useState<Map<string, WordProgress>>(new Map())
  const [loading, setLoading] = useState(true)
  // Incrementing this counter triggers a re-fetch without changing the pair id.
  const [refreshCount, setRefreshCount] = useState(0)

  const refresh = useCallback(() => {
    setRefreshCount((n) => n + 1)
  }, [])

  // Reload whenever the active pair changes or refresh() is called.
  useEffect(() => {
    if (activePairId === null) {
      setWords([])
      setProgressMap(new Map())
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const load = async () => {
      const [loadedWords, allProgress] = await Promise.all([
        storage.getWords(activePairId),
        storage.getAllProgress(activePairId),
      ])

      if (!cancelled) {
        setWords(loadedWords)
        const map = new Map<string, WordProgress>()
        for (const p of allProgress) {
          map.set(p.wordId, p)
        }
        setProgressMap(map)
        setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [storage, activePairId, refreshCount])

  const addWord = useCallback(
    async (pairId: string, input: CreateWordInput): Promise<Word | null> => {
      // Prevent exact duplicates (case-insensitive source + target match).
      const normSource = input.source.trim().toLowerCase()
      const normTarget = input.target.trim().toLowerCase()
      const duplicate = words.find(
        (w) => w.source.toLowerCase() === normSource && w.target.toLowerCase() === normTarget,
      )
      if (duplicate) return null

      const newWord: Word = {
        id: generateId(),
        pairId,
        source: input.source.trim(),
        target: input.target.trim(),
        notes: input.notes?.trim() || null,
        tags: input.tags.map((t) => t.trim()).filter(Boolean),
        createdAt: Date.now(),
        isFromPack: false,
      }

      await storage.saveWord(newWord)
      setWords((prev) => [...prev, newWord])
      return newWord
    },
    [storage, words],
  )

  const updateWord = useCallback(
    async (wordId: string, input: CreateWordInput): Promise<void> => {
      const existing = words.find((w) => w.id === wordId)
      if (!existing) return

      const updated: Word = {
        ...existing,
        source: input.source.trim(),
        target: input.target.trim(),
        notes: input.notes?.trim() || null,
        tags: input.tags.map((t) => t.trim()).filter(Boolean),
      }

      await storage.saveWord(updated)
      setWords((prev) => prev.map((w) => (w.id === wordId ? updated : w)))
    },
    [storage, words],
  )

  const deleteWord = useCallback(
    async (wordId: string): Promise<void> => {
      await storage.deleteWord(wordId)
      setWords((prev) => prev.filter((w) => w.id !== wordId))
      setProgressMap((prev) => {
        const next = new Map(prev)
        next.delete(wordId)
        return next
      })
    },
    [storage],
  )

  const deleteWords = useCallback(
    async (wordIds: readonly string[]): Promise<void> => {
      for (const id of wordIds) {
        await storage.deleteWord(id)
      }
      const idSet = new Set(wordIds)
      setWords((prev) => prev.filter((w) => !idSet.has(w.id)))
      setProgressMap((prev) => {
        const next = new Map(prev)
        for (const id of wordIds) {
          next.delete(id)
        }
        return next
      })
    },
    [storage],
  )

  return { words, progressMap, loading, addWord, updateWord, deleteWord, deleteWords, refresh }
}
