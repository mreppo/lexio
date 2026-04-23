// Lexio screens — iOS 26 Liquid Glass.

function ScreenOnboarding() {
  const t = window.getLexioTokens();
  const pairs = [
    { a:'ES', label:'Spanish', sub:'1,240 words', bg:'linear-gradient(135deg,#FF9500,#FF3B30)', on:true },
    { a:'FR', label:'French',  sub:'980 words',   bg:'linear-gradient(135deg,#5856D6,#0A84FF)' },
    { a:'JP', label:'Japanese',sub:'620 words',   bg:'linear-gradient(135deg,#FF2D55,#AF52DE)' },
    { a:'DE', label:'German',  sub:'740 words',   bg:'linear-gradient(135deg,#30D158,#0A84FF)' },
  ];
  return (
    <PaperSurface>
      <div style={{ padding:'72px 24px 0' }}>
        <div style={{ fontFamily: t.body, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform:'uppercase', color: t.inkSec, marginBottom: 14 }}>
          Welcome to Lexio
        </div>
        <BigWord size={42} weight={800}>Learn any<br/>language, a<br/>word at a time.</BigWord>
        <div style={{ fontSize: 16, fontWeight: 500, color: t.inkSoft, marginTop: 14, maxWidth: 320, letterSpacing:-0.2 }}>
          Spaced-repetition flashcards that adapt to how well you know each word.
        </div>
      </div>

      <div style={{ padding:'28px 16px 0' }}>
        {pairs.map((p,i) => (
          <Glass key={i} pad={12} floating strong={p.on} style={{ marginBottom: 10, border: p.on ? `2px solid ${t.accent}`:'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:46, height:46, borderRadius: 14, background:p.bg,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontFamily: t.body, fontSize: 13, fontWeight: 800 }}>{p.a}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily: t.body, fontSize: 17, fontWeight: 700, color: t.ink, letterSpacing:-0.3 }}>{p.label} → English</div>
                <div style={{ fontSize: 13, color: t.inkSec, marginTop: 1 }}>{p.sub} · Starter pack</div>
              </div>
              <div style={{ width:24, height:24, borderRadius:999,
                border: p.on ? 'none' : `1.5px solid ${t.rule2}`,
                background: p.on ? t.accent : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                {p.on && <IconGlyph d={ICONS.check} size={14} color="#fff" stroke={3}/>}
              </div>
            </div>
          </Glass>
        ))}
      </div>

      <div style={{ position:'absolute', bottom: 46, left: 16, right: 16 }}>
        <Btn kind="filled" full size="lg">Continue</Btn>
      </div>
    </PaperSurface>
  );
}

function ScreenHome() {
  const t = window.getLexioTokens();
  return (
    <PaperSurface>
      <NavBar large prominentTitle="Today"
        leading={<div style={{
          width:36, height:36, borderRadius:999,
          background:'linear-gradient(135deg,#007AFF,#AF52DE)', color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: 15, fontWeight: 700,
        }}>M</div>}
        trailing={<GlassIcon>
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:t.warn, fontFamily:t.body, fontWeight:700 }}>
            <IconGlyph d={ICONS.flame} size={16} color={t.warn} stroke={2.2}/>7
          </span>
        </GlassIcon>}
      />

      {/* Hero */}
      <div style={{ padding:'8px 16px 0' }}>
        <Glass pad={22} floating strong>
          <Chip tone="accent">DUE TODAY</Chip>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop: 14 }}>
            <BigWord size={72} weight={800}>14</BigWord>
            <div style={{ fontFamily: t.body, fontSize: 17, fontWeight: 600, color: t.inkSoft }}>words</div>
          </div>
          <div style={{ fontFamily: t.body, fontSize: 14, color: t.inkSec, marginTop: 2, fontWeight:500 }}>
            ≈ 6 min · Spanish → English
          </div>
          <div style={{ marginTop: 18 }}>
            <Progress value={0.3} tone="accent" height={8}/>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop: 6, fontSize: 12, color: t.inkSec, fontWeight: 600 }}>
              <span>4 of 14 done</span><span>Goal · 20</span>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Btn kind="filled" full size="md">Start review</Btn>
          </div>
        </Glass>
      </div>

      {/* Quick stats */}
      <div style={{ display:'flex', gap:10, padding:'14px 16px 0' }}>
        {[{n:'240',l:'Library'},{n:'164',l:'Mastered'},{n:'84%',l:'Accuracy'}].map((x,i) => (
          <Glass key={i} pad={14} floating style={{ flex:1 }}>
            <BigWord size={24} weight={700}>{x.n}</BigWord>
            <div style={{ fontSize: 12, color: t.inkSec, fontWeight: 600, marginTop: 2 }}>{x.l}</div>
          </Glass>
        ))}
      </div>

      <SectionHeader style={{ padding:'22px 32px 8px' }}>Word of the day</SectionHeader>
      <div style={{ padding:'0 16px' }}>
        <Glass pad={18} floating>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <LangPair from="ES" to="EN"/>
            <GlassIcon><IconGlyph d={ICONS.speaker} size={16} color={t.accent}/></GlassIcon>
          </div>
          <BigWord size={38} weight={800} style={{ marginTop: 12 }}>efímero</BigWord>
          <div style={{ fontFamily: t.body, fontSize: 15, color: t.inkSoft, marginTop: 4, fontWeight: 500 }}>
            adj. — ephemeral, short-lived
          </div>
          <div style={{
            marginTop: 12, padding:'12px 14px', borderRadius: 14,
            background: t.glassBg, fontSize: 14, color: t.inkSoft,
            lineHeight: 1.45, fontStyle:'italic',
            border:`0.5px solid ${t.glassBorder}`,
          }}>
            "La felicidad puede ser efímera, pero real."
          </div>
        </Glass>
      </div>

      <div style={{ height: 140 }}/>
      <TabBar active="home"/>
    </PaperSurface>
  );
}

