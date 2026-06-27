import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase.js'
import AuthScreen from './pages/AuthScreen.jsx'
import OnboardingScreen from './pages/OnboardingScreen.jsx'
import HomeScreen from './pages/HomeScreen.jsx'
import LogScreen from './pages/LogScreen.jsx'
import ProgressScreen from './pages/ProgressScreen.jsx'
import ProfileScreen from './pages/ProfileScreen.jsx'

const today = () => new Date().toISOString().split('T')[0]
const DEFAULTS = { goal: 2000, macroGoals: { protein: 150, carbs: 200, fat: 65 } }

function loadLocalEntries() {
  const result = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('entries_')) {
      const date = key.replace('entries_', '')
      try { result[date] = JSON.parse(localStorage.getItem(key) || '[]') } catch { result[date] = [] }
    }
  }
  return result
}

// ── Radial Nav Orb ────────────────────────────────────────────────────────────
function NavOrb({ activeTab, onTabChange, calorieProgress }) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef()

  // clamp 0–1
  const pct = Math.min(Math.max(calorieProgress, 0), 1)
  const over = calorieProgress > 1

  // Orb color shifts with progress
  const orbColor = over
    ? '#ff453a'
    : pct > 0.85
    ? '#ff9f0a'
    : '#30d158'

  const items = [
    { tab: 'today',    label: 'Home',     emoji: '🏠' },
    { tab: 'log',      label: 'Log',      emoji: '📋' },
    { tab: 'progress', label: 'Progress', emoji: '📈' },
    { tab: 'profile',  label: 'Profile',  emoji: '👤' },
  ]

  // Place items in a semicircle above the orb
  // Angles: spread from 210° to 330° (above, left-to-right)
  const angles = [-120, -160, -200, -240]

  function handleToggle() {
    if (open) {
      setOpen(false)
    } else {
      setOpen(true)
      // Auto-close after 3s of no interaction
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setOpen(false), 3000)
    }
  }

  function handleSelect(tab) {
    onTabChange(tab)
    setOpen(false)
    clearTimeout(timeoutRef.current)
  }

  // Arc fill for calorie ring on orb
  const r = 26
  const circ = 2 * Math.PI * r
  const dash = Math.min(pct, 1) * circ

  return (
    <>
      {/* Backdrop when open */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 90,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(6px)',
          }}
        />
      )}

      {/* Radial menu items */}
      {items.map((item, i) => {
        const angleDeg = angles[i]
        const angleRad = (angleDeg * Math.PI) / 180
        const dist = open ? 90 : 0
        const x = Math.cos(angleRad) * dist
        const y = Math.sin(angleRad) * dist
        const isActive = activeTab === item.tab

        return (
          <button
            key={item.tab}
            onClick={() => handleSelect(item.tab)}
            style={{
              position: 'fixed',
              bottom: 28,
              left: '50%',
              transform: `translate(calc(-50% + ${x}px), ${open ? y : 0}px) scale(${open ? 1 : 0.3})`,
              opacity: open ? 1 : 0,
              pointerEvents: open ? 'auto' : 'none',
              transition: `transform 0.35s cubic-bezier(0.34,1.56,0.64,1) ${i * 40}ms, opacity 0.25s ease ${i * 30}ms`,
              zIndex: 101,
              width: 56, height: 56,
              borderRadius: '50%',
              background: isActive
                ? orbColor
                : 'rgba(28,28,30,0.95)',
              border: `1px solid ${isActive ? orbColor : 'rgba(255,255,255,0.12)'}`,
              boxShadow: isActive
                ? `0 0 20px ${orbColor}66`
                : '0 4px 20px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 1,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{item.emoji}</span>
            <span style={{
              fontSize: 9, fontWeight: 600,
              color: isActive ? '#000' : 'rgba(255,255,255,0.6)',
              letterSpacing: '0.02em',
            }}>{item.label}</span>
          </button>
        )
      })}

      {/* The Orb */}
      <button
        onClick={handleToggle}
        style={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: `translateX(-50%) scale(${open ? 1.08 : 1})`,
          transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
          zIndex: 102,
          width: 64, height: 64,
          borderRadius: '50%',
          background: 'rgba(10,10,12,0.95)',
          border: 'none',
          boxShadow: open
            ? `0 0 0 2px ${orbColor}, 0 0 40px ${orbColor}55, 0 8px 32px rgba(0,0,0,0.6)`
            : `0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.6)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Progress ring on orb */}
        <svg width={64} height={64} viewBox="0 0 64 64" style={{ position: 'absolute', inset: 0 }}>
          <circle cx={32} cy={32} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
          <circle
            cx={32} cy={32} r={r}
            fill="none"
            stroke={orbColor}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            transform="rotate(-90 32 32)"
            style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s ease' }}
          />
        </svg>
        {/* Inner symbol */}
        <span style={{
          fontSize: open ? 20 : 18,
          transition: 'all 0.2s ease',
          position: 'relative', zIndex: 1,
          filter: open ? `drop-shadow(0 0 6px ${orbColor})` : 'none',
        }}>
          {open ? '✕' : activeTab === 'today' ? '🏠' : activeTab === 'log' ? '📋' : activeTab === 'progress' ? '📈' : '👤'}
        </span>
      </button>
    </>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [skipAuth, setSkipAuth] = useState(() => localStorage.getItem('skip_auth') === 'true')
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('onboarded') === 'true')
  const [activeTab, setActiveTab] = useState('today')
  const [allEntries, setAllEntries] = useState(loadLocalEntries)
  const [dbLoading, setDbLoading] = useState(false)
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('settings') || 'null') || DEFAULTS } catch { return DEFAULTS }
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    document.documentElement.setAttribute('data-theme', savedTheme)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setAuthChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    window.addEventListener('skip-auth', () => {
      localStorage.setItem('skip_auth', 'true')
      setSkipAuth(true)
    })
    if (window.location.search.includes('upgraded=true')) {
      window.history.replaceState({}, '', window.location.pathname)
      supabase.auth.getSession().then(({ data }) => {
        const uid = data.session?.user?.id
        if (uid) supabase.from('profiles').upsert({ id: uid, is_premium: true, scan_count: 0 }).then(() => window.location.reload())
      })
    }
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    setDbLoading(true)
    supabase.from('food_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error(error); setDbLoading(false); return }
        const grouped = {}
        ;(data || []).forEach(row => {
          if (!grouped[row.date]) grouped[row.date] = []
          grouped[row.date].push({ id: row.id, name: row.name, calories: row.calories, protein: row.protein, carbs: row.carbs, fat: row.fat, meal: row.meal, portion: row.portion, per: row.per, time: row.time })
        })
        setAllEntries(grouped)
        setDbLoading(false)
      })
  }, [user])

  const todayEntries = allEntries[today()] || []

  async function addFood(food) {
    const entry = { ...food, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
    if (user) {
      const { data, error } = await supabase.from('food_logs').insert({
        user_id: user.id, date: today(), name: entry.name,
        calories: entry.calories || 0, protein: entry.protein || 0,
        carbs: entry.carbs || 0, fat: entry.fat || 0,
        meal: entry.meal, portion: entry.portion || 100, per: entry.per, time: entry.time,
      }).select().single()
      if (!error && data) {
        entry.id = data.id
        setAllEntries(prev => ({ ...prev, [today()]: [...(prev[today()] || []), entry] }))
      }
    } else {
      entry.id = Date.now()
      const updated = [...todayEntries, entry]
      localStorage.setItem('entries_' + today(), JSON.stringify(updated))
      setAllEntries(prev => ({ ...prev, [today()]: updated }))
    }
  }

  async function removeFood(id) {
    if (user) {
      await supabase.from('food_logs').delete().eq('id', id).eq('user_id', user.id)
      setAllEntries(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(date => { updated[date] = updated[date].filter(e => e.id !== id) })
        return updated
      })
    } else {
      const updated = todayEntries.filter(e => e.id !== id)
      localStorage.setItem('entries_' + today(), JSON.stringify(updated))
      setAllEntries(prev => ({ ...prev, [today()]: updated }))
    }
  }

  async function editFood(id, updated) {
    if (user) {
      await supabase.from('food_logs').update({
        name: updated.name, calories: updated.calories || 0, protein: updated.protein || 0,
        carbs: updated.carbs || 0, fat: updated.fat || 0, meal: updated.meal,
        portion: updated.portion || 100, per: updated.per,
      }).eq('id', id).eq('user_id', user.id)
      setAllEntries(prev => ({ ...prev, [today()]: (prev[today()] || []).map(e => e.id === id ? { ...e, ...updated } : e) }))
    } else {
      const newEntries = todayEntries.map(e => e.id === id ? { ...e, ...updated } : e)
      localStorage.setItem('entries_' + today(), JSON.stringify(newEntries))
      setAllEntries(prev => ({ ...prev, [today()]: newEntries }))
    }
  }

  function updateGoals({ goal, macroGoals }) {
    const next = { goal, macroGoals }
    localStorage.setItem('settings', JSON.stringify(next))
    setSettings(next)
  }

  // Calorie progress for orb
  const totalCalories = todayEntries.reduce((sum, e) => sum + (e.calories || 0), 0)
  const calorieProgress = settings.goal > 0 ? totalCalories / settings.goal : 0

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#30d158', animation: 'spin 800ms linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!user && !skipAuth) return <AuthScreen />

  if (!onboarded) return <OnboardingScreen onDone={() => {
    setOnboarded(true)
    const saved = JSON.parse(localStorage.getItem('settings') || 'null')
    if (saved) setSettings(saved)
  }} />

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', width: '100%',
      maxWidth: 430, margin: '0 auto',
      overflow: 'hidden', background: '#000',
      position: 'relative',
    }}>
      {/* Page content — extra bottom padding so orb doesn't cover content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {dbLoading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} } @keyframes spin { to{transform:rotate(360deg)} }`}</style>
            <img src="/icon-192.png" style={{ width: 64, height: 64, borderRadius: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading your data…</div>
          </div>
        ) : (
          <>
            {activeTab === 'today'    && <HomeScreen    entries={todayEntries} onAdd={addFood} onRemove={removeFood} onEdit={editFood} goal={settings.goal} macroGoals={settings.macroGoals} user={user} />}
            {activeTab === 'log'      && <LogScreen     allEntries={allEntries} />}
            {activeTab === 'progress' && <ProgressScreen allEntries={allEntries} goal={settings.goal} />}
            {activeTab === 'profile'  && <ProfileScreen  user={user} goal={settings.goal} macroGoals={settings.macroGoals} onUpdateGoals={updateGoals} />}
          </>
        )}
      </div>

      {/* Floating Orb Nav */}
      <NavOrb
        activeTab={activeTab}
        onTabChange={setActiveTab}
        calorieProgress={calorieProgress}
      />
    </div>
  )
}
