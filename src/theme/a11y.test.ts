/**
 * Accessibility smoke tests for issue #155.
 *
 * Verifies that:
 *   - pxToRem conversion produces correct values (Dynamic Type / 200% zoom)
 *   - createAppTheme sets the CSS variable for focus-visible ring
 *   - Typography body1 / button sizes are expressed in rem, not px
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createAppTheme } from './theme'

describe('pxToRem (typography)', () => {
  it('should emit rem values for body1 fontSize', () => {
    const theme = createAppTheme('light')
    // body role is 17px → 17/16 = 1.0625rem
    expect(theme.typography.body1.fontSize).toBe('1.0625rem')
  })

  it('should emit rem values for button fontSize', () => {
    const theme = createAppTheme('light')
    // button role is 17px → 1.0625rem
    expect(theme.typography.button.fontSize).toBe('1.0625rem')
  })

  it('should emit rem values for h1 (largeTitle: 36px)', () => {
    const theme = createAppTheme('light')
    // largeTitle is 36px → 36/16 = 2.25rem
    expect(theme.typography.h1?.fontSize).toBe('2.25rem')
  })

  it('should produce identical values in dark mode', () => {
    const lightTheme = createAppTheme('light')
    const darkTheme = createAppTheme('dark')
    expect(lightTheme.typography.body1.fontSize).toBe(darkTheme.typography.body1.fontSize)
  })
})

describe('focus-visible accent CSS variable', () => {
  let originalSetProperty: typeof document.body.style.setProperty

  beforeEach(() => {
    originalSetProperty = document.body.style.setProperty.bind(document.body.style)
  })

  afterEach(() => {
    document.body.style.setProperty = originalSetProperty
  })

  it('should set --lexio-accent on body when creating light theme', () => {
    createAppTheme('light')
    const val = document.body.style.getPropertyValue('--lexio-accent')
    // lightGlass accent is #007AFF
    expect(val).toBe('#007AFF')
  })

  it('should set --lexio-accent on body when creating dark theme', () => {
    createAppTheme('dark')
    const val = document.body.style.getPropertyValue('--lexio-accent')
    // darkGlass accent is #0A84FF
    expect(val).toBe('#0A84FF')
  })
})