function ScreenQuizType() {
  const t = window.getLexioTokens();
  return (
    <PaperSurface>
      <div style={{ padding:'56px 16px 10px', display:'flex', alignItems:'center', gap:10 }}>
        <GlassIcon><IconGlyph d={ICONS.close} size={20} color={t.inkSoft}/></GlassIcon>
        <Glass radius={22} pad={0} floating style={{ flex:1 }}>
          <div style={{ padding:'15px 18px' }}><Progress value={5/14} tone="accent" height={6}/></div>
        </Glass>
        <Glass radius={22} pad={0} floating>
          <div style={{ height:44, padding:'0 14px', display:'flex', alignItems:'center', fontFamily:t.body, fontSize:14, fontWeight:700, color:t.ink }}>5/14</div>
        </Glass>
      </div>

      <div style={{ padding:'40px 24px 0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: 18 }}>
          <LangPair from="ES" to="EN"/>
          <Chip tone="accent">adjective</Chip>
        </div>
        <BigWord size={64} weight={800}>efímero</BigWord>
        <div style={{ fontFamily: t.body, fontSize: 15, color: t.inkSec, marginTop: 10, fontWeight: 500 }}>
          Translate to English
        </div>
      </div>

      <div style={{ padding:'36px 16px 0' }}>
        <Glass pad={18} floating strong>
          <div style={{ fontFamily: t.display, fontSize: 26, fontWeight: 700, color: t.ink, letterSpacing:-0.5 }}>
            ephem
            <span style={{ display:'inline-block', width:2, height: 24, background: t.accent, marginLeft: 2, verticalAlign:'middle', animation:'lexiblink 1s steps(2) infinite' }}/>
          </div>
        </Glass>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop: 10, padding:'0 6px', fontSize: 13 }}>
          <span style={{ color: t.inkSec, fontWeight: 500 }}>Hint: starts with <b style={{color:t.ink}}>e</b>, 9 letters</span>
          <span style={{ color: t.accent, fontWeight: 700 }}>Skip</span>
        </div>
      </div>

      <div style={{ position:'absolute', bottom: 46, left: 16, right: 16, display:'flex', gap: 10 }}>
        <Btn kind="glass" size="lg" style={{ flex:1 }}>Show answer</Btn>
        <Btn kind="filled" size="lg" style={{ flex:1.3 }}>Check</Btn>
      </div>
      <style>{`@keyframes lexiblink{50%{opacity:0}}`}</style>
    </PaperSurface>
  );
}

