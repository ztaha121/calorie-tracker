import { useState } from 'react'
import CalorieRing from '../components/CalorieRing.jsx'
import MacroBar from '../components/MacroBar.jsx'
import AddFoodModal from '../components/AddFoodModal.jsx'

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const WATER_GOAL = 8

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
    if (next === WATER_GOAL && n > 0) {
      setTimeout(() => alert('💧 Amazing! You hit your water goal for today!'), 100)
    }
  }

  function handleAdd(food) {
    if (editEntry) {
      onEdit(editEntry.id, food)
      setEditEntry(null)
    } else {
      onAdd(food)
    }
    setShowModal(false)
  }

  function startEdit(entry) {
    setEditEntry(entry)
    setShowModal(true)
  }

  const grouped = MEAL_ORDER.reduce((acc, meal) => {
    acc[meal] = entries.filter(e => e.meal === meal)
    return acc
  }, {})

  const ungrouped = entries.filter(e => !e.meal || !MEAL_ORDER.includes(e.meal))

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 90 }}>
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>
            {(() => {
              const h = new Date().getHours()
              const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
              const name = user?.user_metadata?.full_name?.split(' ')[0] || ''
              return name ? `${greeting}, ${name}` : greeting
            })()}
          </div>
        </div>
        <div style={{ background: 'rgba(168,224,99,0.12)', borderRadius: 99, padding: '7px 14px', color: '#a8e063', fontSize: 13, fontWeight: 500 }}>
          {goal} kcal goal
        </div>
      </div>

      <div style={{ padding: '24px 20px 8px', display: 'flex', justifyContent: 'center' }}>
        <CalorieRing consumed={Math.round(totals.calories)} goal={goal} />
      </div>

      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MacroBar label="Protein" value={totals.protein} goal={macroGoals.protein} color="#a8e063" />
        <MacroBar label="Carbs" value={totals.carbs} goal={macroGoals.carbs} color="#ffd166" />
        <MacroBar label="Fat" value={totals.fat} goal={macroGoals.fat} color="#ff9f68" />
      </div>

      {/* water tracker */}
      <div style={{ margin: '0 20px 20px', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>💧</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Water</span>
          </div>
          <span style={{ fontSize: 13, color: water >= WATER_GOAL ? '#a8e063' : '#666' }}>{water} / {WATER_GOAL} glasses</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {Array.from({ length: WATER_GOAL }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 8, borderRadius: 99,
              background: i < water ? '#5bb8f5' : 'rgba(255,255,255,0.08)',
              transition: 'background 0.2s'
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => addWater(-1)} style={{
            flex: 1, padding: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: 10,
            color: '#888', fontSize: 18
          }}>−</button>
          <button onClick={() => addWater(1)} style={{
            flex: 2, padding: '8px', background: 'rgba(91,184,245,0.15)', borderRadius: 10,
            color: '#5bb8f5', fontSize: 14, fontWeight: 500
          }}>+ Add glass</button>
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <button onClick={() => { setEditEntry(null); setShowModal(true) }} style={{
          width: '100%', padding: '15px', background: '#a8e063',
          borderRadius: 14, color: '#0e0e0f', fontSize: 16, fontWeight: 600
        }}>+ Add food</button>
      </div>

      {/* meal groups */}
      <div style={{ padding: '0 20px' }}>
        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#444' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🍽️</div>
            <div style={{ fontSize: 14 }}>Nothing logged yet.<br />Tap + Add food to start.</div>
          </div>
        ) : (
          <>
            {MEAL_ORDER.map(mealName => {
              const mealEntries = grouped[mealName]
              if (mealEntries.length === 0) return null
              const mealCals = Math.round(mealEntries.reduce((s, e) => s + (e.calories || 0), 0))
              return (
                <div key={mealName} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{mealName}</span>
                    <span style={{ fontSize: 12, color: '#a8e063' }}>{mealCals} kcal</span>
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
                <div style={{ fontSize: 12, fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Other</div>
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

function EntryRow({ entry, onRemove, onEdit }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 12px'
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#f0f0f0', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
        <div style={{ fontSize: 12, color: '#555' }}>{entry.time}{entry.per ? ` · ${entry.per}` : ''} · P {Math.round(entry.protein || 0)}g · C {Math.round(entry.carbs || 0)}g</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: '#a8e063' }}>{Math.round(entry.calories || 0)}</span>
        <button onClick={() => onEdit(entry)} style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: 8, width: 28, height: 28,
          color: '#888', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>✏️</button>
        <button onClick={() => { if (window.confirm('Delete this entry?')) onRemove(entry.id) }} style={{
          background: 'rgba(255,107,107,0.1)', borderRadius: 8, width: 28, height: 28,
          color: '#ff6b6b', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>×</button>
      </div>
    </div>
  )
}
