import { useState } from 'react'

const STEPS = [
  { emoji: '⚖️', title: 'Welcome to Mizan', desc: 'Track Arabic and international food with AI. Your personal nutrition companion.' },
  { emoji: '📸', title: 'Scan with AI', desc: 'Point your camera at any plate. Our AI identifies the food and fills in calories automatically.' },
  { emoji: '🌌', title: 'Track your orbit', desc: 'Watch streaks, macros, and weekly progress. Stay aligned with your goals every day.' }
]

function calculateGoals({ weight, height, age, sex, activity, goalType }) {
  const w = Number(weight), h = Number(height), a = Number(age)
  if (!w || !h || !a) return null
  const bmr = sex === 'female' ? 10*w + 6.25*h - 5*a - 161 : 10*w + 6.25*h - 5*a + 5
  const activityMult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }
  const tdee = Math.round(bmr * (activityMult[activity] || 1.375))
  const calGoal = goalType === 'loss' ? Math.max(tdee - 500, 1200) : goalType === 'gain' ? tdee + 300 : tdee
  return { goal: calGoal, macroGoals: { protein: Math.round((calGoal*0.30)/4), carbs: Math.round((calGoal*0.40)/4), fat: Math.round((calGoal*0.30)/9) } }
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

  function next() { if (step < STEPS.length) setStep(s => s + 1) }

  function handleCalculate() {
    const result = calculateGoals({ weight, height, age, sex, activity, goalType })
    if (result) { setCalculated(result); setCustomGoal(String(result.goal)) }
  }

  function finish() {
    localStorage.setItem('onboarded', 'true')
    const base = calculated || { goal: 2000, macroGoals: { protein: 150, carbs: 200, fat: 65 } }
    const finalGoal = Number(customGoal) || base.goal
    const ratio = finalGoal / base.goal
    const settings = {
      goal: finalGoal,
      macroGoals: calculated ? { protein: Math.round(base.macroGoals.protein*ratio), carbs: Math.round(base.macroGoals.carbs*ratio), fat: Math.round(base.macroGoals.fat*ratio) } : base.macroGoals,
      name, weight, height, age, sex, activity, goalType,
    }
    localStorage.setItem('settings', JSON.stringify(settings))
    onDone()
  }

  const isSetup = step === STEPS.length

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, color: '#f0f4ff', fontSize: 15,
    fontFamily: "'Space Grotesk', sans-serif",
  }

  const chipStyle = (active) => ({
    flex: 1, padding: '10px 8px', borderRadius: 10,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
    background: active ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${active ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)'}`,
    color: active ? '#10b981' : 'rgba(240,244,255,0.45)',
  })

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto', padding: '0 24px', background: '#020408', position: 'relative', overflow: 'hidden' }}>
      {/* Cosmic bg */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(16,185,129,0.07)', filter: 'blur(80px)', top: -80, left: -80 }} />
        <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: 'rgba(99,102,241,0.06)', filter: 'blur(60px)', bottom: -60, right: -60 }} />
      </div>

      {!isSetup ? (
        <>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 28, position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 96, height: 96, borderRadius: 28,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 44,
              boxShadow: '0 0 40px rgba(16,185,129,0.15)',
            }}>{STEPS[step].emoji}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,244,255,0.3)', letterSpacing: '0.14em', marginBottom: 10 }}>{step + 1} OF {STEPS.length}</div>
              <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', marginBottom: 14, color: '#f0f4ff', lineHeight: 1.1 }}>{STEPS[step].title}</h1>
              <p style={{ fontSize: 16, color: 'rgba(240,244,255,0.5)', lineHeight: 1.65, maxWidth: 300 }}>{STEPS[step].desc}</p>
            </div>
          </div>
          <div style={{ paddingBottom: 52, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ width: i === step ? 24 : 6, height: 6, borderRadius: 99, background: i === step ? '#10b981' : 'rgba(255,255,255,0.12)', transition: 'width 0.3s ease', boxShadow: i === step ? '0 0 8px rgba(16,185,129,0.5)' : 'none' }} />
              ))}
            </div>
            <button onClick={next} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700, boxShadow: '0 4px 24px rgba(16,185,129,0.35)' }}>
              {step === STEPS.length - 1 ? 'Set up my goals →' : 'Continue →'}
            </button>
            <button onClick={finish} style={{ background: 'none', color: 'rgba(240,244,255,0.3)', fontSize: 13 }}>Skip setup</button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 52, paddingBottom: 52, display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: '0.14em', marginBottom: 10 }}>ALMOST THERE</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', marginBottom: 8, color: '#f0f4ff' }}>Set your goals</h1>
            <p style={{ color: 'rgba(240,244,255,0.45)', fontSize: 14 }}>We'll calculate your perfect calorie and macro targets.</p>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,244,255,0.3)', marginBottom: 8, letterSpacing: '0.12em' }}>YOUR NAME</div>
            <input style={inputStyle} placeholder="e.g. Zaynab" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,244,255,0.3)', marginBottom: 8, letterSpacing: '0.12em' }}>SEX</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSex('female')} style={chipStyle(sex === 'female')}>Female</button>
              <button onClick={() => setSex('male')} style={chipStyle(sex === 'male')}>Male</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[['Age', age, setAge, 'yrs', '25'], ['Weight', weight, setWeight, 'kg', '65'], ['Height', height, setHeight, 'cm', '165']].map(([label, val, set, unit, ph]) => (
              <div key={label}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,244,255,0.3)', marginBottom: 8, letterSpacing: '0.12em' }}>{label.toUpperCase()}</div>
                <input style={{ ...inputStyle, padding: '11px 10px' }} type="number" placeholder={ph} value={val} onChange={e => set(e.target.value)} />
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,244,255,0.3)', marginBottom: 8, letterSpacing: '0.12em' }}>ACTIVITY LEVEL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['sedentary','Sedentary','Desk job, little exercise'],['light','Light','1–3 days/week'],['moderate','Moderate','3–5 days/week'],['active','Active','6–7 days/week']].map(([val, label, sub]) => (
                <button key={val} onClick={() => setActivity(val)} style={{ ...chipStyle(activity === val), display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', textAlign: 'left' }}>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 400 }}>{sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,244,255,0.3)', marginBottom: 8, letterSpacing: '0.12em' }}>GOAL</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['loss','Lose weight'],['maintain','Maintain'],['gain','Build muscle']].map(([val, label]) => (
                <button key={val} onClick={() => setGoalType(val)} style={{ ...chipStyle(goalType === val), flex: 1, fontSize: 12 }}>{label}</button>
              ))}
            </div>
          </div>

          <button onClick={handleCalculate} style={{ padding: '14px', background: 'rgba(16,185,129,0.10)', borderRadius: 12, color: '#10b981', fontSize: 14, fontWeight: 700, border: '1px solid rgba(16,185,129,0.3)' }}>
            ✦ Calculate my goals
          </button>

          {calculated && (
            <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 18, padding: '18px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: '0.12em', marginBottom: 14 }}>YOUR TARGETS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                {[['Cal', calculated.goal, '#10b981'], ['Pro', calculated.macroGoals.protein, '#6366f1'], ['Carb', calculated.macroGoals.carbs, '#a855f7'], ['Fat', calculated.macroGoals.fat, '#f43f5e']].map(([label, val, color]) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 6px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{val}</div>
                    <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.3)', marginTop: 3 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,244,255,0.3)', marginBottom: 8, letterSpacing: '0.12em' }}>ADJUST CALORIE GOAL</div>
                <input style={inputStyle} type="number" value={customGoal} onChange={e => setCustomGoal(e.target.value)} />
              </div>
            </div>
          )}

          <button onClick={finish} style={{ padding: '16px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700, boxShadow: '0 4px 24px rgba(16,185,129,0.35)' }}>
            Begin my journey →
          </button>
        </div>
      )}
    </div>
  )
}
