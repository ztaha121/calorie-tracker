import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

const GUMROAD_URL = 'https://zaytaha.gumroad.com/l/cyfiz'

function calculateGoals({ weight, height, age, sex, activity, goalType }) {
  const w = Number(weight), h = Number(height), a = Number(age)
  if (!w || !h || !a) return null
  const bmr = sex === 'female' ? 10*w + 6.25*h - 5*a - 161 : 10*w + 6.25*h - 5*a + 5
  const activityMult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }
  const tdee = Math.round(bmr * (activityMult[activity] || 1.375))
  const calGoal = goalType === 'loss' ? Math.max(tdee - 500, 1200) : goalType === 'gain' ? tdee + 300 : tdee
  return {
    goal: calGoal,
    macroGoals: {
      protein: Math.round((calGoal * 0.30) / 4),
      carbs:   Math.round((calGoal * 0.40) / 4),
      fat:     Math.round((calGoal * 0.30) / 9),
    }
  }
}

export default function ProfileScreen({ user, goal, macroGoals, onUpdateGoals, onNavigate }) {
  const [editing, setEditing]               = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [displayName, setDisplayName]       = useState(user?.user_metadata?.full_name || '')
  const [calGoal, setCalGoal]               = useState(goal)
  const [protein, setProtein]               = useState(macroGoals.protein)
  const [carbs, setCarbs]                   = useState(macroGoals.carbs)
  const [fat, setFat]                       = useState(macroGoals.fat)

  const saved = (() => { try { return JSON.parse(localStorage.getItem('settings') || '{}') } catch { return {} } })()
  const [weight, setWeight]     = useState(saved.weight || '')
  const [height, setHeight]     = useState(saved.height || '')
  const [age, setAge]           = useState(saved.age || '')
  const [sex, setSex]           = useState(saved.sex || 'female')
  const [activity, setActivity] = useState(saved.activity || 'moderate')
  const [goalType, setGoalType] = useState(saved.goalType || 'maintain')
  const [calcResult, setCalcResult] = useState(null)

  const [showManageModal, setShowManageModal] = useState(false)
  const [showDeleteFlow, setShowDeleteFlow]   = useState(false)
  const [confirmEmail, setConfirmEmail]       = useState('')
  const [deleteLoading, setDeleteLoading]     = useState(false)
  const [deleteError, setDeleteError]         = useState('')

  function closeManageModal() {
    setShowManageModal(false); setShowDeleteFlow(false)
    setConfirmEmail(''); setDeleteError(''); setDeleteLoading(false)
  }

  function handleCalculate() {
    const result = calculateGoals({ weight, height, age, sex, activity, goalType })
    if (result) { setCalcResult(result); setCalGoal(result.goal); setProtein(result.macroGoals.protein); setCarbs(result.macroGoals.carbs); setFat(result.macroGoals.fat) }
  }

  async function saveGoals() {
    if (displayName && user) await supabase.auth.updateUser({ data: { full_name: displayName } })
    const updated = { goal: Number(calGoal), macroGoals: { protein: Number(protein), carbs: Number(carbs), fat: Number(fat) } }
    onUpdateGoals(updated)
    const existing = (() => { try { return JSON.parse(localStorage.getItem('settings') || '{}') } catch { return {} } })()
    localStorage.setItem('settings', JSON.stringify({ ...existing, ...updated, weight, height, age, sex, activity, goalType }))
    setEditing(false); setShowCalculator(false); setCalcResult(null)
  }

  async function handleDeleteAccount() {
    if (confirmEmail.trim().toLowerCase() !== user?.email?.toLowerCase()) { setDeleteError("Email doesn't match."); return }
    setDeleteLoading(true); setDeleteError('')
    try {
      const { error: logsErr } = await supabase.from('food_logs').delete().eq('user_id', user.id)
      if (logsErr) throw logsErr
      await supabase.from('profiles').delete().eq('id', user.id)
      await supabase.functions.invoke('delete-account')
      await supabase.auth.signOut()
    } catch (err) { setDeleteError(err.message || 'Something went wrong.'); setDeleteLoading(false) }
  }

  const inp = {
    width: '100%', padding: '12px 14px',
    background: 'var(--bg-input)', border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-xs)', color: 'var(--text)', fontSize: 15, fontFamily: 'inherit',
  }
  const chip = (active) => ({
    flex: 1, padding: '9px 6px', borderRadius: 'var(--radius-xs)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
    background: active ? 'var(--accent-dim)' : 'var(--bg-input)',
    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    color: active ? 'var(--accent)' : 'var(--text-muted)',
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', paddingBottom: 24 }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>Profile</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 99, background: 'var(--accent-dim)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>{user?.user_metadata?.full_name || 'User'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email || 'Local mode'}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* Daily goals card */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>DAILY GOALS</span>
            <button onClick={() => setEditing(!editing)} style={{ background: editing ? 'var(--danger-dim)' : 'var(--accent-dim)', borderRadius: 8, padding: '5px 14px', color: editing ? 'var(--danger)' : 'var(--accent)', fontSize: 13, fontWeight: 600, border: `1px solid ${editing ? 'rgba(239,68,68,0.3)' : 'var(--accent-glow)'}` }}>
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Your name</div>
                <input style={inp} placeholder="e.g. Zaynab" value={displayName} onChange={e => setDisplayName(e.target.value)} />
              </div>
              <button onClick={() => setShowCalculator(!showCalculator)} style={{ padding: '11px', background: 'var(--bg-card-2)', borderRadius: 'var(--radius-xs)', color: 'var(--accent)', fontSize: 13, fontWeight: 700, border: '1.5px solid var(--accent)' }}>
                ✦ {showCalculator ? 'Hide calculator' : 'Calculate from my stats'}
              </button>
              {showCalculator && (
                <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setSex('female')} style={chip(sex==='female')}>Female</button>
                    <button onClick={() => setSex('male')} style={chip(sex==='male')}>Male</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[['Age (yrs)', age, setAge, '25'], ['Weight (kg)', weight, setWeight, '65'], ['Height (cm)', height, setHeight, '165']].map(([label, val, set, ph]) => (
                      <div key={label}>
                        <div style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 5, fontWeight: 500 }}>{label}</div>
                        <input style={{ ...inp, padding: '9px 10px', fontSize: 14 }} type="number" placeholder={ph} value={val} onChange={e => set(e.target.value)} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 6, fontWeight: 500 }}>Activity level</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {[['sedentary','Sedentary'],['light','Light'],['moderate','Moderate'],['active','Active']].map(([val, label]) => (
                        <button key={val} onClick={() => setActivity(val)} style={chip(activity===val)}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 6, fontWeight: 500 }}>Goal</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[['loss','Lose weight'],['maintain','Maintain'],['gain','Build muscle']].map(([val, label]) => (
                        <button key={val} onClick={() => setGoalType(val)} style={{ ...chip(goalType===val), fontSize: 11 }}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleCalculate} style={{ padding: '11px', background: 'var(--accent)', borderRadius: 'var(--radius-xs)', color: '#fff', fontSize: 13, fontWeight: 700 }}>Calculate</button>
                  {calcResult && (
                    <div style={{ background: 'var(--accent-dim)', borderRadius: 'var(--radius-xs)', padding: '10px 12px', fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
                      ✦ {calcResult.goal} kcal · P {calcResult.macroGoals.protein}g · C {calcResult.macroGoals.carbs}g · F {calcResult.macroGoals.fat}g
                    </div>
                  )}
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Calories (kcal)</div>
                <input style={inp} type="number" value={calGoal} onChange={e => setCalGoal(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[['Protein (g)', protein, setProtein], ['Carbs (g)', carbs, setCarbs], ['Fat (g)', fat, setFat]].map(([label, val, set]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 6, fontWeight: 500 }}>{label}</div>
                    <input style={{ ...inp, padding: '10px' }} type="number" value={val} onChange={e => set(e.target.value)} />
                  </div>
                ))}
              </div>
              <button onClick={saveGoals} style={{ marginTop: 4, padding: '13px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 15, fontWeight: 700, boxShadow: 'var(--shadow-accent)' }}>Save goals</button>
            </div>
          ) : (
            <>
              {[['Calories', `${goal} kcal`], ['Protein', `${macroGoals.protein}g`], ['Carbs', `${macroGoals.carbs}g`], ['Fat', `${macroGoals.fat}g`]].map(([label, val], i) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{val}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Account actions */}
        {user ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
            {[
              { label: '✨ Restore purchase', color: 'var(--accent)', action: async () => { const { data } = await supabase.from('profiles').select('is_premium').eq('id', user.id).single(); if (data?.is_premium) alert('✨ Pro access confirmed!'); else window.location.href = GUMROAD_URL } },
              { label: '📤 Share Mizan', color: 'var(--text)', action: () => { if (navigator.share) navigator.share({ title: 'Mizan', text: 'Track nutrition with AI!', url: 'https://calorie-tracker-fawn-sigma.vercel.app' }); else { navigator.clipboard.writeText('https://calorie-tracker-fawn-sigma.vercel.app'); alert('Link copied!') } } },
              { label: '⚙️ Manage account', color: 'var(--text-muted)', action: () => setShowManageModal(true) },
              { label: 'Sign out', color: 'var(--danger)', action: () => supabase.auth.signOut() },
            ].map(({ label, color, action }, i) => (
              <button key={label} onClick={action} style={{ width: '100%', padding: '15px 16px', background: 'transparent', textAlign: 'left', fontSize: 15, fontWeight: 500, color, borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {label}
                <span style={{ color: 'var(--text-hint)', fontSize: 18 }}>›</span>
              </button>
            ))}
          </div>
        ) : (
          <button onClick={() => { localStorage.removeItem('skip_auth'); location.reload() }} style={{ width: '100%', padding: '14px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', color: 'var(--text-muted)', fontSize: 15, fontWeight: 600, border: '1px solid var(--border)' }}>Switch to account</button>
        )}

        <p style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: 'var(--text-hint)' }}>Mizan · Patent pending · DTH Technology</p>
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 20, paddingBottom: 8 }}>
          {[['Privacy', '/privacy.html'], ['Terms', '/terms.html'], ['About', '/about.html']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 12, color: 'var(--text-hint)', textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
      </div>

      {/* Manage Account modal */}
      {showManageModal && (
        <div onClick={closeManageModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 430, display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--border)', borderBottom: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>Manage Account</span>
              <button onClick={closeManageModal} style={{ background: 'var(--bg-card-2)', borderRadius: 99, width: 30, height: 30, color: 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            {!showDeleteFlow ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Signed in as</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.email}</span>
                </div>
                <button onClick={() => { closeManageModal(); supabase.auth.signOut() }} style={{ width: '100%', padding: '14px', background: 'var(--bg-card-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 15, fontWeight: 600 }}>Sign Out</button>
                <button onClick={() => setShowDeleteFlow(true)} style={{ width: '100%', padding: '14px', background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: 15, fontWeight: 600 }}>Delete Account</button>
              </>
            ) : (
              <>
                <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, padding: '14px', display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>This will permanently delete your account and <strong>all your food logs</strong>. This cannot be undone.</p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Type your email to confirm:</p>
                <input style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-xs)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} type="email" placeholder={user?.email} value={confirmEmail} onChange={e => { setConfirmEmail(e.target.value); setDeleteError('') }} autoCapitalize="none" />
                {deleteError && <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0, padding: '8px 12px', background: 'var(--danger-dim)', borderRadius: 8 }}>{deleteError}</p>}
                <button onClick={handleDeleteAccount} disabled={deleteLoading} style={{ width: '100%', padding: '14px', background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: 15, fontWeight: 700, opacity: deleteLoading ? 0.6 : 1 }}>
                  {deleteLoading ? 'Deleting…' : 'Yes, Delete My Account'}
                </button>
                <button onClick={() => { setShowDeleteFlow(false); setDeleteError(''); setConfirmEmail('') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, padding: '8px' }}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
