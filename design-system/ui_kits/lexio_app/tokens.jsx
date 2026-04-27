// Lexio design tokens — mirrored from src/theme.ts via colors_and_type.css
window.LX = {
  color: {
    bg: '#F4F2EE',
    ink: '#111114',
    inkSoft: 'rgba(30,30,36,0.75)',
    inkSec: 'rgba(30,30,36,0.70)',
    inkFaint: 'rgba(30,30,36,0.28)',
    rule: 'rgba(0,0,0,0.08)',
    accent: '#007AFF',
    accentSoft: 'rgba(0,122,255,0.14)',
    ok: '#34C759',
    okSoft: 'rgba(52,199,89,0.16)',
    warn: '#FF9500',
    red: '#FF3B30',
    redSoft: 'rgba(255,59,48,0.12)',
    violet: '#AF52DE',
    glassBg: 'rgba(255,255,255,0.55)',
    glassBorder: 'rgba(255,255,255,0.7)',
  },
  font: {
    // Inter is the canonical cross-platform substitute for SF Pro (shipped via @fontsource/inter).
    // "Sora" / "Nunito" labels in earlier bundle versions were stale - the production stack uses
    // SF Pro system fonts with Inter as the fallback.
    display: '"Inter", -apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
    body: '"Inter", -apple-system, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif',
    mono: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  radius: { iconSq: 10, inline: 14, btn: 18, card: 22, glass: 28, pill: 999 },
  shadow: {
    glassFloat: '0 1px 3px rgba(0,0,0,0.05),0 8px 30px rgba(0,0,0,0.08)',
    accentBtn: '0 6px 20px rgba(0,122,255,0.32)',
    iconSquare: 'inset 0 1px 0 rgba(255,255,255,0.35),0 2px 6px rgba(0,0,0,0.1)',
    redBtn: '0 6px 20px rgba(255,59,48,0.32)',
  },
  ease: 'cubic-bezier(0.32, 0.72, 0.16, 1)',
  // Liquid Glass mesh wallpaper used app-wide
  wallpaper: 'radial-gradient(1200px 600px at 85% -10%, #FFD6A5 0%, transparent 50%), radial-gradient(900px 500px at -10% 30%, #A5C8FF 0%, transparent 55%), radial-gradient(800px 500px at 50% 110%, #FFB3D4 0%, transparent 55%), linear-gradient(180deg,#F9F7F2 0%,#EEEDF6 100%)',
};
