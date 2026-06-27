import { useState, useRef, useEffect } from 'react'
import CalorieRing from '../components/CalorieRing.jsx'
import MacroBar from '../components/MacroBar.jsx'
import AddFoodModal from '../components/AddFoodModal.jsx'

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const WATER_GOAL = 8
const MEAL_ICONS = { Breakfast: '☀️', Lunch: '🌤️', Dinner: '🌙', Snack: '⚡' }
const WATER_MESSAGES = ["You're glowing 💧", "Hydration queen! ✦", "8/8 — body is thriving 🌊", "Skin is eating today 💦", "Your body says thank you 🫧"]

function Stars() {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() < 0.7 ? 1 : 1.5,
    dur: 2 + Math.random() * 4,
    delay: Math.random() * 4,
    minOp: 0.1 + Math.random() * 0.15,
    maxOp: 0.4 + Math.random() * 0.4,
  }))
  return (
    <div className="stars" aria-hidden>
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          '--dur': `${s.dur}s`,
          '--delay': `${s.delay}s`,
          '--min-op': s.minOp,
          '--max-op': s.maxOp,
        }} />
      ))}
    </div>
  )
}

function Confetti({ active, onDone }) {
  const canvasRef = useRef()
  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight
    const pieces = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, y: -10 - Math.random() * 80,
      r: 3 + Math.random() * 4, d: 2 + Math.random() * 2,
      color: ['#10b981','#6366f1','#a855f7','#f43f5e','#f59e0b'][Math.floor(Math.random() * 5)],
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
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }} />
}

