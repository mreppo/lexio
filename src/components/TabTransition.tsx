/**
 * TabTransition - wraps tab content with a subtle fade-in transition.
 *
 * When the active tab changes the incoming content fades in over ~200ms.
 * This creates a native-app feel without heavy JS-driven animations.
 *
 * Respects `prefers-reduced-motion` by using `opacity: 1` immediately with no
 * transition delay.
 */

import { type ReactNode, useEffect, useState } from 'react'
import { Box } from '@mui/material'
import type { AppTab } from './composites'
import { TAB_TRANSITION_MS } from '@/utils/animation'

interface TabTransitionProps {
  /** The currently active tab key - changing this triggers the transition. */
  readonly activeTab: AppTab
  readonly children: ReactNode
}

export function TabTransition({ activeTab, children }: TabTransitionProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Fade out instantly, then fade back in after a very short tick so React
    // has time to render the new content before the fade-in starts.
    setVisible(false)
    const timer = setTimeout(() => setVisible(true), 16)
    return () => clearTimeout(timer)
  }, [activeTab])

  return (
    <Box
      sx={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${TAB_TRANSITION_MS}ms ease-in-out`,
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          opacity: 1,
        },
      }}
    >
      {children}
    </Box>
  )
}
