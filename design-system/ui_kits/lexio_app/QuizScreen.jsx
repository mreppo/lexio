const QuizScreen = ({ words, onExit, onComplete }) => {
  const [idx, setIdx] = React.useState(0);
  const [picked, setPicked] = React.useState(null);
  const [graded, setGraded] = React.useState(false);

  const w = words[idx];
  const total = words.length;

  const submit = () => {
    if (picked == null) return;
    setGraded(true);
  };

  const next = () => {
    if (idx + 1 >= total) {
      onComplete();
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
    setGraded(false);
  };

  const isCorrect = graded && picked === w.correct;

  return (
    <div style={{ padding: '20px 18px 110px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onExit} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', width: 36, height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="close" size={18} color={LX.color.ink} />
        </button>
        <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((idx + (graded ? 1 : 0)) / total) * 100}%`, background: LX.color.accent, borderRadius: 999, transition: `width 0.3s ${LX.ease}` }} />
        </div>
        <Pill>{idx + 1} / {total}</Pill>
      </div>

      <GlassCard padding={20} style={{ marginTop: 10 }}>
        <Pill tone="accent">Latvian → English</Pill>
        <div style={{ font: `800 44px ${LX.font.display}`, letterSpacing: '-1px', lineHeight: 1.05, color: LX.color.ink, marginTop: 14 }}>{w.term}</div>
        <div style={{ font: `500 15px ${LX.font.body}`, color: LX.color.inkSec, marginTop: 4 }}>{w.hint}</div>
      </GlassCard>

      <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
        {w.options.map((opt, i) => {
          let style = { background: 'rgba(255,255,255,0.7)', border: `0.5px solid ${LX.color.rule}`, color: LX.color.ink };
          if (graded) {
            if (i === w.correct) style = { background: LX.color.okSoft, border: `0.5px solid ${LX.color.ok}`, color: '#1F8E3F' };
            else if (i === picked) style = { background: LX.color.redSoft, border: `0.5px solid ${LX.color.red}`, color: '#C2241B' };
          } else if (picked === i) {
            style = { background: LX.color.accentSoft, border: `0.5px solid ${LX.color.accent}`, color: LX.color.accent };
          }
          return (
            <div key={i} onClick={() => !graded && setPicked(i)} style={{
              ...style,
              font: `600 17px ${LX.font.body}`,
              letterSpacing: '-0.3px',
              padding: '14px 16px',
              borderRadius: LX.radius.btn,
              cursor: graded ? 'default' : 'pointer',
              transition: `all 0.18s ${LX.ease}`,
            }}>{opt}</div>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {graded && (
          <div style={{ font: `700 15px ${LX.font.body}`, color: isCorrect ? '#1F8E3F' : '#C2241B', textAlign: 'center' }}>
            {isCorrect ? 'Correct · +1 XP' : `Answer: ${w.options[w.correct]}`}
          </div>
        )}
        {!graded
          ? <Button variant="primary" onClick={submit} disabled={picked == null} fullWidth>Submit</Button>
          : <Button variant="primary" onClick={next} fullWidth>{idx + 1 >= total ? 'Finish' : 'Next'}</Button>}
      </div>
    </div>
  );
};
window.QuizScreen = QuizScreen;
