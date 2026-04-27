const SettingsRow = ({ icon, gradient, title, sub, badge, onClick }) => {
  const [pressed, setPressed] = React.useState(false);
  return (
    <div onClick={onClick}
      onPointerDown={() => setPressed(true)} onPointerUp={() => setPressed(false)} onPointerLeave={() => setPressed(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
        background: pressed ? 'rgba(0,0,0,0.04)' : 'transparent',
        cursor: 'pointer',
        transition: `background 0.14s ${LX.ease}`,
      }}>
      <IconSquare size={32} gradient={gradient}>{icon}</IconSquare>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: `600 16px ${LX.font.body}`, letterSpacing: '-0.3px' }}>{title}</div>
        {sub && <div style={{ font: `500 13px ${LX.font.body}`, color: LX.color.inkSec, marginTop: 1 }}>{sub}</div>}
      </div>
      {badge && <Pill tone="accent">{badge}</Pill>}
      <Icon name="chevron" size={16} color={LX.color.inkFaint} />
    </div>
  );
};

const SettingsScreen = ({ onDrillDown }) => (
  <div style={{ padding: '20px 18px 110px', display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{ font: `800 32px ${LX.font.display}`, letterSpacing: '-0.8px' }}>Settings</div>

    <GlassCard padding={0} style={{ overflow: 'hidden' }}>
      <SettingsRow icon="A" gradient="linear-gradient(135deg,#007AFF,#AF52DE)" title="Account" sub="marekss@gmail.com" onClick={() => onDrillDown('account')} />
      <div style={{ borderTop: `0.5px solid ${LX.color.rule}` }}/>
      <SettingsRow icon="L" gradient="linear-gradient(135deg,#30D158,#0A84FF)" title="Languages" sub="Latvian → English" onClick={() => onDrillDown('languages')} />
      <div style={{ borderTop: `0.5px solid ${LX.color.rule}` }}/>
      <SettingsRow icon="N" gradient="linear-gradient(135deg,#FF9500,#FF3B30)" title="Notifications" sub="Daily at 8:00" badge="New" onClick={() => onDrillDown('notify')} />
    </GlassCard>

    <GlassCard padding={0} style={{ overflow: 'hidden' }}>
      <SettingsRow icon="R" gradient="linear-gradient(135deg,#AF52DE,#007AFF)" title="Review schedule" sub="Spaced repetition · default" onClick={() => onDrillDown('review')} />
      <div style={{ borderTop: `0.5px solid ${LX.color.rule}` }}/>
      <SettingsRow icon="A" gradient="linear-gradient(135deg,#FF2D55,#AF52DE)" title="Appearance" sub="Auto" onClick={() => onDrillDown('appearance')} />
      <div style={{ borderTop: `0.5px solid ${LX.color.rule}` }}/>
      <SettingsRow icon="B" gradient="linear-gradient(135deg,#5856D6,#0A84FF)" title="Backup & sync" sub="Last backup 2h ago" onClick={() => onDrillDown('backup')} />
    </GlassCard>

    <GlassCard padding={0} style={{ overflow: 'hidden' }}>
      <SettingsRow icon="?" gradient="linear-gradient(135deg,#0A84FF,#30D158)" title="Help & feedback" onClick={() => onDrillDown('help')} />
      <div style={{ borderTop: `0.5px solid ${LX.color.rule}` }}/>
      <SettingsRow icon="i" gradient="linear-gradient(135deg,#8E8E93,#48484A)" title="About Lexio" sub="v1.4.0" onClick={() => onDrillDown('about')} />
    </GlassCard>
  </div>
);

const SettingsDrillDown = ({ id, onBack }) => {
  const titles = {
    account: 'Account', languages: 'Languages', notify: 'Notifications',
    review: 'Review schedule', appearance: 'Appearance', backup: 'Backup & sync',
    help: 'Help & feedback', about: 'About Lexio',
  };
  const [pair, setPair] = React.useState('lv-en');
  const pairs = [
    { id: 'lv-en', label: 'Latvian → English', grad: 'linear-gradient(135deg,#FF9500,#FF3B30)' },
    { id: 'fr-en', label: 'French → English', grad: 'linear-gradient(135deg,#5856D6,#0A84FF)' },
    { id: 'ja-en', label: 'Japanese → English', grad: 'linear-gradient(135deg,#FF2D55,#AF52DE)' },
    { id: 'de-en', label: 'German → English', grad: 'linear-gradient(135deg,#30D158,#0A84FF)' },
  ];

  return (
    <div style={{ padding: '14px 18px 110px', display: 'flex', flexDirection: 'column', gap: 14, animation: `slideIn 0.32s ${LX.ease}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', color: LX.color.accent, font: `500 17px ${LX.font.body}`, cursor: 'pointer', padding: 4 }}>
          <Icon name="chevronLeft" size={18} color={LX.color.accent} />
          Settings
        </button>
      </div>
      <div style={{ font: `800 28px ${LX.font.display}`, letterSpacing: '-0.6px' }}>{titles[id]}</div>

      {id === 'languages' && (
        <GlassCard padding={0} style={{ overflow: 'hidden' }}>
          {pairs.map((p, i) => (
            <div key={p.id} onClick={() => setPair(p.id)} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              borderTop: i === 0 ? 'none' : `0.5px solid ${LX.color.rule}`,
              cursor: 'pointer',
            }}>
              <IconSquare size={32} gradient={p.grad}>{p.id.slice(0,2).toUpperCase()}</IconSquare>
              <div style={{ flex: 1, font: `600 16px ${LX.font.body}` }}>{p.label}</div>
              {pair === p.id && <Icon name="check" size={20} color={LX.color.accent} />}
            </div>
          ))}
        </GlassCard>
      )}

      {id !== 'languages' && (
        <GlassCard padding={20}>
          <div style={{ font: `500 15px ${LX.font.body}`, color: LX.color.inkSec, lineHeight: 1.5 }}>
            Drill-down placeholder for <b style={{ color: LX.color.ink }}>{titles[id]}</b>. Real settings render the same grouped list pattern.
          </div>
        </GlassCard>
      )}

      <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0.4; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
};

Object.assign(window, { SettingsScreen, SettingsDrillDown });
