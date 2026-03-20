import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock the virtual:pwa-register module before importing the hook.
// The real module only exists at Vite build time; Vitest needs a manual mock.
vi.mock('virtual:pwa-register', () => ({
  registerSW: vi.fn(),
}))

import { registerSW } from 'virtual:pwa-register'
import { useServiceWorker } from './useServiceWorker'

describe('useServiceWorker', () => {
  // Capture the options passed to registerSW so tests can trigger callbacks.
  let capturedOptions: {
    onOfflineReady?: () => void
    onNeedRefresh?: () => void
  } = {}

  // The mock SW function returned by registerSW.
  const mockUpdateFn = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
    capturedOptions = {}

    vi.mocked(registerSW).mockImplementation((options) => {
      capturedOptions = options ?? {}
      return mockUpdateFn
    })
  })

  it('should return updateAvailable as false on initial render', () => {
    const { result } = renderHook(() => useServiceWorker())
    expect(result.current.updateAvailable).toBe(false)
  })

  it('should return offlineReady as false on initial render', () => {
    const { result } = renderHook(() => useServiceWorker())
    expect(result.current.offlineReady).toBe(false)
  })

  it('should set offlineReady to true when onOfflineReady callback fires', () => {
    const { result } = renderHook(() => useServiceWorker())
    act(() => {
      capturedOptions.onOfflineReady?.()
    })
    expect(result.current.offlineReady).toBe(true)
  })

  it('should set updateAvailable to true when onNeedRefresh callback fires', () => {
    const { result } = renderHook(() => useServiceWorker())
    act(() => {
      capturedOptions.onNeedRefresh?.()
    })
    expect(result.current.updateAvailable).toBe(true)
  })

  it('should call the updateSW function with true when applyUpdate is called', () => {
    const { result } = renderHook(() => useServiceWorker())
    act(() => {
      result.current.applyUpdate()
    })
    expect(mockUpdateFn).toHaveBeenCalledWith(true)
  })

  it('should set updateAvailable to false when dismissUpdate is called', () => {
    const { result } = renderHook(() => useServiceWorker())

    // First trigger an update.
    act(() => {
      capturedOptions.onNeedRefresh?.()
    })
    expect(result.current.updateAvailable).toBe(true)

    // Then dismiss it.
    act(() => {
      result.current.dismissUpdate()
    })
    expect(result.current.updateAvailable).toBe(false)
  })

  it('should register the service worker once on mount', () => {
    renderHook(() => useServiceWorker())
    expect(registerSW).toHaveBeenCalledOnce()
  })
})
