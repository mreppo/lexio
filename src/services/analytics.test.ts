import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ─── Module-level mock for import.meta.env ────────────────────────────────────

// Default: production mode (analytics should fire).
// Individual tests override this via vi.stubEnv.

describe('analytics service', () => {
  // Capture and restore window.goatcounter between tests.
  beforeEach(() => {
    // Reset DEV flag to false (production) before each test.
    vi.stubEnv('DEV', false)
    // Provide a fresh spy-backed goatcounter on the window.
    window.goatcounter = {
      count: vi.fn(),
      no_onload: true,
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    delete window.goatcounter
  })

  // ─── Import analytics after env is set up ─────────────────────────────────
  // We import inline so the module re-evaluates with the stubbed env.

  describe('trackPageview', () => {
    it('should call window.goatcounter.count with the given path', async () => {
      const { analytics } = await import('./analytics')
      analytics.trackPageview('/app')
      expect(window.goatcounter?.count).toHaveBeenCalledOnce()
      expect(window.goatcounter?.count).toHaveBeenCalledWith({ path: '/app' })
    })

    it('should call window.goatcounter.count with / for the landing page', async () => {
      const { analytics } = await import('./analytics')
      analytics.trackPageview('/')
      expect(window.goatcounter?.count).toHaveBeenCalledWith({ path: '/' })
    })

    it('should not throw if window.goatcounter is undefined (ad blocker scenario)', async () => {
      delete window.goatcounter
      const { analytics } = await import('./analytics')
      expect(() => analytics.trackPageview('/')).not.toThrow()
    })

    it('should not call goatcounter in DEV mode', async () => {
      vi.stubEnv('DEV', true)
      const { analytics } = await import('./analytics')
      analytics.trackPageview('/app')
      expect(window.goatcounter?.count).not.toHaveBeenCalled()
    })
  })

  describe('trackEvent', () => {
    it('should call window.goatcounter.count with event path and event flag', async () => {
      const { analytics } = await import('./analytics')
      analytics.trackEvent('demo-start', 'Demo Started')
      expect(window.goatcounter?.count).toHaveBeenCalledOnce()
      expect(window.goatcounter?.count).toHaveBeenCalledWith({
        path: 'events/demo-start',
        title: 'Demo Started',
        event: true,
      })
    })

    it('should use the event name as title when title is omitted', async () => {
      const { analytics } = await import('./analytics')
      analytics.trackEvent('quiz-start')
      expect(window.goatcounter?.count).toHaveBeenCalledWith({
        path: 'events/quiz-start',
        title: 'quiz-start',
        event: true,
      })
    })

    it('should not throw if window.goatcounter is undefined (ad blocker scenario)', async () => {
      delete window.goatcounter
      const { analytics } = await import('./analytics')
      expect(() => analytics.trackEvent('quiz-start')).not.toThrow()
    })

    it('should not call goatcounter in DEV mode', async () => {
      vi.stubEnv('DEV', true)
      const { analytics } = await import('./analytics')
      analytics.trackEvent('demo-complete', 'Demo Complete')
      expect(window.goatcounter?.count).not.toHaveBeenCalled()
    })

    it('should prefix the event name with events/', async () => {
      const { analytics } = await import('./analytics')
      analytics.trackEvent('install-banner-shown')
      expect(window.goatcounter?.count).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'events/install-banner-shown' }),
      )
    })
  })
})
