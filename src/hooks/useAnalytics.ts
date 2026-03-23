/**
 * useAnalytics - tracks hash-route changes as pageviews in GoatCounter.
 *
 * Lexio uses HashRouter, so GoatCounter's automatic SPA pageview detection
 * (which only works with the History API) does not fire on route changes.
 * This hook listens for hashchange events and manually records each navigation.
 *
 * Mount this hook once at the application root (App.tsx). It is a side-effect
 * only hook and returns nothing.
 */

import { useEffect } from 'react'
import { analytics } from '@/services/analytics'

/**
 * Converts a hash fragment to the clean path sent to GoatCounter.
 * Examples:
 *   '#/'       → '/'
 *   '#/app'    → '/app'
 *   ''         → '/'  (initial load with no hash)
 */
function hashToPath(hash: string): string {
  const stripped = hash.replace(/^#/, '')
  return stripped === '' ? '/' : stripped
}

/**
 * Mounts once and tracks every hash-route change as a GoatCounter pageview.
 * Also records the initial pageview on first render.
 */
export function useAnalytics(): void {
  useEffect(() => {
    // Record the initial pageview for the current route.
    analytics.trackPageview(hashToPath(window.location.hash))

    function handleHashChange(): void {
      analytics.trackPageview(hashToPath(window.location.hash))
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])
}
