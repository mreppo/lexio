/**
 * Tests for the useCountUp hook.
 *
 * In the test environment (Vitest/jsdom), requestAnimationFrame is not a
 * real animation scheduler, so the hook returns the target value immediately.
 * These tests verify the final value rather than intermediate animation frames.
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCountUp } from './useCountUp'

describe('useCountUp', () => {
  it('should return the target value immediately in test environment', () => {
    const { result } = renderHook(() => useCountUp(100))
    expect(result.current).toBe(100)
  })

  it('should return 0 when target is 0', () => {
    const { result } = renderHook(() => useCountUp(0))
    expect(result.current).toBe(0)
  })

  it('should return the target value when enabled is false', () => {
    const { result } = renderHook(() => useCountUp(50, 800, false))
    expect(result.current).toBe(50)
  })

  it('should return the target value when duration is custom', () => {
    const { result } = renderHook(() => useCountUp(42, 1200))
    expect(result.current).toBe(42)
  })

  it('should return a number type', () => {
    const { result } = renderHook(() => useCountUp(77))
    expect(typeof result.current).toBe('number')
  })

  it('should handle large target values', () => {
    const { result } = renderHook(() => useCountUp(9999))
    expect(result.current).toBe(9999)
  })
})
