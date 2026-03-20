import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We mock @sentry/react before importing the module under test so that
// Sentry.init is never called against a real DSN in the test environment.
const mockInit = vi.fn()
const mockErrorBoundary = vi.fn()

vi.mock('@sentry/react', () => ({
  init: mockInit,
  ErrorBoundary: mockErrorBoundary,
}))

describe('initSentry', () => {
  beforeEach(() => {
    vi.resetModules()
    mockInit.mockClear()
    mockErrorBoundary.mockClear()
  })

  afterEach(() => {
    // Clean up any DSN set during test.
    delete import.meta.env.VITE_SENTRY_DSN
  })

  it('should not call Sentry.init when VITE_SENTRY_DSN is not set', async () => {
    delete import.meta.env.VITE_SENTRY_DSN

    const { initSentry } = await import('./sentry')
    initSentry()

    expect(mockInit).not.toHaveBeenCalled()
  })

  it('should not call Sentry.init when VITE_SENTRY_DSN is an empty string', async () => {
    import.meta.env.VITE_SENTRY_DSN = ''

    const { initSentry } = await import('./sentry')
    initSentry()

    expect(mockInit).not.toHaveBeenCalled()
  })

  it('should call Sentry.init when VITE_SENTRY_DSN is provided', async () => {
    const testDsn = 'https://test@o123.ingest.sentry.io/456'
    import.meta.env.VITE_SENTRY_DSN = testDsn

    const { initSentry } = await import('./sentry')
    initSentry()

    expect(mockInit).toHaveBeenCalledOnce()
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: testDsn,
        sampleRate: 1.0,
        tracesSampleRate: 0.1,
      }),
    )
  })

  it('should pass enabled: false in non-production environments', async () => {
    const testDsn = 'https://test@o123.ingest.sentry.io/456'
    import.meta.env.VITE_SENTRY_DSN = testDsn
    // PROD is false in the Vitest jsdom environment.
    import.meta.env.PROD = false

    const { initSentry } = await import('./sentry')
    initSentry()

    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    )
  })

  it('should include ignoreErrors patterns to suppress noisy browser errors', async () => {
    const testDsn = 'https://test@o123.ingest.sentry.io/456'
    import.meta.env.VITE_SENTRY_DSN = testDsn

    const { initSentry } = await import('./sentry')
    initSentry()

    const callArgs = mockInit.mock.calls[0][0] as {
      ignoreErrors: Array<string | RegExp>
    }
    expect(callArgs.ignoreErrors).toContain('Failed to fetch')
    expect(callArgs.ignoreErrors).toContain('Network request failed')
    expect(callArgs.ignoreErrors.some((e) => e instanceof RegExp)).toBe(true)
  })

  it('should re-export the Sentry namespace', async () => {
    const { Sentry } = await import('./sentry')
    expect(Sentry).toBeDefined()
    // Confirm it re-exports the mocked init function.
    expect(Sentry.init).toBe(mockInit)
  })
})
