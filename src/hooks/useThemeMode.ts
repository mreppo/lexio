import { useState, useEffect, useCallback } from 'react'
import type { ThemePreference } from '@/types'
import type { StorageService } from '@/services/storage/StorageService'
import { resolveThemeMode } from '@/theme'

export interface UseThemeModeResult {
  /** The user's stored preference (light | dark | system). */
  readonly preference: ThemePreference
  /** The resolved concrete mode used to render the theme. */
  readonly mode: 'light' | 'dark'
  /** Update and persist the preference. */
  readonly setPreference: (next: ThemePreference) => Promise<void>
}

/**
 * Manages theme mode preference.
 *
 * - Reads initial preference from UserSettings via StorageService.
 * - 'system' follows the prefers-color-scheme media query and updates live.
 * - Persists changes through StorageService so the choice survives sessions.
 */
export function useThemeMode(storage: StorageService): UseThemeModeResult {
  const [preference, setPreferenceState] = useState<ThemePreference>('dark')
  const [mode, setMode] = useState<'light' | 'dark'>('dark')

  // Load persisted preference on mount.
  useEffect(() => {
    let cancelled = false
    storage.getSettings().then((settings) => {
      if (!cancelled) {
        setPreferenceState(settings.theme)
        setMode(resolveThemeMode(settings.theme))
      }
    })
    return () => {
      cancelled = true
    }
  }, [storage])

  // When preference is 'system', listen for OS-level colour scheme changes.
  useEffect(() => {
    if (preference !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      setMode(mediaQuery.matches ? 'dark' : 'light')
    }

    // Use addEventListener when available (modern browsers), fall back to addListener.
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [preference])

  const setPreference = useCallback(
    async (next: ThemePreference): Promise<void> => {
      const settings = await storage.getSettings()
      await storage.saveSettings({ ...settings, theme: next })
      setPreferenceState(next)
      setMode(resolveThemeMode(next))
    },
    [storage],
  )

  return { preference, mode, setPreference }
}
