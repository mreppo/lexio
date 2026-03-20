import { useState, useEffect, useCallback } from 'react'
import { registerSW } from 'virtual:pwa-register'

/**
 * State exposed by the useServiceWorker hook.
 */
export interface ServiceWorkerState {
  /** True when a new service worker version is waiting to activate. */
  updateAvailable: boolean
  /** Call this to apply the pending update and reload the page. */
  applyUpdate: () => void
  /** Dismiss the update notification without applying. */
  dismissUpdate: () => void
  /** True while the service worker is being registered (first page load). */
  offlineReady: boolean
}

/**
 * Registers the Vite-generated service worker and exposes update state.
 *
 * Uses the `registerSW` helper from `virtual:pwa-register` which is provided
 * by vite-plugin-pwa.  The plugin is configured with `registerType: 'prompt'`,
 * meaning the new SW will not skip waiting automatically — the user must
 * confirm the update via the notification component.
 */
export function useServiceWorker(): ServiceWorkerState {
  const [offlineReady, setOfflineReady] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  // updateSW is a function provided by registerSW that, when called with
  // `true`, tells the waiting SW to skip waiting and takes over.
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    const sw = registerSW({
      onOfflineReady() {
        setOfflineReady(true)
      },
      onNeedRefresh() {
        setUpdateAvailable(true)
      },
    })
    setUpdateSW(() => sw)
    // registerSW returns a cleanup function — call it on unmount.
    return () => {
      sw(false).catch(() => undefined)
    }
  }, [])

  const applyUpdate = useCallback(() => {
    if (updateSW) {
      void updateSW(true)
    }
  }, [updateSW])

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false)
  }, [])

  return { offlineReady, updateAvailable, applyUpdate, dismissUpdate }
}
