const BottomNav = ({ active, onChange }) => {
  const tabs = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'words', icon: 'words', label: 'Words' },
    { id: 'stats', icon: 'stats', label: 'Stats' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ];
  return (
    <div style={{
      position: 'absolute',
      left: 12, right: 12, bottom: 18,
      height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      background: LX.color.glassBg,
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: `0.5px solid ${LX.color.glassBorder}`,
      borderRadius: LX.radius.glass,
      boxShadow: LX.shadow.glassFloat,
      padding: '0 8px',
      zIndex: 10,
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <div key={t.id} onClick={() => onChange(t.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '8px 14px',
            borderRadius: LX.radius.btn,
            color: isActive ? LX.color.accent : LX.color.inkFaint,
            cursor: 'pointer',
            transition: `color 0.16s ${LX.ease}`,
          }}>
            <div style={{
              width: 32, height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isActive ? LX.color.accentSoft : 'transparent',
              borderRadius: 10,
              transition: `background 0.16s ${LX.ease}`,
            }}>
              <Icon name={t.icon} size={20} />
            </div>
            <div style={{ font: `600 11px ${LX.font.body}`, letterSpacing: '-0.1px' }}>{t.label}</div>
          </div>
        );
      })}
    </div>
  );
};
window.BottomNav = BottomNav;