function ScreenQuizMC() {
  const t = window.getLexioTokens();
  const opts = [
    { label:'homesickness', state:'correct' },
    { label:'forest', state:'idle' },
    { label:'star', state:'idle' },
    { label:'amazement', state:'wrong' },
  ];
  return (
    <PaperSurface>
      <div style={{ padding:'56px 16px 10px', display:'flex', alignItems:'center', gap:10 }}>
        <GlassIcon><IconGlyph d={ICONS.close} size={20} color={t.inkSoft}/></GlassIcon>
        <Glass radius={22} pad={0} floating style={{ flex:1 }}>
          <div style={{ padding:'15px 18px' }}><Progress value={7/14} tone="accent" height={6}/></div>
        </Glass>
        <Glass radius={22} pad={0} floating>
          <div style={{ height:44, padding:'0 14px', display:'flex', alignItems:'center', fontFamily:t.body, fontSize:14, fontWeight:700, color:t.ink }}>7/14</div>
        </Glass>
      </div>

      <div style={{ padding:'36px 24px 0', textAlign:'center' }}>
        <LangPair from="PT" to="EN" style={{ justifyContent:'center' }}/>
        <div style={{ marginTop: 14 }}><BigWord size={66} weight={800}>saudade</BigWord></div>
        <div style={{ fontFamily: t.body, fontSize: 14, color: t.inkSec, marginTop: 12, fontWeight:500 }}>Choose the meaning</div>
      </div>

      <div style={{ padding:'34px 16px 0', display:'flex', flexDirection:'column', gap:10 }}>
        {opts.map((o,i) => {
          const isCorrect = o.state==='correct';
          const isWrong   = o.state==='wrong';
          const bd = isCorrect ? t.ok : isWrong ? t.red : 'transparent';
          return (
            <Glass key={i} pad={0} floating strong={isCorrect||isWrong} style={{ border: bd==='transparent'?'none':`2px solid ${bd}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px' }}>
                <div style={{
                  width:30, height:30, borderRadius: 9,
                  background: o.state==='idle' ? t.glassBg : (isCorrect ? t.ok : t.red),
                  border: o.state==='idle' ? `0.5px solid ${t.glassBorder}` : 'none',
                  color: o.state==='idle' ? t.inkSoft : '#fff',
                  fontFamily: t.body, fontSize: 13, fontWeight: 800,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {o.state==='idle' ? ['A','B','C','D'][i]
                   : <IconGlyph d={isCorrect?ICONS.check:ICONS.x} size={14} color="#fff" stroke={3}/>}
                </div>
                <span style={{ flex:1, fontFamily: t.body, fontSize: 17, fontWeight: 600, color: t.ink, letterSpacing:-0.3 }}>{o.label}</span>
              </div>
            </Glass>
          );
        })}
      </div>

      <div style={{ position:'absolute', bottom: 46, left: 16, right: 16 }}>
        <Glass pad={14} floating strong style={{ marginBottom: 10, border:`1px solid ${t.ok}40` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:22, height:22, borderRadius:999, background: t.ok, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <IconGlyph d={ICONS.check} size={12} color="#fff" stroke={3}/>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.ok }}>Correct · +8 XP</div>
          </div>
          <div style={{ fontSize: 13, color: t.inkSoft, marginTop: 6, lineHeight: 1.4, fontWeight: 500 }}>
            A Portuguese feeling of deep nostalgic longing — no English equivalent.
          </div>
        </Glass>
        <Btn kind="filled" full size="lg">Next word</Btn>
      </div>
    </PaperSurface>
  );
}

function ScreenLibrary() {
  const t = window.getLexioTokens();
  const groups = [
    { letter:'E', words:[
      { w:'efímero', m:'ephemeral · short-lived', score:40, state:'learning' },
      { w:'estrella', m:'star', score:95, state:'mastered' },
    ]},
    { letter:'K', words:[
      { w:'komorebi', m:'sunlight through leaves', score:20, state:'new' },
    ]},
    { letter:'S', words:[
      { w:'saudade', m:'nostalgic longing', score:30, state:'learning' },
    ]},
  ];
  const stateColor = s => s==='mastered'?t.ok : s==='learning'?t.warn : t.accent;

  return (
    <PaperSurface>
      <NavBar large prominentTitle="Library"
        trailing={<>
          <GlassIcon><IconGlyph d={ICONS.search} size={18} color={t.ink}/></GlassIcon>
          <GlassIcon><IconGlyph d={ICONS.plus} size={18} color={t.accent} stroke={2.4}/></GlassIcon>
        </>}
      />

      <div style={{ padding:'4px 16px 8px' }}>
        <Glass pad={0} floating radius={16}>
          <div style={{ display:'flex', alignItems:'center', gap:8, height: 40, padding:'0 14px' }}>
            <IconGlyph d={ICONS.search} size={16} color={t.inkSec} stroke={2.2}/>
            <span style={{ fontSize: 15, color: t.inkSec, fontWeight: 500 }}>Search 240 words</span>
          </div>
        </Glass>
      </div>

      <div style={{ display:'flex', gap:8, padding:'6px 16px 8px', overflowX:'auto' }}>
        {[
          { l:'All · 240', on:true },
          { l:'Due · 14' }, { l:'Learning · 62' }, { l:'Mastered · 164' },
        ].map((c,i) => c.on ? (
          <div key={i} style={{
            padding:'8px 14px', borderRadius:999, background: t.ink, color: t.dark?'#000':'#fff',
            fontSize:14, fontWeight:700, whiteSpace:'nowrap', letterSpacing:-0.1,
            boxShadow:'0 4px 14px rgba(0,0,0,0.18)',
          }}>{c.l}</div>
        ) : (
          <Glass key={i} pad={0} floating radius={999}>
            <div style={{ padding:'8px 14px', fontSize:14, fontWeight:600, color:t.ink, whiteSpace:'nowrap', letterSpacing:-0.1 }}>{c.l}</div>
          </Glass>
        ))}
      </div>

      <div style={{ padding:'0 0 140px' }}>
        {groups.map((g,gi) => (
          <div key={gi}>
            <SectionHeader>{g.letter}</SectionHeader>
            <div style={{ padding:'0 16px' }}>
              <Glass pad={0} floating>
                {g.words.map((w,i) => (
                  <GlassRow key={i}
                    isLast={i===g.words.length-1}
                    icon={ICONS.card} iconBg={stateColor(w.state)}
                    title={w.w} detail={w.m}
                    accessory={
                      <div style={{ height:22, padding:'0 10px', borderRadius:999, background: t.glassBg, border:`0.5px solid ${t.glassBorder}`,
                        color: t.inkSoft, fontSize: 12, fontWeight: 700, display:'flex', alignItems:'center' }}>{w.score}%</div>
                    }
                  />
                ))}
              </Glass>
            </div>
          </div>
        ))}
      </div>

      <TabBar active="library"/>
    </PaperSurface>
  );
}

function ScreenAddWord() {
  const t = window.getLexioTokens();
  return (
    <PaperSurface>
      <div style={{ padding:'56px 20px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize: 17, color: t.accent, fontWeight: 500 }}>Cancel</span>
        <span style={{ fontSize: 17, fontWeight: 700, color: t.ink }}>New Word</span>
        <span style={{ fontSize: 17, fontWeight: 700, color: t.accent }}>Save</span>
      </div>

      <div style={{ padding:'10px 16px 0' }}>
        <Glass pad={16} floating style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.inkSec, textTransform:'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Term · ES</div>
          <div style={{ fontFamily: t.display, fontSize: 30, fontWeight: 800, color: t.ink, letterSpacing:-0.7 }}>
            madrugar
            <span style={{ display:'inline-block', width:2, height:24, background:t.accent, marginLeft:2, verticalAlign:'middle', animation:'lexiblink 1s steps(2) infinite' }}/>
          </div>
        </Glass>
        <Glass pad={16} floating style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.inkSec, textTransform:'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Meaning · EN</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: t.ink, letterSpacing:-0.3 }}>to wake up early</div>
        </Glass>

        <SectionHeader style={{ padding:'10px 14px 6px' }}>Part of speech</SectionHeader>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {['noun','verb','adj','adv','phrase'].map(p => {
            const on = p==='verb';
            return on ? (
              <span key={p} style={{ padding:'8px 16px', borderRadius:999, background:t.accent, color:'#fff', fontSize:14, fontWeight:700, letterSpacing:-0.1, boxShadow:'0 4px 12px rgba(0,122,255,0.3)' }}>{p}</span>
            ) : (
              <Glass key={p} pad={0} floating radius={999}>
                <div style={{ padding:'8px 16px', fontSize:14, fontWeight:600, color:t.ink, letterSpacing:-0.1 }}>{p}</div>
              </Glass>
            );
          })}
        </div>

        <SectionHeader style={{ padding:'14px 14px 6px' }}>Example</SectionHeader>
        <Glass pad={16} floating style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 16, color: t.inkSoft, lineHeight: 1.5, fontStyle:'italic', fontWeight:500 }}>
            "Me gusta madrugar los sábados."
          </div>
        </Glass>

        <div style={{ marginTop: 6 }}>
          <Glass pad={14} floating strong>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{
                width:38, height:38, borderRadius:999,
                background:'linear-gradient(135deg,#AF52DE,#007AFF)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 4px 12px rgba(175,82,222,0.4)',
              }}>
                <IconGlyph d={ICONS.sparkle} size={18} color="#fff" stroke={2.2}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:700, color:t.ink, letterSpacing:-0.2 }}>Autofill with AI</div>
                <div style={{ fontSize:12, color:t.inkSec, marginTop:1, fontWeight:500 }}>Meaning, example, pronunciation</div>
              </div>
              <button style={{
                height:32, padding:'0 14px', borderRadius:999,
                background:t.accent, color:'#fff', border:'none',
                fontSize:14, fontWeight:700, cursor:'pointer',
              }}>Fill</button>
            </div>
          </Glass>
        </div>
      </div>
      <style>{`@keyframes lexiblink{50%{opacity:0}}`}</style>
    </PaperSurface>
  );
}

function ScreenStats() {
  const t = window.getLexioTokens();
  const week = [8,14,20,11,0,17,12];
  const day = ['M','T','W','T','F','S','S'];
  return (
    <PaperSurface>
      <NavBar large prominentTitle="Progress"
        trailing={<GlassIcon><IconGlyph d={ICONS.share} size={18} color={t.ink}/></GlassIcon>}
      />

      {/* Streak hero (gradient tile behind glass) */}
      <div style={{ padding:'8px 16px 0' }}>
        <div style={{
          borderRadius: t.radiusCard, overflow:'hidden',
          background:'linear-gradient(135deg,#FF9500,#FF3B30)',
          position:'relative', color:'#fff',
        }}>
          <div style={{ padding:22 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <IconGlyph d={ICONS.flame} size={20} color="#fff" stroke={2.2}/>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform:'uppercase' }}>Streak</span>
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:10, marginTop: 8 }}>
              <BigWord size={68} color="#fff" weight={800}>7</BigWord>
              <span style={{ fontSize: 18, fontWeight: 600, opacity: 0.92 }}>days · best 19</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:10, padding:'10px 16px 0' }}>
        <Glass pad={16} floating style={{ flex:1 }}>
          <div style={{ fontSize: 13, color: t.inkSec, fontWeight: 600 }}>Accuracy</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:4, marginTop:4 }}>
            <BigWord size={30} weight={800}>84</BigWord>
            <span style={{ fontSize: 16, color: t.inkSec, fontWeight: 700 }}>%</span>
          </div>
          <div style={{ fontSize: 12, color: t.ok, marginTop: 2, fontWeight: 700 }}>↑ 6% wk/wk</div>
        </Glass>
        <Glass pad={16} floating style={{ flex:1 }}>
          <div style={{ fontSize: 13, color: t.inkSec, fontWeight: 600 }}>Mastered</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:4, marginTop:4 }}>
            <BigWord size={30} weight={800}>164</BigWord>
            <span style={{ fontSize: 14, color: t.inkSec, fontWeight: 700 }}>/ 240</span>
          </div>
          <div style={{ fontSize: 12, color: t.inkSec, marginTop: 2, fontWeight: 600 }}>68% of library</div>
        </Glass>
      </div>

      <SectionHeader style={{ padding:'22px 32px 6px' }}>This week</SectionHeader>
      <div style={{ padding:'0 16px' }}>
        <Glass pad={18} floating>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <BigWord size={22} weight={800}>82</BigWord>
            <div style={{ fontSize: 13, color: t.inkSec, fontWeight: 600 }}>words reviewed</div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap: 8, height: 100, marginTop: 14 }}>
            {week.map((v,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{
                  width:'100%', height:`${(v/20)*84}px`,
                  background: v===0 ? t.rule2 : (i===2 ? t.accent : t.ink),
                  borderRadius: 6, minHeight: 4,
                }}/>
                <div style={{ fontSize: 11, color: t.inkSec, fontWeight: 600 }}>{day[i]}</div>
              </div>
            ))}
          </div>
        </Glass>
      </div>

      <SectionHeader style={{ padding:'22px 32px 6px' }}>Knowledge</SectionHeader>
      <div style={{ padding:'0 16px 140px' }}>
        <Glass pad={16} floating>
          <div style={{ display:'flex', height:14, borderRadius:99, overflow:'hidden', marginBottom:12 }}>
            <div style={{ width:'68%', background: t.ok }}/>
            <div style={{ width:'26%', background: t.warn }}/>
            <div style={{ width:'6%', background: t.red }}/>
          </div>
          {[{c:t.ok,l:'Mastered',n:164},{c:t.warn,l:'Learning',n:62},{c:t.red,l:'Struggling',n:14}].map((r,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0',
              borderTop: i===0?'none':`0.5px solid ${t.rule2}` }}>
              <div style={{ width:10, height:10, borderRadius:999, background:r.c }}/>
              <div style={{ flex:1, fontSize:15, color:t.ink, fontWeight:500 }}>{r.l}</div>
              <div style={{ fontSize:15, color:t.inkSoft, fontWeight:700 }}>{r.n}</div>
            </div>
          ))}
        </Glass>
      </div>

      <TabBar active="stats"/>
    </PaperSurface>
  );
}

function ScreenSettings() {
  const t = window.getLexioTokens();
  return (
    <PaperSurface>
      <NavBar large prominentTitle="Settings"
        leading={
          <span style={{ display:'inline-flex', alignItems:'center', gap:3, color:t.accent, padding:'0 4px' }}>
            <svg width="10" height="16" viewBox="0 0 10 16">
              <path d="M8 2L2 8l6 6" stroke={t.accent} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 16, fontWeight: 500 }}>Learn</span>
          </span>
        }
      />

      <div style={{ padding:'4px 16px 8px' }}>
        <Glass pad={16} floating>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:56, height:56, borderRadius:999,
              background:'linear-gradient(135deg,#007AFF,#AF52DE)', color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:22, fontWeight:800,
            }}>M</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: t.ink, letterSpacing:-0.3 }}>Miro</div>
              <div style={{ fontSize: 14, color: t.inkSec, marginTop: 1 }}>miro@example.com</div>
            </div>
            <svg width="8" height="13" viewBox="0 0 8 13"><path d="M1 1l6 5.5L1 12" stroke={t.inkFaint} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </Glass>
      </div>

      <SectionHeader>Daily practice</SectionHeader>
      <div style={{ padding:'0 16px' }}>
        <Glass pad={0} floating>
          <GlassRow icon={ICONS.flash} iconBg="#FF9500" title="Daily goal" detail="20 words"/>
          <GlassRow icon={ICONS.bell} iconBg="#FF3B30" title="Reminder" detail="9:00 AM"/>
          <GlassRow icon={ICONS.speaker} iconBg="#5856D6" title="Sound effects" chevron={false} accessory={<Toggle on={true}/>} isLast/>
        </Glass>
      </div>

      <SectionHeader>Quiz</SectionHeader>
      <div style={{ padding:'0 16px' }}>
        <Glass pad={0} floating>
          <GlassRow icon={ICONS.card} iconBg="#007AFF" title="Quiz mode" detail="Mixed"/>
          <GlassRow icon={ICONS.clock} iconBg="#34C759" title="Show hints" detail="After 10s"/>
          <GlassRow icon={ICONS.speaker} iconBg="#AF52DE" title="Auto-play pronunciation" chevron={false} accessory={<Toggle on={false}/>} isLast/>
        </Glass>
      </div>

      <SectionHeader>Data</SectionHeader>
      <div style={{ padding:'0 16px 140px' }}>
        <Glass pad={0} floating>
          <GlassRow icon={ICONS.share} iconBg="#30D158" title="Export vocabulary" detail="CSV"/>
          <GlassRow icon={ICONS.plus} iconBg="#0A84FF" title="Import from file"/>
          <GlassRow icon={ICONS.close} iconBg="#FF3B30" title="Reset progress" chevron={false} isLast/>
        </Glass>
      </div>

      <TabBar active="settings"/>
    </PaperSurface>
  );
}

Object.assign(window, {
  ScreenOnboarding, ScreenHome, ScreenQuizType, ScreenQuizMC,
  ScreenLibrary, ScreenAddWord, ScreenStats, ScreenSettings,
});
