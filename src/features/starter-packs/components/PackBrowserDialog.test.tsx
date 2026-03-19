import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { PackBrowserDialog } from './PackBrowserDialog'
import { StorageContext } from '@/hooks/useStorage'
import type { StorageService } from '@/services/storage'
import type { StarterPack } from '@/types'
import * as starterPacksService from '@/services/starterPacks'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_PACK: StarterPack = {
  id: 'en-lv-b1b2',
  name: 'English-Latvian B1-B2',
  description: 'Common English-Latvian vocabulary at B1-B2 level',
  level: 'B1-B2',
  sourceCode: 'en',
  targetCode: 'lv',
  words: [
    { source: 'house', target: 'māja', tags: [] },
    { source: 'cat', target: 'kaķis', tags: [] },
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStorage(): StorageService {
  return {
    getLanguagePairs: vi.fn().mockResolvedValue([]),
    getLanguagePair: vi.fn().mockResolvedValue(null),
    saveLanguagePair: vi.fn().mockResolvedValue(undefined),
    deleteLanguagePair: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue(null),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    getWords: vi.fn().mockResolvedValue([]),
    getWord: vi.fn().mockResolvedValue(null),
    saveWord: vi.fn().mockResolvedValue(undefined),
    saveWords: vi.fn().mockResolvedValue(undefined),
    deleteWord: vi.fn().mockResolvedValue(undefined),
    getWordProgress: vi.fn().mockResolvedValue(null),
    getAllProgress: vi.fn().mockResolvedValue([]),
    saveWordProgress: vi.fn().mockResolvedValue(undefined),
    getDailyStats: vi.fn().mockResolvedValue(null),
    getDailyStatsRange: vi.fn().mockResolvedValue([]),
    saveDailyStats: vi.fn().mockResolvedValue(undefined),
    getRecentDailyStats: vi.fn().mockResolvedValue([]),
    exportAll: vi.fn().mockResolvedValue('{}'),
    importAll: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
  } as StorageService
}

function makeWrapper(storage: StorageService) {
  return ({ children }: { children: ReactNode }) =>
    createElement(StorageContext.Provider, { value: storage }, children)
}

const DEFAULT_PROPS = {
  open: true,
  pairId: 'pair-1',
  pairSourceCode: 'en',
  pairTargetCode: 'lv',
  onClose: vi.fn(),
  onInstalled: vi.fn(),
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PackBrowserDialog', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should not render dialog content when open is false', () => {
    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([])
    render(
      <PackBrowserDialog {...DEFAULT_PROPS} open={false} />,
      { wrapper: makeWrapper(makeStorage()) },
    )
    expect(screen.queryByText('Browse starter packs')).not.toBeInTheDocument()
  })

  it('should render dialog title when open is true', async () => {
    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([MOCK_PACK])
    render(
      <PackBrowserDialog {...DEFAULT_PROPS} />,
      { wrapper: makeWrapper(makeStorage()) },
    )
    await waitFor(() => {
      expect(screen.getByText('Browse starter packs')).toBeInTheDocument()
    })
  })

  it('should show loading indicator while packs are loading', () => {
    // Never resolves, so loading stays true
    vi.spyOn(starterPacksService, 'listPacks').mockReturnValue(new Promise(() => {}))
    render(
      <PackBrowserDialog {...DEFAULT_PROPS} />,
      { wrapper: makeWrapper(makeStorage()) },
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should show "No starter packs available" when list is empty', async () => {
    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([])
    render(
      <PackBrowserDialog {...DEFAULT_PROPS} />,
      { wrapper: makeWrapper(makeStorage()) },
    )
    await waitFor(() => {
      expect(screen.getByText(/No starter packs available/i)).toBeInTheDocument()
    })
  })

  it('should display pack name and description after load', async () => {
    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([MOCK_PACK])
    render(
      <PackBrowserDialog {...DEFAULT_PROPS} />,
      { wrapper: makeWrapper(makeStorage()) },
    )
    await waitFor(() => {
      expect(screen.getByText('English-Latvian B1-B2')).toBeInTheDocument()
      expect(screen.getByText('Common English-Latvian vocabulary at B1-B2 level')).toBeInTheDocument()
    })
  })

  it('should show error message when listPacks fails', async () => {
    vi.spyOn(starterPacksService, 'listPacks').mockRejectedValue(new Error('Network error'))
    render(
      <PackBrowserDialog {...DEFAULT_PROPS} />,
      { wrapper: makeWrapper(makeStorage()) },
    )
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should call onClose when Close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([MOCK_PACK])
    render(
      <PackBrowserDialog {...DEFAULT_PROPS} onClose={onClose} />,
      { wrapper: makeWrapper(makeStorage()) },
    )
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Close$/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /^Close$/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onInstalled immediately after successful install', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    const onInstalled = vi.fn()
    const onClose = vi.fn()
    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([MOCK_PACK])
    vi.spyOn(starterPacksService, 'installPack').mockResolvedValue({ added: 2, skipped: 0 })

    render(
      <PackBrowserDialog {...DEFAULT_PROPS} onInstalled={onInstalled} onClose={onClose} />,
      { wrapper: makeWrapper(makeStorage()) },
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Install/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Install/i }))

    await waitFor(() => {
      expect(onInstalled).toHaveBeenCalledTimes(1)
    })
    // Dialog should NOT be closed yet (still within 1500ms window)
    expect(onClose).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('should show success alert after install with word counts', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([MOCK_PACK])
    vi.spyOn(starterPacksService, 'installPack').mockResolvedValue({ added: 2, skipped: 1 })

    render(
      <PackBrowserDialog {...DEFAULT_PROPS} />,
      { wrapper: makeWrapper(makeStorage()) },
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Install/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Install/i }))

    await waitFor(() => {
      expect(screen.getByText(/Added 2 words/i)).toBeInTheDocument()
      expect(screen.getByText(/skipped 1 duplicates/i)).toBeInTheDocument()
    })
    vi.useRealTimers()
  })

  it('should auto-close dialog after 1500ms following successful install', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    const onClose = vi.fn()
    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([MOCK_PACK])
    vi.spyOn(starterPacksService, 'installPack').mockResolvedValue({ added: 2, skipped: 0 })

    render(
      <PackBrowserDialog {...DEFAULT_PROPS} onClose={onClose} />,
      { wrapper: makeWrapper(makeStorage()) },
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Install/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Install/i }))

    // Wait for install to complete and success alert to show
    await waitFor(() => {
      expect(screen.getByText(/Added 2 words/i)).toBeInTheDocument()
    })

    // Before 1500ms: dialog should still be open
    expect(onClose).not.toHaveBeenCalled()

    // Advance time past the delay
    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(onClose).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('should call onInstalled before onClose', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    const callOrder: string[] = []
    const onInstalled = vi.fn().mockImplementation(() => { callOrder.push('onInstalled') })
    const onClose = vi.fn().mockImplementation(() => { callOrder.push('onClose') })

    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([MOCK_PACK])
    vi.spyOn(starterPacksService, 'installPack').mockResolvedValue({ added: 2, skipped: 0 })

    render(
      <PackBrowserDialog {...DEFAULT_PROPS} onInstalled={onInstalled} onClose={onClose} />,
      { wrapper: makeWrapper(makeStorage()) },
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Install/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Install/i }))

    await waitFor(() => {
      expect(onInstalled).toHaveBeenCalledTimes(1)
    })

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(callOrder).toEqual(['onInstalled', 'onClose'])
    vi.useRealTimers()
  })

  it('should not auto-close on install error', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    const onClose = vi.fn()
    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([MOCK_PACK])
    vi.spyOn(starterPacksService, 'installPack').mockRejectedValue(new Error('Install failed'))

    render(
      <PackBrowserDialog {...DEFAULT_PROPS} onClose={onClose} />,
      { wrapper: makeWrapper(makeStorage()) },
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Install/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Install/i }))

    await waitFor(() => {
      expect(screen.getByText('Install failed')).toBeInTheDocument()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // onClose should NOT have been called by auto-close on error
    expect(onClose).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
