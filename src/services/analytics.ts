/**
 * Analytics service wrapping GoatCounter.
 *
 * GoatCounter is loaded asynchronously via a script tag in index.html.
 * Before the script loads, window.goatcounter is pre-populated by an inline
 * script with only { no_onload: true } — it does NOT yet have a count() method.
 * All calls therefore use optional chaining on both the object AND the method
 * (?.count?.()) to guard against the script not yet being loaded or being
 * blocked by an ad blocker.
 *
 * Analytics are suppressed entirely in development mode to avoid
 * polluting the GoatCounter dashboard with dev traffic.
 */

// ─── GoatCounter type declarations ───────────────────────────────────────────

/** Options accepted by window.goatcounter.count(). */
interface GoatCounterCountOptions {
  /** The path or event name to record. */
  readonly path: string
  /** Human-readable title for the entry. */
  readonly title?: string
  /**
   * When true, the entry is recorded as a custom event rather than a pageview.
   * Events appear under the "Events" tab in the GoatCounter dashboard.
   */
  readonly event?: boolean
}

/** Minimal GoatCounter API surface we rely on. */
interface GoatCounter {
  count?(options: GoatCounterCountOptions): void
  /**
   * When set to true before the script loads, GoatCounter will not
   * automatically record a pageview on initial page load.
   * Required for HashRouter-based SPAs.
   */
  no_onload?: boolean
}

declare global {
  interface Window {
    goatcounter?: GoatCounter
  }
}

// ─── Analytics service ───────────────────────────────────────────────────────

/**
 * Thin wrapper around GoatCounter that centralises all analytics calls.
 *
 * Usage:
 *   analytics.trackPageview('/app')
 *   analytics.trackEvent('demo-start', 'Demo Started')
 */
export const analytics = {
  /**
   * Records a pageview for the given path.
   * The path should not include the hash prefix, e.g. '/' or '/app'.
   */
  trackPageview(path: string): void {
    if (import.meta.env.DEV) return
    // Use ?.count?.() — window.goatcounter is pre-set by the inline script with
    // only no_onload: true; count() is added later when count.js loads async.
    window.goatcounter?.count?.({ path })
  },

  /**
   * Records a custom event.
   * Events appear under the "Events" tab in GoatCounter (separate from pageviews).
   *
   * @param name  - Short event identifier, e.g. 'demo-start'. Used as the path
   *                sent to GoatCounter as `events/<name>`.
   * @param title - Optional human-readable label shown in the dashboard.
   */
  trackEvent(name: string, title?: string): void {
    if (import.meta.env.DEV) return
    // Use ?.count?.() — window.goatcounter is pre-set by the inline script with
    // only no_onload: true; count() is added later when count.js loads async.
    window.goatcounter?.count?.({
      path: `events/${name}`,
      title: title ?? name,
      event: true,
    })
  },
}
