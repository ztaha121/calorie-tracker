import { useState } from 'react'

const STEPS = [
  { emoji: '⚖️', title: 'Track what you eat', desc: 'Log meals in seconds. Search millions of foods or pick from our Arabic food library.' },
  { emoji: '📸', title: 'Scan with AI', desc: 'Point your camera at any plate. Our AI identifies the food and fills in calories automatically.' },
  { emoji: '📈', title: 'See your progress', desc: 'Track streaks, macros, and weekly trends to hit your goals every day.' },
]

function calculateGoals({ weight, height, age, sex, activity, goalType }) {
  const w = Number(weight), h = Number(height), a = Number(age)
  if (!w || !h || !a) return null
  const bmr = sex === 'female' ? 10*w + 6.25*h - 5*a - 161 : 10*w + 6.25*h - 5*a + 5
  const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }
  const tdee = Math.round(bmr * (mult[activity] || 1.375))
  const goal = goalType === 'loss' ? Math.max(tdee - 500, 1200) : goalType === 'gain' ? tdee + 300 : tdee
  return { goal, macroGoals: { protein: Math.round((goal*0.30)/4), carbs: Math.round((goal*0.40)/4), fat: Math.round((goal*0.30)/9) } }
}

export default function OnboardingScreen({ onDone }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('female')
  const [activity, setActivity] = useState('moderate')
  const [goalType, setGoalType] = useState('maintain')
  const [customGoal, setCustomGoal] = useState('')
  const [calculated, setCalculated] = useState(null)

  const isSetup = step === STEPS.length

  function finish() {
    localStorage.setItem('onboarded', 'true')
    const base = calculated || { goal: 2000, macroGoals: { protein: 150, carbs: 200, fat: 65 } }
    const finalGoal = Number(customGoal) || base.goal
    const ratio = finalGoal / base.goal
    localStorage.setItem('settings', JSON.stringify({
      goal: finalGoal,
      macroGoals: calculated ? { protein: Math.round(base.macroGoals.protein*ratio), carbs: Math.round(base.macroGoals.carbs*ratio), fat: Math.round(base.macroGoals.fat*ratio) } : base.macroGoals,
      name, weight, height, age, sex, activity, goalType,
    }))
    onDone()
  }

  const inp = { width: '100%', padding: '13px 16px', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 15, fontFamily: 'inherit' }
  const chip = (active) => ({ flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', background: active ? 'var(--accent-dim)' : 'var(--bg-input)', border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`, color: active ? 'var(--accent)' : 'var(--text-muted)' })

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', maxWidth: 430, margin: '0 auto' }}>
      <div style={{ height: 4, background: 'var(--accent)' }} />

      {!isSetup ? (
        <>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px 28px', gap: 24 }}>
            <div style={{ width: 88, height: 88, borderRadius: 24, background: 'var(--accent-dim)', border: '2px solid var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>{STEPS[step].emoji}</div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>{STEPS[step].title}</h1>
              <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6 }}>{STEPS[step].desc}</p>
            </div>
          </div>
          <div style={{ padding: '0 28px 48px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {STEPS.map((_, i) => <div key={i} style={{ width: i === step ? 24 : 6, height: 6, borderRadius: 99, background: i === step ? 'var(--accent)' : 'var(--border)', transition: 'width 0.3s ease' }} />)}
            </div>
            <button onClick={() => step < STEPS.length - 1 ? setStep(s => s+1) : setStep(STEPS.length)} style={{ width: '100%', padding: '15px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 16, fontWeight: 700, boxShadow: 'var(--shadow-accent)' }}>
              {step === STEPS.length - 1 ? 'Set up my goals →' : 'Next →'}
            </button>
            <button onClick={finish} style={{ background: 'none', color: 'var(--text-hint)', fontSize: 13 }}>Skip setup</button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.10em', marginBottom: 8 }}>ALMOST DONE</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Set your goals</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>We'll calculate your calorie and macro targets.</p>
          </div>

          <div><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Your name</div><input style={inp} placeholder="e.g. Zaynab" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Sex</div><div style={{ display: 'flex', gap: 8 }}><button onClick={() => setSex('female')} style={chip(sex==='female')}>Female</button><button onClick={() => setSex('male')} style={chip(sex==='male')}>Male</button></div></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[['Age', age, setAge, 'yrs', '25'], ['Weight', weight, setWeight, 'kg', '65'], ['Height', height, setHeight, 'cm', '165']].map(([label, val, set, unit, ph]) => (
              <div key={label}><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>{label} ({unit})</div><input style={{ ...inp, padding: '11px 10px' }} type="number" placeholder={ph} value={val} onChange={e => set(e.target.value)} /></div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Activity level</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['sedentary','Sedentary','Desk job'],['light','Light','1–3x/week'],['moderate','Moderate','3–5x/week'],['active','Active','6–7x/week']].map(([val, label, sub]) => (
                <button key={val} onClick={() => setActivity(val)} style={{ ...chip(activity===val), display: 'flex', justifyContent: 'space-between', padding: '12px 14px', textAlign: 'left' }}>
                  <span style={{ fontWeight: 600 }}>{label}</span><span style={{ fontSize: 11, opacity: 0.7 }}>{sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Goal</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['loss','Lose weight'],['maintain','Maintain'],['gain','Build muscle']].map(([val, label]) => (
                <button key={val} onClick={() => setGoalType(val)} style={{ ...chip(goalType===val), flex: 1, fontSize: 12 }}>{label}</button>
              ))}
            </div>
          </div>

          <button onClick={() => { const r = calculateGoals({ weight, height, age, sex, activity, goalType }); if (r) { setCalculated(r); setCustomGoal(String(r.goal)) } }} style={{ padding: '13px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 14, fontWeight: 700, border: '1.5px solid var(--accent)' }}>
            ✦ Calculate my goals
          </button>

          {calculated && (
            <div style={{ background: 'var(--accent-dim)', border: '1.5px solid var(--accent-glow)', borderRadius: 'var(--radius)', padding: '16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 12 }}>YOUR TARGETS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                {[['Cal', calculated.goal, 'var(--accent)'], ['Pro', calculated.macroGoals.protein, 'var(--blue)'], ['Carb', calculated.macroGoals.carbs, 'var(--orange)'], ['Fat', calculated.macroGoals.fat, 'var(--purple)']].map(([label, val, color]) => (
                  <div key={label} style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{val}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 3 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Adjust calorie goal</div>
              <input style={inp} type="number" value={customGoal} onChange={e => setCustomGoal(e.target.value)} />
            </div>
          )}

          <button onClick={finish} style={{ padding: '15px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 16, fontWeight: 700, boxShadow: 'var(--shadow-accent)' }}>Start tracking →</button>
        </div>
      )}
    </div>
  )
}
