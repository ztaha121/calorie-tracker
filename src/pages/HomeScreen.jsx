import { useState, useRef, useEffect } from 'react'
import CalorieRing from '../components/CalorieRing.jsx'
import MacroBar from '../components/MacroBar.jsx'
import AddFoodModal from '../components/AddFoodModal.jsx'
import FoodImage from '../components/FoodImage.jsx'

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const WATER_GOAL = 8
const MEAL_ICONS = { Breakfast: '☀️', Lunch: '🌤️', Dinner: '🌙', Snack: '⚡' }
const WATER_MESSAGES = ["You're glowing 💧", "Hydration queen! ✦", "8/8 — thriving 🌊", "Skin is eating 💦", "Your body says thank you 🫧"]

function Confetti({ active, onDone }) {
  const ref = useRef()
  useEffect(() => {
    if (!active) return
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight
    const pieces = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, y: -10 - Math.random() * 80,
      r: 3 + Math.random() * 4, d: 2 + Math.random() * 2,
      color: ['#00b96b','#3b82f6','#f97316','#8b5cf6','#ef4444'][Math.floor(Math.random() * 5)],
      tilt: 0, tiltAngle: 0, tiltSpeed: 0.05 + Math.random() * 0.1,
    }))
    let frame, done = false
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach(p => {
        p.tiltAngle += p.tiltSpeed; p.y += p.d; p.x += Math.sin(p.tiltAngle) * 1.2; p.tilt = Math.sin(p.tiltAngle) * 10
        ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y); ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2); ctx.stroke()
      })
      if (!done) frame = requestAnimationFrame(draw)
    }
    draw()
    const t = setTimeout(() => { done = true; cancelAnimationFrame(frame); onDone() }, 2200)
    return () => { done = true; cancelAnimationFrame(frame); clearTimeout(t) }
  }, [active])
  if (!active) return null
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }} />
}

