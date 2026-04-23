/**
 * Liquid Glass design tokens — iOS 26 aesthetic.
 *
 * Two variants:
 *   lightGlass — vivid wallpaper gradient, translucent glass chrome
 *   darkGlass  — deep ambient background, refractive glass
 *
 * Values are copied verbatim from docs/design/liquid-glass/tokens.json.
 * Do NOT change any numeric or color value without updating tokens.json first.
 */

export interface GlassColorTokens {
  readonly bg: string
  readonly ink: string
  readonly inkSoft: string
  readonly inkSec: string
  readonly inkFaint: string
  readonly rule2: string
  readonly accent: string
  readonly accentSoft: string
  readonly accentText: string
  readonly ok: string
  readonly warn: string
  readonly red: string
  readonly violet: string
  readonly pink: string
}

export interface GlassLayerTokens {
  readonly bg: string
  readonly bgStrong: string
  readonly border: string
  readonly inner: string
  readonly shadow: string
  readonly backdropFilter: string
}

export interface GlassTypographyRoleTokens {
  readonly size: number
  readonly weight: number
  readonly tracking: number
  readonly lineHeight: number
  readonly transform?: string
}

export interface GlassTypographyTokens {
  readonly display: string
  readonly body: string
  readonly mono: string
  readonly roles: {
    readonly heroWord: GlassTypographyRoleTokens
    readonly largeTitle: GlassTypographyRoleTokens
    readonly onboardHeadline: GlassTypographyRoleTokens
    readonly title: GlassTypographyRoleTokens
    readonly body: GlassTypographyRoleTokens
    readonly button: GlassTypographyRoleTokens
    readonly copy: GlassTypographyRoleTokens
    readonly caption: GlassTypographyRoleTokens
    readonly micro: GlassTypographyRoleTokens
    readonly uppercaseLabel: GlassTypographyRoleTokens
  }
}

export interface GlassRadiusTokens {
  readonly card: number
  readonly btn: number
  readonly glass: number
  readonly inline: number
  readonly iconSquare: number
  readonly pill: number
}

export interface GlassSpacingTokens {
  readonly unit: number
  readonly scale: readonly number[]
  readonly screenPadX: number
  readonly navTop: number
  readonly tabBottom: number
}

export interface GlassShadowTokens {
  readonly glassFloat: string
  readonly glassFloatDark: string
  readonly accentBtn: string
  readonly whiteBtn: string
  readonly iconSquare: string
  readonly activeTab: string
  readonly filterActive: string
}

export interface GlassMotionTokens {
  readonly toggle: string
  readonly progress: string
  readonly caretBlink: string
}

export interface GlassVariantTokens {
  readonly name: string
  readonly wallpaper: string
  readonly color: GlassColorTokens
  readonly glass: GlassLayerTokens
  readonly dark: boolean
}

export interface LiquidGlassTokens {
  readonly lightGlass: GlassVariantTokens
  readonly darkGlass: GlassVariantTokens
  readonly radius: GlassRadiusTokens
  readonly spacing: GlassSpacingTokens
  readonly typography: GlassTypographyTokens
  readonly shadows: GlassShadowTokens
  readonly motion: GlassMotionTokens
}

/**
 * Light variant — vivid wallpaper gradient, translucent glass chrome.
 * Wallpaper is 4 stacked CSS gradients in one declaration (verbatim from tokens.json).
 */
export const lightGlass: GlassVariantTokens = {
  name: 'Liquid Glass',
  wallpaper:
    'radial-gradient(1200px 600px at 85% -10%, #FFD6A5 0%, transparent 50%), radial-gradient(900px 500px at -10% 30%, #A5C8FF 0%, transparent 55%), radial-gradient(800px 500px at 50% 110%, #FFB3D4 0%, transparent 55%), linear-gradient(180deg,#F9F7F2 0%,#EEEDF6 100%)',
  color: {
    bg: '#F4F2EE',
    ink: '#111114',
    inkSoft: 'rgba(30,30,36,0.75)',
    inkSec: 'rgba(30,30,36,0.55)',
    inkFaint: 'rgba(30,30,36,0.28)',
    rule2: 'rgba(0,0,0,0.08)',
    accent: '#007AFF',
    accentSoft: 'rgba(0,122,255,0.14)',
    accentText: '#0060D6',
    ok: '#34C759',
    warn: '#FF9500',
    red: '#FF3B30',
    violet: '#AF52DE',
    pink: '#FF2D55',
  },
  glass: {
    bg: 'rgba(255,255,255,0.55)',
    bgStrong: 'rgba(255,255,255,0.72)',
    border: 'rgba(255,255,255,0.7)',
    inner:
      'inset 1.5px 1.5px 1px rgba(255,255,255,0.85), inset -1px -1px 1px rgba(255,255,255,0.5)',
    shadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 30px rgba(0,0,0,0.08)',
    backdropFilter: 'blur(24px) saturate(180%)',
  },
  dark: false,
}

