import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Word } from '@/types'
import { listPackIds, loadPack, listPacks, installPack, packMatchesPair } from './starterPacks'
import { createMockStarterPack, createMockWord } from '@/test/fixtures'
import { createMockStorage } from '@/test/mockStorage'

// ── helpers ──────────────────────────────────────────────────────────────────

const makePack = createMockStarterPack

function makeWord(overrides: Partial<Word> = {}): Word {
  return createMockWord({
    id: 'w1',
    pairId: 'pair-1',
    source: 'house',
    target: 'māja',
    tags: ['B1', 'starter-pack'],
    createdAt: 1000,
    isFromPack: true,
    ...overrides,
  })
}

function makeStorageMock(existingWords: Word[] = []) {
  return createMockStorage({
    getWords: vi.fn().mockResolvedValue(existingWords),
    saveWords: vi.fn().mockResolvedValue(undefined),
  })
}

// ── packMatchesPair ───────────────────────────────────────────────────────────

describe('packMatchesPair', () => {
  it('should return "same" when pack codes match the pair exactly', () => {
    const pack = makePack({ sourceCode: 'lv', targetCode: 'en' })
    expect(packMatchesPair(pack, 'lv', 'en')).toBe('same')
  })

  it('should return "reversed" when pack codes are the mirror of the pair', () => {
    const pack = makePack({ sourceCode: 'lv', targetCode: 'en' })
    expect(packMatchesPair(pack, 'en', 'lv')).toBe('reversed')
  })

  it('should return "none" for unrelated language codes', () => {
    const pack = makePack({ sourceCode: 'lv', targetCode: 'en' })
    expect(packMatchesPair(pack, 'ru', 'de')).toBe('none')
  })

  it('should return "none" when only one code matches', () => {
    const pack = makePack({ sourceCode: 'lv', targetCode: 'en' })
    expect(packMatchesPair(pack, 'lv', 'ru')).toBe('none')
  })

  it('should return "same" for ru-en pack with ru-en pair', () => {
    const pack = makePack({ sourceCode: 'ru', targetCode: 'en' })
    expect(packMatchesPair(pack, 'ru', 'en')).toBe('same')
  })

  it('should return "reversed" for ru-en pack with en-ru pair', () => {
    const pack = makePack({ sourceCode: 'ru', targetCode: 'en' })
    expect(packMatchesPair(pack, 'en', 'ru')).toBe('reversed')
  })

  it('should return "same" for ru-lv pack with ru-lv pair', () => {
    const pack = makePack({ sourceCode: 'ru', targetCode: 'lv' })
    expect(packMatchesPair(pack, 'ru', 'lv')).toBe('same')
  })

  it('should return "reversed" for ru-lv pack with lv-ru pair', () => {
    const pack = makePack({ sourceCode: 'ru', targetCode: 'lv' })
    expect(packMatchesPair(pack, 'lv', 'ru')).toBe('reversed')
  })
})

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
    expect(fetch).toHaveBeenCalledWith('/lexio/starter-packs/test-pack.json')
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
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ packs: ['pack-1', 'pack-2'] }),
      } as Response)
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
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ packs: ['pack-1', 'broken'] }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => pack1 } as Response)
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Error' } as Response)

    const packs = await listPacks()
    expect(packs).toHaveLength(1)
    expect(packs[0].id).toBe('pack-1')
  })
})

// ── installPack ───────────────────────────────────────────────────────────────

