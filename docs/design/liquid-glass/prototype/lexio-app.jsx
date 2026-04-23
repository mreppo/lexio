const LEXIO_DEFAULTS = /*EDITMODE-BEGIN*/{ "direction": "lightGlass" }/*EDITMODE-END*/;
window.__LEXIO_DIR = LEXIO_DEFAULTS.direction || 'lightGlass';

function ScreenFrame({ children, dark=false }) {
  return <IOSDevice width={402} height={874} dark={dark}>{children}</IOSDevice>;
}

function LexioApp() {
  const [, force] = React.useReducer(x=>x+1, 0);
  React.useEffect(() => {
    const onChange = () => force();
    window.addEventListener('lexio-dir-change', onChange);
    return () => window.removeEventListener('lexio-dir-change', onChange);
  }, []);
  const t = window.getLexioTokens();
  const dark = t.dark;

  const screens = [
    { id:'onboarding', label:'Onboarding',            C: ScreenOnboarding },
    { id:'home',       label:'Home · Today',          C: ScreenHome },
    { id:'quiz-type',  label:'Quiz · Typing',         C: ScreenQuizType },
    { id:'quiz-mc',    label:'Quiz · Multiple choice',C: ScreenQuizMC },
    { id:'library',    label:'Library',               C: ScreenLibrary },
    { id:'add-word',   label:'Add word',              C: ScreenAddWord },
    { id:'stats',      label:'Progress',              C: ScreenStats },
    { id:'settings',   label:'Settings',              C: ScreenSettings },
  ];

  return (
    <DesignCanvas>
      <DCSection id="intro" title="Lexio — iOS 26 Liquid Glass redesign" subtitle={`Direction: ${t.name} · ${t.tagline} · flip A/B in Tweaks`}>
        <DCArtboard id="_intro" label="Read me" width={540} height={874}><IntroCard/></DCArtboard>
      </DCSection>

      <DCSection id="flow" title="Core flow" subtitle="Onboarding → Home → Quiz">
        {['onboarding','home','quiz-type','quiz-mc'].map(id => {
          const s = screens.find(x=>x.id===id);
          return <DCArtboard key={id} id={id} label={s.label} width={402} height={874}>
            <ScreenFrame dark={dark}><s.C/></ScreenFrame>
          </DCArtboard>;
        })}
      </DCSection>

      <DCSection id="manage" title="Manage" subtitle="Library, add word, progress, settings">
        {['library','add-word','stats','settings'].map(id => {
          const s = screens.find(x=>x.id===id);
          return <DCArtboard key={id} id={id} label={s.label} width={402} height={874}>
            <ScreenFrame dark={dark}><s.C/></ScreenFrame>
          </DCArtboard>;
        })}
      </DCSection>

      <DCSection id="notes" title="What changed & why" subtitle="iOS 26 patterns applied">
        <DCArtboard id="_notes" label="Summary" width={1120} height={720}><NotesCard/></DCArtboard>
      </DCSection>

      <LexioTweaks/>
    </DesignCanvas>
  );
}

