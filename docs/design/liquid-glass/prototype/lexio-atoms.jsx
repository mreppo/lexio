// Lexio atoms — iOS 26 Liquid Glass primitives.

// Each "screen" surface has a wallpaper gradient — glass chrome sits on top.
function PaperSurface({ children, style = {} }) {
  const t = window.getLexioTokens();
  return (
    <div style={{
      width:'100%', height:'100%',
      background: t.wallpaper, backgroundSize:'cover',
      color: t.ink, fontFamily: t.body,
      position:'relative', overflow:'hidden',
      ...style,
    }}>{children}</div>
  );
}

// Glass — the core surface material.
function Glass({ children, style={}, pad=16, strong=false, radius, floating=false }) {
  const t = window.getLexioTokens();
  return (
    <div style={{
      position:'relative',
      borderRadius: radius ?? t.radiusCard,
      overflow:'hidden',
      boxShadow: floating ? t.glassShadow : 'none',
      ...style,
    }}>
      <div style={{
        position:'absolute', inset:0, borderRadius:'inherit',
        background: strong ? t.glassBgStrong : t.glassBg,
        backdropFilter:'blur(24px) saturate(180%)',
        WebkitBackdropFilter:'blur(24px) saturate(180%)',
      }}/>
      <div style={{
        position:'absolute', inset:0, borderRadius:'inherit',
        boxShadow: t.glassInner,
        border: `0.5px solid ${t.glassBorder}`,
        pointerEvents:'none',
      }}/>
      <div style={{ position:'relative', padding: pad }}>{children}</div>
    </div>
  );
}

function IconGlyph({ d, size=22, color, stroke=2 }) {
  const t = window.getLexioTokens();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || t.ink} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}

const ICONS = {
  chevronRight:'M9 6l6 6-6 6', chevronLeft:'M15 6l-6 6 6 6',
  close:'M6 6l12 12M18 6L6 18', plus:'M12 5v14M5 12h14',
  flame:'M12 3c1 3 4 4 4 8a4 4 0 11-8 0c0-2 1-3 2-4-1 3 1 3 2 2 0-2-1-4 0-6z',
  check:'M4 12l5 5L20 6', x:'M6 6l12 12M18 6L6 18',
  speaker:'M11 5L6 9H3v6h3l5 4V5z M15 9a3 3 0 010 6 M18 6a7 7 0 010 12',
  search:'M11 4a7 7 0 105 12l4 4 M11 4a7 7 0 017 7',
  book:'M4 4h11a3 3 0 013 3v13H7a3 3 0 01-3-3V4z',
  card:'M3 7h18v10H3z M3 11h18',
  sparkle:'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z',
  clock:'M12 7v5l3 2 M12 3a9 9 0 100 18 9 9 0 000-18z',
  flash:'M13 3L4 14h6l-1 7 9-11h-6l1-7z',
  settings:'M12 9a3 3 0 100 6 3 3 0 000-6z M19 12l2 1 -1.5 3-2.3-0.5a7 7 0 01-2 1.2L15 19h-3l-0.3-2.3a7 7 0 01-2-1.2L7.5 16 6 13l2-1a7 7 0 010-2l-2-1 1.5-3 2.3 0.5a7 7 0 012-1.2L12 3h3l0.3 2.3a7 7 0 012 1.2L19.5 6 21 9l-2 1a7 7 0 010 2z',
  trophy:'M8 4h8v4a4 4 0 11-8 0V4z M8 6H4a4 4 0 004 4 M16 6h4a4 4 0 01-4 4 M10 14h4l-1 6h-2l-1-6z',
  bell:'M6 9a6 6 0 0112 0v5l2 3H4l2-3V9z M10 20a2 2 0 004 0',
  share:'M12 4v12 M6 10l6-6 6 6 M4 20h16',
};

