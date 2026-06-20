import { useState } from 'react'

const STEPS = [
  {
    emoji: '🥗',
    title: 'Track what you eat',
    desc: 'Log meals in seconds. Search millions of foods or pick from our Arabic food library.'
  },
  {
    emoji: '📸',
    title: 'Scan with AI',
    desc: 'Point your camera at any plate. Our AI identifies the food and fills in the calories automatically.'
  },
  {
    emoji: '📈',
    title: 'See your progress',
    desc: 'Watch your streaks, macros, and weekly trends. Stay on top of your goals every day.'
  }
]

export default function OnboardingScreen({ onDone }) {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState('2000')
  const [name, setName] = useState('')

  function next() {
    if (step < STEPS.length) setStep(s => s + 1)
  }

  function finish() {
    localStorage.setItem('onboarded', 'true')
    const settings = {
      goal: Number(goal) || 2000,
      macroGoals: { protein: 150, carbs: 200, fat: 65 },
      name
    }
    localStorage.setItem('settings', JSON.stringify(settings))
    onDone()
  }

  const isSetup = step === STEPS.length

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto', padding: '0 28px' }}>

      {!isSetup ? (
        <>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 24 }}>
            <div style={{ fontSize: 72 }}>{STEPS[step].emoji}</div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 12 }}>{STEPS[step].title}</h1>
              <p style={{ fontSize: 16, color: '#666', lineHeight: 1.6 }}>{STEPS[step].desc}</p>
            </div>
          </div>

          <div style={{ paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i === step ? 20 : 6, height: 6, borderRadius: 99,
                  background: i === step ? '#a8e063' : 'rgba(255,255,255,0.15)',
                  transition: 'width 0.3s ease'
                }} />
              ))}
            </div>
            <button onClick={next} style={{
              width: '100%', padding: '15px', background: '#a8e063',
              borderRadius: 14, color: '#0e0e0f', fontSize: 16, fontWeight: 600
            }}>
              {step === STEPS.length - 1 ? 'Set up my goals →' : 'Next →'}
            </button>
            <button onClick={finish} style={{ background: 'none', color: '#444', fontSize: 13 }}>
              Skip setup
            </button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
          <div>
            <div style={{ fontSize: 13, color: '#a8e063', fontWeight: 500, marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Almost done</div>
            <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 8 }}>Set your daily goal</h1>
            <p style={{ color: '#666', fontSize: 15 }}>You can always change this later in Profile.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your name</div>
              <input
                style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f0f0f0', fontSize: 16 }}
                placeholder="e.g. Zaynab"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Daily calorie goal</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[['1500', 'Weight loss'], ['2000', 'Maintenance'], ['2500', 'Active'], ['3000', 'Build muscle']].map(([val, label]) => (
                  <button key={val} onClick={() => setGoal(val)} style={{
                    padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 500,
                    background: goal === val ? 'rgba(168,224,99,0.15)' : 'rgba(255,255,255,0.04)',
                    border: goal === val ? '1px solid rgba(168,224,99,0.4)' : '0.5px solid rgba(255,255,255,0.08)',
                    color: goal === val ? '#a8e063' : '#666'
                  }}>
                    <div>{val} kcal</div>
                    <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>{label}</div>
                  </button>
                ))}
              </div>
              <input
                style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f0f0f0', fontSize: 16 }}
                placeholder="Or enter custom amount"
                type="number"
                value={goal}
                onChange={e => setGoal(e.target.value)}
              />
            </div>
          </div>

          <button onClick={finish} style={{
            padding: '15px', background: '#a8e063', borderRadius: 14,
            color: '#0e0e0f', fontSize: 16, fontWeight: 600
          }}>
            Start tracking →
          </button>
        </div>
      )}
    </div>
  )
}
