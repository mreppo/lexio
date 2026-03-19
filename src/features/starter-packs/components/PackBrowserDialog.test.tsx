import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PackBrowserDialog } from './PackBrowserDialog'
import { createMockStarterPack } from '@/test/fixtures'
import { createMockStorage } from '@/test/mockStorage'
import { renderWithStorage } from '@/test/renderWithStorage'
import * as starterPacksService from '@/services/starterPacks'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_PACK = createMockStarterPack({
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
})

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
    renderWithStorage(<PackBrowserDialog {...DEFAULT_PROPS} open={false} />, createMockStorage())
    expect(screen.queryByText('Browse starter packs')).not.toBeInTheDocument()
  })

  it('should render dialog title when open is true', async () => {
    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([MOCK_PACK])
    renderWithStorage(<PackBrowserDialog {...DEFAULT_PROPS} />, createMockStorage())
    await waitFor(() => {
      expect(screen.getByText('Browse starter packs')).toBeInTheDocument()
    })
  })

  it('should show loading indicator while packs are loading', () => {
    // Never resolves, so loading stays true
    vi.spyOn(starterPacksService, 'listPacks').mockReturnValue(new Promise(() => {}))
    renderWithStorage(<PackBrowserDialog {...DEFAULT_PROPS} />, createMockStorage())
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should show "No starter packs available" when list is empty', async () => {
    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([])
    renderWithStorage(<PackBrowserDialog {...DEFAULT_PROPS} />, createMockStorage())
    await waitFor(() => {
      expect(screen.getByText(/No starter packs available/i)).toBeInTheDocument()
    })
  })

  it('should display pack name and description after load', async () => {
    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([MOCK_PACK])
    renderWithStorage(<PackBrowserDialog {...DEFAULT_PROPS} />, createMockStorage())
    await waitFor(() => {
      expect(screen.getByText('English-Latvian B1-B2')).toBeInTheDocument()
      expect(
        screen.getByText('Common English-Latvian vocabulary at B1-B2 level'),
      ).toBeInTheDocument()
    })
  })

  it('should show error message when listPacks fails', async () => {
    vi.spyOn(starterPacksService, 'listPacks').mockRejectedValue(new Error('Network error'))
    renderWithStorage(<PackBrowserDialog {...DEFAULT_PROPS} />, createMockStorage())
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should call onClose when Close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([MOCK_PACK])
    renderWithStorage(
      <PackBrowserDialog {...DEFAULT_PROPS} onClose={onClose} />,
      createMockStorage(),
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

    renderWithStorage(
      <PackBrowserDialog {...DEFAULT_PROPS} onInstalled={onInstalled} onClose={onClose} />,
      createMockStorage(),
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

    renderWithStorage(<PackBrowserDialog {...DEFAULT_PROPS} />, createMockStorage())

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

    renderWithStorage(
      <PackBrowserDialog {...DEFAULT_PROPS} onClose={onClose} />,
      createMockStorage(),
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
    const onInstalled = vi.fn().mockImplementation(() => {
      callOrder.push('onInstalled')
    })
    const onClose = vi.fn().mockImplementation(() => {
      callOrder.push('onClose')
    })

    vi.spyOn(starterPacksService, 'listPacks').mockResolvedValue([MOCK_PACK])
    vi.spyOn(starterPacksService, 'installPack').mockResolvedValue({ added: 2, skipped: 0 })

    renderWithStorage(
      <PackBrowserDialog {...DEFAULT_PROPS} onInstalled={onInstalled} onClose={onClose} />,
      createMockStorage(),
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

    renderWithStorage(
      <PackBrowserDialog {...DEFAULT_PROPS} onClose={onClose} />,
      createMockStorage(),
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
