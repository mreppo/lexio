// Lexio Tweaks — flip Light Glass / Dark Glass.
function LexioTweaks() {
  const [open, setOpen] = React.useState(false);
  const [hostOn, setHostOn] = React.useState(false);
  const [dir, setDir] = React.useState(window.__LEXIO_DIR || 'lightGlass');

  React.useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === '__activate_edit_mode') setHostOn(true);
      if (e.data?.type === '__deactivate_edit_mode') setHostOn(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  React.useEffect(() => {
    window.__LEXIO_DIR = dir;
    window.dispatchEvent(new CustomEvent('lexio-dir-change'));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { direction: dir } }, '*');
  }, [dir]);

  const visible = hostOn || open;

  return (
    <>
      {!hostOn && (
        <button onClick={()=>setOpen(o=>!o)} style={{
          position:'fixed', right: 20, bottom: 20, zIndex: 200,
          padding:'12px 18px', borderRadius: 999, background:'#000', color:'#fff',
          fontFamily:'-apple-system, system-ui', fontSize:14, fontWeight:600,
          border:'none', cursor:'pointer',
          boxShadow:'0 10px 30px rgba(0,0,0,0.25)', letterSpacing:-0.2,
        }}>{open ? 'Close Tweaks' : 'Tweaks'}</button>
      )}
      {visible && (
        <div style={{
          position:'fixed', right: 20, bottom: 74, zIndex: 201,
          width: 300, padding: 20, background:'#fff', borderRadius: 18,
          border:'0.5px solid rgba(60,60,67,0.15)',
          boxShadow:'0 24px 70px rgba(0,0,0,0.2)',
          fontFamily:'-apple-system, system-ui', color:'#000',
        }}>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5, marginBottom: 2 }}>Tweaks</div>
          <div style={{ fontSize: 13, color:'rgba(60,60,67,0.6)', marginBottom: 16, letterSpacing:-0.1 }}>
            iOS 26 Liquid Glass — light vs dark.
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color:'rgba(60,60,67,0.6)', textTransform:'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Direction</div>
          <div style={{ display:'flex', gap: 10 }}>
            {[
              { id:'lightGlass', label:'A · Light', sub:'translucent chrome', bg:'linear-gradient(135deg,#FFD6A5,#A5C8FF)', dot:'#007AFF' },
              { id:'darkGlass',  label:'B · Dark',  sub:'ambient glass',      bg:'linear-gradient(135deg,#3A1E6B,#0F3B6C)', dot:'#BF5AF2' },
            ].map(o => {
              const on = dir === o.id;
              return (
                <button key={o.id} onClick={()=>setDir(o.id)} style={{
                  flex:1, padding:'12px 12px', borderRadius: 14, background: o.bg,
                  color: o.id==='darkGlass' ? '#fff' : '#000',
                  border:`2px solid ${on ? o.dot : 'rgba(60,60,67,0.12)'}`,
                  textAlign:'left', cursor:'pointer',
                }}>
                  <div style={{ width:24, height:24, borderRadius: 999, background: o.dot, marginBottom: 10, boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }}/>
                  <div style={{ fontSize: 13, fontWeight: 800, letterSpacing:-0.2 }}>{o.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop:1 }}>{o.sub}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
window.LexioTweaks = LexioTweaks;