export default function HomeScreen({ entries, onAdd, onRemove, onEdit, goal, macroGoals, user }) {
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [water, setWater] = useState(() => Number(localStorage.getItem('water_' + new Date().toISOString().split('T')[0]) || 0))
  const [showConfetti, setShowConfetti] = useState(false)
  const [waterMsg, setWaterMsg] = useState('')

  const totals = entries.reduce((acc, e) => ({
    calories: acc.calories + (e.calories || 0),
    protein:  acc.protein  + (e.protein  || 0),
    carbs:    acc.carbs    + (e.carbs    || 0),
    fat:      acc.fat      + (e.fat      || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  function addWater(n) {
    const key = 'water_' + new Date().toISOString().split('T')[0]
    const next = Math.max(0, Math.min(water + n, WATER_GOAL))
    setWater(next); localStorage.setItem(key, next)
    if (next === WATER_GOAL && n > 0) { setWaterMsg(WATER_MESSAGES[Math.floor(Math.random() * WATER_MESSAGES.length)]); setShowConfetti(true) }
  }

  function handleAdd(food) {
    if (editEntry) { onEdit(editEntry.id, food); setEditEntry(null) } else onAdd(food)
    setShowModal(false)
  }

  const grouped = MEAL_ORDER.reduce((acc, m) => { acc[m] = entries.filter(e => e.meal === m); return acc }, {})
  const ungrouped = entries.filter(e => !e.meal || !MEAL_ORDER.includes(e.meal))

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const name = user?.user_metadata?.full_name?.split(' ')[0] || ''
  const calories = Math.round(totals.calories)
  const remaining = Math.max(0, goal - calories)
  const over = calories > goal

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24, background: 'var(--bg)' }}>
      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />

      {waterMsg && showConfetti && (
        <div style={{
          position: 'fixed', top: 56, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-card)', borderRadius: 999, padding: '10px 20px', zIndex: 1000,
          fontSize: 14, fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap',
          animation: 'fadeInDown 0.3s ease', boxShadow: 'var(--shadow-soft)',
          border: '1px solid var(--accent-dim)',
        }}>{waterMsg}</div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 20px 0', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-hint)', fontWeight: 500, marginBottom: 2 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20 }}>
          {name ? `${greeting}, ${name} 👋` : greeting}
        </div>

        {/* Calorie ring + summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingBottom: 20 }}>
          <CalorieRing consumed={calories} goal={goal} />
          <div style={{ flex: 1 }}>
            {/* Remaining / over badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: over ? 'var(--danger-dim)' : 'var(--accent-dim)',
              borderRadius: 999, padding: '5px 12px', marginBottom: 14,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: over ? 'var(--danger)' : 'var(--accent)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: over ? 'var(--danger)' : 'var(--accent)' }}>
                {over ? `${calories - goal} over` : `${remaining} left`}
              </span>
            </div>

            {/* Quick stats */}
            {[
              { label: 'Eaten', value: `${calories} kcal` },
              { label: 'Goal', value: `${goal} kcal` },
              { label: 'Meals', value: `${MEAL_ORDER.filter(m => grouped[m]?.length > 0).length}/4` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Macros card */}
      <div style={{ margin: '12px 16px 0', background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14, letterSpacing: '-0.01em' }}>Macros</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MacroBar label="Protein" value={totals.protein} goal={macroGoals.protein} color="var(--blue)" />
          <MacroBar label="Carbs"   value={totals.carbs}   goal={macroGoals.carbs}   color="var(--orange)" />
          <MacroBar label="Fat"     value={totals.fat}     goal={macroGoals.fat}     color="var(--purple)" />
        </div>
      </div>

      {/* Water card */}
      <div style={{ margin: '12px 16px 0', background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{water === WATER_GOAL ? '🌊' : '💧'}</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{water === WATER_GOAL ? 'Fully hydrated!' : 'Water'}</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: water === WATER_GOAL ? 'var(--blue)' : 'var(--text-muted)' }}>
            {water}<span style={{ fontWeight: 400, color: 'var(--text-hint)' }}>/{WATER_GOAL}</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {Array.from({ length: WATER_GOAL }).map((_, i) => (
            <div key={i} onClick={() => { if (i >= water) addWater(i + 1 - water) }} style={{
              flex: 1, height: 6, borderRadius: 99,
              background: i < water ? 'var(--blue)' : 'var(--bg-card-2)',
              cursor: i >= water ? 'pointer' : 'default',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => addWater(-1)} style={{ flex: 1, padding: '10px', background: 'var(--bg-card-2)', borderRadius: 10, color: 'var(--text-muted)', fontSize: 18, fontWeight: 300 }}>−</button>
          <button onClick={() => addWater(1)} disabled={water >= WATER_GOAL} style={{ flex: 3, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: water >= WATER_GOAL ? 'var(--bg-card-2)' : 'var(--blue-dim)', color: water >= WATER_GOAL ? 'var(--text-hint)' : 'var(--blue)' }}>
            {water >= WATER_GOAL ? '✓ Goal reached' : '+ Add glass'}
          </button>
        </div>
      </div>

      {/* Log food button */}
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: 10 }}>
        <button onClick={() => { setEditEntry(null); setShowModal(true) }} style={{
          flex: 1, padding: '15px', background: 'var(--accent)', borderRadius: 'var(--radius)',
          color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em',
          boxShadow: 'var(--shadow-accent)',
        }}>+ Log food</button>
        <button onClick={() => { setEditEntry(null); setShowModal(true); setTimeout(() => window._mizanSetTab?.('scan'), 100) }} style={{ width: 54, height: 54, background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 22, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-card)' }}>📷</button>
        <button onClick={() => { setEditEntry(null); setShowModal(true); setTimeout(() => window._mizanSetTab?.('barcode'), 100) }} style={{ width: 54, height: 54, background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 22, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-card)' }}>📦</button>
      </div>

      {/* Meal groups */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>Today's meals</div>

        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1.5px dashed var(--border)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Nothing logged yet</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>Tap <strong>+ Log food</strong> to start tracking.</div>
          </div>
        ) : (
          <>
            {MEAL_ORDER.map(mealName => {
              const mealEntries = grouped[mealName]
              if (!mealEntries?.length) return null
              const mealCals = Math.round(mealEntries.reduce((s, e) => s + (e.calories || 0), 0))
              return (
                <div key={mealName} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{MEAL_ICONS[mealName]}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{mealName}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{mealCals} kcal</span>
                  </div>
                  <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    {mealEntries.map((entry, idx) => (
                      <EntryRow key={entry.id} entry={entry} onRemove={onRemove} onEdit={e => { setEditEntry(e); setShowModal(true) }} isLast={idx === mealEntries.length - 1} />
                    ))}
                  </div>
                </div>
              )
            })}
            {ungrouped.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Other</div>
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {ungrouped.map((entry, idx) => (
                    <EntryRow key={entry.id} entry={entry} onRemove={onRemove} onEdit={e => { setEditEntry(e); setShowModal(true) }} isLast={idx === ungrouped.length - 1} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && <AddFoodModal onAdd={handleAdd} onClose={() => { setShowModal(false); setEditEntry(null) }} editEntry={editEntry} user={user} />}
    </div>
  )
}

function EntryRow({ entry, onRemove, onEdit, isLast }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)', gap: 12 }}>
      {/* Food image */}
      <FoodImage name={entry.name} meal={entry.meal} size={44} borderRadius={10} />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{entry.time}{entry.per ? ` · ${entry.per}` : ''} · P {Math.round(entry.protein||0)}g · C {Math.round(entry.carbs||0)}g</div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', minWidth: 36, textAlign: 'right' }}>{Math.round(entry.calories||0)}</span>
        <button onClick={() => onEdit(entry)} style={{ width: 30, height: 30, background: 'var(--bg-card-2)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
        <button onClick={() => { if (window.confirm('Delete this entry?')) onRemove(entry.id) }} style={{ width: 30, height: 30, background: 'var(--danger-dim)', borderRadius: 8, color: 'var(--danger)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      </div>
    </div>
  )
}
