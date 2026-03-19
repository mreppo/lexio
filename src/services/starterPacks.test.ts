import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { StarterPack, Word } from '@/types'
import { listPackIds, loadPack, listPacks, installPack } from './starterPacks'

// ── helpers ──────────────────────────────────────────────────────────────────

const makePack = (overrides: Partial<StarterPack> = {}): StarterPack => ({
  id: 'test-pack',
  name: 'Test Pack',
  description: 'A pack for testing',
  sourceCode: 'lv',
  targetCode: 'en',
  level: 'B1',
  words: [
    { source: 'ūdens', target: 'water', tags: ['B1'] },
    { source: 'maize', target: 'bread', tags: ['B1'] },
  ],
  ...overrides,
})

const makeWord = (overrides: Partial<Word> = {}): Word => ({
  id: 'w1',
  pairId: 'pair-1',
  source: 'ūdens',
  target: 'water',
  notes: null,
  tags: ['B1', 'starter-pack'],
  createdAt: 1000,
  isFromPack: true,
  ...overrides,
})

function makeStorageMock(existingWords: Word[] = []) {
  return {
    getWords: vi.fn().mockResolvedValue(existingWords),
    saveWords: vi.fn().mockResolvedValue(undefined),
    // Unused methods - only included for type compatibility
    getLanguagePairs: vi.fn(),
    getLanguagePair: vi.fn(),
    saveLanguagePair: vi.fn(),
    deleteLanguagePair: vi.fn(),
    getWord: vi.fn(),
    saveWord: vi.fn(),
    deleteWord: vi.fn(),
    getWordProgress: vi.fn(),
    getAllProgress: vi.fn(),
    saveWordProgress: vi.fn(),
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
    getDailyStats: vi.fn(),
    getDailyStatsRange: vi.fn(),
    saveDailyStats: vi.fn(),
    getRecentDailyStats: vi.fn(),
    exportAll: vi.fn(),
    importAll: vi.fn(),
    clearAll: vi.fn(),
  }
}

// ── listPackIds ───────────────────────────────────────────────────────────────

describe('listPackIds', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('should return pack ids from the manifest', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ packs: ['en-lv-b1b2', 'en-de-a1a2'] }),
    } as Response)

    const ids = await listPackIds()
    expect(ids).toEqual(['en-lv-b1b2', 'en-de-a1a2'])
  })

  it('should throw when the manifest fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response)

    await expect(listPackIds()).rejects.toThrow('Failed to load pack manifest: 404 Not Found')
  })
})

// ── loadPack ──────────────────────────────────────────────────────────────────

describe('loadPack', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('should fetch and return a parsed StarterPack', async () => {
    const pack = makePack()
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => pack,
    } as Response)

    const result = await loadPack('test-pack')
    expect(result).toEqual(pack)
    expect(fetch).toHaveBeenCalledWith('/starter-packs/test-pack.json')
  })

  it('should throw when the pack fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response)

    await expect(loadPack('missing-pack')).rejects.toThrow(
      'Failed to load pack "missing-pack": 404 Not Found',
    )
  })
})

// ── listPacks ─────────────────────────────────────────────────────────────────

describe('listPacks', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('should return all successfully loaded packs', async () => {
    const pack1 = makePack({ id: 'pack-1', name: 'Pack 1' })
    const pack2 = makePack({ id: 'pack-2', name: 'Pack 2' })

    // Manifest fetch
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ packs: ['pack-1', 'pack-2'] }) } as Response)
      // pack-1 fetch
      .mockResolvedValueOnce({ ok: true, json: async () => pack1 } as Response)
      // pack-2 fetch
      .mockResolvedValueOnce({ ok: true, json: async () => pack2 } as Response)

    const packs = await listPacks()
    expect(packs).toHaveLength(2)
    expect(packs[0]).toEqual(pack1)
    expect(packs[1]).toEqual(pack2)
  })

  it('should silently skip packs that fail to load', async () => {
    const pack1 = makePack({ id: 'pack-1' })

    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ packs: ['pack-1', 'broken'] }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => pack1 } as Response)
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Error' } as Response)

    const packs = await listPacks()
    expect(packs).toHaveLength(1)
    expect(packs[0].id).toBe('pack-1')
  })
})

// ── installPack ───────────────────────────────────────────────────────────────