function IntroCard() {
  const t = window.getLexioTokens();
  return (
    <div style={{ width:'100%', height:'100%', padding: 36, boxSizing:'border-box',
      background: t.wallpaper, color: t.ink, fontFamily: t.body,
      display:'flex', flexDirection:'column', gap: 18, overflow:'auto' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform:'uppercase', color: t.inkSec }}>
        Lexio · iOS 26 redesign · v3
      </div>
      <div style={{ fontFamily: t.display, fontSize: 44, lineHeight: 1.02, fontWeight: 800, letterSpacing: -1.4 }}>
        Liquid Glass,<br/>for a vocabulary<br/>app you'll want to open.
      </div>
      <div style={{ fontSize: 16, color: t.inkSoft, lineHeight: 1.5, fontWeight: 500, letterSpacing:-0.2, maxWidth: 440 }}>
        Redesigned around Apple's iOS 26 material system: translucent glass chrome that floats over a warm wallpaper gradient, bubble-shaped nav and tab bars, and content-first layouts that recede chrome when you're reading.
      </div>
      <div style={{ height:1, background: t.rule2, margin:'4px 0' }}/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
        {[
          { t:'Glass material', b:'Translucent panels with blur+saturate backdrop, inner highlight, hairline rim. Every card is glass.' },
          { t:'Floating chrome', b:'Nav + tab bars are separated bubbles — not bezel-pinned bars — so they can recede or morph on scroll.' },
          { t:'Wallpaper beneath', b:'A vivid multi-gradient wallpaper gives the glass something to refract. Light and dark variants ship.' },
          { t:'Content-first', b:'The word itself is 56–72px bold SF Pro. Chrome gets out of the way so the language stays the star.' },
        ].map((x,i) => (
          <Glass key={i} pad={14} floating>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 3, letterSpacing:-0.3 }}>{x.t}</div>
            <div style={{ fontSize: 13, color: t.inkSoft, lineHeight: 1.4, fontWeight: 500 }}>{x.b}</div>
          </Glass>
        ))}
      </div>
      <Glass pad={14} floating strong style={{ background: t.accentSoft }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.accentText, letterSpacing:-0.1 }}>
          Open <b>Tweaks</b> (bottom-right) to flip between light and dark glass.
        </div>
      </Glass>
    </div>
  );
}

function NotesCard() {
  const t = window.getLexioTokens();
  const items = [
    { t:'Liquid Glass material on every surface', b:'Cards, buttons, chips, search — all get the same translucent backdrop-blur treatment. Gives the whole UI a sense of depth.' },
    { t:'Chrome as floating bubbles', b:'Nav bar, tab bar, progress strip are separated pills — matches iOS 26 pattern where bars aren\'t pinned to the bezel.' },
    { t:'Wallpaper-first aesthetic', b:'A warm multi-stop gradient sits behind every screen so the glass has something to refract. Ships in light and dark.' },
    { t:'Hero word at 56–72px', b:'The target word is the visual anchor of quiz & home screens — big SF Pro bold with tight tracking.' },
    { t:'Tab bar as single floating pill', b:'Four icon-only glyphs inside one glass pill, active tab is a filled-blue capsule. Replaces the bezel-pinned MUI BottomNav.' },
    { t:'Tinted-square symbols on list rows', b:'Each settings/library row has a colored rounded-square glyph — matches iOS Settings pattern and adds rhythm.' },
    { t:'Searchbar + segmented pills in Library', b:'Translucent search field + a row of glass filter pills with one filled "All" pill as the active chip.' },
    { t:'Add-word: one glass card per field', b:'Each field is its own floating glass card with a tiny uppercase label. Cleaner than MUI outlined inputs.' },
    { t:'Gradient tiles for milestones', b:'Streak and AI upsell use vivid gradients behind glass — feels premium without being loud.' },
  ];
  return (
    <div style={{ width:'100%', height:'100%', padding: 28, background: t.wallpaper, color: t.ink, fontFamily: t.body, overflow:'auto', boxSizing:'border-box' }}>
      <div style={{ fontFamily: t.display, fontSize: 34, fontWeight: 800, letterSpacing: -0.9, marginBottom: 4 }}>What changed & why</div>
      <div style={{ fontSize: 14, color: t.inkSoft, marginBottom: 18, maxWidth: 720, fontWeight: 500 }}>
        All iOS 26 patterns. Translates to MUI by building a Glass component (backdrop-filter + inner shadow + rim) and replacing Paper/Card/AppBar/BottomNavigation.
      </div>
      {items.map((x,i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:'36px 260px 1fr', padding:'12px 0', borderBottom:`0.5px solid ${t.rule2}`, alignItems:'baseline' }}>
          <div style={{ fontFamily: t.mono, fontSize: 11, color: t.inkFaint, fontWeight: 700 }}>{String(i+1).padStart(2,'0')}</div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3, paddingRight: 12, color: t.ink }}>{x.t}</div>
          <div style={{ fontSize: 13, color: t.inkSoft, lineHeight: 1.5, fontWeight: 500 }}>{x.b}</div>
        </div>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<LexioApp/>);
