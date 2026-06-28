import { useState, useRef, useEffect, useCallback } from 'react'
import CalorieRing from '../components/CalorieRing.jsx'
import MacroBar from '../components/MacroBar.jsx'
import AddFoodModal from '../components/AddFoodModal.jsx'
import FoodImage from '../components/FoodImage.jsx'
import StreakProtection from '../components/StreakProtection.jsx'

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const WATER_GOAL = 8
const MEAL_ICONS = { Breakfast: '☀️', Lunch: '🌤️', Dinner: '🌙', Snack: '⚡' }
const WATER_MESSAGES = ["You're glowing 💧", "Hydration queen! ✦", "8/8 — thriving 🌊", "Skin is eating 💦", "Your body says thank you 🫧"]
const GOAL_MESSAGES = ["Goal crushed! 🎯", "Perfect day! 🏆", "You did it! ⚡", "On point! ✨", "Nailed it today! 💪"]
const GUMROAD_URL = 'https://zaytaha.gumroad.com/l/cyfiz'

// ── Streak calculation ────────────────────────────────────────────────────────
function getStreak(allEntries) {
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const key = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
    if ((allEntries?.[key] || []).length > 0) streak++
    else break
  }
  return streak
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti({ active, onDone }) {
  const ref = useRef()
  useEffect(() => {
    if (!active) return
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight
    const pieces = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width, y: -10 - Math.random() * 80,
      r: 3 + Math.random() * 5, d: 2 + Math.random() * 3,
      color: ['#00b96b','#3b82f6','#f97316','#8b5cf6','#ffd700','#ef4444'][Math.floor(Math.random() * 6)],
      tilt: 0, tiltAngle: 0, tiltSpeed: 0.04 + Math.random() * 0.1,
    }))
    let frame, done = false
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach(p => {
        p.tiltAngle += p.tiltSpeed; p.y += p.d; p.x += Math.sin(p.tiltAngle) * 1.5; p.tilt = Math.sin(p.tiltAngle) * 10
        ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y); ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2); ctx.stroke()
      })
      if (!done) frame = requestAnimationFrame(draw)
    }
    draw()
    const t = setTimeout(() => { done = true; cancelAnimationFrame(frame); onDone() }, 2800)
    return () => { done = true; cancelAnimationFrame(frame); clearTimeout(t) }
  }, [active])
  if (!active) return null
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }} />
}

// ── Share card generator ───────────────────────────────────────────────────────
function generateShareText({ name, calories, goal, protein, carbs, fat, streak, water }) {
  const pct = Math.round((calories / goal) * 100)
  const bar = '█'.repeat(Math.min(10, Math.round(pct / 10))) + '░'.repeat(Math.max(0, 10 - Math.round(pct / 10)))
  return `🥗 Mizan Daily Summary
${name ? `👤 ${name}` : ''}
━━━━━━━━━━━━━━━
🔥 Calories: ${calories}/${goal} kcal
${bar} ${pct}%

💪 Protein: ${Math.round(protein)}g
🌾 Carbs: ${Math.round(carbs)}g
🧈 Fat: ${Math.round(fat)}g
💧 Water: ${water}/${WATER_GOAL} glasses
🔁 Streak: ${streak} day${streak !== 1 ? 's' : ''}
━━━━━━━━━━━━━━━
Tracked with Mizan
calorie-tracker-fawn-sigma.vercel.app`
}

