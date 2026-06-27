import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase.js'
import AuthScreen from './pages/AuthScreen.jsx'
import OnboardingScreen from './pages/OnboardingScreen.jsx'
import HomeScreen from './pages/HomeScreen.jsx'
import LogScreen from './pages/LogScreen.jsx'
import ProgressScreen from './pages/ProgressScreen.jsx'
import ProfileScreen from './pages/ProfileScreen.jsx'
import RamadanScreen from './pages/RamadanScreen.jsx'
import WeightTracker from './pages/WeightTracker.jsx'
import FriendsScreen from './pages/FriendsScreen.jsx'
import ArabicRecipeScreen from './pages/ArabicRecipeScreen.jsx'
import MoreScreen from './pages/MoreScreen.jsx'

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

// Clean iOS-style tab bar icons as SVG
function TabIcon({ tab, active }) {
  const color = active ? 'var(--accent)' : 'var(--text-hint)'
  const icons = {
    today: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d={active
          ? "M12 2L3 9v13h6v-6h6v6h6V9L12 2z"
          : "M12 3.5L4 9.5V21h5v-6h6v6h5V9.5L12 3.5z"}
          fill={active ? color : 'none'}
          stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    ),
    log: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="18" rx="3"
          fill={active ? color : 'none'} stroke={color} strokeWidth="1.8"/>
        {active
          ? <path d="M8 9h8M8 13h6M8 17h4" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
          : <path d="M8 9h8M8 13h6M8 17h4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>}
      </svg>
    ),
    progress: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {active
          ? <>
              <rect x="3" y="12" width="4" height="9" rx="1" fill={color}/>
              <rect x="10" y="7" width="4" height="14" rx="1" fill={color}/>
              <rect x="17" y="3" width="4" height="18" rx="1" fill={color}/>
            </>
          : <>
              <rect x="3" y="12" width="4" height="9" rx="1" stroke={color} strokeWidth="1.8"/>
              <rect x="10" y="7" width="4" height="14" rx="1" stroke={color} strokeWidth="1.8"/>
              <rect x="17" y="3" width="4" height="18" rx="1" stroke={color} strokeWidth="1.8"/>
            </>}
      </svg>
    ),
    weight: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {active
          ? <><rect x="3" y="6" width="18" height="14" rx="3" fill={color}/><path d="M8 6V5a4 4 0 0 1 8 0v1" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></>
          : <><rect x="3" y="6" width="18" height="14" rx="3" stroke={color} strokeWidth="1.8"/><path d="M8 6V5a4 4 0 0 1 8 0v1" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>}
      </svg>
    ),
    friends: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {active
          ? <><circle cx="9" cy="8" r="3" fill={color}/><path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" fill={color}/><circle cx="17" cy="8" r="2.5" fill={color} opacity="0.7"/><path d="M19 19c0-2.8-1.8-5.1-4.3-5.9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>
          : <><circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.8"/><path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/><circle cx="17" cy="8" r="2.5" stroke={color} strokeWidth="1.8"/><path d="M19 19c0-2.8-1.8-5.1-4.3-5.9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>}
      </svg>
    ),
    arabic: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {active
          ? <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm3 13H9v-2h2v-4H9v-2h4v6h2v2z" fill={color}/>
          : <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm3 13H9v-2h2v-4H9v-2h4v6h2v2z" fill="none" stroke={color} strokeWidth="0.5"/>}
      </svg>
    ),
    ramadan: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {active
          ? <path d="M12 3a9 9 0 1 0 9 9c0-.5-.5-1-1-1a7 7 0 1 1-8-8c-.5 0-1-.5-1-1s.5-1 1-1z" fill={color}/>
          : <path d="M12 3a9 9 0 1 0 9 9c0-.5-.5-1-1-1a7 7 0 1 1-8-8c-.5 0-1-.5-1-1s.5-1 1-1z" stroke={color} strokeWidth="1.8" fill="none"/>}
      </svg>
    ),
    more: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {active
          ? <><circle cx="5" cy="12" r="2" fill={color}/><circle cx="12" cy="12" r="2" fill={color}/><circle cx="19" cy="12" r="2" fill={color}/></>
          : <><circle cx="5" cy="12" r="2" stroke={color} strokeWidth="1.8"/><circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1.8"/><circle cx="19" cy="12" r="2" stroke={color} strokeWidth="1.8"/></>}
      </svg>
    ),
    profile: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4"
          fill={active ? color : 'none'} stroke={color} strokeWidth="1.8"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
          fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  }
  return icons[tab] || null
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
    const savedTheme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setAuthChecked(true) })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    window.addEventListener('skip-auth', () => { localStorage.setItem('skip_auth', 'true'); setSkipAuth(true) })
    if (window.location.search.includes('upgraded=true')) {
      window.history.replaceState({}, '', window.location.pathname)
      supabase.auth.getSession().then(({ data }) => {
        const uid = data.session?.user?.id
        if (uid) supabase.from('profiles').upsert({ id: uid, is_premium: true, scan_count: 0 }).then(() => window.location.reload())
      })
    }
    return () => listener.subscription.unsubscribe()
  }, [])

  // Schedule daily summary notification at 8pm
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready.then(reg => {
      if (!reg.active) return
      const name = (() => { try { return JSON.parse(localStorage.getItem('settings') || '{}').name || '' } catch { return '' } })()
      const todayKey = new Date().toISOString().split('T')[0]
      const scheduled = localStorage.getItem('summary_scheduled_' + todayKey)
      if (scheduled) return
      localStorage.setItem('summary_scheduled_' + todayKey, 'true')
      reg.active.postMessage({
        type: 'SCHEDULE_DAILY_SUMMARY',
        calories: 0, // SW will use this as baseline; app reschedules with real data
        goal: settings.goal,
        name,
      })
    })
  }, [settings.goal])

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
        setAllEntries(grouped); setDbLoading(false)
      })
  }, [user])

  const todayEntries = allEntries[today()] || []

  async function addFood(food) {
    const entry = { ...food, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
    if (user) {
      const { data, error } = await supabase.from('food_logs').insert({ user_id: user.id, date: today(), name: entry.name, calories: entry.calories||0, protein: entry.protein||0, carbs: entry.carbs||0, fat: entry.fat||0, meal: entry.meal, portion: entry.portion||100, per: entry.per, time: entry.time }).select().single()
      if (!error && data) { entry.id = data.id; setAllEntries(prev => ({ ...prev, [today()]: [...(prev[today()]||[]), entry] })) }
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
      setAllEntries(prev => { const u = {...prev}; Object.keys(u).forEach(d => { u[d] = u[d].filter(e => e.id !== id) }); return u })
    } else {
      const updated = todayEntries.filter(e => e.id !== id)
      localStorage.setItem('entries_' + today(), JSON.stringify(updated))
      setAllEntries(prev => ({ ...prev, [today()]: updated }))
    }
  }

  async function editFood(id, updated) {
    if (user) {
      await supabase.from('food_logs').update({ name: updated.name, calories: updated.calories||0, protein: updated.protein||0, carbs: updated.carbs||0, fat: updated.fat||0, meal: updated.meal, portion: updated.portion||100, per: updated.per }).eq('id', id).eq('user_id', user.id)
      setAllEntries(prev => ({ ...prev, [today()]: (prev[today()]||[]).map(e => e.id === id ? {...e, ...updated} : e) }))
    } else {
      const newEntries = todayEntries.map(e => e.id === id ? {...e, ...updated} : e)
      localStorage.setItem('entries_' + today(), JSON.stringify(newEntries))
      setAllEntries(prev => ({ ...prev, [today()]: newEntries }))
    }
  }

  function updateGoals({ goal, macroGoals }) {
    const next = { goal, macroGoals }
    localStorage.setItem('settings', JSON.stringify(next))
    setSettings(next)
  }

  if (!authChecked) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--accent-dim)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!user && !skipAuth) return <AuthScreen />
  if (!onboarded) return <OnboardingScreen onDone={() => { setOnboarded(true); const s = JSON.parse(localStorage.getItem('settings')||'null'); if (s) setSettings(s) }} />

  const navItems = [
    { tab: 'today',   label: 'Home' },
    { tab: 'log',     label: 'Log' },
    { tab: 'progress',label: 'Progress' },
    { tab: 'friends', label: 'Friends' },
    { tab: 'more', label: 'More' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', maxWidth: 430, margin: '0 auto', overflow: 'hidden', background: 'var(--bg)' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {dbLoading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <img src="/icon-192.png" style={{ width: 56, height: 56, borderRadius: 14, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading your data…</div>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
          </div>
        ) : (
          <>
            {activeTab === 'today'    && <HomeScreen    entries={todayEntries} onAdd={addFood} onRemove={removeFood} onEdit={editFood} goal={settings.goal} macroGoals={settings.macroGoals} user={user} allEntries={allEntries} />}
            {activeTab === 'log'      && <LogScreen     allEntries={allEntries} />}
            {activeTab === 'progress' && <ProgressScreen allEntries={allEntries} goal={settings.goal} />}
            {activeTab === 'profile'  && <ProfileScreen  user={user} goal={settings.goal} macroGoals={settings.macroGoals} onUpdateGoals={updateGoals} onNavigate={setActiveTab} />}
            {activeTab === 'more'     && <MoreScreen onNavigate={setActiveTab} user={user} />}
            {activeTab === 'ramadan'  && <RamadanScreen entries={todayEntries} goal={settings.goal} macroGoals={settings.macroGoals} onAdd={addFood} user={user} />}
            {activeTab === 'friends'  && <FriendsScreen user={user} allEntries={allEntries} goal={settings.goal} />}
            {activeTab === 'weight'   && <WeightTracker user={user} />}
            {activeTab === 'arabic'   && <ArabicRecipeScreen onAdd={addFood} user={user} />}
          </>
        )}
      </div>

      {/* Tab bar */}
      <div style={{
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        display: 'flex', flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -1px 0 var(--border)',
      }}>
        {navItems.map(({ tab, label }) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '10px 0 12px',
            background: 'none', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <TabIcon tab={tab} active={activeTab === tab} />
            <span style={{
              fontSize: 10, fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-hint)',
              letterSpacing: '0.01em',
            }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
