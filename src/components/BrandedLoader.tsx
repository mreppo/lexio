/**
 * BrandedLoader - replaces the generic CircularProgress spinner with a
 * Lexio-branded loading indicator.
 *
 * Uses the amber primary colour with a gentle pulse animation to reinforce
 * the app's visual identity during async operations.
 *
 * Respects `prefers-reduced-motion` by disabling the pulse animation.
 */

import { Box, Typography } from '@mui/material'
import { BRANDED_PULSE_KEYFRAMES, REDUCED_MOTION_ANIMATION_NONE } from '@/utils/animation'

interface BrandedLoaderProps {
  /** Optional accessible label for screen readers. Defaults to "Loading". */
  readonly label?: string
  /** Whether to show the "Lexio" wordmark below the indicator. */
  readonly showWordmark?: boolean
}

export function BrandedLoader({ label = 'Loading', showWordmark = false }: BrandedLoaderProps) {
  return (
    <>
      {/* Inject keyframes into the document once */}
      <style>{BRANDED_PULSE_KEYFRAMES}</style>

      <Box
        role="status"
        aria-label={label}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
        }}
      >
        {/* Amber circle with pulse */}
        <Box
          aria-hidden="true"
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            animation: 'lexio-branded-pulse 1.4s ease-in-out infinite',
            ...REDUCED_MOTION_ANIMATION_NONE,
          }}
        />

        {showWordmark && (
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
            LEXIO
          </Typography>
        )}
      </Box>
    </>
  )
}