// Glass pill button
function Btn({ children, kind='glass', full=false, onClick, style={}, size='md' }) {
  const t = window.getLexioTokens();
  const sizes = { sm:{h:36,fs:15,px:14}, md:{h:50,fs:17,px:20}, lg:{h:56,fs:17,px:24} }[size];
  if (kind==='filled') {
    return (
      <button onClick={onClick} style={{
        height:sizes.h, width: full?'100%':'auto', padding:`0 ${sizes.px}px`,
        background: t.accent, color:'#fff', border:'none',
        borderRadius: sizes.h/2,
        fontFamily: t.body, fontWeight:600, fontSize: sizes.fs, letterSpacing:-0.2,
        cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
        boxShadow:'0 6px 20px rgba(0,122,255,0.32)',
        ...style,
      }}>{children}</button>
    );
  }
  if (kind==='white') {
    return (
      <button onClick={onClick} style={{
        height:sizes.h, width: full?'100%':'auto', padding:`0 ${sizes.px}px`,
        background:'#fff', color: t.accent, border:'none',
        borderRadius: sizes.h/2, fontFamily: t.body, fontWeight:700, fontSize: sizes.fs,
        letterSpacing:-0.2, cursor:'pointer',
        display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
        boxShadow:'0 6px 20px rgba(0,0,0,0.2)',
        ...style,
      }}>{children}</button>
    );
  }
  // glass
  return (
    <div style={{ display: full?'block':'inline-block', width: full?'100%':'auto', ...style }}>
      <Glass radius={sizes.h/2} pad={0} strong floating>
        <button onClick={onClick} style={{
          height:sizes.h, width:'100%', padding:`0 ${sizes.px}px`,
          background:'transparent', color: t.ink, border:'none',
          fontFamily: t.body, fontWeight:600, fontSize: sizes.fs, letterSpacing:-0.2,
          cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>{children}</button>
      </Glass>
    </div>
  );
}

function Chip({ children, tone='neutral', style={} }) {
  const t = window.getLexioTokens();
  const tones = {
    neutral: { bg: t.glassBg, fg: t.ink },
    accent:  { bg: t.accentSoft, fg: t.accentText },
  }[tone];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      height: 26, padding:'0 12px', borderRadius: 999,
      background: tones.bg, color: tones.fg,
      backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
      border:`0.5px solid ${t.glassBorder}`,
      fontFamily: t.body, fontSize: 12, fontWeight: 700, letterSpacing:-0.1,
      ...style,
    }}>{children}</span>
  );
}

function LargeTitle({ children, style={} }) {
  const t = window.getLexioTokens();
  return (
    <div style={{
      fontFamily: t.display, fontSize: 36, fontWeight: 800,
      letterSpacing: -1, color: t.ink, lineHeight: 1.05,
      ...style,
    }}>{children}</div>
  );
}

// Floating glass nav — iOS 26 separates chrome into floating bubbles
function NavBar({ title, leading, trailing, large=false, prominentTitle }) {
  const t = window.getLexioTokens();
  return (
    <div style={{ paddingTop: 52 }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 16px', gap: 10, height: 50,
      }}>
        <div>{leading && <Glass radius={22} pad={0} floating>
          <div style={{ width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center' }}>{leading}</div>
        </Glass>}</div>
        {!large && (
          <Glass radius={22} pad={0} floating>
            <div style={{ height:44, padding:'0 18px', display:'flex', alignItems:'center', fontFamily:t.body, fontSize:16, fontWeight:700, color:t.ink, letterSpacing:-0.3 }}>{title}</div>
          </Glass>
        )}
        <div style={{ display:'flex', gap:8 }}>{trailing}</div>
      </div>
      {large && (
        <div style={{ padding:'14px 22px 8px' }}>
          <LargeTitle>{prominentTitle || title}</LargeTitle>
        </div>
      )}
    </div>
  );
}

function GlassIcon({ children }) {
  return (
    <Glass radius={22} pad={0} floating>
      <div style={{ width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center' }}>{children}</div>
    </Glass>
  );
}

// Floating glass tab bar — iOS 26 shrinks tab bars into a single pill
function TabBar({ active='home' }) {
  const t = window.getLexioTokens();
  const tabs = [
    { id:'home', icon: ICONS.flash },
    { id:'library', icon: ICONS.book },
    { id:'stats', icon: ICONS.trophy },
    { id:'settings', icon: ICONS.settings },
  ];
  return (
    <div style={{
      position:'absolute', left:0, right:0, bottom: 30,
      display:'flex', justifyContent:'center', zIndex: 20,
    }}>
      <Glass radius={34} pad={0} strong floating>
        <div style={{ display:'flex', padding:'8px', gap: 4 }}>
          {tabs.map(tab => {
            const on = tab.id === active;
            return (
              <div key={tab.id} style={{
                width: 52, height: 52, borderRadius: 26,
                display:'flex', alignItems:'center', justifyContent:'center',
                background: on ? t.accent : 'transparent',
                boxShadow: on ? '0 4px 14px rgba(0,122,255,0.35)' : 'none',
              }}>
                <IconGlyph d={tab.icon} size={24} color={on ? '#fff' : t.inkSoft} stroke={on ? 2.4 : 2}/>
              </div>
            );
          })}
        </div>
      </Glass>
    </div>
  );
}

function LangPair({ from, to, style={} }) {
  const t = window.getLexioTokens();
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      fontFamily: t.body, fontSize: 13, fontWeight: 600,
      color: t.inkSec, letterSpacing:-0.1, ...style,
    }}>
      <span>{from}</span>
      <svg width="12" height="8" viewBox="0 0 12 8" style={{opacity:0.7}}>
        <path d="M0 4h10m0 0l-3-3m3 3l-3 3" stroke="currentColor" fill="none" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      <span>{to}</span>
    </span>
  );
}

