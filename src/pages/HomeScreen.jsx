import { useState } from 'react'
import AddFoodModal from '../components/AddFoodModal.jsx'

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const WATER_GOAL = 8

export default function HomeScreen({ entries, onAdd, onRemove, onEdit, goal, macroGoals, user, streak = 0 }) {
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [water, setWater] = useState(() => {
    const today = new Date().toISOString().split('T')[0]
    return Number(localStorage.getItem('water_' + today) || 0)
  })

  const totals = entries.reduce((acc, e) => ({
    calories: acc.calories + (e.calories || 0),
    protein: acc.protein + (e.protein || 0),
    carbs: acc.carbs + (e.carbs || 0),
    fat: acc.fat + (e.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const consumed = Math.round(totals.calories)
  const remaining = Math.max(0, goal - consumed)
  const progress = Math.min(consumed / goal, 1)
  const circumference = 2 * Math.PI * 54
  const strokeDash = circumference * progress
  const over = consumed > goal

  function addWater(n) {
    const today = new Date().toISOString().split('T')[0]
    const next = Math.max(0, Math.min(water + n, WATER_GOAL))
    setWater(next)
    localStorage.setItem('water_' + today, next)
    if (next === WATER_GOAL && n > 0) setTimeout(() => alert('💧 You hit your water goal!'), 100)
  }

  function handleAdd(food) {
    if (editEntry) { onEdit(editEntry.id, food); setEditEntry(null) }
    else onAdd(food)
    setShowModal(false)
  }

  function startEdit(entry) { setEditEntry(entry); setShowModal(true) }

  const grouped = MEAL_ORDER.reduce((acc, meal) => {
    acc[meal] = entries.filter(e => e.meal === meal)
    return acc
  }, {})
  const ungrouped = entries.filter(e => !e.meal || !MEAL_ORDER.includes(e.meal))

  const name = user?.user_metadata?.full_name?.split(' ')[0] || ''
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  const waterLiters = (water * 0.25).toFixed(1)
  const waterGoalLiters = (WATER_GOAL * 0.25).toFixed(1)
  const waterPct = Math.round((water / WATER_GOAL) * 100)

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 90, background: '#0e0e0f' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#a8e063', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: '#0e0e0f' }}>M</div>
          <span style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f0', letterSpacing: '-0.02em' }}>Mizan</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 99, padding: '6px 12px' }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0' }}>{streak}</span>
            </div>
          )}
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.07)', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
        <div style={{ fontSize: 22, fontWeight: 500, color: '#f0f0f0' }}>
          {name ? `${greeting}, ${name}` : greeting}
        </div>
      </div>

      {/* Calorie Card */}
      <div style={{ margin: '0 16px 12px', background: '#1a1a1c', borderRadius: 20, padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Ring */}
          <div style={{ position: 'relative', width: 128, height: 128, flexShrink: 0 }}>
            <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              <circle
                cx="64" cy="64" r="54" fill="none"
                stroke={over ? '#ff6b6b' : '#a8e063'}
                strokeWidth="10"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>Today</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.03em', lineHeight: 1 }}>{consumed.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>/ {goal.toLocaleString()} kcal</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: over ? '#ff6b6b' : '#a8e063', marginTop: 4 }}>{over ? `${consumed - goal} over` : `${remaining} left`}</div>
            </div>
          </div>
          {/* Breakdown */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0', marginBottom: 14 }}>Daily Calories</div>
            {[
              { label: 'Base Goal', value: goal.toLocaleString(), color: '#555' },
              { label: 'Food', value: consumed.toLocaleString(), color: '#a8e063' },
              { label: 'Remaining', value: remaining.toLocaleString(), color: over ? '#ff6b6b' : '#a8e063' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 99, background: row.color }} />
                  <span style={{ fontSize: 13, color: '#888' }}>{row.label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: row.color }}>{row.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, background: 'rgba(168,224,99,0.08)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: 12, color: '#a8e063', fontWeight: 500 }}>View Insights</span>
              <span style={{ fontSize: 12, color: '#a8e063' }}>›</span>
            </div>
          </div>
        </div>
      </div>

      {/* Macros Card */}
      <div style={{ margin: '0 16px 12px', background: '#1a1a1c', borderRadius: 20, padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0' }}>Macronutrients</span>
          <span style={{ fontSize: 13, color: '#a8e063' }}>Details ›</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { label: 'Protein', icon: '🌿', value: Math.round(totals.protein), goal: macroGoals.protein, color: '#a8e063' },
            { label: 'Carbs', icon: '🌾', value: Math.round(totals.carbs), goal: macroGoals.carbs, color: '#ffd166' },
            { label: 'Fat', icon: '💧', value: Math.round(totals.fat), goal: macroGoals.fat, color: '#ff9f68' },
          ].map(m => {
            const pct = Math.min(Math.round((m.value / m.goal) * 100), 100)
            return (
              <div key={m.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{m.icon}</div>
                  <span style={{ fontSize: 12, color: '#888' }}>{m.label}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.02em' }}>{m.value}<span style={{ fontSize: 11, color: '#555', fontWeight: 400 }}>g</span></div>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>/ {m.goal}g</div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: 99, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: m.color, marginTop: 4, fontWeight: 600 }}>{pct}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Water Card */}
      <div style={{ margin: '0 16px 12px', background: '#1a1a1c', borderRadius: 20, padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0' }}>Water</span>
          <span style={{ fontSize: 13, color: '#a8e063', cursor: 'pointer' }}>Edit Goal</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {Array.from({ length: WATER_GOAL }).map((_, i) => (
            <div key={i} onClick={() => i < water ? addWater(-1) : addWater(1)} style={{ cursor: 'pointer' }}>
              <svg width="22" height="28" viewBox="0 0 22 28">
                <path d="M11 2 C11 2, 2 12, 2 18 C2 23.5 6 27 11 27 C16 27 20 23.5 20 18 C20 12, 11 2 11 2Z"
                  fill={i < water ? '#5bb8f5' : 'rgba(255,255,255,0.1)'}
                  style={{ transition: 'fill 0.2s' }}
                />
              </svg>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => addWater(-1)} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, width: 32, height: 32, color: '#888', fontSize: 18 }}>−</button>
            <button onClick={() => addWater(1)} style={{ background: 'rgba(91,184,245,0.15)', borderRadius: 8, width: 32, height: 32, color: '#5bb8f5', fontSize: 18 }}>+</button>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.02em' }}>{waterLiters}<span style={{ fontSize: 13, color: '#555' }}> L</span> / {waterGoalLiters}<span style={{ fontSize: 13, color: '#555' }}> L</span></div>
            <div style={{ fontSize: 12, color: waterPct >= 100 ? '#a8e063' : '#5bb8f5', fontWeight: 600 }}>{waterPct}%</div>
          </div>
        </div>
      </div>

      {/* Add Meal Buttons */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 10 }}>
        <button onClick={() => { setEditEntry(null); setShowModal(true) }} style={{
          flex: 1, padding: '14px', background: '#a8e063',
          borderRadius: 14, color: '#0e0e0f', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em'
        }}>Add Meal +</button>
        <button onClick={() => { setEditEntry(null); setShowModal(true); setTimeout(() => window._mizanSetTab?.('scan'), 100) }} style={{
          width: 50, height: 50, background: 'rgba(168,224,99,0.12)', borderRadius: 14,
          color: '#a8e063', fontSize: 20, border: '0.5px solid rgba(168,224,99,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>📸</button>
        <button onClick={() => { setEditEntry(null); setShowModal(true); setTimeout(() => window._mizanSetTab?.('barcode'), 100) }} style={{
          width: 50, height: 50, background: 'rgba(168,224,99,0.12)', borderRadius: 14,
          color: '#a8e063', fontSize: 20, border: '0.5px solid rgba(168,224,99,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>📦</button>
      </div>

      {/* Meals Section */}
      <div style={{ margin: '0 16px', background: '#1a1a1c', borderRadius: 20, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0' }}>Meals</span>
          <button onClick={() => { setEditEntry(null); setShowModal(true) }} style={{ background: 'none', color: '#a8e063', fontSize: 13, fontWeight: 600 }}>Add Meal +</button>
        </div>

        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#444' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🍽️</div>
            <div style={{ fontSize: 14 }}>Nothing logged yet.<br />Tap Add Meal to start.</div>
          </div>
        ) : (
          <>
            {MEAL_ORDER.map(mealName => {
              const mealEntries = grouped[mealName]
              if (mealEntries.length === 0) return null
              const mealCals = Math.round(mealEntries.reduce((s, e) => s + (e.calories || 0), 0))
              return (
                <div key={mealName} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{mealName}</span>
                    <span style={{ fontSize: 12, color: '#a8e063', fontWeight: 600 }}>{mealCals} kcal</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {mealEntries.map((entry, idx) => (
                      <EntryRow key={entry.id} entry={entry} onRemove={onRemove} onEdit={startEdit} isLast={idx === mealEntries.length - 1} />
                    ))}
                  </div>
                </div>
              )
            })}
            {ungrouped.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Other</div>
                {ungrouped.map((entry, idx) => <EntryRow key={entry.id} entry={entry} onRemove={onRemove} onEdit={startEdit} isLast={idx === ungrouped.length - 1} />)}
              </div>
            )}
            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>📈</span>
                <span style={{ fontSize: 13, color: '#888' }}><span style={{ color: '#a8e063', fontWeight: 600 }}>{consumed.toLocaleString()} kcal</span> consumed</span>
              </div>
              <span style={{ fontSize: 13, color: '#a8e063', fontWeight: 600 }}>{Math.round((consumed / goal) * 100)}% of goal</span>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <AddFoodModal
          onAdd={handleAdd}
          onClose={() => { setShowModal(false); setEditEntry(null) }}
          editEntry={editEntry}
          user={user}
        />
      )}
    </div>
  )
}

function EntryRow({ entry, onRemove, onEdit, isLast }) {
  const [showMenu, setShowMenu] = useState(false)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0',
      borderBottom: isLast ? 'none' : '0.5px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(168,224,99,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        🍽️
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#f0f0f0', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
        <div style={{ fontSize: 12, color: '#555' }}>{Math.round(entry.calories || 0)} kcal · P {Math.round(entry.protein || 0)}g · C {Math.round(entry.carbs || 0)}g · F {Math.round(entry.fat || 0)}g</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#a8e063' }}>{Math.round(entry.calories || 0)}</span>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', color: '#555', fontSize: 18, padding: '4px', lineHeight: 1 }}>⋮</button>
          {showMenu && (
            <div style={{ position: 'absolute', right: 0, top: '100%', background: '#252527', borderRadius: 10, padding: '4px', zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', minWidth: 100 }}>
              <button onClick={() => { onEdit(entry); setShowMenu(false) }} style={{ display: 'block', width: '100%', padding: '8px 12px', color: '#f0f0f0', fontSize: 13, textAlign: 'left', borderRadius: 6 }}>✏️ Edit</button>
              <button onClick={() => { if (window.confirm('Delete this entry?')) onRemove(entry.id); setShowMenu(false) }} style={{ display: 'block', width: '100%', padding: '8px 12px', color: '#ff6b6b', fontSize: 13, textAlign: 'left', borderRadius: 6 }}>🗑️ Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
