const StatsScreen = () => {
  const days = [40, 65, 50, 90, 75, 30, 85];
  const labels = ['M','T','W','T','F','S','S'];
  return (
    <div style={{ padding: '20px 18px 110px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ font: `800 11px ${LX.font.body}`, letterSpacing: 1, textTransform: 'uppercase', color: LX.color.inkFaint }}>Streak</div>
        <div style={{ font: `800 56px ${LX.font.display}`, letterSpacing: '-1.4px', lineHeight: 1, color: LX.color.ink, marginTop: 4 }}>5 <span style={{ font: `600 22px ${LX.font.body}`, color: LX.color.inkSec, letterSpacing: '-0.3px' }}>days</span></div>
        <div style={{ font: `600 14px ${LX.font.body}`, color: '#FF9500', marginTop: 4 }}>🔥 best 12 days</div>
      </div>

      <GlassCard padding={16}>
        <div style={{ font: `800 11px ${LX.font.body}`, letterSpacing: 1, textTransform: 'uppercase', color: LX.color.inkFaint }}>This week</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 14, height: 100 }}>
          {days.map((h, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', height: `${h}%`, background: 'linear-gradient(180deg,#FF9500,#FF3B30)', borderRadius: 6 }} />
              </div>
              <div style={{ font: `600 11px ${LX.font.body}`, color: LX.color.inkFaint }}>{labels[i]}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <GlassCard padding={14}>
          <div style={{ font: `800 11px ${LX.font.body}`, letterSpacing: 1, textTransform: 'uppercase', color: LX.color.inkFaint }}>Reviewed</div>
          <div style={{ font: `800 30px ${LX.font.display}`, letterSpacing: '-0.7px', marginTop: 6 }}>142</div>
          <div style={{ font: `700 12px ${LX.font.body}`, color: '#1F8E3F', marginTop: 4 }}>+18 this week</div>
        </GlassCard>
        <GlassCard padding={14}>
          <div style={{ font: `800 11px ${LX.font.body}`, letterSpacing: 1, textTransform: 'uppercase', color: LX.color.inkFaint }}>Accuracy</div>
          <div style={{ font: `800 30px ${LX.font.display}`, letterSpacing: '-0.7px', marginTop: 6 }}>87%</div>
          <div style={{ font: `600 12px ${LX.font.body}`, color: LX.color.inkFaint, marginTop: 4 }}>last 50 reviews</div>
        </GlassCard>
        <GlassCard padding={14}>
          <div style={{ font: `800 11px ${LX.font.body}`, letterSpacing: 1, textTransform: 'uppercase', color: LX.color.inkFaint }}>Words known</div>
          <div style={{ font: `800 30px ${LX.font.display}`, letterSpacing: '-0.7px', marginTop: 6 }}>248</div>
          <div style={{ font: `600 12px ${LX.font.body}`, color: LX.color.inkFaint, marginTop: 4 }}>of 312 total</div>
        </GlassCard>
        <GlassCard padding={14}>
          <div style={{ font: `800 11px ${LX.font.body}`, letterSpacing: 1, textTransform: 'uppercase', color: LX.color.inkFaint }}>Time</div>
          <div style={{ font: `800 30px ${LX.font.display}`, letterSpacing: '-0.7px', marginTop: 6 }}>14m</div>
          <div style={{ font: `600 12px ${LX.font.body}`, color: LX.color.inkFaint, marginTop: 4 }}>today</div>
        </GlassCard>
      </div>
    </div>
  );
};
window.StatsScreen = StatsScreen;
