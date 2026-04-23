import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAppTheme, resolveThemeMode } from './theme'
import {
  lightGlass,
  darkGlass,
  glassRadius,
  glassTypography,
  glassMotion,
  glassShadows,
} from './liquidGlass'

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

// --- Token shape verification ---
// These tests assert that lightGlass/darkGlass match the expected token structure.
// Values are cross-checked against docs/design/liquid-glass/tokens.json.

describe('lightGlass tokens', () => {
  it('should have the correct wallpaper gradient', () => {
    expect(lightGlass.wallpaper).toContain('#FFD6A5')
    expect(lightGlass.wallpaper).toContain('#A5C8FF')
    expect(lightGlass.wallpaper).toContain('#FFB3D4')
    expect(lightGlass.wallpaper).toContain('#F9F7F2')
    expect(lightGlass.wallpaper).toContain('#EEEDF6')
  })

  it('should have the correct ink color', () => {
    expect(lightGlass.color.ink).toBe('#111114')
  })

  it('should have the correct bg color', () => {
    expect(lightGlass.color.bg).toBe('#F4F2EE')
  })

  it('should have the correct accent color (iOS blue)', () => {
    expect(lightGlass.color.accent).toBe('#007AFF')
  })

  it('should have the correct ok color (iOS green)', () => {
    expect(lightGlass.color.ok).toBe('#34C759')
  })

  it('should have the correct red color', () => {
    expect(lightGlass.color.red).toBe('#FF3B30')
  })

  it('should have the correct glass.bg value', () => {
    expect(lightGlass.glass.bg).toBe('rgba(255,255,255,0.55)')
  })

  it('should have the correct glass.bgStrong value', () => {
    expect(lightGlass.glass.bgStrong).toBe('rgba(255,255,255,0.72)')
  })

  it('should have the correct glass.backdropFilter value', () => {
    expect(lightGlass.glass.backdropFilter).toBe('blur(24px) saturate(180%)')
  })

  it('should have dark: false', () => {
    expect(lightGlass.dark).toBe(false)
  })
})

describe('darkGlass tokens', () => {
  it('should have the correct wallpaper gradient (deep purple/navy)', () => {
    expect(darkGlass.wallpaper).toContain('#3A1E6B')
    expect(darkGlass.wallpaper).toContain('#0F3B6C')
    expect(darkGlass.wallpaper).toContain('#6B1E4A')
    expect(darkGlass.wallpaper).toContain('#0A0A10')
    expect(darkGlass.wallpaper).toContain('#14121D')
  })

  it('should have the correct ink color (white for dark mode)', () => {
    expect(darkGlass.color.ink).toBe('#FFFFFF')
  })

  it('should have the correct bg color', () => {
    expect(darkGlass.color.bg).toBe('#0A0A10')
  })

  it('should have the correct accent color (iOS dark-mode blue)', () => {
    expect(darkGlass.color.accent).toBe('#0A84FF')
  })

  it('should have the correct ok color (iOS dark-mode green)', () => {
    expect(darkGlass.color.ok).toBe('#30D158')
  })

  it('should have the correct glass.bg value', () => {
    expect(darkGlass.glass.bg).toBe('rgba(255,255,255,0.10)')
  })

  it('should have the correct glass.bgStrong value', () => {
    expect(darkGlass.glass.bgStrong).toBe('rgba(255,255,255,0.18)')
  })

  it('should have dark: true', () => {
    expect(darkGlass.dark).toBe(true)
  })
})

describe('shared radius tokens', () => {
  it('should have card radius 22', () => {
    expect(glassRadius.card).toBe(22)
  })

  it('should have btn radius 18', () => {
    expect(glassRadius.btn).toBe(18)
  })

  it('should have glass radius 28', () => {
    expect(glassRadius.glass).toBe(28)
  })

  it('should have pill radius 999', () => {
    expect(glassRadius.pill).toBe(999)
  })

  it('should have inline radius 14', () => {
    expect(glassRadius.inline).toBe(14)
  })

  it('should have iconSquare radius 10', () => {
    expect(glassRadius.iconSquare).toBe(10)
  })
})

describe('shared typography tokens', () => {
  it('should reference SF Pro Display as the display font', () => {
    expect(glassTypography.display).toContain('SF Pro Display')
  })

  it('should reference Inter as cross-platform fallback in display', () => {
    expect(glassTypography.display).toContain('Inter')
  })

  it('should reference SF Pro Text as the body font', () => {
    expect(glassTypography.body).toContain('SF Pro Text')
  })

  it('should reference Inter as cross-platform fallback in body', () => {
    expect(glassTypography.body).toContain('Inter')
  })

  it('should have heroWord at 72px weight 800', () => {
    expect(glassTypography.roles.heroWord.size).toBe(72)
    expect(glassTypography.roles.heroWord.weight).toBe(800)
  })

  it('should have button at 17px weight 600', () => {
    expect(glassTypography.roles.button.size).toBe(17)
    expect(glassTypography.roles.button.weight).toBe(600)
  })

  it('should have uppercaseLabel transform uppercase', () => {
    expect(glassTypography.roles.uppercaseLabel.transform).toBe('uppercase')
  })
})

