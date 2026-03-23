/**
 * Shared animation utilities.
 *
 * All durations and keyframes are defined here so they can be reused
 * consistently across the app and tested in isolation.
 *
 * Animations must always respect the user's `prefers-reduced-motion`
 * preference. Components should use the `reducedMotion` helpers when
 * building `sx` props or `keyframes` strings.
 */

// ─── Duration constants ────────────────────────────────────────────────────────

/** Standard page/tab transition duration in ms. */
export const TAB_TRANSITION_MS = 200

/** Brief flash feedback duration in ms (correct/incorrect). */
export const FEEDBACK_FLASH_MS = 400

/** Shake animation duration in ms (incorrect answer). */
export const SHAKE_DURATION_MS = 500

/** Count-up animation duration in ms (dashboard stats). */
export const COUNT_UP_MS = 800

// ─── CSS keyframe strings ──────────────────────────────────────────────────────

/**
 * Shake keyframe for incorrect answer feedback.
 * Uses a horizontal wiggle that feels gentle but noticeable.
 */
export const SHAKE_KEYFRAMES = `
  @keyframes lexio-shake {
    0%   { transform: translateX(0); }
    15%  { transform: translateX(-6px); }
    30%  { transform: translateX(6px); }
    45%  { transform: translateX(-5px); }
    60%  { transform: translateX(5px); }
    75%  { transform: translateX(-3px); }
    90%  { transform: translateX(3px); }
    100% { transform: translateX(0); }
  }
` as const

/**
 * Pulse-scale keyframe for correct answer feedback.
 */
export const PULSE_KEYFRAMES = `
  @keyframes lexio-pulse {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.06); }
    70%  { transform: scale(0.97); }
    100% { transform: scale(1); }
  }
` as const

/**
 * Glow pulse keyframe for streak indicator.
 */
export const GLOW_KEYFRAMES = `
  @keyframes lexio-glow {
    0%   { box-shadow: 0 0 0 0 rgba(255, 167, 38, 0.4); }
    50%  { box-shadow: 0 0 0 6px rgba(255, 167, 38, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 167, 38, 0); }
  }
` as const

/**
 * Branded loading pulse keyframe (amber accent).
 */
export const BRANDED_PULSE_KEYFRAMES = `
  @keyframes lexio-branded-pulse {
    0%   { opacity: 1;   transform: scale(1); }
    50%  { opacity: 0.5; transform: scale(0.95); }
    100% { opacity: 1;   transform: scale(1); }
  }
` as const

// ─── prefers-reduced-motion helpers ───────────────────────────────────────────

/**
 * Returns an MUI `sx`-compatible object that disables all transitions and
 * animations when the user has requested reduced motion.
 *
 * Usage:
 * ```tsx
 * <Box sx={{ animation: '...', ...reducedMotionOverride() }} />
 * ```
 */
export function reducedMotionOverride(): Record<string, Record<string, string>> {
  return {
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      transition: 'none',
    },
  }
}

/**
 * Wraps an animation string to return `'none'` when the user prefers reduced
 * motion. Use this inside MUI `sx` objects to conditionally apply animations.
 *
 * Note: This is a CSS media query approach for sx props.
 * The `reducedMotionOverride()` helper is more universal.
 */
export const REDUCED_MOTION_ANIMATION_NONE = {
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none !important',
    transition: 'none !important',
  },
} as const
