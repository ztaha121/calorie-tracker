import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function ProfileScreen({ user, goal, macroGoals, onUpdateGoals }) {
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '')
  const [calGoal, setCalGoal] = useState(goal)
  const [protein, setProtein] = useState(macroGoals.protein)
  const [carbs, setCarbs] = useState(macroGoals.carbs)
  const [fat, setFat] = useState(macroGoals.fat)

  async function saveGoals() {
    if (displayName && user) {
      await supabase.auth.updateUser({ data: { full_name: displayName } })
    }
    onUpdateGoals({
      goal: Number(calGoal),
      macroGoals: { protein: Number(protein), carbs: Number(carbs), fat: Number(fat) }
    })
    setEditing(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.06)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 10, color: '#f0f0f0', fontSize: 15
  }

  const rowStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0', borderBottom: '0.5px solid rgba(255,255,255,0.05)'
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 90px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 24 }}>Profile</h2>

      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 99,
            background: 'rgba(168,224,99,0.15)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 20, color: '#a8e063', fontWeight: 500
          }}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#f0f0f0' }}>
              {user?.user_metadata?.full_name || 'User'}
            </div>
            <div style={{ fontSize: 13, color: '#555' }}>{user?.email || 'Local mode'}</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '0 16px', marginBottom: 20 }}>
        <div style={{ ...rowStyle, borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 14, color: '#888' }}>Daily goals</span>
          <button onClick={() => setEditing(!editing)} style={{
            background: 'rgba(168,224,99,0.1)', borderRadius: 8, padding: '5px 12px',
            color: '#a8e063', fontSize: 13, fontWeight: 500
          }}>{editing ? 'Cancel' : 'Edit'}</button>
        </div>

        {editing ? (
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>Your name</div>
              <input style={inputStyle} placeholder="e.g. Zaynab" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>Calories (kcal)</div>
              <input style={inputStyle} type="number" value={calGoal} onChange={e => setCalGoal(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['Protein (g)', protein, setProtein], ['Carbs (g)', carbs, setCarbs], ['Fat (g)', fat, setFat]].map(([label, val, set]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>{label}</div>
                  <input style={{ ...inputStyle, padding: '10px 10px', fontSize: 14 }} type="number" value={val} onChange={e => set(e.target.value)} />
                </div>
              ))}
            </div>
            <button onClick={saveGoals} style={{
              marginTop: 4, padding: '13px', background: '#a8e063', borderRadius: 12,
              color: '#0e0e0f', fontSize: 15, fontWeight: 600
            }}>Save goals</button>
          </div>
        ) : (
          <>
            <div style={rowStyle}>
              <span style={{ fontSize: 14, color: '#666' }}>Calories</span>
              <span style={{ fontSize: 14, color: '#f0f0f0', fontWeight: 500 }}>{goal} kcal</span>
            </div>
            <div style={rowStyle}>
              <span style={{ fontSize: 14, color: '#666' }}>Protein</span>
              <span style={{ fontSize: 14, color: '#f0f0f0', fontWeight: 500 }}>{macroGoals.protein}g</span>
            </div>
            <div style={rowStyle}>
              <span style={{ fontSize: 14, color: '#666' }}>Carbs</span>
              <span style={{ fontSize: 14, color: '#f0f0f0', fontWeight: 500 }}>{macroGoals.carbs}g</span>
            </div>
            <div style={{ ...rowStyle, borderBottom: 'none' }}>
              <span style={{ fontSize: 14, color: '#666' }}>Fat</span>
              <span style={{ fontSize: 14, color: '#f0f0f0', fontWeight: 500 }}>{macroGoals.fat}g</span>
            </div>
          </>
        )}
      </div>

      {user ? (
        <>
          <button onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Mizan — AI Calorie Tracker',
                text: 'I use Mizan to track my nutrition with AI food scanning. Try it free!',
                url: 'https://calorie-tracker-fawn-sigma.vercel.app'
              })
            } else {
              navigator.clipboard.writeText('https://calorie-tracker-fawn-sigma.vercel.app')
              alert('Link copied!')
            }
          }} style={{
            width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)',
            borderRadius: 14, color: '#f0f0f0', fontSize: 15, fontWeight: 500,
            marginBottom: 10
          }}>📤 Share Mizan with a friend</button>
          <button onClick={async () => {
            const { data } = await supabase.from('profiles').select('is_premium').eq('id', user.id).single()
            if (data?.is_premium) {
              alert('✨ Pro access confirmed! Your subscription is active.')
            } else {
              window.location.href = 'https://calorie-tracker.lemonsqueezy.com/checkout/buy/dcfeff6d-dfd3-4617-b1c2-bfe200389807?redirect_url=https://calorie-tracker-fawn-sigma.vercel.app?upgraded=true'
            }
          }} style={{
            width: '100%', padding: '14px', background: 'rgba(168,224,99,0.08)',
            borderRadius: 14, color: '#a8e063', fontSize: 15, fontWeight: 500,
            marginBottom: 10
          }}>Restore purchase</button>
          <button onClick={signOut} style={{
            width: '100%', padding: '14px', background: 'rgba(255,107,107,0.08)',
            borderRadius: 14, color: '#ff6b6b', fontSize: 15, fontWeight: 500
          }}>Sign out</button>
        </>
      ) : (
        <button onClick={() => { localStorage.removeItem('skip_auth'); location.reload() }} style={{
          width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)',
          borderRadius: 14, color: '#888', fontSize: 15, fontWeight: 500
        }}>Switch to account</button>
      )}

      <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#333' }}>
        Mizan · Patent pending · DTH Technology
      </p>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 16 }}>
        <a href="/privacy.html" style={{ fontSize: 12, color: '#444', textDecoration: 'none' }}>Privacy Policy</a>
        <a href="/terms.html" style={{ fontSize: 12, color: '#444', textDecoration: 'none' }}>Terms of Service</a>
      </div>
    </div>
  )
}