// ── What should I eat suggestion ──────────────────────────────────────────────
function getSuggestion({ remaining, proteinLeft, carbsLeft, fatLeft }) {
  if (remaining <= 0) return { emoji: '✅', text: "You've hit your calorie goal! Great job today.", foods: [] }
  if (remaining < 100) return { emoji: '🍵', text: 'Almost there — just a light snack left.', foods: ['Green tea', 'A handful of dates (2-3)', 'Black coffee'] }
  if (proteinLeft > carbsLeft && proteinLeft > fatLeft) {
    return {
      emoji: '💪', text: `You need ${Math.round(proteinLeft)}g more protein. Try:`,
      foods: ['Grilled chicken breast (165 kcal/100g)', 'Tuna can (116 kcal)', 'Greek yogurt (100 kcal)', 'Boiled eggs (78 kcal each)']
    }
  }
  if (remaining > 500) {
    return {
      emoji: '🍽️', text: `You have ${Math.round(remaining)} kcal left — time for a proper meal:`,
      foods: ['Chicken Kabsa (~320 kcal)', 'Grilled fish + rice (~350 kcal)', 'Chicken shawarma wrap (~290 kcal)', 'Lentil soup + bread (~295 kcal)']
    }
  }
  return {
    emoji: '🥗', text: `${Math.round(remaining)} kcal remaining — perfect for a snack:`,
    foods: ['Mixed nuts handful (~164 kcal)', 'Hummus + pita (~250 kcal)', 'Fruit salad (~120 kcal)', 'Labneh + crackers (~200 kcal)']
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HomeScreen({ entries, onAdd, onRemove, onEdit, goal, macroGoals, user, allEntries }) {
  const [showModal, setShowModal]           = useState(false)
  const [editEntry, setEditEntry]           = useState(null)
  const [water, setWater]                   = useState(() => Number(localStorage.getItem('water_' + new Date().toISOString().split('T')[0]) || 0))
  const [showConfetti, setShowConfetti]     = useState(false)
  const [toast, setToast]                   = useState('')
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [showShareSheet, setShowShareSheet] = useState(false)
  const [goalCelebrated, setGoalCelebrated] = useState(() => localStorage.getItem('goal_celebrated_' + new Date().toISOString().split('T')[0]) === 'true')
  const [isPro] = useState(() => localStorage.getItem('is_premium') === 'true')
  const [showStreakModal, setShowStreakModal] = useState(() => {
    const today = new Date().toISOString().split('T')[0]
    const dismissed = localStorage.getItem('streak_dismissed_' + today) === 'true'
    const frozen = localStorage.getItem('streak_freeze_' + today) === 'true'
    return false
  })

  const totals = entries.reduce((acc, e) => ({
    calories: acc.calories + (e.calories || 0),
    protein:  acc.protein  + (e.protein  || 0),
    carbs:    acc.carbs    + (e.carbs    || 0),
    fat:      acc.fat      + (e.fat      || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const calories  = Math.round(totals.calories)
  const remaining = Math.max(0, goal - calories)
  const over      = calories > goal
  const pct       = goal > 0 ? calories / goal : 0
  const streak    = getStreak(allEntries)
  const name      = user?.user_metadata?.full_name?.split(' ')[0] || ''
  const h         = new Date().getHours()
  const greeting  = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  const grouped   = MEAL_ORDER.reduce((acc, m) => { acc[m] = entries.filter(e => e.meal === m); return acc }, {})
  const ungrouped = entries.filter(e => !e.meal || !MEAL_ORDER.includes(e.meal))

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const dismissed = localStorage.getItem('streak_dismissed_' + today) === 'true'
    const frozen = localStorage.getItem('streak_freeze_' + today) === 'true'
    if (streak >= 3 && entries.length === 0 && !dismissed && !frozen) {
      const timer = setTimeout(() => setShowStreakModal(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [streak, entries.length])

  useEffect(() => {
    if (calories >= goal && goal > 0 && !goalCelebrated && entries.length > 0) {
      const todayKey = new Date().toISOString().split('T')[0]
      localStorage.setItem('goal_celebrated_' + todayKey, 'true')
      setGoalCelebrated(true)
      setShowConfetti(true)
      setToast(GOAL_MESSAGES[Math.floor(Math.random() * GOAL_MESSAGES.length)])
    }
  }, [calories, goal, goalCelebrated, entries.length])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function addWater(n) {
    const key = 'water_' + new Date().toISOString().split('T')[0]
    const next = Math.max(0, Math.min(water + n, WATER_GOAL))
    setWater(next); localStorage.setItem(key, next)
    if (next === WATER_GOAL && n > 0) {
      setShowConfetti(true)
      showToast(WATER_MESSAGES[Math.floor(Math.random() * WATER_MESSAGES.length)])
    }
  }

  function handleAdd(food) {
    if (editEntry) { onEdit(editEntry.id, food); setEditEntry(null) } else onAdd(food)
    setShowModal(false)
  }

  function handleShare() {
    const text = generateShareText({
      name, calories, goal,
      protein: totals.protein, carbs: totals.carbs, fat: totals.fat,
      streak, water,
    })
    if (navigator.share) {
      navigator.share({ title: 'My Mizan Summary', text })
    } else {
      navigator.clipboard.writeText(text)
      showToast('Summary copied! 📋')
    }
    setShowShareSheet(false)
  }

  const suggestion = getSuggestion({
    remaining,
    proteinLeft: macroGoals.protein - totals.protein,
    carbsLeft:   macroGoals.carbs   - totals.carbs,
    fatLeft:     macroGoals.fat     - totals.fat,
  })

  return (
    <div className="screen">
      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />

      {toast && <div className="toast-glass">{toast}</div>}

      <div className="home-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-hint)', fontWeight: 500, marginBottom: 2 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em' }}>
              {name ? `${greeting}, ${name}` : greeting}
            </div>
          </div>

          {streak > 0 && (
            <div className={`streak-badge${streak >= 7 ? ' hot' : ''}`}>
              <div className="streak-badge-num" style={{ color: streak >= 7 ? '#f97316' : 'var(--text)' }}>{streak}</div>
              <div className="streak-badge-label">DAY{streak !== 1 ? 'S' : ''}</div>
            </div>
          )}
        </div>

        <div className="home-ring-row">
          <CalorieRing consumed={calories} goal={goal} />
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: over ? 'var(--danger-dim)' : calories >= goal ? 'rgba(0,185,107,0.15)' : 'var(--accent-dim)',
              borderRadius: 999, padding: '5px 12px', marginBottom: 14,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: over ? 'var(--danger)' : 'var(--accent)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: over ? 'var(--danger)' : 'var(--accent)' }}>
                {over ? `${calories - goal} over` : calories >= goal ? 'Goal reached! 🎯' : `${remaining} left`}
              </span>
            </div>
            {[
              { label: 'Eaten',  value: `${calories} kcal` },
              { label: 'Goal',   value: `${goal} kcal` },
              { label: 'Meals',  value: `${MEAL_ORDER.filter(m => grouped[m]?.length > 0).length}/4` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="glass-card glass-card-pad" style={{ margin: '12px 16px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14 }}>Macros</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MacroBar label="Protein" value={totals.protein} goal={macroGoals.protein} color="var(--blue)" />
          <MacroBar label="Carbs"   value={totals.carbs}   goal={macroGoals.carbs}   color="var(--orange)" />
          <MacroBar label="Fat"     value={totals.fat}     goal={macroGoals.fat}     color="var(--purple)" />
        </div>
      </div>

      {/* What should I eat */}
      <div style={{ margin: '12px 16px 0' }}>
        <button
          onClick={() => setShowSuggestion(s => !s)}
          style={{
            width: '100%', padding: '14px 18px',
            background: 'var(--bg-card)', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🤔</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>What should I eat?</span>
          </div>
          <span style={{ fontSize: 18, color: 'var(--text-hint)', transition: 'transform 0.2s', transform: showSuggestion ? 'rotate(180deg)' : 'none' }}>›</span>
        </button>

        {showSuggestion && (
          <div style={{
            background: 'var(--bg-card)', borderRadius: '0 0 var(--radius) var(--radius)',
            border: '1px solid var(--border)', borderTop: 'none',
            padding: '14px 18px', boxShadow: 'var(--shadow-card)',
          }} className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>{suggestion.emoji}</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{suggestion.text}</span>
            </div>
            {suggestion.foods.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {suggestion.foods.map((food, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--bg-card-2)', borderRadius: 10, padding: '10px 12px',
                  }}>
                    <span style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 700 }}>→</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{food}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-hint)', textAlign: 'center' }}>
              {remaining > 0 ? `${Math.round(remaining)} kcal · P ${Math.round(Math.max(0, macroGoals.protein - totals.protein))}g · C ${Math.round(Math.max(0, macroGoals.carbs - totals.carbs))}g remaining` : 'All goals met today! 🎉'}
            </div>
          </div>
        )}
      </div>

      {/* Water */}
      <div style={{ margin: '12px 16px 0', background: water === WATER_GOAL ? 'rgba(59,130,246,0.05)' : 'var(--bg-card)', border: `1px solid ${water === WATER_GOAL ? 'rgba(59,130,246,0.2)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '16px 18px', boxShadow: 'var(--shadow-card)', transition: 'all 0.3s ease' }}>
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
            <div key={i} onClick={() => { if (i >= water) addWater(i + 1 - water) }} style={{ flex: 1, height: 6, borderRadius: 99, background: i < water ? 'var(--blue)' : 'var(--bg-card-2)', cursor: i >= water ? 'pointer' : 'default', transition: 'background 0.2s' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => addWater(-1)} style={{ flex: 1, padding: '10px', background: 'var(--bg-card-2)', borderRadius: 10, color: 'var(--text-muted)', fontSize: 18, fontWeight: 300 }}>−</button>
          <button onClick={() => addWater(1)} disabled={water >= WATER_GOAL} style={{ flex: 3, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: water >= WATER_GOAL ? 'var(--bg-card-2)' : 'var(--blue-dim)', color: water >= WATER_GOAL ? 'var(--text-hint)' : 'var(--blue)' }}>
            {water >= WATER_GOAL ? '✓ Goal reached' : '+ Add glass'}
          </button>
        </div>
      </div>

      <div className="action-row">
        <button onClick={() => { setEditEntry(null); setShowModal(true) }} className="action-btn-main">+ Log food</button>
        <button onClick={() => { setEditEntry(null); setShowModal(true); setTimeout(() => window._mizanSetTab?.('scan'), 100) }} className="action-btn-icon" aria-label="Scan food">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button onClick={() => setShowShareSheet(true)} className="action-btn-icon" aria-label="Share">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
        </button>
      </div>

      {/* Food log */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Today's meals</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{entries.length} item{entries.length !== 1 ? 's' : ''}</div>
        </div>

        {entries.length === 0 ? (
          <div className="empty-state">
            <img src="/logo.png" alt="Mizan" />
            <div className="empty-state-title">Nothing logged yet</div>
            <div className="empty-state-sub">Tap <strong>+ Log food</strong> to start tracking.</div>
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

      {/* Share sheet */}
      {showShareSheet && (
        <div className="modal-overlay" onClick={() => setShowShareSheet(false)}>
          <div className="modal-sheet sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>Share your day</span>
              <button onClick={() => setShowShareSheet(false)} style={{ background: 'var(--bg-card-2)', borderRadius: 99, width: 30, height: 30, color: 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ background: 'var(--bg-card-2)', borderRadius: 16, padding: '16px 18px', marginBottom: 20, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🥗 Mizan Daily Summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Calories</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{calories}/{goal} kcal</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ height: '100%', width: `${Math.min(100, Math.round(pct * 100))}%`, background: over ? 'var(--danger)' : 'var(--accent)', borderRadius: 99 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[['💪 Protein', `${Math.round(totals.protein)}g`], ['🌾 Carbs', `${Math.round(totals.carbs)}g`], ['💧 Water', `${water}/8`]].map(([label, val]) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{val}</div>
                  </div>
                ))}
              </div>
              {streak > 0 && (
                <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: streak >= 7 ? '#f97316' : 'var(--text-muted)' }}>
                  {streak >= 7 ? '🔥' : '🔁'} {streak} day streak
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleShare} style={{ width: '100%', padding: '14px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 15, fontWeight: 700, boxShadow: 'var(--shadow-accent)' }}>
                {typeof navigator !== 'undefined' && navigator.share ? '📤 Share via WhatsApp / Instagram' : '📋 Copy to clipboard'}
              </button>
              <button onClick={() => setShowShareSheet(false)} style={{ background: 'none', color: 'var(--text-muted)', fontSize: 14, padding: '10px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showStreakModal && (
        <StreakProtection
          streak={streak}
          isPro={isPro}
          onClose={() => {
            const today = new Date().toISOString().split('T')[0]
            localStorage.setItem('streak_dismissed_' + today, 'true')
            setShowStreakModal(false)
            setShowModal(true)
          }}
          onUpgrade={() => {
            setShowStreakModal(false)
            window.location.href = GUMROAD_URL
          }}
        />
      )}

      {showModal && <AddFoodModal onAdd={handleAdd} onClose={() => { setShowModal(false); setEditEntry(null) }} editEntry={editEntry} user={user} />}
    </div>
  )
}

function EntryRow({ entry, onRemove, onEdit, isLast }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)', gap: 12 }}>
      <FoodImage name={entry.name} meal={entry.meal} size={44} borderRadius={10} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{entry.time}{entry.per ? ` · ${entry.per}` : ''} · P {Math.round(entry.protein||0)}g · C {Math.round(entry.carbs||0)}g</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', minWidth: 36, textAlign: 'right' }}>{Math.round(entry.calories||0)}</span>
        <button onClick={() => onEdit(entry)} style={{ width: 30, height: 30, background: 'var(--bg-card-2)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
        <button onClick={() => { if (window.confirm('Delete this entry?')) onRemove(entry.id) }} style={{ width: 30, height: 30, background: 'var(--danger-dim)', borderRadius: 8, color: 'var(--danger)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      </div>
    </div>
  )
}
