import * as Sentry from '@sentry/react'
import type { Breadcrumb } from '@sentry/core'

/**
 * Initialises Sentry error tracking.
 *
 * Sentry is optional — if VITE_SENTRY_DSN is not set (local dev, forks without
 * the secret), this function returns early and the app works identically.
 *
 * Call this before React renders so that initialisation errors are also captured.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

  // Skip initialisation if no DSN provided (local dev or secret not configured).
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE as string,
    // Only send errors in production builds — keeps staging/preview clean.
    enabled: import.meta.env.PROD as boolean,
    // Capture 100% of errors, 10% of performance transactions.
    sampleRate: 1.0,
    tracesSampleRate: 0.1,
    // Suppress noisy errors caused by browser extensions or transient network issues.
    ignoreErrors: [
      /extensions\//,
      /^chrome-extension:\/\//,
      'Network request failed',
      'Failed to fetch',
      'Load failed',
    ],
    beforeSend(event) {
      // The app has no user accounts, but strip breadcrumb data that could
      // accidentally include form values or localStorage contents.
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(
          (crumb: Breadcrumb): Breadcrumb => ({
            ...crumb,
            // Retain only url and method from XHR/fetch breadcrumb payloads —
            // strip any response bodies or other potentially sensitive fields.
            data: crumb.data
              ? {
                  url: crumb.data.url as string | undefined,
                  method: crumb.data.method as string | undefined,
                }
              : undefined,
          }),
        )
      }
      return event
    },
  })
}

// Re-export the Sentry namespace so callers do not need a direct dependency on
// @sentry/react — they import from here and get the ErrorBoundary etc.
export { Sentry }
