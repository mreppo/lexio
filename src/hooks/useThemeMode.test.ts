import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThemeMode } from './useThemeMode'
import type { StorageService } from '@/services/storage/StorageService'
import type { UserSettings } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSettings(theme: UserSettings['theme']): UserSettings {
  return {
    activePairId: null,
    quizMode: 'mixed',
    dailyGoal: 20,
    theme,
    typoTolerance: 1,
  }
}

function makeStorage(theme: UserSettings['theme']): StorageService {
  const settings: UserSettings = makeSettings(theme)

  return {
    getSettings: vi.fn().mockResolvedValue({ ...settings }),
    saveSettings: vi.fn().mockImplementation(async (updated: UserSettings) => {
      Object.assign(settings, updated)
    }),
    // Unused methods – cast to satisfy the interface
    getLanguagePairs: vi.fn(),
    saveLanguagePair: vi.fn(),
    deleteLanguagePair: vi.fn(),
    getWords: vi.fn(),
    saveWord: vi.fn(),
    saveWords: vi.fn(),
    deleteWord: vi.fn(),
    getWordProgress: vi.fn(),
    getAllProgress: vi.fn(),
    saveWordProgress: vi.fn(),
    getDailyStats: vi.fn(),
    saveDailyStats: vi.fn(),
    getRecentDailyStats: vi.fn(),
  } as unknown as StorageService
}

// ---------------------------------------------------------------------------
// matchMedia mock
// ---------------------------------------------------------------------------

type MatchMediaListener = () => void

function mockMatchMedia(prefersDark: boolean): MockInstance {
  const listeners: MatchMediaListener[] = []

  const mediaQueryList = {
    matches: prefersDark,
    addEventListener: vi.fn((event: string, cb: MatchMediaListener) => {
      if (event === 'change') listeners.push(cb)
    }),
    removeEventListener: vi.fn(),
  }

  const spy = vi.spyOn(window, 'matchMedia').mockReturnValue(
    mediaQueryList as unknown as MediaQueryList,
  )

  return spy
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useThemeMode', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialise with dark mode when settings.theme is "dark"', async () => {
    mockMatchMedia(false)
    const storage = makeStorage('dark')
    const { result } = renderHook(() => useThemeMode(storage))

    await act(async () => {})

    expect(result.current.preference).toBe('dark')
    expect(result.current.mode).toBe('dark')
  })

  it('should initialise with light mode when settings.theme is "light"', async () => {
    mockMatchMedia(false)
    const storage = makeStorage('light')
    const { result } = renderHook(() => useThemeMode(storage))

    await act(async () => {})

    expect(result.current.preference).toBe('light')
    expect(result.current.mode).toBe('light')
  })

  it('should resolve "system" to "dark" when OS prefers dark', async () => {
    mockMatchMedia(true)
    const storage = makeStorage('system')
    const { result } = renderHook(() => useThemeMode(storage))

    await act(async () => {})

    expect(result.current.preference).toBe('system')
    expect(result.current.mode).toBe('dark')
  })

  it('should resolve "system" to "light" when OS prefers light', async () => {
    mockMatchMedia(false)
    const storage = makeStorage('system')
    const { result } = renderHook(() => useThemeMode(storage))

    await act(async () => {})

    expect(result.current.preference).toBe('system')
    expect(result.current.mode).toBe('light')
  })

  it('should persist the new preference when setPreference is called', async () => {
    mockMatchMedia(false)
    const storage = makeStorage('dark')
    const { result } = renderHook(() => useThemeMode(storage))

    await act(async () => {})
    await act(async () => {
      await result.current.setPreference('light')
    })

    expect(storage.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'light' }),
    )
    expect(result.current.preference).toBe('light')
    expect(result.current.mode).toBe('light')
  })

  it('should update mode to dark when switching to "dark" preference', async () => {
    mockMatchMedia(false)
    const storage = makeStorage('light')
    const { result } = renderHook(() => useThemeMode(storage))

    await act(async () => {})
    await act(async () => {
      await result.current.setPreference('dark')
    })

    expect(result.current.mode).toBe('dark')
  })

  it('should load settings only once on mount', async () => {
    mockMatchMedia(false)
    const storage = makeStorage('dark')
    const { result } = renderHook(() => useThemeMode(storage))

    await act(async () => {})

    // Force a re-render by calling setPreference
    await act(async () => {
      await result.current.setPreference('dark')
    })

    // getSettings called once on mount, once inside setPreference
    expect(storage.getSettings).toHaveBeenCalledTimes(2)
  })
})
