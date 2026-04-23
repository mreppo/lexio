// Lexio tokens — iOS 26 Liquid Glass aesthetic.
// A · Liquid Light: vivid wallpaper gradient, translucent glass chrome
// B · Liquid Dark:  deep ambient background, refractive glass

const LEXIO_TOKENS = {
  lightGlass: {
    name: 'A · Liquid Glass',
    tagline: 'iOS 26 — translucent chrome, vivid backdrop',
    // "Wallpaper" layer the glass sits on top of (inside every screen)
    wallpaper: 'radial-gradient(1200px 600px at 85% -10%, #FFD6A5 0%, transparent 50%), radial-gradient(900px 500px at -10% 30%, #A5C8FF 0%, transparent 55%), radial-gradient(800px 500px at 50% 110%, #FFB3D4 0%, transparent 55%), linear-gradient(180deg,#F9F7F2 0%,#EEEDF6 100%)',
    bg: '#F4F2EE',
    ink: '#111114',
    inkSoft: 'rgba(30,30,36,0.75)',
    inkSec: 'rgba(30,30,36,0.55)',
    inkFaint: 'rgba(30,30,36,0.28)',
    rule2: 'rgba(0,0,0,0.08)',
    glassBg: 'rgba(255,255,255,0.55)',
    glassBgStrong: 'rgba(255,255,255,0.72)',
    glassBorder: 'rgba(255,255,255,0.7)',
    glassInner: 'inset 1.5px 1.5px 1px rgba(255,255,255,0.85), inset -1px -1px 1px rgba(255,255,255,0.5)',
    glassShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 30px rgba(0,0,0,0.08)',
    accent: '#007AFF',
    accentSoft: 'rgba(0,122,255,0.14)',
    accentText: '#0060D6',
    ok: '#34C759',
    warn: '#FF9500',
    red: '#FF3B30',
    violet: '#AF52DE',
    pink: '#FF2D55',
    radiusCard: 22,
    radiusBtn: 18,
    radiusGlass: 28,
    display: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
    body:    '-apple-system, "SF Pro Text", system-ui, sans-serif',
    mono:    '"SF Mono", ui-monospace, monospace',
    dark: false,
  },
  darkGlass: {
    name: 'B · Liquid Glass Dark',
    tagline: 'iOS 26 — ambient dark backdrop, refractive glass',
    wallpaper: 'radial-gradient(900px 500px at 100% -10%, #3A1E6B 0%, transparent 55%), radial-gradient(900px 500px at -10% 50%, #0F3B6C 0%, transparent 55%), radial-gradient(700px 400px at 50% 110%, #6B1E4A 0%, transparent 55%), linear-gradient(180deg,#0A0A10 0%,#14121D 100%)',
    bg: '#0A0A10',
    ink: '#FFFFFF',
    inkSoft: 'rgba(255,255,255,0.82)',
    inkSec: 'rgba(255,255,255,0.55)',
    inkFaint: 'rgba(255,255,255,0.28)',
    rule2: 'rgba(255,255,255,0.1)',
    glassBg: 'rgba(255,255,255,0.10)',
    glassBgStrong: 'rgba(255,255,255,0.18)',
    glassBorder: 'rgba(255,255,255,0.22)',
    glassInner: 'inset 1.5px 1.5px 1px rgba(255,255,255,0.14), inset -1px -1px 1px rgba(255,255,255,0.06)',
    glassShadow: '0 1px 3px rgba(0,0,0,0.4), 0 12px 36px rgba(0,0,0,0.5)',
    accent: '#0A84FF',
    accentSoft: 'rgba(10,132,255,0.22)',
    accentText: '#6FB4FF',
    ok: '#30D158',
    warn: '#FF9F0A',
    red: '#FF453A',
    violet: '#BF5AF2',
    pink: '#FF375F',
    radiusCard: 22,
    radiusBtn: 18,
    radiusGlass: 28,
    display: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
    body:    '-apple-system, "SF Pro Text", system-ui, sans-serif',
    mono:    '"SF Mono", ui-monospace, monospace',
    dark: true,
  },
};

window.getLexioTokens = function () {
  const d = window.__LEXIO_DIR || 'lightGlass';
  return LEXIO_TOKENS[d] || LEXIO_TOKENS.lightGlass;
};
window.LEXIO_TOKENS = LEXIO_TOKENS;
