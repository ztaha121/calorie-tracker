import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function ProfileScreen({ user, goal, macroGoals, onUpdateGoals }) {
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '')
  const [calGoal, setCalGoal] = useState(goal)
  const [protein, setProtein] = useState(macroGoals.protein)
  const [carbs, setCarbs] = useState(macroGoals.carbs)
  const [fat, setFat] = useState(macroGoals.fat)
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('notif_enabled') === 'true')
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light')

  async function toggleNotifications() {
    if (notifEnabled) { localStorage.setItem('notif_enabled', 'false'); setNotifEnabled(false); return }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      localStorage.setItem('notif_enabled', 'true'); setNotifEnabled(true)
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        reg.active?.postMessage({ type: 'SCHEDULE_REMINDER', time: 20 })
      }
    } else { alert('Please enable notifications in your browser settings.') }
  }

  async function saveGoals() {
    if (displayName && user) await supabase.auth.updateUser({ data: { full_name: displayName } })
    onUpdateGoals({ goal: Number(calGoal), macroGoals: { protein: Number(protein), carbs: Number(carbs), fat: Number(fat) } })
    setEditing(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xs)', color: 'var(--text)', fontSize: 15
  }

  const Toggle = ({ on, onToggle }) => (
    <button onClick={onToggle} style={{
      width: 48, height: 26, borderRadius: 99,
      background: on ? 'var(--accent)' : 'var(--bg-input)',
      border: '1px solid var(--border)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 99,
        background: on ? '#0e0e0f' : 'var(--text-muted)',
        position: 'absolute', top: 3,
        left: on ? 25 : 3, transition: 'left 0.2s'
      }} />
    </button>
  )

  const Section = ({ children, style }) => (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      marginBottom: 16,
      ...style
    }}>{children}</div>
  )

  const Row = ({ label, sub, right, borderTop }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 16px',
      borderTop: borderTop ? '1px solid var(--border)' : 'none'
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div>{right}</div>
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 100px' }}>

      <h2 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 24 }}>
        Profile ✦
      </h2>

      {/* Avatar card */}
      <Section>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 99,
            background: 'var(--accent-dim)',
            border: '2px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: 'var(--accent)', fontWeight: 700,
            fontFamily: 'var(--font-display)'
          }}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {user?.user_metadata?.full_name || 'User'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-hint)', marginTop: 2 }}>{user?.email || 'Local mode'}</div>
          </div>
        </div>
      </Section>

      {/* Settings */}
      <Section>
        <Row label="Daily reminder" sub="Get reminded at 8pm if you haven't logged" right={<Toggle on={notifEnabled} onToggle={toggleNotifications} />} />
        <Row label="Appearance" sub={isDark ? 'Dark mode' : 'Light mode'} borderTop right={
          <Toggle on={!isDark} onToggle={() => {
            const next = !isDark; setIsDark(next)
            localStorage.setItem('theme', next ? 'dark' : 'light')
            document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
          }} />
        } />
      </Section>

      {/* Goals */}
      <Section>
        <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>Daily goals</span>
          <button onClick={() => setEditing(!editing)} style={{
            background: editing ? 'var(--danger-dim)' : 'var(--accent-dim)',
            borderRadius: 8, padding: '5px 14px',
            color: editing ? 'var(--danger)' : 'var(--accent)',
            fontSize: 13, fontWeight: 600,
            border: `1px solid ${editing ? 'var(--danger)' : 'var(--accent-glow)'}`
          }}>{editing ? 'Cancel' : 'Edit'}</button>
        </div>
        {editing ? (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 6, fontWeight: 500 }}>Your name</div>
              <input style={inputStyle} placeholder="e.g. Zaynab" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 6, fontWeight: 500 }}>Calories (kcal)</div>
              <input style={inputStyle} type="number" value={calGoal} onChange={e => setCalGoal(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['Protein (g)', protein, setProtein], ['Carbs (g)', carbs, setCarbs], ['Fat (g)', fat, setFat]].map(([label, val, set]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 6, fontWeight: 500 }}>{label}</div>
                  <input style={{ ...inputStyle, padding: '10px' }} type="number" value={val} onChange={e => set(e.target.value)} />
                </div>
              ))}
            </div>
            <button onClick={saveGoals} style={{
              marginTop: 4, padding: '13px', background: 'var(--accent)',
              borderRadius: 'var(--radius-sm)', color: '#0e0e0f', fontSize: 15, fontWeight: 700,
              fontFamily: 'var(--font-display)', boxShadow: '0 4px 16px var(--accent-glow)'
            }}>Save goals</button>
          </div>
        ) : (
          <>
            {[['Calories', `${goal} kcal`], ['Protein', `${macroGoals.protein}g`], ['Carbs', `${macroGoals.carbs}g`], ['Fat', `${macroGoals.fat}g`]].map(([label, val], i) => (
              <Row key={label} label={label} borderTop={i > 0} right={
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{val}</span>
              } />
            ))}
          </>
        )}
      </Section>

      {/* Actions */}
      {user ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: '✨ Restore purchase', bg: 'var(--accent-dim)', color: 'var(--accent)', border: 'var(--accent-glow)', action: async () => {
              const { data } = await supabase.from('profiles').select('is_premium').eq('id', user.id).single()
              if (data?.is_premium) alert('✨ Pro access confirmed!')
              else window.location.href = 'https://calorie-tracker.lemonsqueezy.com/checkout/buy/dcfeff6d-dfd3-4617-b1c2-bfe200389807?redirect_url=https://calorie-tracker-fawn-sigma.vercel.app?upgraded=true'
            }},
            { label: '📤 Share Mizan', bg: 'var(--bg-card)', color: 'var(--text)', border: 'var(--border)', action: () => {
              if (navigator.share) navigator.share({ title: 'Mizan — AI Calorie Tracker', text: 'Track nutrition with AI!', url: 'https://calorie-tracker-fawn-sigma.vercel.app' })
              else { navigator.clipboard.writeText('https://calorie-tracker-fawn-sigma.vercel.app'); alert('Link copied!') }
            }},
            { label: 'Manage subscription', bg: 'var(--bg-card)', color: 'var(--text-muted)', border: 'var(--border)', action: () => alert('Check your email receipt from Mizan and click "Manage subscription".') },
            { label: 'Sign out', bg: 'var(--danger-dim)', color: 'var(--danger)', border: 'var(--danger)', action: () => supabase.auth.signOut() },
          ].map(({ label, bg, color, border, action }) => (
            <button key={label} onClick={action} style={{
              width: '100%', padding: '14px',
              background: bg, borderRadius: 'var(--radius)',
              color, fontSize: 15, fontWeight: 600,
              border: `1px solid ${border}`,
              fontFamily: 'var(--font-display)'
            }}>{label}</button>
          ))}
        </div>
      ) : (
        <button onClick={() => { localStorage.removeItem('skip_auth'); location.reload() }} style={{
          width: '100%', padding: '14px', background: 'var(--bg-card)',
          borderRadius: 'var(--radius)', color: 'var(--text-muted)', fontSize: 15, fontWeight: 600,
          border: '1px solid var(--border)'
        }}>Switch to account</button>
      )}

      <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: 'var(--text-hint)' }}>
        Mizan · Patent pending · DTH Technology
      </p>
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 20 }}>
        {[['Privacy Policy', '/privacy.html'], ['Terms', '/terms.html'], ['About', '/about.html']].map(([label, href]) => (
          <a key={label} href={href} style={{ fontSize: 12, color: 'var(--text-hint)', textDecoration: 'none' }}>{label}</a>
        ))}
      </div>
    </div>
  )
}