function Progress({ value=0.5, tone='accent', height=8, track }) {
  const t = window.getLexioTokens();
  const fill = { ink:t.ink, accent:t.accent, ok:t.ok }[tone];
  return (
    <div style={{ height, background: track || t.rule2, borderRadius:99, overflow:'hidden' }}>
      <div style={{ width:`${Math.round(value*100)}%`, height:'100%', background:fill, borderRadius:99, transition:'width .3s' }}/>
    </div>
  );
}

function BigWord({ children, size=44, color, weight=800, style={} }) {
  const t = window.getLexioTokens();
  return (
    <div style={{
      fontFamily: t.display, fontSize: size, lineHeight: 1.02,
      fontWeight: weight, color: color || t.ink,
      letterSpacing: size >= 40 ? -1.2 : -0.5, ...style,
    }}>{children}</div>
  );
}

function Toggle({ on }) {
  const t = window.getLexioTokens();
  return (
    <div style={{
      width: 51, height: 31, borderRadius: 99,
      background: on ? t.ok : 'rgba(120,120,128,0.32)',
      position:'relative', transition:'background .2s', flexShrink: 0,
    }}>
      <div style={{
        position:'absolute', top:2, left: on ? 22 : 2,
        width:27, height:27, borderRadius:999, background:'#fff',
        boxShadow:'0 3px 8px rgba(0,0,0,0.15)', transition:'left .2s',
      }}/>
    </div>
  );
}

// Glass list row
function GlassRow({ icon, iconBg, title, detail, chevron=true, accessory, isLast=false }) {
  const t = window.getLexioTokens();
  return (
    <div style={{
      display:'flex', alignItems:'center', minHeight: 56,
      padding:'12px 16px', gap: 14, position:'relative',
    }}>
      {icon && (
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: iconBg || t.accent,
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink: 0,
          boxShadow:'inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 6px rgba(0,0,0,0.1)',
        }}>
          <IconGlyph d={icon} size={18} color="#fff" stroke={2.3}/>
        </div>
      )}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:t.body, fontSize:17, color:t.ink, fontWeight:500, letterSpacing:-0.3 }}>{title}</div>
        {detail && <div style={{ fontSize:13, color:t.inkSec, marginTop:1 }}>{detail}</div>}
      </div>
      {accessory}
      {chevron && (
        <svg width="8" height="13" viewBox="0 0 8 13" style={{ flexShrink:0 }}>
          <path d="M1 1l6 5.5L1 12" stroke={t.inkFaint} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {!isLast && (
        <div style={{ position:'absolute', left: icon?64:16, right:16, bottom:0, height:0.5, background: t.rule2 }}/>
      )}
    </div>
  );
}

function SectionHeader({ children, style={} }) {
  const t = window.getLexioTokens();
  return (
    <div style={{
      padding:'20px 30px 8px', fontFamily: t.body, fontSize: 13, fontWeight: 600,
      color: t.inkSec, textTransform:'uppercase', letterSpacing: 0.6,
      ...style,
    }}>{children}</div>
  );
}

Object.assign(window, {
  PaperSurface, Glass, IconGlyph, ICONS, Btn, Chip, LargeTitle, NavBar,
  GlassIcon, TabBar, LangPair, Progress, BigWord, Toggle, GlassRow, SectionHeader,
});
