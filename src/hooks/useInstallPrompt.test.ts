import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { StorageService } from '@/services/storage'
import { detectInstallPlatform } from './useInstallPrompt'

// ---------------------------------------------------------------------------
// Mock StorageContext so the hook receives a controllable StorageService
// ---------------------------------------------------------------------------
const mockStorage: Pick<StorageService, 'getItem' | 'setItem' | 'removeItem'> & StorageService = {
  getItem: vi.fn().mockResolvedValue(null),
  setItem: vi.fn().mockResolvedValue(undefined),
  removeItem: vi.fn().mockResolvedValue(undefined),
  // Unused StorageService methods — satisfy the interface
  getLanguagePairs: vi.fn(),
  getLanguagePair: vi.fn(),
  saveLanguagePair: vi.fn(),
  deleteLanguagePair: vi.fn(),
  getWords: vi.fn(),
  getWord: vi.fn(),
  saveWord: vi.fn(),
  saveWords: vi.fn(),
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

vi.mock('./useStorage', () => ({
  useStorage: () => mockStorage,
}))

// ---------------------------------------------------------------------------
// Helpers to stub window.matchMedia for standalone-mode detection
// ---------------------------------------------------------------------------
function stubMatchMedia(standalone: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: standalone && query.includes('standalone'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('detectInstallPlatform', () => {
  afterEach(() => {
    // Reset navigator.standalone spoof
    Object.defineProperty(navigator, 'standalone', {
      writable: true,
      value: undefined,
    })
    stubMatchMedia(false)
  })

  it('returns "standalone" when display-mode: standalone media query matches', () => {
    stubMatchMedia(true)
    expect(detectInstallPlatform()).toBe('standalone')
  })

  it('returns "standalone" when navigator.standalone is true (iOS installed)', () => {
    stubMatchMedia(false)
    Object.defineProperty(navigator, 'standalone', { writable: true, value: true })
    expect(detectInstallPlatform()).toBe('standalone')
  })

  it('returns "ios-safari" for iPhone Safari user agent', () => {
    stubMatchMedia(false)
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    })
    Object.defineProperty(navigator, 'maxTouchPoints', { writable: true, value: 5 })
    expect(detectInstallPlatform()).toBe('ios-safari')
  })

  it('returns "android-chrome" for Android Chrome user agent', () => {
    stubMatchMedia(false)
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    })
    Object.defineProperty(navigator, 'maxTouchPoints', { writable: true, value: 5 })
    expect(detectInstallPlatform()).toBe('android-chrome')
  })

  it('returns "desktop-chromium" for desktop Chrome user agent', () => {
    stubMatchMedia(false)
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })
    Object.defineProperty(navigator, 'maxTouchPoints', { writable: true, value: 0 })
    expect(detectInstallPlatform()).toBe('desktop-chromium')
  })

  it('returns "other" for Firefox user agent', () => {
    stubMatchMedia(false)
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
    })
    Object.defineProperty(navigator, 'maxTouchPoints', { writable: true, value: 0 })
    expect(detectInstallPlatform()).toBe('other')
  })
})

describe('useInstallPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubMatchMedia(false)
    // Default: no stored data (fresh install, no previous visits)
    vi.mocked(mockStorage.getItem).mockResolvedValue(null)
    vi.mocked(mockStorage.setItem).mockResolvedValue(undefined)
  })

  it('should not show banner on first visit (engagement threshold not met)', async () => {
    // Import here to pick up mocks
    const { useInstallPrompt } = await import('./useInstallPrompt')
    const { result } = renderHook(() => useInstallPrompt())

    await waitFor(() => {
      // After first visit (count = 1), threshold of 2 not yet met
      expect(result.current.showBanner).toBe(false)
    })
  })

  it('should show banner when visit count reaches threshold', async () => {
    // Simulate 1 already recorded visit (so incrementing makes it 2 = threshold)
    vi.mocked(mockStorage.getItem).mockImplementation(async (key: string) => {
      if (key === 'lexio:meta:install-banner:visit-count') return '1'
      return null
    })

    const { useInstallPrompt } = await import('./useInstallPrompt')
    const { result } = renderHook(() => useInstallPrompt())

    await waitFor(() => {
      expect(result.current.showBanner).toBe(true)
    })
  })

  it('should not show banner when dismissed within 7-day cooldown', async () => {
    // Simulate 1 already recorded visit (so incrementing makes it 2 = threshold)
    const recentDismissal = String(Date.now() - 1000) // dismissed 1 second ago
    vi.mocked(mockStorage.getItem).mockImplementation(async (key: string) => {
      if (key === 'lexio:meta:install-banner:visit-count') return '1'
      if (key === 'lexio:meta:install-banner:dismissed-at') return recentDismissal
      return null
    })

    const { useInstallPrompt } = await import('./useInstallPrompt')
    const { result } = renderHook(() => useInstallPrompt())

    await waitFor(() => {
      // Engagement met but dismissed recently — should NOT show
      expect(result.current.showBanner).toBe(false)
    })
  })

  it('should show banner after 7-day dismissal cooldown has passed', async () => {
    const oldDismissal = String(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
    vi.mocked(mockStorage.getItem).mockImplementation(async (key: string) => {
      if (key === 'lexio:meta:install-banner:visit-count') return '1'
      if (key === 'lexio:meta:install-banner:dismissed-at') return oldDismissal
      return null
    })

    const { useInstallPrompt } = await import('./useInstallPrompt')
    const { result } = renderHook(() => useInstallPrompt())

    await waitFor(() => {
      expect(result.current.showBanner).toBe(true)
    })
  })

  it('should hide banner and store dismissal timestamp when dismissBanner is called', async () => {
    vi.mocked(mockStorage.getItem).mockImplementation(async (key: string) => {
      if (key === 'lexio:meta:install-banner:visit-count') return '1'
      return null
    })

    const { useInstallPrompt } = await import('./useInstallPrompt')
    const { result } = renderHook(() => useInstallPrompt())

    await waitFor(() => {
      expect(result.current.showBanner).toBe(true)
    })

    act(() => {
      result.current.dismissBanner()
    })

    expect(result.current.showBanner).toBe(false)
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'lexio:meta:install-banner:dismissed-at',
      expect.any(String),
    )
  })

  it('should show banner when quiz session threshold is met (>= 5 questions)', async () => {
    // 0 visits but 0 recorded sessions — recordQuizSession will set it to 1
    vi.mocked(mockStorage.getItem).mockImplementation(async (key: string) => {
      if (key === 'lexio:meta:install-banner:quiz-sessions') return '0'
      return null
    })

    const { useInstallPrompt } = await import('./useInstallPrompt')
    const { result } = renderHook(() => useInstallPrompt())

    // Simulate completing a qualifying quiz session
    act(() => {
      result.current.recordQuizSession()
    })

    await waitFor(() => {
      expect(result.current.showBanner).toBe(true)
    })
  })

  it('should not show banner when already in standalone mode', async () => {
    stubMatchMedia(true) // Simulate installed PWA

    // Engagement threshold met
    vi.mocked(mockStorage.getItem).mockImplementation(async (key: string) => {
      if (key === 'lexio:meta:install-banner:visit-count') return '1'
      return null
    })

    const { useInstallPrompt } = await import('./useInstallPrompt')
    const { result } = renderHook(() => useInstallPrompt())

    // Small wait to ensure any async state updates are processed
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(result.current.showBanner).toBe(false)
  })
})
