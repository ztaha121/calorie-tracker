import { useState } from 'react'
import CalorieRing from '../components/CalorieRing.jsx'
import MacroBar from '../components/MacroBar.jsx'
import AddFoodModal from '../components/AddFoodModal.jsx'

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const WATER_GOAL = 8

const MEAL_ICONS = { Breakfast: '☀️', Lunch: '🌤️', Dinner: '🌙', Snack: '⚡' }

export default function HomeScreen({ entries, onAdd, onRemove, onEdit, goal, macroGoals, user }) {
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

  function addWater(n) {
    const today = new Date().toISOString().split('T')[0]
    const next = Math.max(0, Math.min(water + n, WATER_GOAL))
    setWater(next)
    localStorage.setItem('water_' + today, next)
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

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const name = user?.user_metadata?.full_name?.split(' ')[0] || ''
  const remaining = Math.max(0, goal - Math.round(totals.calories))
  const overGoal = totals.calories > goal

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ padding: '24px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1 }}>
            {name ? `${greeting},` : greeting}
            {name && <span style={{ display: 'block', color: 'var(--accent)' }}>{name} ✦</span>}
          </div>
        </div>
        <div style={{
          background: overGoal ? 'var(--danger-dim)' : 'var(--accent-dim)',
          border: `1px solid ${overGoal ? 'var(--danger)' : 'var(--accent)'}`,
          borderRadius: 99, padding: '6px 14px',
          color: overGoal ? 'var(--danger)' : 'var(--accent)',
          fontSize: 12, fontWeight: 600, marginTop: 4
        }}>
          {overGoal ? `+${Math.round(totals.calories - goal)} over` : `${remaining} left`}
        </div>
      </div>

      {/* Calorie ring */}
      <div style={{ padding: '20px 20px 8px', display: 'flex', justifyContent: 'center' }}>
        <CalorieRing consumed={Math.round(totals.calories)} goal={goal} />
      </div>

      {/* Macros */}
      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <MacroBar label="Protein" value={totals.protein} goal={macroGoals.protein} color="var(--protein-color)" />
        <MacroBar label="Carbs" value={totals.carbs} goal={macroGoals.carbs} color="var(--carbs-color)" />
        <MacroBar label="Fat" value={totals.fat} goal={macroGoals.fat} color="var(--fat-color)" />
      </div>

      {/* Water tracker */}
      <div style={{
        margin: '0 20px 20px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>💧</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Hydration</span>
          </div>
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: water >= WATER_GOAL ? 'var(--accent)' : 'var(--text-muted)',
          }}>{water} / {WATER_GOAL}</span>
        </div>
        <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
          {Array.from({ length: WATER_GOAL }).map((_, i) => (
            <div key={i} onClick={() => { if (i < water) addWater(i + 1 - water); else addWater(i + 1 - water) }} style={{
              flex: 1, height: 6, borderRadius: 99,
              background: i < water ? '#5bb8f5' : 'var(--border)',
              transition: 'background 0.2s', cursor: 'pointer'
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => addWater(-1)} style={{
            flex: 1, padding: '9px', background: 'var(--bg-input)',
            borderRadius: 'var(--radius-xs)', color: 'var(--text-muted)', fontSize: 18
          }}>−</button>
          <button onClick={() => addWater(1)} style={{
            flex: 2, padding: '9px', background: 'rgba(91,184,245,0.12)',
            borderRadius: 'var(--radius-xs)', color: '#5bb8f5', fontSize: 13, fontWeight: 600,
            border: '1px solid rgba(91,184,245,0.2)'
          }}>+ Add glass</button>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
        <button onClick={() => { setEditEntry(null); setShowModal(true) }} style={{
          flex: 1, padding: '15px',
          background: 'var(--accent)',
          borderRadius: 'var(--radius)',
          color: '#0e0e0f', fontSize: 15, fontWeight: 700,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.01em',
          boxShadow: '0 4px 20px var(--accent-glow)'
        }}>+ Log food</button>
        <button onClick={() => { setEditEntry(null); setShowModal(true); setTimeout(() => window._mizanSetTab?.('scan'), 100) }} style={{
          width: 52, height: 52, background: 'var(--accent-dim)',
          borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 20,
          border: '1px solid var(--accent-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>📸</button>
        <button onClick={() => { setEditEntry(null); setShowModal(true); setTimeout(() => window._mizanSetTab?.('barcode'), 100) }} style={{
          width: 52, height: 52, background: 'var(--bg-card)',
          borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 20,
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>📦</button>
      </div>

      {/* Meal groups */}
      <div style={{ padding: '0 20px' }}>
        {entries.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'var(--bg-card)', borderRadius: 'var(--radius)',
            border: '1px dashed var(--border)'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: 6 }}>Nothing logged yet</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Tap + Log food to get started.</div>
          </div>
        ) : (
          <>
            {MEAL_ORDER.map(mealName => {
              const mealEntries = grouped[mealName]
              if (mealEntries.length === 0) return null
              const mealCals = Math.round(mealEntries.reduce((s, e) => s + (e.calories || 0), 0))
              return (
                <div key={mealName} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{MEAL_ICONS[mealName]}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>{mealName}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{mealCals} kcal</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {mealEntries.map(entry => (
                      <EntryRow key={entry.id} entry={entry} onRemove={onRemove} onEdit={startEdit} />
                    ))}
                  </div>
                </div>
              )
            })}
            {ungrouped.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Other</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ungrouped.map(entry => (
                    <EntryRow key={entry.id} entry={entry} onRemove={onRemove} onEdit={startEdit} />
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

function EntryRow({ entry, onRemove, onEdit }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '11px 14px'
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>
          {entry.time}{entry.per ? ` · ${entry.per}` : ''} · P {Math.round(entry.protein || 0)}g · C {Math.round(entry.carbs || 0)}g
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>{Math.round(entry.calories || 0)}</span>
        <button onClick={() => onEdit(entry)} style={{
          background: 'var(--bg-input)', borderRadius: 8, width: 30, height: 30,
          color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>✏️</button>
        <button onClick={() => { if (window.confirm('Delete this entry?')) onRemove(entry.id) }} style={{
          background: 'var(--danger-dim)', borderRadius: 8, width: 30, height: 30,
          color: 'var(--danger)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>×</button>
      </div>
    </div>
  )
}
