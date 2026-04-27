const Dashboard = ({ onStartReview, onAddWord, mocks }) => {
  return (
    <div style={{ padding: '20px 18px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ font: `500 13px ${LX.font.body}`, color: LX.color.inkSec, letterSpacing: '-0.1px' }}>Tuesday, April 29</div>
        <div style={{ font: `800 32px ${LX.font.display}`, letterSpacing: '-0.8px', color: LX.color.ink, marginTop: 2 }}>Good morning</div>
      </div>

      <GlassChip onClick={onStartReview} style={{ padding: '16px 20px' }}>
        <IconSquare size={40}>L</IconSquare>
        <div style={{ flex: 1 }}>
          <div style={{ font: `700 17px ${LX.font.body}`, letterSpacing: '-0.3px' }}>Continue review</div>
          <div style={{ font: `500 13px ${LX.font.body}`, color: LX.color.inkSec, marginTop: 2 }}>{mocks.due} words due · ~3 min</div>
        </div>
        <Icon name="chevron" size={18} color={LX.color.inkFaint} />
      </GlassChip>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <GlassCard padding={14}>
          <div style={{ font: `800 11px ${LX.font.body}`, letterSpacing: 1, textTransform: 'uppercase', color: LX.color.inkFaint }}>Streak</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <div style={{ font: `800 30px ${LX.font.display}`, letterSpacing: '-0.7px', lineHeight: 1.05 }}>{mocks.streak}</div>
            <div style={{ font: `600 13px ${LX.font.body}`, color: LX.color.inkSec }}>days</div>
          </div>
          <div style={{ font: `700 12px ${LX.font.body}`, color: '#FF9500', marginTop: 4 }}>🔥 keep it up</div>
        </GlassCard>
        <GlassCard padding={14}>
          <div style={{ font: `800 11px ${LX.font.body}`, letterSpacing: 1, textTransform: 'uppercase', color: LX.color.inkFaint }}>Reviewed</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <div style={{ font: `800 30px ${LX.font.display}`, letterSpacing: '-0.7px', lineHeight: 1.05 }}>{mocks.reviewed}</div>
          </div>
          <div style={{ font: `700 12px ${LX.font.body}`, color: '#1F8E3F', marginTop: 4 }}>+18 this week</div>
        </GlassCard>
      </div>

      <div>
        <div style={{ font: `800 11px ${LX.font.body}`, letterSpacing: 1, textTransform: 'uppercase', color: LX.color.inkFaint, padding: '8px 4px' }}>Up next</div>
        <GlassCard padding={0}>
          {mocks.upNext.map((w, i) => (
            <div key={w.term} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              borderTop: i === 0 ? 'none' : `0.5px solid ${LX.color.rule}`,
            }}>
              <IconSquare size={32} gradient="linear-gradient(135deg,#FF9500,#FF3B30)">{w.term[0].toUpperCase()}</IconSquare>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: `600 16px ${LX.font.body}`, letterSpacing: '-0.3px' }}>{w.term}</div>
                <div style={{ font: `500 13px ${LX.font.body}`, color: LX.color.inkSec, marginTop: 1 }}>{w.gloss}</div>
              </div>
              <Pill tone={w.due <= 0 ? 'accent' : 'neutral'}>{w.due <= 0 ? 'due' : `${w.due}d`}</Pill>
            </div>
          ))}
        </GlassCard>
      </div>

      <Button variant="ghost" onClick={onAddWord} fullWidth>+ Add a word</Button>
    </div>
  );
};
window.Dashboard = Dashboard;
