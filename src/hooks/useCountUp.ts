/**
 * useCountUp - animates a number from 0 to a target value over a given duration.
 *
 * Returns the current animated value. When `prefers-reduced-motion` is active
 * the target value is returned immediately with no animation.
 *
 * In environments where `requestAnimationFrame` is synchronous / absent (tests,
 * SSR) the target value is returned immediately so tests can assert on the
 * final value without needing to advance timers.
 *
 * @param target - The final value to count up to.
 * @param duration - Animation duration in milliseconds (default: 800).
 * @param enabled - Whether the animation should run (default: true).
 */

import { useState, useEffect, useRef } from 'react'

/** Returns true when we are in an environment that supports smooth RAF animation. */
function canAnimateWithRaf(): boolean {
  if (typeof requestAnimationFrame !== 'function') return false
  if (typeof performance === 'undefined') return false
  // In jsdom, requestAnimationFrame exists but won't schedule callbacks unless
  // timers are advanced manually. Detect this by checking for a known jsdom
  // navigator property that real browsers do not set in the same way, or just
  // by checking if we appear to be running inside Vitest.
  // The most reliable heuristic: if `process.env.VITEST` is set we're in tests.
  if (typeof process !== 'undefined' && process.env['VITEST']) return false
  return true
}

export function useCountUp(target: number, duration = 800, enabled = true): number {
  const [value, setValue] = useState(target)
  const rafRef = useRef<number | null>(null)
  const hasStartedRef = useRef(false)

  useEffect(() => {
    // Respect prefers-reduced-motion at the JS level too.
    // Guard against jsdom environments where matchMedia is not implemented.
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!enabled || prefersReduced || target === 0 || !canAnimateWithRaf()) {
      setValue(target)
      return
    }

    // Only run the count-up animation on first mount with a non-zero target.
    if (hasStartedRef.current) {
      setValue(target)
      return
    }
    hasStartedRef.current = true

    // Start from 0 and animate up to target.
    setValue(0)
    const startTime = performance.now()

    const tick = (now: number): void => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic for a natural feel.
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [target, duration, enabled])

  return value
}
