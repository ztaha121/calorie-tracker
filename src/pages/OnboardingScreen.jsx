import { useState } from 'react'

const STEPS = [
  { logo: true, title: 'Track what you eat', desc: 'Log meals in seconds. Search millions of foods or pick from our Arabic food library.' },
  { icon: 'scan', title: 'Scan with AI', desc: 'Point your camera at any plate. Our AI identifies the food and fills in calories automatically.' },
  { icon: 'chart', title: 'See your progress', desc: 'Track streaks, macros, and weekly trends to hit your goals every day.' },
]

function StepVisual({ step }) {
  if (step.logo) {
    return (
      <div className="onboard-hero-icon">
        <img src="/logo.png" alt="Mizan" />
      </div>
    )
  }
  if (step.icon === 'scan') {
    return (
      <div className="onboard-hero-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#00a862" strokeWidth="1.6" strokeLinecap="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </div>
    )
  }
  return (
    <div className="onboard-hero-icon">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round">
        <rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>
      </svg>
    </div>
  )
}

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

  return (
    <div className="onboard-screen">
      <div className="app-ambient">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
      </div>

      {!isSetup ? (
        <>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px 28px', gap: 28, position: 'relative', zIndex: 1 }}>
            <StepVisual step={STEPS[step]} />
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 12 }}>{STEPS[step].title}</h1>
              <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 300 }}>{STEPS[step].desc}</p>
            </div>
          </div>
          <div style={{ padding: '0 24px 48px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div className="onboard-dots">
              {STEPS.map((_, i) => (
                <div key={i} className={`onboard-dot${i === step ? ' active' : ''}`} style={{ width: i === step ? 24 : 6 }} />
              ))}
            </div>
            <button onClick={() => step < STEPS.length - 1 ? setStep(s => s+1) : setStep(STEPS.length)} className="btn-primary">
              {step === STEPS.length - 1 ? 'Set up my goals' : 'Continue'}
            </button>
            <button onClick={finish} className="auth-skip">Skip setup</button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px 48px', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 1 }}>
          <div>
            <div className="section-label" style={{ color: 'var(--accent)' }}>ALMOST DONE</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 6 }}>Set your goals</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>We'll calculate your calorie and macro targets.</p>
          </div>

          <div className="glass-card glass-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Your name</div>
              <input className="input-ios" placeholder="e.g. Zaynab" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Sex</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setSex('female')} className={`btn-chip${sex==='female' ? ' active' : ''}`}>Female</button>
                <button onClick={() => setSex('male')} className={`btn-chip${sex==='male' ? ' active' : ''}`}>Male</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[['Age', age, setAge, 'yrs', '25'], ['Weight', weight, setWeight, 'kg', '65'], ['Height', height, setHeight, 'cm', '165']].map(([label, val, set, unit, ph]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 6, fontWeight: 600 }}>{label} ({unit})</div>
                  <input className="input-ios" style={{ padding: '11px 10px', fontSize: 15 }} type="number" placeholder={ph} value={val} onChange={e => set(e.target.value)} />
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Activity level</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['sedentary','Sedentary','Desk job'],['light','Light','1–3x/week'],['moderate','Moderate','3–5x/week'],['active','Active','6–7x/week']].map(([val, label, sub]) => (
                  <button key={val} onClick={() => setActivity(val)} className={`btn-chip${activity===val ? ' active' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', textAlign: 'left' }}>
                    <span>{label}</span><span style={{ fontSize: 11, opacity: 0.7 }}>{sub}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Goal</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['loss','Lose weight'],['maintain','Maintain'],['gain','Build muscle']].map(([val, label]) => (
                  <button key={val} onClick={() => setGoalType(val)} className={`btn-chip${goalType===val ? ' active' : ''}`} style={{ fontSize: 12 }}>{label}</button>
                ))}
              </div>
            </div>
            <button onClick={() => { const r = calculateGoals({ weight, height, age, sex, activity, goalType }); if (r) { setCalculated(r); setCustomGoal(String(r.goal)) } }} className="btn-secondary" style={{ width: '100%', color: 'var(--accent)', borderColor: 'var(--accent-glow)' }}>
              Calculate my goals
            </button>
            {calculated && (
              <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', borderRadius: 14, padding: 16 }}>
                <div className="section-label" style={{ color: 'var(--accent)', marginBottom: 12 }}>YOUR TARGETS</div>
                <div className="stat-grid stat-grid-3" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                  {[['Cal', calculated.goal, 'var(--accent)'], ['Pro', calculated.macroGoals.protein, 'var(--blue)'], ['Carb', calculated.macroGoals.carbs, 'var(--orange)'], ['Fat', calculated.macroGoals.fat, 'var(--purple)']].map(([label, val, color]) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{val}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 3 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Adjust calorie goal</div>
                <input className="input-ios" type="number" value={customGoal} onChange={e => setCustomGoal(e.target.value)} />
              </div>
            )}
          </div>

          <button onClick={finish} className="btn-primary">Start tracking</button>
        </div>
      )}
    </div>
  )
}
