/**
 * Shared CSS @keyframes strings for Liquid Glass animations.
 *
 * Inject these into a <style> tag (or MUI GlobalStyles) wherever the
 * animation is first needed. Consumers that need the same animation can
 * import the string and inject it themselves — injecting the same @keyframes
 * name twice is harmless; the browser deduplicates by name.
 *
 * All animations respect prefers-reduced-motion — callers must guard
 * usage with the appropriate media query or MUI sx shorthand.
 */

/**
 * Blinking caret: steps(2) gives an instant 0/1 toggle (not a smooth fade).
 * Originally defined in TypeQuizContent.tsx; promoted here so AddWordModal
 * and any future screens can share the same rule.
 *
 * prefers-reduced-motion: callers must suppress the animation-name when
 * the media query matches (see AddWordModal and TypeQuizContent for examples).
 */
export const CARET_BLINK_KEYFRAMES = `
  @keyframes lg-caret-blink {
    0%   { opacity: 1; }
    50%  { opacity: 0; }
    100% { opacity: 1; }
  }
` as const