/**
 * Dark variant — deep ambient background, refractive glass.
 * Wallpaper is 4 stacked CSS gradients in one declaration (verbatim from tokens.json).
 */
export const darkGlass: GlassVariantTokens = {
  name: 'Liquid Glass Dark',
  wallpaper:
    'radial-gradient(900px 500px at 100% -10%, #3A1E6B 0%, transparent 55%), radial-gradient(900px 500px at -10% 50%, #0F3B6C 0%, transparent 55%), radial-gradient(700px 400px at 50% 110%, #6B1E4A 0%, transparent 55%), linear-gradient(180deg,#0A0A10 0%,#14121D 100%)',
  color: {
    bg: '#0A0A10',
    ink: '#FFFFFF',
    inkSoft: 'rgba(255,255,255,0.82)',
    inkSec: 'rgba(255,255,255,0.55)',
    inkFaint: 'rgba(255,255,255,0.28)',
    rule2: 'rgba(255,255,255,0.1)',
    accent: '#0A84FF',
    accentSoft: 'rgba(10,132,255,0.22)',
    accentText: '#6FB4FF',
    ok: '#30D158',
    warn: '#FF9F0A',
    red: '#FF453A',
    violet: '#BF5AF2',
    pink: '#FF375F',
  },
  glass: {
    bg: 'rgba(255,255,255,0.10)',
    bgStrong: 'rgba(255,255,255,0.18)',
    border: 'rgba(255,255,255,0.22)',
    inner:
      'inset 1.5px 1.5px 1px rgba(255,255,255,0.14), inset -1px -1px 1px rgba(255,255,255,0.06)',
    shadow: '0 1px 3px rgba(0,0,0,0.4), 0 12px 36px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(24px) saturate(180%)',
  },
  dark: true,
}

/** Shared radius scale (same for both variants). */
export const glassRadius: GlassRadiusTokens = {
  card: 22,
  btn: 18,
  glass: 28,
  inline: 14,
  iconSquare: 10,
  pill: 999,
}

/** Shared spacing scale (same for both variants). */
export const glassSpacing: GlassSpacingTokens = {
  unit: 4,
  scale: [4, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 36, 46, 56, 72],
  screenPadX: 16,
  navTop: 52,
  tabBottom: 30,
}

/**
 * Typography tokens.
 * Display font: SF Pro Display (system) with Inter as cross-platform fallback.
 * Body font: SF Pro Text (system) with Inter as cross-platform fallback.
 * The Inter import (via @fontsource/inter) is in src/main.tsx.
 */
export const glassTypography: GlassTypographyTokens = {
  display: '-apple-system, "SF Pro Display", "Helvetica Neue", Inter, system-ui, sans-serif',
  body: '-apple-system, "SF Pro Text", Inter, system-ui, sans-serif',
  mono: '"SF Mono", ui-monospace, monospace',
  roles: {
    heroWord: { size: 72, weight: 800, tracking: -1.2, lineHeight: 1.02 },
    largeTitle: { size: 36, weight: 800, tracking: -1, lineHeight: 1.05 },
    onboardHeadline: { size: 42, weight: 800, tracking: -1, lineHeight: 1.05 },
    title: { size: 28, weight: 800, tracking: -0.6, lineHeight: 1.1 },
    body: { size: 17, weight: 500, tracking: -0.3, lineHeight: 1.3 },
    button: { size: 17, weight: 600, tracking: -0.2, lineHeight: 1 },
    copy: { size: 15, weight: 500, tracking: -0.2, lineHeight: 1.5 },
    caption: { size: 13, weight: 500, tracking: -0.1, lineHeight: 1.3 },
    micro: { size: 12, weight: 700, tracking: -0.1, lineHeight: 1 },
    uppercaseLabel: { size: 13, weight: 700, tracking: 1, lineHeight: 1, transform: 'uppercase' },
  },
}

/** Shared shadow scale (same for both variants). */
export const glassShadows: GlassShadowTokens = {
  glassFloat: '0 1px 3px rgba(0,0,0,0.05), 0 8px 30px rgba(0,0,0,0.08)',
  glassFloatDark: '0 1px 3px rgba(0,0,0,0.4), 0 12px 36px rgba(0,0,0,0.5)',
  accentBtn: '0 6px 20px rgba(0,122,255,0.32)',
  whiteBtn: '0 6px 20px rgba(0,0,0,0.2)',
  iconSquare: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 6px rgba(0,0,0,0.1)',
  activeTab: '0 4px 14px rgba(0,122,255,0.35)',
  filterActive: '0 4px 14px rgba(0,0,0,0.18)',
}

/** Shared motion tokens. */
export const glassMotion: GlassMotionTokens = {
  toggle: '200ms ease',
  progress: '300ms ease',
  caretBlink: '1s steps(2) infinite',
}

/**
 * Convenience function — returns the correct variant token set for a given mode.
 * Use this inside createAppTheme to pick the right color set.
 */
export function getGlassTokens(mode: 'light' | 'dark'): GlassVariantTokens {
  return mode === 'dark' ? darkGlass : lightGlass
}