describe('installPack', () => {
  it('should add all words when storage is empty', async () => {
    const pack = makePack()
    const storage = makeStorageMock([])

    const result = await installPack(pack, 'pair-1', storage)

    expect(result.added).toBe(2)
    expect(result.skipped).toBe(0)
    expect(storage.saveWords).toHaveBeenCalledOnce()

    const saved = storage.saveWords.mock.calls[0][0] as Word[]
    expect(saved).toHaveLength(2)
  })

  it('should set isFromPack to true on all installed words', async () => {
    const pack = makePack()
    const storage = makeStorageMock([])

    await installPack(pack, 'pair-1', storage)

    const saved = storage.saveWords.mock.calls[0][0] as Word[]
    expect(saved.every((w) => w.isFromPack)).toBe(true)
  })

  it('should add the "starter-pack" tag to all installed words', async () => {
    const pack = makePack()
    const storage = makeStorageMock([])

    await installPack(pack, 'pair-1', storage)

    const saved = storage.saveWords.mock.calls[0][0] as Word[]
    expect(saved.every((w) => w.tags.includes('starter-pack'))).toBe(true)
  })

  it('should preserve the original tags alongside "starter-pack"', async () => {
    const pack = makePack({
      words: [{ source: 'ūdens', target: 'water', tags: ['food-drink', 'B1'] }],
    })
    const storage = makeStorageMock([])

    await installPack(pack, 'pair-1', storage)

    const saved = storage.saveWords.mock.calls[0][0] as Word[]
    expect(saved[0].tags).toContain('food-drink')
    expect(saved[0].tags).toContain('B1')
    expect(saved[0].tags).toContain('starter-pack')
  })

  it('should skip words that already exist (case-insensitive match)', async () => {
    const existingWord = makeWord({ source: 'Ūdens', target: 'Water' })
    const pack = makePack({
      words: [
        { source: 'ūdens', target: 'water', tags: ['B1'] }, // duplicate
        { source: 'maize', target: 'bread', tags: ['B1'] }, // new
      ],
    })
    const storage = makeStorageMock([existingWord])

    const result = await installPack(pack, 'pair-1', storage)

    expect(result.added).toBe(1)
    expect(result.skipped).toBe(1)

    const saved = storage.saveWords.mock.calls[0][0] as Word[]
    expect(saved).toHaveLength(1)
    expect(saved[0].source).toBe('maize')
  })

  it('should return added:0 skipped:N when all words are duplicates', async () => {
    const existingWords = [
      makeWord({ id: 'w1', source: 'ūdens', target: 'water' }),
      makeWord({ id: 'w2', source: 'maize', target: 'bread' }),
    ]
    const pack = makePack()
    const storage = makeStorageMock(existingWords)

    const result = await installPack(pack, 'pair-1', storage)

    expect(result.added).toBe(0)
    expect(result.skipped).toBe(2)
    expect(storage.saveWords).not.toHaveBeenCalled()
  })

  it('should not call saveWords when there are no new words', async () => {
    const existingWords = [
      makeWord({ id: 'w1', source: 'ūdens', target: 'water' }),
      makeWord({ id: 'w2', source: 'maize', target: 'bread' }),
    ]
    const pack = makePack()
    const storage = makeStorageMock(existingWords)

    await installPack(pack, 'pair-1', storage)

    expect(storage.saveWords).not.toHaveBeenCalled()
  })

  it('should assign the correct pairId to all installed words', async () => {
    const pack = makePack()
    const storage = makeStorageMock([])

    await installPack(pack, 'my-pair-id', storage)

    const saved = storage.saveWords.mock.calls[0][0] as Word[]
    expect(saved.every((w) => w.pairId === 'my-pair-id')).toBe(true)
  })

  it('should handle intra-pack duplicates (same word twice in the pack)', async () => {
    const pack = makePack({
      words: [
        { source: 'ūdens', target: 'water', tags: ['B1'] },
        { source: 'ūdens', target: 'water', tags: ['B1'] }, // duplicate entry
      ],
    })
    const storage = makeStorageMock([])

    const result = await installPack(pack, 'pair-1', storage)

    expect(result.added).toBe(1)
    expect(result.skipped).toBe(1)
  })

  it('should not modify existing words in storage', async () => {
    const existingWord = makeWord()
    const pack = makePack({
      words: [{ source: 'maize', target: 'bread', tags: ['B1'] }],
    })
    const storage = makeStorageMock([existingWord])

    await installPack(pack, 'pair-1', storage)

    const saved = storage.saveWords.mock.calls[0][0] as Word[]
    const savedIds = saved.map((w) => w.id)
    expect(savedIds).not.toContain(existingWord.id)
  })
})