export default function HomeScreen({ entries, onAdd, onRemove, onEdit, goal, macroGoals, user }) {
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [water, setWater] = useState(() => Number(localStorage.getItem('water_' + new Date().toISOString().split('T')[0]) || 0))
  const [showConfetti, setShowConfetti] = useState(false)
  const [waterMessage, setWaterMessage] = useState('')

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
    if (next === WATER_GOAL && n > 0) {
      setWaterMessage(WATER_MESSAGES[Math.floor(Math.random() * WATER_MESSAGES.length)])
      setShowConfetti(true)
    }
  }

  function handleAdd(food) {
    if (editEntry) { onEdit(editEntry.id, food); setEditEntry(null) } else onAdd(food)
    setShowModal(false)
  }

  const grouped = MEAL_ORDER.reduce((acc, m) => { acc[m] = entries.filter(e => e.meal === m); return acc }, {})
  const ungrouped = entries.filter(e => !e.meal || !MEAL_ORDER.includes(e.meal))

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'
  const name = user?.user_metadata?.full_name?.split(' ')[0] || ''
  const calories = Math.round(totals.calories)
  const remaining = Math.max(0, goal - calories)
  const over = calories > goal
  const pct = goal > 0 ? Math.min(calories / goal, 1) : 0

  // Background nebula color shifts with progress
  const nebulaColor = over ? 'rgba(239,68,68,0.06)' : pct > 0.85 ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.07)'

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 120, position: 'relative', background: 'var(--bg)' }}>
      <Stars />

      {/* Nebula blobs */}
      <div className="nebula" style={{ width: 300, height: 300, background: nebulaColor, top: -60, left: -60, transition: 'background 1s ease' }} />
      <div className="nebula" style={{ width: 200, height: 200, background: 'rgba(99,102,241,0.05)', top: 100, right: -60 }} />

      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />

      {waterMessage && showConfetti && (
        <div style={{
          position: 'fixed', top: 60, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(2,4,8,0.92)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: 999, padding: '10px 22px', zIndex: 1000,
          fontSize: 14, fontWeight: 600, color: '#10b981',
          whiteSpace: 'nowrap', animation: 'fadeInDown 0.3s ease',
          boxShadow: '0 0 32px rgba(16,185,129,0.3)',
        }}>{waterMessage}</div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 22px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-hint)', letterSpacing: '0.14em', marginBottom: 6 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{greeting},</div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, color: 'var(--text)' }}>
              {name || 'Explorer'} <span style={{ color: '#6366f1' }}>✦</span>
            </div>
          </div>
          <div style={{
            background: over ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.10)',
            border: `1px solid ${over ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            borderRadius: 999, padding: '6px 14px', marginTop: 8,
            color: over ? '#ef4444' : '#10b981',
            fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
          }}>
            {over ? `+${calories - goal} over` : `${remaining} left`}
          </div>
        </div>
      </div>

      {/* Hero calorie display */}
      <div style={{ padding: '24px 22px 0', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 24,
          padding: '28px 20px 20px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Inner glow */}
          <div style={{
            position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
            width: 180, height: 180, borderRadius: '50%',
            background: `radial-gradient(circle, ${over ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)'}, transparent 70%)`,
            filter: 'blur(20px)', pointerEvents: 'none',
            transition: 'background 1s ease',
          }} />

          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            <CalorieRing consumed={calories} goal={goal} />
          </div>

          {/* Stat row */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            gap: 1, background: 'rgba(255,255,255,0.04)',
            borderRadius: 14, overflow: 'hidden', marginTop: 16,
          }}>
            {[
              { label: 'EATEN', value: calories, unit: 'kcal' },
              { label: 'GOAL', value: goal, unit: 'kcal' },
              { label: 'MEALS', value: MEAL_ORDER.filter(m => grouped[m]?.length > 0).length, unit: 'of 4' },
            ].map(({ label, value, unit }) => (
              <div key={label} style={{ padding: '12px 6px', textAlign: 'center', background: 'rgba(2,4,8,0.4)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-hint)', letterSpacing: '0.10em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em' }}>
                  {value.toLocaleString()}<span style={{ fontSize: 10, color: 'var(--text-hint)', marginLeft: 2 }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Macros */}
      <div style={{ margin: '14px 22px 0', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 18, padding: '16px 18px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.14em', marginBottom: 14 }}>MACRONUTRIENTS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <MacroBar label="Protein" value={totals.protein} goal={macroGoals.protein} color="var(--indigo)" />
            <MacroBar label="Carbs"   value={totals.carbs}   goal={macroGoals.carbs}   color="var(--violet)" />
            <MacroBar label="Fat"     value={totals.fat}     goal={macroGoals.fat}     color="var(--rose)"   />
          </div>
        </div>
      </div>

      {/* Water */}
      <div style={{ margin: '14px 22px 0', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: water === WATER_GOAL ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${water === WATER_GOAL ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 18, padding: '16px 18px',
          transition: 'all 0.4s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: water === WATER_GOAL ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
              }}>{water === WATER_GOAL ? '🌊' : '💧'}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>
                  {water === WATER_GOAL ? 'Fully hydrated' : 'Hydration'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 1 }}>Daily goal · {WATER_GOAL} glasses</div>
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: water === WATER_GOAL ? '#6366f1' : 'var(--text-muted)', letterSpacing: '-0.02em' }}>
              {water}<span style={{ color: 'var(--text-hint)', fontWeight: 400, fontSize: 13 }}>/{WATER_GOAL}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
            {Array.from({ length: WATER_GOAL }).map((_, i) => (
              <div key={i} onClick={() => { if (i >= water) addWater(i + 1 - water) }} style={{
                flex: 1, height: 4, borderRadius: 99,
                background: i < water ? '#6366f1' : 'rgba(255,255,255,0.07)',
                boxShadow: i < water ? '0 0 8px rgba(99,102,241,0.5)' : 'none',
                transition: 'all 0.2s', cursor: i >= water ? 'pointer' : 'default',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => addWater(-1)} style={{
              flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)',
              borderRadius: 10, color: 'var(--text-muted)', fontSize: 18, fontWeight: 300,
            }}>−</button>
            <button onClick={() => addWater(1)} disabled={water >= WATER_GOAL} style={{
              flex: 3, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: water >= WATER_GOAL ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.14)',
              color: water >= WATER_GOAL ? 'rgba(99,102,241,0.4)' : '#6366f1',
            }}>{water >= WATER_GOAL ? '✓ Goal reached' : '+ Add glass'}</button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '16px 22px 8px', display: 'flex', gap: 10, position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => { setEditEntry(null); setShowModal(true) }}
          style={{
            flex: 1, padding: '16px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: 16, color: '#fff',
            fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
            boxShadow: '0 4px 24px rgba(16,185,129,0.35)',
          }}
        >+ Log food</button>
        <button onClick={() => { setEditEntry(null); setShowModal(true); setTimeout(() => window._mizanSetTab?.('scan'), 100) }}
          style={{ width: 54, height: 54, background: 'rgba(99,102,241,0.12)', borderRadius: 14, color: '#6366f1', fontSize: 22, border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📷</button>
        <button onClick={() => { setEditEntry(null); setShowModal(true); setTimeout(() => window._mizanSetTab?.('barcode'), 100) }}
          style={{ width: 54, height: 54, background: 'rgba(168,85,247,0.10)', borderRadius: 14, color: '#a855f7', fontSize: 22, border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📦</button>
      </div>

      {/* Food log */}
      <div style={{ padding: '8px 22px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em' }}>Today's log</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{entries.length} item{entries.length !== 1 ? 's' : ''}</div>
        </div>

        {entries.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 20, border: '1px dashed rgba(255,255,255,0.08)',
          }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🍽️</div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Nothing in orbit yet</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>Log your first meal to begin tracking.</div>
          </div>
        ) : (
          <>
            {MEAL_ORDER.map(mealName => {
              const mealEntries = grouped[mealName]
              if (!mealEntries?.length) return null
              const mealCals = Math.round(mealEntries.reduce((s, e) => s + (e.calories || 0), 0))
              return (
                <div key={mealName} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingLeft: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12 }}>{MEAL_ICONS[mealName]}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.10em' }}>{mealName.toUpperCase()}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>{mealCals} kcal</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
                    {mealEntries.map((entry, idx) => (
                      <EntryRow key={entry.id} entry={entry} onRemove={onRemove} onEdit={e => { setEditEntry(e); setShowModal(true) }} isLast={idx === mealEntries.length - 1} />
                    ))}
                  </div>
                </div>
              )
            })}
            {ungrouped.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.10em', marginBottom: 8, paddingLeft: 2 }}>OTHER</div>
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
                  {ungrouped.map((entry, idx) => (
                    <EntryRow key={entry.id} entry={entry} onRemove={onRemove} onEdit={e => { setEditEntry(e); setShowModal(true) }} isLast={idx === ungrouped.length - 1} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <AddFoodModal onAdd={handleAdd} onClose={() => { setShowModal(false); setEditEntry(null) }} editEntry={editEntry} user={user} />
      )}
    </div>
  )
}

function EntryRow({ entry, onRemove, onEdit, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '12px 16px',
      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>
          {entry.time}{entry.per ? ` · ${entry.per}` : ''} · P {Math.round(entry.protein || 0)}g · C {Math.round(entry.carbs || 0)}g
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#10b981', minWidth: 36, textAlign: 'right', letterSpacing: '-0.02em' }}>{Math.round(entry.calories || 0)}</span>
        <button onClick={() => onEdit(entry)} style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.05)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
        <button onClick={() => { if (window.confirm('Remove this entry?')) onRemove(entry.id) }} style={{ width: 30, height: 30, background: 'rgba(239,68,68,0.10)', borderRadius: 8, color: '#ef4444', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      </div>
    </div>
  )
}
