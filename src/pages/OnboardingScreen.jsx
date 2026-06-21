import { useState } from 'react'

const STEPS = [
  { emoji: '🥗', title: 'Track what you eat', desc: 'Log meals in seconds. Search millions of foods or pick from our Arabic food library.' },
  { emoji: '📸', title: 'Scan with AI', desc: 'Point your camera at any plate. Our AI identifies the food and fills in the calories automatically.' },
  { emoji: '📈', title: 'See your progress', desc: 'Watch your streaks, macros, and weekly trends. Stay on top of your goals every day.' }
]

function calculateGoals({ weight, height, age, sex, activity, goalType }) {
  const w = Number(weight), h = Number(height), a = Number(age)
  if (!w || !h || !a) return null
  // Mifflin-St Jeor BMR
  const bmr = sex === 'female'
    ? 10 * w + 6.25 * h - 5 * a - 161
    : 10 * w + 6.25 * h - 5 * a + 5
  const activityMult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }
  const tdee = Math.round(bmr * (activityMult[activity] || 1.375))
  const calGoal = goalType === 'loss' ? Math.max(tdee - 500, 1200)
    : goalType === 'gain' ? tdee + 300
    : tdee
  // Macro split: protein 30%, carbs 40%, fat 30%
  const protein = Math.round((calGoal * 0.30) / 4)
  const carbs = Math.round((calGoal * 0.40) / 4)
  const fat = Math.round((calGoal * 0.30) / 9)
  return { goal: calGoal, macroGoals: { protein, carbs, fat } }
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
    // Recalculate macros if custom goal differs
    const ratio = finalGoal / base.goal
    const settings = {
      goal: finalGoal,
      macroGoals: calculated ? {
        protein: Math.round(base.macroGoals.protein * ratio),
        carbs: Math.round(base.macroGoals.carbs * ratio),
        fat: Math.round(base.macroGoals.fat * ratio),
      } : base.macroGoals,
      name,
      weight, height, age, sex, activity, goalType
    }
    localStorage.setItem('settings', JSON.stringify(settings))
    onDone()
  }

  const isSetup = step === STEPS.length

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 15
  }

  const chipStyle = (active) => ({
    flex: 1, padding: '10px 8px', borderRadius: 'var(--radius-sm)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
    background: active ? 'var(--accent-dim)' : 'var(--bg-input)',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    fontFamily: 'var(--font-display)'
  })

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto', padding: '0 24px', background: 'var(--bg)' }}>
      {!isSetup ? (
        <>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
            <div style={{ fontSize: 72 }}>{STEPS[step].emoji}</div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', marginBottom: 12, color: 'var(--text)' }}>{STEPS[step].title}</h1>
              <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6 }}>{STEPS[step].desc}</p>
            </div>
          </div>
          <div style={{ paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 99, background: i === step ? 'var(--accent)' : 'var(--border)', transition: 'width 0.3s ease' }} />
              ))}
            </div>
            <button onClick={next} style={{ width: '100%', padding: '15px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#0e0e0f', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', boxShadow: '0 4px 20px var(--accent-glow)' }}>
              {step === STEPS.length - 1 ? 'Set up my goals →' : 'Next →'}
            </button>
            <button onClick={finish} style={{ background: 'none', color: 'var(--text-hint)', fontSize: 13 }}>Skip setup</button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 48, paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Almost done</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', marginBottom: 6, color: 'var(--text)' }}>Set your goals</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>We'll calculate your perfect calorie and macro targets.</p>
          </div>

          {/* Name */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Your name</div>
            <input style={inputStyle} placeholder="e.g. Zaynab" value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Sex */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Sex</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSex('female')} style={chipStyle(sex === 'female')}>Female</button>
              <button onClick={() => setSex('male')} style={chipStyle(sex === 'male')}>Male</button>
            </div>
          </div>

          {/* Age, Weight, Height */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[['Age', age, setAge, 'yrs', '25'], ['Weight', weight, setWeight, 'kg', '65'], ['Height', height, setHeight, 'cm', '165']].map(([label, val, set, unit, ph]) => (
              <div key={label}>
                <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label} ({unit})</div>
                <input style={{ ...inputStyle, padding: '11px 10px' }} type="number" placeholder={ph} value={val} onChange={e => set(e.target.value)} />
              </div>
            ))}
          </div>

          {/* Activity */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Activity level</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['sedentary', 'Sedentary', 'Desk job, little exercise'], ['light', 'Light', '1–3 days/week'], ['moderate', 'Moderate', '3–5 days/week'], ['active', 'Active', '6–7 days/week']].map(([val, label, sub]) => (
                <button key={val} onClick={() => setActivity(val)} style={{ ...chipStyle(activity === val), display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', textAlign: 'left' }}>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Goal type */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Goal</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['loss', 'Lose weight'], ['maintain', 'Maintain'], ['gain', 'Build muscle']].map(([val, label]) => (
                <button key={val} onClick={() => setGoalType(val)} style={{ ...chipStyle(goalType === val), flex: 1, fontSize: 12 }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Calculate button */}
          <button onClick={handleCalculate} style={{ padding: '14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 14, fontWeight: 700, border: '1px solid var(--accent)', fontFamily: 'var(--font-display)' }}>
            ✦ Calculate my goals
          </button>

          {/* Calculated result */}
          {calculated && (
            <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', borderRadius: 'var(--radius)', padding: '16px' }}>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Your personalized targets</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[['Calories', calculated.goal, 'kcal'], ['Protein', calculated.macroGoals.protein, 'g'], ['Carbs', calculated.macroGoals.carbs, 'g'], ['Fat', calculated.macroGoals.fat, 'g']].map(([label, val, unit]) => (
                  <div key={label} style={{ textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-xs)', padding: '10px 6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>{val}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 2 }}>{unit}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-hint)' }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 6, fontWeight: 500 }}>Adjust calorie goal</div>
                <input style={inputStyle} type="number" value={customGoal} onChange={e => setCustomGoal(e.target.value)} />
              </div>
            </div>
          )}

          <button onClick={finish} style={{ padding: '15px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#0e0e0f', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', boxShadow: '0 4px 20px var(--accent-glow)' }}>
            Start tracking →
          </button>
        </div>
      )}
    </div>
  )
}
