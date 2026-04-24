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

/**
 * Language-pair gradient map for the onboarding LanguagePairStep.
 *
 * Each entry is a CSS gradient string (linear-gradient) keyed by the
 * target-language BCP-47 code (lowercase). The values are per design spec.
 *
 * Fallback: when a code is not present in the map, callers should fall back
 * to `avatarGradient` (blue-to-violet). This ensures the UI never breaks on
 * unknown language codes (e.g. the default EN-LV pair where 'lv' is not in
 * the spec's listed set).
 */
export interface PairGradientMap {
  readonly es: string
  readonly fr: string
  /** Japanese pair — BCP-47 code 'ja' (not 'jp'). */
  readonly ja: string
  readonly de: string
  /** Additional codes can be added here as new pairs are supported. */
  readonly [code: string]: string
}

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
  /**
   * Avatar gradient — placeholder for future auth integration.
   * Used by the NavBar avatar on the Home screen.
   * Value from design spec: #007AFF → #AF52DE.
   */
  readonly avatarGradient: string
  /**
   * AI upsell gradient — used in the Add Word AI upsell circle icon.
   * Reversed direction vs. avatarGradient: #AF52DE → #007AFF.
   * The direction matters visually — a separate token avoids confusion.
   */
  readonly aiGradient: string
  /**
   * Streak hero gradient — vivid orange-red used exclusively for the streak
   * hero tile on the Progress (Stats) screen. Always this gradient regardless
   * of light/dark mode per design spec.
   * Value: linear-gradient(135deg, #FF9500 0%, #FF3B30 100%).
   */
  readonly streakGradient: string
  /**
   * Language-pair gradient map — used in the LanguagePairStep onboarding card.
   * Keyed by target-language BCP-47 code (lowercase). Falls back to
   * `avatarGradient` for any code not in the map (e.g. 'lv').
   */
  readonly pairGradients: PairGradientMap
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
    /** Quiz typing: typed-so-far display text. 26/700 tracking -0.5. */
    readonly quizDisplay: GlassTypographyRoleTokens
    /** Quiz typing: part-of-speech sub label. 15/500. */
    readonly quizSub: GlassTypographyRoleTokens
    /** Quiz typing: hint and skip row text. 13/500. */
    readonly quizHint: GlassTypographyRoleTokens
    /** Quiz top bar N/M pill. 14/700. */
    readonly quizPill: GlassTypographyRoleTokens
    /** Quiz MC: option label text. 17/600. */
    readonly quizOption: GlassTypographyRoleTokens
    /** Quiz MC: feedback headline "Correct · +N XP" / wrong copy. 15/700. */
    readonly quizFeedbackHeadline: GlassTypographyRoleTokens
    /** Quiz MC: "Choose the meaning" subtitle. 14/500. */
    readonly quizChoiceSub: GlassTypographyRoleTokens
    /** Quiz MC: explanation body in feedback card. 13/500. */
    readonly quizExplanation: GlassTypographyRoleTokens
    /** Add Word: Term input — display 30/800 tracking -0.7. */
    readonly addWordTerm: GlassTypographyRoleTokens
    /** Add Word: Meaning input — 20/500. */
    readonly addWordMeaning: GlassTypographyRoleTokens
    /** Stats: streak eyebrow label "STREAK" — 13/800 tracking 1 uppercase. */
    readonly streakEyebrow: GlassTypographyRoleTokens
    /** Stats: streak helper "days · best N" — 18/600. */
    readonly streakHelper: GlassTypographyRoleTokens
    /** Stats: stat card number — 30/800. */
    readonly statCardNumber: GlassTypographyRoleTokens
    /** Stats: stat card sublabel — 12/700 (delta) or 12/600 (secondary). */
    readonly statCardSub: GlassTypographyRoleTokens
    /** Stats: bar chart day letter label — 11/600. */
    readonly barDayLabel: GlassTypographyRoleTokens
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
  /**
   * Active filter/library pill shadow — canonical named token for the
   * `0 4px 14px rgba(0,0,0,0.18)` value shared across QuizHub and Library.
   * Alias of filterActive; both resolve to the same value.
   */
  readonly pillActive: string
  /**
   * AI upsell circle shadow (light mode) — violet glow at 0.4 alpha.
   * Light: rgba(175,82,222,0.4) derived from lightGlass violet #AF52DE.
   * Use `aiCircleShadow(mode)` helper for the mode-correct value.
   */
  readonly aiCircleLight: string
  /**
   * AI upsell circle shadow (dark mode) — violet glow at 0.4 alpha.
   * Dark: rgba(191,90,242,0.4) derived from darkGlass violet #BF5AF2.
   * Use `aiCircleShadow(mode)` helper for the mode-correct value.
   */
  readonly aiCircleDark: string
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
    /**
     * inkSec raised from 0.55 → 0.70 for WCAG AA contrast on light surfaces.
     * At 0.55 on bg #F4F2EE the effective colour is ~#7E7D7F (≈3.6:1 — FAIL).
     * At 0.70 the effective colour is ~#5E5D5D (≈5.3:1 — PASS).
     * Dark variant remains 0.55 — on the dark bg #0A0A10 it already passes AA.
     */
    inkSec: 'rgba(30,30,36,0.70)',
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
    // Avatar gradient placeholder — design spec: #007AFF → #AF52DE
    avatarGradient: 'linear-gradient(135deg, #007AFF 0%, #AF52DE 100%)',
    // AI upsell gradient — reversed direction: #AF52DE → #007AFF
    aiGradient: 'linear-gradient(135deg, #AF52DE 0%, #007AFF 100%)',
    // Streak hero gradient — always vivid orange-red regardless of theme
    streakGradient: 'linear-gradient(135deg, #FF9500 0%, #FF3B30 100%)',
    // Language-pair gradient map. ES reuses streakGradient colors per spec.
    // Fallback for unknown codes: use avatarGradient (#007AFF → #AF52DE).
    pairGradients: {
      es: 'linear-gradient(135deg, #FF9500 0%, #FF3B30 100%)',
      fr: 'linear-gradient(135deg, #5856D6 0%, #0A84FF 100%)',
      ja: 'linear-gradient(135deg, #FF2D55 0%, #AF52DE 100%)',
      de: 'linear-gradient(135deg, #30D158 0%, #0A84FF 100%)',
    },
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
    // Avatar gradient placeholder — same gradient on dark variant for consistency
    avatarGradient: 'linear-gradient(135deg, #0A84FF 0%, #BF5AF2 100%)',
    // AI upsell gradient — reversed direction: #BF5AF2 → #0A84FF
    aiGradient: 'linear-gradient(135deg, #BF5AF2 0%, #0A84FF 100%)',
    // Streak hero gradient — same on both variants per spec (always vivid orange-red)
    streakGradient: 'linear-gradient(135deg, #FF9500 0%, #FF3B30 100%)',
    // Language-pair gradient map. Same values in dark mode — per design spec the
    // pair gradients are vivid and do not change between light/dark.
    // Fallback for unknown codes: use avatarGradient (#0A84FF → #BF5AF2).
    pairGradients: {
      es: 'linear-gradient(135deg, #FF9500 0%, #FF3B30 100%)',
      fr: 'linear-gradient(135deg, #5856D6 0%, #0A84FF 100%)',
      ja: 'linear-gradient(135deg, #FF2D55 0%, #AF52DE 100%)',
      de: 'linear-gradient(135deg, #30D158 0%, #0A84FF 100%)',
    },
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
    // Quiz typing screen tokens (§3 in design README)
    quizDisplay: { size: 26, weight: 700, tracking: -0.5, lineHeight: 1.1 },
    quizSub: { size: 15, weight: 500, tracking: -0.2, lineHeight: 1.45 },
    quizHint: { size: 13, weight: 500, tracking: -0.1, lineHeight: 1.3 },
    quizPill: { size: 14, weight: 700, tracking: -0.1, lineHeight: 1 },
    // Quiz MC screen tokens (§4 in design README)
    quizOption: { size: 17, weight: 600, tracking: -0.3, lineHeight: 1.3 },
    quizFeedbackHeadline: { size: 15, weight: 700, tracking: -0.2, lineHeight: 1 },
    quizChoiceSub: { size: 14, weight: 500, tracking: -0.2, lineHeight: 1.45 },
    quizExplanation: { size: 13, weight: 500, tracking: -0.1, lineHeight: 1.4 },
    // Add Word screen tokens (§6 in design README)
    addWordTerm: { size: 30, weight: 800, tracking: -0.7, lineHeight: 1.1 },
    addWordMeaning: { size: 20, weight: 500, tracking: -0.3, lineHeight: 1.3 },
    // Stats screen tokens (§7 in design README)
    streakEyebrow: { size: 13, weight: 800, tracking: 1, lineHeight: 1, transform: 'uppercase' },
    streakHelper: { size: 18, weight: 600, tracking: -0.2, lineHeight: 1.2 },
    statCardNumber: { size: 30, weight: 800, tracking: -0.7, lineHeight: 1.05 },
    statCardSub: { size: 12, weight: 700, tracking: -0.1, lineHeight: 1.2 },
    barDayLabel: { size: 11, weight: 600, tracking: 0, lineHeight: 1 },
  },
}

