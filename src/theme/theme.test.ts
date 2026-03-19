import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAppTheme, resolveThemeMode } from './theme'

describe('resolveThemeMode', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should return "dark" for "dark" preference', () => {
    expect(resolveThemeMode('dark')).toBe('dark')
  })

  it('should return "light" for "light" preference', () => {
    expect(resolveThemeMode('light')).toBe('light')
  })

  it('should return "dark" for "system" when OS prefers dark', () => {
    vi.spyOn(globalThis, 'matchMedia').mockReturnValue({
      matches: true,
    } as MediaQueryList)

    expect(resolveThemeMode('system')).toBe('dark')
  })

  it('should return "light" for "system" when OS prefers light', () => {
    vi.spyOn(globalThis, 'matchMedia').mockReturnValue({
      matches: false,
    } as MediaQueryList)

    expect(resolveThemeMode('system')).toBe('light')
  })
})

describe('createAppTheme', () => {
  it('should create a dark theme with correct palette mode', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.palette.mode).toBe('dark')
  })

  it('should create a light theme with correct palette mode', () => {
    const lightTheme = createAppTheme('light')
    expect(lightTheme.palette.mode).toBe('light')
  })

  it('should use amber/gold as the primary colour', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.palette.primary.main).toBe('#f59e0b')
  })

  it('should use blue as the secondary colour', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.palette.secondary.main).toBe('#3b82f6')
  })

  it('should use deep navy as dark mode default background', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.palette.background.default).toBe('#0a0f1a')
  })

  it('should use warm white as light mode default background', () => {
    const lightTheme = createAppTheme('light')
    expect(lightTheme.palette.background.default).toBe('#fafaf9')
  })

  it('should not have the MUI default blue/purple leaking through (no default primary)', () => {
    const darkTheme = createAppTheme('dark')
    // MUI default primary is #1976d2 - ensure it is overridden
    expect(darkTheme.palette.primary.main).not.toBe('#1976d2')
  })

  it('should use Sora and Nunito fonts (not Inter/Roboto/Arial as primary body font)', () => {
    const darkTheme = createAppTheme('dark')
    const fontFamily = darkTheme.typography.fontFamily ?? ''
    expect(fontFamily).toContain('Nunito')
    expect(fontFamily).not.toMatch(/^"?Inter"?,/)
    expect(fontFamily).not.toMatch(/^Roboto,/)
  })

  it('should set rounded corners (borderRadius 12)', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.shape.borderRadius).toBe(12)
  })

  it('should set green success colour', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.palette.success.main).toBe('#22c55e')
  })

  it('should set red error colour', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.palette.error.main).toBe('#ef4444')
  })
})