describe('installPack', () => {
  // ── same direction (pack codes == pair codes) ──────────────────────────────

  it('should add all words when storage is empty', async () => {
    const pack = makePack({
      sourceCode: 'lv',
      targetCode: 'en',
      words: [
        { source: 'ūdens', target: 'water', tags: ['B1'] },
        { source: 'maize', target: 'bread', tags: ['B1'] },
      ],
    })
    const storage = makeStorageMock([])

    const result = await installPack(pack, 'pair-1', 'lv', 'en', storage)

    expect(result.added).toBe(2)
    expect(result.skipped).toBe(0)
    expect(storage.saveWords).toHaveBeenCalledOnce()

    const saved = vi.mocked(storage.saveWords).mock.calls[0][0] as Word[]
    expect(saved).toHaveLength(2)
  })

  it('should set isFromPack to true on all installed words', async () => {
    const pack = makePack({
      sourceCode: 'lv',
      targetCode: 'en',
      words: [
        { source: 'ūdens', target: 'water', tags: ['B1'] },
        { source: 'maize', target: 'bread', tags: ['B1'] },
      ],
    })
    const storage = makeStorageMock([])

    await installPack(pack, 'pair-1', 'lv', 'en', storage)

    const saved = vi.mocked(storage.saveWords).mock.calls[0][0] as Word[]
    expect(saved.every((w) => w.isFromPack)).toBe(true)
  })

  it('should add the "starter-pack" tag to all installed words', async () => {
    const pack = makePack({
      sourceCode: 'lv',
      targetCode: 'en',
      words: [
        { source: 'ūdens', target: 'water', tags: ['B1'] },
        { source: 'maize', target: 'bread', tags: ['B1'] },
      ],
    })
    const storage = makeStorageMock([])

    await installPack(pack, 'pair-1', 'lv', 'en', storage)

    const saved = vi.mocked(storage.saveWords).mock.calls[0][0] as Word[]
    expect(saved.every((w) => w.tags.includes('starter-pack'))).toBe(true)
  })

  it('should preserve the original tags alongside "starter-pack"', async () => {
    const pack = makePack({
      sourceCode: 'lv',
      targetCode: 'en',
      words: [{ source: 'ūdens', target: 'water', tags: ['food-drink', 'B1'] }],
    })
    const storage = makeStorageMock([])

    await installPack(pack, 'pair-1', 'lv', 'en', storage)

    const saved = vi.mocked(storage.saveWords).mock.calls[0][0] as Word[]
    expect(saved[0].tags).toContain('food-drink')
    expect(saved[0].tags).toContain('B1')
    expect(saved[0].tags).toContain('starter-pack')
  })

  it('should skip words that already exist (case-insensitive match)', async () => {
    const existingWord = makeWord({ source: 'Ūdens', target: 'Water' })
    const pack = makePack({
      sourceCode: 'lv',
      targetCode: 'en',
      words: [
        { source: 'ūdens', target: 'water', tags: ['B1'] }, // duplicate
        { source: 'maize', target: 'bread', tags: ['B1'] }, // new
      ],
    })
    const storage = makeStorageMock([existingWord])

    const result = await installPack(pack, 'pair-1', 'lv', 'en', storage)

    expect(result.added).toBe(1)
    expect(result.skipped).toBe(1)

    const saved = vi.mocked(storage.saveWords).mock.calls[0][0] as Word[]
    expect(saved).toHaveLength(1)
    expect(saved[0].source).toBe('maize')
  })

  it('should return added:0 skipped:N when all words are duplicates', async () => {
    const existingWords = [
      makeWord({ id: 'w1', source: 'ūdens', target: 'water' }),
      makeWord({ id: 'w2', source: 'maize', target: 'bread' }),
    ]
    const pack = makePack({
      sourceCode: 'lv',
      targetCode: 'en',
      words: [
        { source: 'ūdens', target: 'water', tags: ['B1'] },
        { source: 'maize', target: 'bread', tags: ['B1'] },
      ],
    })
    const storage = makeStorageMock(existingWords)

    const result = await installPack(pack, 'pair-1', 'lv', 'en', storage)

    expect(result.added).toBe(0)
    expect(result.skipped).toBe(2)
    expect(storage.saveWords).not.toHaveBeenCalled()
  })

  it('should not call saveWords when there are no new words', async () => {
    const existingWords = [
      makeWord({ id: 'w1', source: 'ūdens', target: 'water' }),
      makeWord({ id: 'w2', source: 'maize', target: 'bread' }),
    ]
    const pack = makePack({
      sourceCode: 'lv',
      targetCode: 'en',
      words: [
        { source: 'ūdens', target: 'water', tags: ['B1'] },
        { source: 'maize', target: 'bread', tags: ['B1'] },
      ],
    })
    const storage = makeStorageMock(existingWords)

    await installPack(pack, 'pair-1', 'lv', 'en', storage)

    expect(storage.saveWords).not.toHaveBeenCalled()
  })

  it('should assign the correct pairId to all installed words', async () => {
    const pack = makePack({
      sourceCode: 'lv',
      targetCode: 'en',
      words: [
        { source: 'ūdens', target: 'water', tags: ['B1'] },
        { source: 'maize', target: 'bread', tags: ['B1'] },
      ],
    })
    const storage = makeStorageMock([])

    await installPack(pack, 'my-pair-id', 'lv', 'en', storage)

    const saved = vi.mocked(storage.saveWords).mock.calls[0][0] as Word[]
    expect(saved.every((w) => w.pairId === 'my-pair-id')).toBe(true)
  })

  it('should handle intra-pack duplicates (same word twice in the pack)', async () => {
    const pack = makePack({
      sourceCode: 'lv',
      targetCode: 'en',
      words: [
        { source: 'ūdens', target: 'water', tags: ['B1'] },
        { source: 'ūdens', target: 'water', tags: ['B1'] }, // duplicate entry
      ],
    })
    const storage = makeStorageMock([])

    const result = await installPack(pack, 'pair-1', 'lv', 'en', storage)

    expect(result.added).toBe(1)
    expect(result.skipped).toBe(1)
  })

  it('should not modify existing words in storage', async () => {
    const existingWord = makeWord()
    const pack = makePack({
      sourceCode: 'lv',
      targetCode: 'en',
      words: [{ source: 'maize', target: 'bread', tags: ['B1'] }],
    })
    const storage = makeStorageMock([existingWord])

    await installPack(pack, 'pair-1', 'lv', 'en', storage)

    const saved = vi.mocked(storage.saveWords).mock.calls[0][0] as Word[]
    const savedIds = saved.map((w) => w.id)
    expect(savedIds).not.toContain(existingWord.id)
  })

  // ── reversed direction (pack codes are swapped relative to pair) ───────────

  it('should swap source and target when installing in reversed direction', async () => {
    // Pack is lv→en, but pair is en→lv (reversed)
    const pack = makePack({
      sourceCode: 'lv',
      targetCode: 'en',
      words: [
        { source: 'ūdens', target: 'water', tags: ['B1'] },
        { source: 'maize', target: 'bread', tags: ['B1'] },
      ],
    })
    const storage = makeStorageMock([])

    const result = await installPack(pack, 'pair-1', 'en', 'lv', storage)

    expect(result.added).toBe(2)
    const saved = vi.mocked(storage.saveWords).mock.calls[0][0] as Word[]
    expect(saved[0].source).toBe('water')
    expect(saved[0].target).toBe('ūdens')
    expect(saved[1].source).toBe('bread')
    expect(saved[1].target).toBe('maize')
  })

  it('should detect duplicates on swapped values when installing reversed', async () => {
    // Existing word already has "water" as source and "ūdens" as target (en-lv direction).
    const existingWord = makeWord({ source: 'water', target: 'ūdens' })
    const pack = makePack({
      sourceCode: 'lv',
      targetCode: 'en',
      words: [
        { source: 'ūdens', target: 'water', tags: ['B1'] }, // becomes water|ūdens after swap -> duplicate
        { source: 'maize', target: 'bread', tags: ['B1'] }, // becomes bread|maize -> new
      ],
    })
    const storage = makeStorageMock([existingWord])

    const result = await installPack(pack, 'pair-1', 'en', 'lv', storage)

    expect(result.added).toBe(1)
    expect(result.skipped).toBe(1)

    const saved = vi.mocked(storage.saveWords).mock.calls[0][0] as Word[]
    expect(saved[0].source).toBe('bread')
    expect(saved[0].target).toBe('maize')
  })

  it('should preserve tags when installing in reversed direction', async () => {
    const pack = makePack({
      sourceCode: 'lv',
      targetCode: 'en',
      words: [{ source: 'ūdens', target: 'water', tags: ['food-drink', 'B1'] }],
    })
    const storage = makeStorageMock([])

    await installPack(pack, 'pair-1', 'en', 'lv', storage)

    const saved = vi.mocked(storage.saveWords).mock.calls[0][0] as Word[]
    expect(saved[0].tags).toContain('food-drink')
    expect(saved[0].tags).toContain('B1')
    expect(saved[0].tags).toContain('starter-pack')
  })

  it('should set isFromPack to true on reversed-direction installs', async () => {
    const pack = makePack({
      sourceCode: 'lv',
      targetCode: 'en',
      words: [
        { source: 'ūdens', target: 'water', tags: ['B1'] },
        { source: 'maize', target: 'bread', tags: ['B1'] },
      ],
    })
    const storage = makeStorageMock([])

    await installPack(pack, 'pair-1', 'en', 'lv', storage)

    const saved = vi.mocked(storage.saveWords).mock.calls[0][0] as Word[]
    expect(saved.every((w) => w.isFromPack)).toBe(true)
  })

  // ── incompatible pack ──────────────────────────────────────────────────────

  it('should throw when the pack is not compatible with the pair', async () => {
    const pack = makePack({ sourceCode: 'lv', targetCode: 'en' })
    const storage = makeStorageMock([])

    await expect(installPack(pack, 'pair-1', 'ru', 'de', storage)).rejects.toThrow(
      'not compatible with pair ru-de',
    )
  })
})