// ─── Colour-with-alpha helpers ─────────────────────────────────────────────────

/**
 * Returns the `ok` colour from the given variant at the specified alpha (0–1).
 * Used for borders like "1px solid ok@40" in the MC feedback card.
 *
 * Light: #34C759 Dark: #30D158 — both converted to rgba so alpha is set
 * explicitly instead of relying on CSS color-mix (which has lower browser
 * support). The values are derived from the hex tokens above.
 */
export function okAlpha(mode: 'light' | 'dark', alpha: number): string {
  // Light ok: #34C759 = rgb(52, 199, 89)
  // Dark  ok: #30D158 = rgb(48, 209, 88)
  const [r, g, b] = mode === 'dark' ? [48, 209, 88] : [52, 199, 89]
  return `rgba(${r},${g},${b},${alpha})`
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
  // Named alias so Library (and future screens) can reference by semantic name.
  pillActive: '0 4px 14px rgba(0,0,0,0.18)',
  // AI upsell circle shadows — violet glow, mode-dependent.
  // Light: #AF52DE = rgb(175,82,222). Dark: #BF5AF2 = rgb(191,90,242).
  aiCircleLight: '0 4px 12px rgba(175,82,222,0.4)',
  aiCircleDark: '0 4px 12px rgba(191,90,242,0.4)',
}

/**
 * Returns the AI upsell circle shadow for the given mode.
 * The shadow uses the mode-specific violet color at 0.4 alpha.
 *
 * Light: #AF52DE → rgba(175,82,222,0.4)
 * Dark:  #BF5AF2 → rgba(191,90,242,0.4)
 */
export function aiCircleShadow(mode: 'light' | 'dark'): string {
  return mode === 'dark' ? glassShadows.aiCircleDark : glassShadows.aiCircleLight
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
