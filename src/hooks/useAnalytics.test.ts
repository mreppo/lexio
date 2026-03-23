import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mock the analytics module so we can track calls without hitting GoatCounter.
vi.mock('@/services/analytics', () => ({
  analytics: {
    trackPageview: vi.fn(),
    trackEvent: vi.fn(),
  },
}))

import { analytics } from '@/services/analytics'
import { useAnalytics } from './useAnalytics'

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset hash to a known state.
    window.location.hash = ''
  })

  afterEach(() => {
    window.location.hash = ''
  })

  it('should track a pageview on initial mount with path / when hash is empty', () => {
    window.location.hash = ''
    renderHook(() => useAnalytics())
    expect(analytics.trackPageview).toHaveBeenCalledWith('/')
  })

  it('should track a pageview on initial mount with the current hash path', () => {
    window.location.hash = '#/app'
    renderHook(() => useAnalytics())
    expect(analytics.trackPageview).toHaveBeenCalledWith('/app')
  })

  it('should track a pageview when the hash changes', () => {
    window.location.hash = '#/'
    renderHook(() => useAnalytics())

    // Simulate a hash navigation.
    window.location.hash = '#/app'
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    expect(analytics.trackPageview).toHaveBeenCalledWith('/app')
  })

  it('should track multiple hash changes', () => {
    window.location.hash = '#/'
    renderHook(() => useAnalytics())

    window.location.hash = '#/app'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    window.location.hash = '#/'
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    // Initial + 2 hash changes = 3 calls total.
    expect(analytics.trackPageview).toHaveBeenCalledTimes(3)
  })

  it('should remove the hashchange listener on unmount', () => {
    window.location.hash = '#/'
    const { unmount } = renderHook(() => useAnalytics())

    unmount()

    // Simulate a hash navigation after unmount — should not trigger another call.
    const countBefore = vi.mocked(analytics.trackPageview).mock.calls.length
    window.location.hash = '#/app'
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    expect(analytics.trackPageview).toHaveBeenCalledTimes(countBefore)
  })

  it('should strip the # prefix from the hash before sending the path', () => {
    window.location.hash = '#/some/path'
    renderHook(() => useAnalytics())
    expect(analytics.trackPageview).toHaveBeenCalledWith('/some/path')
  })
})
