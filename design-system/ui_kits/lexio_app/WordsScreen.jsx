const WordsScreen = ({ words, onAdd }) => {
  const [showSheet, setShowSheet] = React.useState(false);
  const [term, setTerm] = React.useState('');
  const [gloss, setGloss] = React.useState('');
  const [query, setQuery] = React.useState('');

  const filtered = words.filter(w => !query || w.term.toLowerCase().includes(query.toLowerCase()) || w.gloss.toLowerCase().includes(query.toLowerCase()));

  const submit = () => {
    if (!term.trim() || !gloss.trim()) return;
    onAdd({ term, gloss, due: 0 });
    setTerm(''); setGloss(''); setShowSheet(false);
  };

  return (
    <div style={{ padding: '20px 18px 110px', display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ font: `800 32px ${LX.font.display}`, letterSpacing: '-0.8px' }}>Words</div>
        <div style={{ font: `500 13px ${LX.font.body}`, color: LX.color.inkSec }}>{words.length} total</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'rgba(255,255,255,0.7)', border: `0.5px solid ${LX.color.rule}`, borderRadius: LX.radius.btn }}>
        <Icon name="search" size={18} color={LX.color.inkFaint} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search words"
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', font: `500 16px ${LX.font.body}`, color: LX.color.ink }}
        />
      </div>

      <GlassCard padding={0} style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <div style={{ font: `700 16px ${LX.font.display}` }}>No matches</div>
            <div style={{ font: `500 13px ${LX.font.body}`, color: LX.color.inkSec, marginTop: 4 }}>Try a different search.</div>
          </div>
        ) : filtered.map((w, i) => (
          <div key={w.term} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
            borderTop: i === 0 ? 'none' : `0.5px solid ${LX.color.rule}`,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: `700 17px ${LX.font.display}`, letterSpacing: '-0.3px' }}>{w.term}</div>
              <div style={{ font: `500 14px ${LX.font.body}`, color: LX.color.inkSec, marginTop: 1 }}>{w.gloss}</div>
            </div>
            <Pill tone={w.due <= 0 ? 'accent' : 'neutral'}>{w.due <= 0 ? 'due' : `${w.due}d`}</Pill>
          </div>
        ))}
      </GlassCard>

      <Button variant="primary" fullWidth onClick={() => setShowSheet(true)} style={{ marginTop: 'auto' }}>+ Add word</Button>

      {showSheet && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
          <div onClick={() => setShowSheet(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', animation: 'fade 0.2s ease' }} />
          <div style={{
            position: 'absolute', left: 8, right: 8, bottom: 8,
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(30px) saturate(180%)',
            border: `0.5px solid ${LX.color.glassBorder}`,
            borderRadius: 24,
            padding: '12px 18px 22px',
            animation: `rise 0.32s ${LX.ease}`,
            boxShadow: '0 -8px 30px rgba(0,0,0,0.18)',
          }}>
            <div style={{ width: 36, height: 5, background: 'rgba(0,0,0,0.18)', borderRadius: 999, margin: '0 auto 14px' }} />
            <div style={{ font: `800 22px ${LX.font.display}`, letterSpacing: '-0.5px' }}>Add word</div>
            <div style={{ font: `500 14px ${LX.font.body}`, color: LX.color.inkSec, marginTop: 4 }}>Quick capture — refine later.</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              <input value={term} onChange={e => setTerm(e.target.value)} placeholder="māja" style={{
                font: `600 18px ${LX.font.display}`, padding: '13px 16px',
                borderRadius: LX.radius.btn, background: '#fff',
                border: `0.5px solid ${LX.color.rule}`, outline: 'none',
              }}/>
              <input value={gloss} onChange={e => setGloss(e.target.value)} placeholder="house, home" style={{
                font: `500 16px ${LX.font.body}`, padding: '13px 16px',
                borderRadius: LX.radius.btn, background: '#fff',
                border: `0.5px solid ${LX.color.rule}`, outline: 'none',
              }}/>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Button variant="ghost" fullWidth onClick={() => setShowSheet(false)}>Cancel</Button>
              <Button variant="primary" fullWidth onClick={submit} disabled={!term.trim() || !gloss.trim()}>Add</Button>
            </div>
          </div>
          <style>{`
            @keyframes fade { from { opacity:0; } to { opacity:1; } }
            @keyframes rise { from { transform: translateY(100%); } to { transform: translateY(0); } }
          `}</style>
        </div>
      )}
    </div>
  );
};
window.WordsScreen = WordsScreen;
