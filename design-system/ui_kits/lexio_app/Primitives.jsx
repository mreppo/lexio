// Reusable Lexio primitives — Glass cards, buttons, icons
const { useState } = React;

const GlassCard = ({ children, style, onClick, padding = 16 }) => (
  <div onClick={onClick} style={{
    background: LX.color.glassBg,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: `0.5px solid ${LX.color.glassBorder}`,
    borderRadius: LX.radius.card,
    boxShadow: LX.shadow.glassFloat,
    padding,
    ...style,
  }}>{children}</div>
);

const GlassChip = ({ children, onClick, style }) => {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: pressed ? 'rgba(255,255,255,0.45)' : LX.color.glassBg,
        backdropFilter: 'blur(20px) saturate(180%)',
        border: `0.5px solid ${LX.color.glassBorder}`,
        borderRadius: LX.radius.glass,
        boxShadow: LX.shadow.glassFloat,
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        color: LX.color.ink,
        cursor: 'pointer',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: `transform 0.16s ${LX.ease}, background 0.16s ${LX.ease}`,
        ...style,
      }}
    >{children}</div>
  );
};

const Button = ({ children, variant = 'primary', onClick, disabled, style, fullWidth }) => {
  const [pressed, setPressed] = useState(false);
  const variants = {
    primary: { background: pressed ? '#0066D6' : LX.color.accent, color: '#fff', boxShadow: disabled ? 'none' : LX.shadow.accentBtn },
    ghost: { background: pressed ? 'rgba(255,255,255,0.45)' : LX.color.glassBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `0.5px solid ${LX.color.glassBorder}`, color: LX.color.ink, boxShadow: LX.shadow.glassFloat },
    destructive: { background: LX.color.red, color: '#fff', boxShadow: LX.shadow.redBtn },
    text: { background: 'transparent', color: LX.color.accent, padding: '10px 12px', boxShadow: 'none' },
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        font: `600 17px ${LX.font.body}`,
        letterSpacing: '-0.2px',
        padding: '13px 20px',
        borderRadius: LX.radius.btn,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.42 : 1,
        width: fullWidth ? '100%' : 'auto',
        transform: pressed && !disabled ? 'scale(0.97)' : 'scale(1)',
        transition: `transform 0.16s ${LX.ease}, background 0.16s ${LX.ease}`,
        ...variants[variant],
        ...style,
      }}
    >{children}</button>
  );
};

const Pill = ({ children, tone = 'neutral', style }) => {
  const tones = {
    neutral: { background: 'rgba(0,0,0,0.06)', color: LX.color.inkSec },
    accent: { background: LX.color.accentSoft, color: LX.color.accent },
    ok: { background: LX.color.okSoft, color: '#1F8E3F' },
    streak: { background: 'linear-gradient(135deg,#FF9500,#FF3B30)', color: '#fff' },
  };
  return (
    <span style={{
      font: `700 12px ${LX.font.body}`,
      letterSpacing: '-0.1px',
      padding: '4px 10px',
      borderRadius: 999,
      display: 'inline-block',
      ...tones[tone], ...style,
    }}>{children}</span>
  );
};

const IconSquare = ({ children, gradient = 'linear-gradient(135deg,#007AFF,#AF52DE)', size = 32 }) => (
  <div style={{
    width: size, height: size,
    borderRadius: LX.radius.iconSq,
    background: gradient,
    boxShadow: LX.shadow.iconSquare,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff',
    font: `700 ${size * 0.45}px ${LX.font.display}`,
    flexShrink: 0,
  }}>{children}</div>
);

// Lucide-style icons used in nav and rows
const Icon = ({ name, size = 22, color = 'currentColor', style }) => {
  const paths = {
    home: <path d="M3 11l9-8 9 8v10a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2V11z"/>,
    words: <g><path d="M5 4h11l3 5-3 5H5V4z"/><line x1="5" y1="14" x2="5" y2="22"/></g>,
    stats: <g><path d="M3 17l4-4 4 4 8-8"/><path d="M14 5h7v7"/></g>,
    settings: <g><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.85l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.85-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.85.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.85 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.85l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.85.34h0a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.55 1.7 1.7 0 001.85-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.85v0a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.55 1z"/></g>,
    chevron: <polyline points="9 18 15 12 9 6"/>,
    chevronLeft: <polyline points="15 18 9 12 15 6"/>,
    add: <g><path d="M12 5v14M5 12h14"/></g>,
    close: <g><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></g>,
    check: <polyline points="20 6 9 17 4 12"/>,
    search: <g><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></g>,
    flame: <path d="M8 14s1-2 4-2 4 2 4 2 0 6-4 6-4-6-4-6zm4-12c0 4 4 5 4 9 0 2-1 4-4 4s-4-2-4-4c0-3 4-5 4-9z"/>,
    trophy: <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM7 4H4v3a3 3 0 003 3M17 4h3v3a3 3 0 01-3 3"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      {paths[name]}
    </svg>
  );
};

Object.assign(window, { GlassCard, GlassChip, Button, Pill, IconSquare, Icon });
