/**
 * Tests for animation utility constants and helpers.
 */

import { describe, it, expect } from 'vitest'
import {
  TAB_TRANSITION_MS,
  FEEDBACK_FLASH_MS,
  SHAKE_DURATION_MS,
  COUNT_UP_MS,
  SHAKE_KEYFRAMES,
  PULSE_KEYFRAMES,
  GLOW_KEYFRAMES,
  BRANDED_PULSE_KEYFRAMES,
  reducedMotionOverride,
  REDUCED_MOTION_ANIMATION_NONE,
} from './animation'

describe('animation constants', () => {
  it('should export TAB_TRANSITION_MS as 200', () => {
    expect(TAB_TRANSITION_MS).toBe(200)
  })

  it('should export FEEDBACK_FLASH_MS as 400', () => {
    expect(FEEDBACK_FLASH_MS).toBe(400)
  })

  it('should export SHAKE_DURATION_MS as 500', () => {
    expect(SHAKE_DURATION_MS).toBe(500)
  })

  it('should export COUNT_UP_MS as 800', () => {
    expect(COUNT_UP_MS).toBe(800)
  })
})

describe('CSS keyframe strings', () => {
  it('should include the lexio-shake keyframe name', () => {
    expect(SHAKE_KEYFRAMES).toContain('lexio-shake')
  })

  it('should include the lexio-pulse keyframe name', () => {
    expect(PULSE_KEYFRAMES).toContain('lexio-pulse')
  })

  it('should include the lexio-glow keyframe name', () => {
    expect(GLOW_KEYFRAMES).toContain('lexio-glow')
  })

  it('should include the lexio-branded-pulse keyframe name', () => {
    expect(BRANDED_PULSE_KEYFRAMES).toContain('lexio-branded-pulse')
  })

  it('SHAKE_KEYFRAMES should contain a translateX transform', () => {
    expect(SHAKE_KEYFRAMES).toContain('translateX')
  })

  it('PULSE_KEYFRAMES should contain a scale transform', () => {
    expect(PULSE_KEYFRAMES).toContain('scale')
  })

  it('GLOW_KEYFRAMES should contain box-shadow', () => {
    expect(GLOW_KEYFRAMES).toContain('box-shadow')
  })

  it('BRANDED_PULSE_KEYFRAMES should contain opacity', () => {
    expect(BRANDED_PULSE_KEYFRAMES).toContain('opacity')
  })
})

describe('reducedMotionOverride', () => {
  it('should return an object with the prefers-reduced-motion media query key', () => {
    const result = reducedMotionOverride()
    expect(result).toHaveProperty('@media (prefers-reduced-motion: reduce)')
  })

  it('should set animation to none inside the media query', () => {
    const result = reducedMotionOverride()
    expect(result['@media (prefers-reduced-motion: reduce)'].animation).toBe('none')
  })

  it('should set transition to none inside the media query', () => {
    const result = reducedMotionOverride()
    expect(result['@media (prefers-reduced-motion: reduce)'].transition).toBe('none')
  })
})

describe('REDUCED_MOTION_ANIMATION_NONE', () => {
  it('should contain the prefers-reduced-motion media query', () => {
    expect(REDUCED_MOTION_ANIMATION_NONE).toHaveProperty('@media (prefers-reduced-motion: reduce)')
  })

  it('should disable animation and transition', () => {
    const inner = REDUCED_MOTION_ANIMATION_NONE['@media (prefers-reduced-motion: reduce)']
    expect(inner.animation).toBe('none !important')
    expect(inner.transition).toBe('none !important')
  })
})
