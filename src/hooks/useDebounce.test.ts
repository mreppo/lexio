import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 150))
    expect(result.current).toBe('initial')
  })

  it('should not update before the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 150), {
      initialProps: { value: 'initial' },
    })

    rerender({ value: 'updated' })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Should still be the old value
    expect(result.current).toBe('initial')
  })

  it('should update after the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 150), {
      initialProps: { value: 'initial' },
    })

    rerender({ value: 'updated' })

    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(result.current).toBe('updated')
  })

  it('should reset the timer when value changes rapidly', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 150), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: 'c' })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Neither 'b' nor 'c' yet — total elapsed < 150ms since last change
    expect(result.current).toBe('a')

    // Wait for the debounce to settle on 'c'
    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(result.current).toBe('c')
  })

  it('should handle non-string types (numbers)', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 0 },
    })

    rerender({ value: 42 })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toBe(42)
  })
})