describe('shared motion tokens', () => {
  it('should have toggle at 200ms ease', () => {
    expect(glassMotion.toggle).toBe('200ms ease')
  })

  it('should have progress at 300ms ease', () => {
    expect(glassMotion.progress).toBe('300ms ease')
  })
})

describe('shared shadow tokens', () => {
  it('should have accentBtn shadow', () => {
    expect(glassShadows.accentBtn).toContain('rgba(0,122,255,0.32)')
  })

  it('should have glassFloat shadow matching light glass.shadow', () => {
    expect(glassShadows.glassFloat).toBe(lightGlass.glass.shadow)
  })

  it('should have glassFloatDark shadow matching dark glass.shadow', () => {
    expect(glassShadows.glassFloatDark).toBe(darkGlass.glass.shadow)
  })
})

// --- MUI theme integration tests ---

describe('createAppTheme', () => {
  it('should create a dark theme with correct palette mode', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.palette.mode).toBe('dark')
  })

  it('should create a light theme with correct palette mode', () => {
    const lightTheme = createAppTheme('light')
    expect(lightTheme.palette.mode).toBe('light')
  })

  it('should use iOS blue as the primary colour (light mode)', () => {
    const lightTheme = createAppTheme('light')
    expect(lightTheme.palette.primary.main).toBe('#007AFF')
  })

  it('should use iOS dark-mode blue as the primary colour (dark mode)', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.palette.primary.main).toBe('#0A84FF')
  })

  it('should NOT use amber/gold as the primary colour (Hero Arc removed)', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.palette.primary.main).not.toBe('#f59e0b')
  })

  it('should NOT have MUI default blue/purple leaking through', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.palette.primary.main).not.toBe('#1976d2')
  })

  it('should use dark bg token as dark mode background', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.palette.background.default).toBe(darkGlass.color.bg)
  })

  it('should use light bg token as light mode background', () => {
    const lightTheme = createAppTheme('light')
    expect(lightTheme.palette.background.default).toBe(lightGlass.color.bg)
  })

  it('should use iOS green as the success colour (light)', () => {
    const lightTheme = createAppTheme('light')
    expect(lightTheme.palette.success.main).toBe('#34C759')
  })

  it('should use iOS dark-mode green as the success colour (dark)', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.palette.success.main).toBe('#30D158')
  })

  it('should use iOS red as the error colour (light)', () => {
    const lightTheme = createAppTheme('light')
    expect(lightTheme.palette.error.main).toBe('#FF3B30')
  })

  it('should use iOS dark-mode red as the error colour (dark)', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.palette.error.main).toBe('#FF453A')
  })

  it('should use the card radius as borderRadius', () => {
    const darkTheme = createAppTheme('dark')
    expect(darkTheme.shape.borderRadius).toBe(glassRadius.card)
  })

  it('should include Inter in the typography font stack', () => {
    const darkTheme = createAppTheme('dark')
    const fontFamily = darkTheme.typography.fontFamily ?? ''
    expect(fontFamily).toContain('Inter')
  })

  it('should NOT use Nunito or Sora as the primary font (old Hero Arc fonts removed)', () => {
    const darkTheme = createAppTheme('dark')
    const fontFamily = darkTheme.typography.fontFamily ?? ''
    expect(fontFamily).not.toContain('Nunito')
    expect(fontFamily).not.toContain('Sora')
  })

  it('should use SF Pro Text family as the body font', () => {
    const darkTheme = createAppTheme('dark')
    const fontFamily = darkTheme.typography.fontFamily ?? ''
    expect(fontFamily).toContain('SF Pro Text')
  })

  it('should use the divider token from the active variant', () => {
    const lightTheme = createAppTheme('light')
    expect(lightTheme.palette.divider).toBe(lightGlass.color.rule2)
  })

  it('should set text.primary to ink token', () => {
    const lightTheme = createAppTheme('light')
    expect(lightTheme.palette.text.primary).toBe(lightGlass.color.ink)
  })

  it('should set text.secondary to inkSec token', () => {
    const lightTheme = createAppTheme('light')
    expect(lightTheme.palette.text.secondary).toBe(lightGlass.color.inkSec)
  })
})
