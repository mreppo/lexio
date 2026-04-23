import { useState, useEffect } from 'react'

/**
 * Returns a debounced version of `value` that only updates after `delay` ms
 * of silence. Used by the Library search field (150ms debounce per spec).
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debounced
}
