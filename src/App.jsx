import { useState, useEffect } from 'react'
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
    return () => listener.subscription.unsubscribe()
  }, [])

  // load from supabase when user logs in
  useEffect(() => {
    if (!user) return
    setDbLoading(true)
    supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error(error); setDbLoading(false); return }
        const grouped = {}
        ;(data || []).forEach(row => {
          if (!grouped[row.date]) grouped[row.date] = []
          grouped[row.date].push({
            id: row.id,
            name: row.name,
            calories: row.calories,
            protein: row.protein,
            carbs: row.carbs,
            fat: row.fat,
            meal: row.meal,
            portion: row.portion,
            per: row.per,
            time: row.time,
          })
        })
        setAllEntries(grouped)
        setDbLoading(false)
      })
  }, [user])

  const todayEntries = allEntries[today()] || []

  async function addFood(food) {
    const entry = {
      ...food,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    if (user) {
      const { data, error } = await supabase.from('food_logs').insert({
        user_id: user.id,
        date: today(),
        name: entry.name,
        calories: entry.calories || 0,
        protein: entry.protein || 0,
        carbs: entry.carbs || 0,
        fat: entry.fat || 0,
        meal: entry.meal,
        portion: entry.portion || 100,
        per: entry.per,
        time: entry.time,
      }).select().single()
      if (!error && data) {
        entry.id = data.id
        setAllEntries(prev => ({
          ...prev,
          [today()]: [...(prev[today()] || []), entry]
        }))
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
        Object.keys(updated).forEach(date => {
          updated[date] = updated[date].filter(e => e.id !== id)
        })
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
        name: updated.name,
        calories: updated.calories || 0,
        protein: updated.protein || 0,
        carbs: updated.carbs || 0,
        fat: updated.fat || 0,
        meal: updated.meal,
        portion: updated.portion || 100,
        per: updated.per,
      }).eq('id', id).eq('user_id', user.id)
      setAllEntries(prev => ({
        ...prev,
        [today()]: (prev[today()] || []).map(e => e.id === id ? { ...e, ...updated } : e)
      }))
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

  if (!authChecked) {
    return <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 14 }}>Loading...</div>
  }

  if (!user && !skipAuth) return <AuthScreen />

  if (!onboarded) return <OnboardingScreen onDone={() => {
    setOnboarded(true)
    const saved = JSON.parse(localStorage.getItem('settings') || 'null')
    if (saved) setSettings(saved)
  }} />

  const navItems = [
    { tab: 'today', icon: '⬤', label: 'Home' },
    { tab: 'log', icon: '☰', label: 'Log' },
    { tab: 'progress', icon: '▲', label: 'Progress' },
    { tab: 'profile', icon: '○', label: 'Profile' },
  ]

  const navStyle = (tab) => ({
    flex: 1, padding: '10px 0', background: 'none',
    color: activeTab === tab ? '#a8e063' : '#444',
    fontSize: 11, fontWeight: 500,
    borderTop: activeTab === tab ? '1.5px solid #a8e063' : '1.5px solid transparent',
    transition: 'color 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 430, margin: '0 auto', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {dbLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 14 }}>
            Syncing your data...
          </div>
        ) : (
          <>
            {activeTab === 'today' && (
              <HomeScreen entries={todayEntries} onAdd={addFood} onRemove={removeFood} onEdit={editFood} goal={settings.goal} macroGoals={settings.macroGoals} user={user} />
            )}
            {activeTab === 'log' && <LogScreen allEntries={allEntries} />}
            {activeTab === 'progress' && <ProgressScreen allEntries={allEntries} goal={settings.goal} />}
            {activeTab === 'profile' && (
              <ProfileScreen user={user} goal={settings.goal} macroGoals={settings.macroGoals} onUpdateGoals={updateGoals} />
            )}
          </>
        )}
      </div>
      <div style={{ background: 'rgba(14,14,15,0.97)', borderTop: '0.5px solid rgba(255,255,255,0.06)', display: 'flex', flexShrink: 0 }}>
        {navItems.map(({ tab, icon, label }) => (
          <button key={tab} style={navStyle(tab)} onClick={() => setActiveTab(tab)}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
