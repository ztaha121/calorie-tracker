import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

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

export default function ProfileScreen({ user, goal, macroGoals, onUpdateGoals }) {
  // ── Goals editing ──────────────────────────────────────────────────────────
  const [editing, setEditing]           = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [displayName, setDisplayName]   = useState(user?.user_metadata?.full_name || '')
  const [calGoal, setCalGoal]           = useState(goal)
  const [protein, setProtein]           = useState(macroGoals.protein)
  const [carbs, setCarbs]               = useState(macroGoals.carbs)
  const [fat, setFat]                   = useState(macroGoals.fat)

  // ── Notifications / theme ──────────────────────────────────────────────────
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('notif_enabled') === 'true')
  const [isDark, setIsDark]             = useState(() => localStorage.getItem('theme') !== 'light')

  // ── Calculator ─────────────────────────────────────────────────────────────
  const saved = (() => { try { return JSON.parse(localStorage.getItem('settings') || '{}') } catch { return {} } })()
  const [weight, setWeight]     = useState(saved.weight || '')
  const [height, setHeight]     = useState(saved.height || '')
  const [age, setAge]           = useState(saved.age || '')
  const [sex, setSex]           = useState(saved.sex || 'female')
  const [activity, setActivity] = useState(saved.activity || 'moderate')
  const [goalType, setGoalType] = useState(saved.goalType || 'maintain')
  const [calcResult, setCalcResult] = useState(null)

  // ── Manage Account modal ───────────────────────────────────────────────────
  const [showManageModal, setShowManageModal]   = useState(false)
  const [showDeleteFlow, setShowDeleteFlow]     = useState(false)
  const [confirmEmail, setConfirmEmail]         = useState('')
  const [deleteLoading, setDeleteLoading]       = useState(false)
  const [deleteError, setDeleteError]           = useState('')

  // ── Helpers ────────────────────────────────────────────────────────────────
  function closeManageModal() {
    setShowManageModal(false)
    setShowDeleteFlow(false)
    setConfirmEmail('')
    setDeleteError('')
    setDeleteLoading(false)
  }

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

  function handleCalculate() {
    const result = calculateGoals({ weight, height, age, sex, activity, goalType })
    if (result) {
      setCalcResult(result)
      setCalGoal(result.goal)
      setProtein(result.macroGoals.protein)
      setCarbs(result.macroGoals.carbs)
      setFat(result.macroGoals.fat)
    }
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
    if (confirmEmail.trim().toLowerCase() !== user?.email?.toLowerCase()) {
      setDeleteError("Email doesn't match. Please try again.")
      return
    }
    setDeleteLoading(true)
    setDeleteError('')
    try {
      // 1. Delete all food logs
      const { error: logsErr } = await supabase
        .from('food_logs')
        .delete()
        .eq('user_id', user.id)
      if (logsErr) throw logsErr

      // 2. Delete profile row (silent fail — may not exist)
      await supabase.from('profiles').delete().eq('id', user.id)

      // 3. Delete the auth account via edge function, then sign out
      await supabase.functions.invoke('delete-account')
      await supabase.auth.signOut()

    } catch (err) {
      setDeleteError(err.message || 'Something went wrong. Please try again.')
      setDeleteLoading(false)
    }
  }

  // ── Style helpers ──────────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xs)', color: 'var(--text)', fontSize: 15
  }
  const chipStyle = (active) => ({
    flex: 1, padding: '9px 6px', borderRadius: 'var(--radius-xs)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
    background: active ? 'var(--accent-dim)' : 'var(--bg-input)',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    color: active ? 'var(--accent)' : 'var(--text-muted)'
  })

  const Toggle = ({ on, onToggle }) => (
    <button onClick={onToggle} style={{ width: 48, height: 26, borderRadius: 99, background: on ? 'var(--accent)' : 'var(--bg-input)', border: '1px solid var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 20, height: 20, borderRadius: 99, background: on ? '#0e0e0f' : 'var(--text-muted)', position: 'absolute', top: 3, left: on ? 25 : 3, transition: 'left 0.2s' }} />
    </button>
  )
  const Section = ({ children, style }) => (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 16, ...style }}>{children}</div>
  )
  const Row = ({ label, sub, right, borderTop }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: borderTop ? '1px solid var(--border)' : 'none' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div>{right}</div>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 100px' }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 24 }}>Profile ✦</h2>

      {/* Avatar card */}
      <Section>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 99, background: 'var(--accent-dim)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.02em' }}>{user?.user_metadata?.full_name || 'User'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-hint)', marginTop: 2 }}>{user?.email || 'Local mode'}</div>
          </div>
        </div>
      </Section>

      {/* Toggles */}
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

      {/* Daily goals */}
      <Section>
        <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Daily goals</span>
          <button onClick={() => setEditing(!editing)} style={{ background: editing ? 'var(--danger-dim)' : 'var(--accent-dim)', borderRadius: 8, padding: '5px 14px', color: editing ? 'var(--danger)' : 'var(--accent)', fontSize: 13, fontWeight: 600, border: `1px solid ${editing ? 'var(--danger)' : 'var(--accent-glow)'}` }}>{editing ? 'Cancel' : 'Edit'}</button>
        </div>

        {editing ? (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 6, fontWeight: 500 }}>Your name</div>
              <input style={inputStyle} placeholder="e.g. Zaynab" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <button onClick={() => setShowCalculator(!showCalculator)} style={{ padding: '11px', background: 'var(--bg-input)', borderRadius: 'var(--radius-xs)', color: 'var(--accent)', fontSize: 13, fontWeight: 700, border: '1px solid var(--accent-glow)', fontFamily: 'var(--font-display)' }}>
              ✦ {showCalculator ? 'Hide calculator' : 'Calculate from my stats'}
            </button>
            {showCalculator && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setSex('female')} style={chipStyle(sex === 'female')}>Female</button>
                  <button onClick={() => setSex('male')} style={chipStyle(sex === 'male')}>Male</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[['Age (yrs)', age, setAge, '25'], ['Weight (kg)', weight, setWeight, '65'], ['Height (cm)', height, setHeight, '165']].map(([label, val, set, ph]) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 5, fontWeight: 500 }}>{label}</div>
                      <input style={{ ...inputStyle, padding: '9px 10px', fontSize: 14 }} type="number" placeholder={ph} value={val} onChange={e => set(e.target.value)} />
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 6, fontWeight: 500 }}>Activity level</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[['sedentary','Sedentary'],['light','Light'],['moderate','Moderate'],['active','Active']].map(([val, label]) => (
                      <button key={val} onClick={() => setActivity(val)} style={chipStyle(activity === val)}>{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-hint)', marginBottom: 6, fontWeight: 500 }}>Goal</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[['loss','Lose weight'],['maintain','Maintain'],['gain','Build muscle']].map(([val, label]) => (
                      <button key={val} onClick={() => setGoalType(val)} style={{ ...chipStyle(goalType === val), fontSize: 11 }}>{label}</button>
                    ))}
                  </div>
                </div>
                <button onClick={handleCalculate} style={{ padding: '11px', background: 'var(--accent)', borderRadius: 'var(--radius-xs)', color: '#0e0e0f', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Calculate</button>
                {calcResult && (
                  <div style={{ background: 'var(--accent-dim)', borderRadius: 'var(--radius-xs)', padding: '10px 12px', fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
                    ✦ Suggested: {calcResult.goal} kcal · P {calcResult.macroGoals.protein}g · C {calcResult.macroGoals.carbs}g · F {calcResult.macroGoals.fat}g
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 400 }}>Values applied below — adjust if needed</div>
                  </div>
                )}
              </div>
            )}
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
            <button onClick={saveGoals} style={{ marginTop: 4, padding: '13px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#0e0e0f', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', boxShadow: '0 4px 16px var(--accent-glow)' }}>Save goals</button>
          </div>
        ) : (
          <>
            {[['Calories', `${goal} kcal`], ['Protein', `${macroGoals.protein}g`], ['Carbs', `${macroGoals.carbs}g`], ['Fat', `${macroGoals.fat}g`]].map(([label, val], i) => (
              <Row key={label} label={label} borderTop={i > 0} right={<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{val}</span>} />
            ))}
          </>
        )}
      </Section>

      {/* Action buttons */}
      {user ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            {
              label: '✨ Restore purchase',
              bg: 'var(--accent-dim)', color: 'var(--accent)', border: 'var(--accent-glow)',
              action: async () => {
                const { data } = await supabase.from('profiles').select('is_premium').eq('id', user.id).single()
                if (data?.is_premium) alert('✨ Pro access confirmed!')
                else window.location.href = 'https://calorie-tracker.lemonsqueezy.com/checkout/buy/dcfeff6d-dfd3-4617-b1c2-bfe200389807?redirect_url=https://calorie-tracker-fawn-sigma.vercel.app?upgraded=true'
              }
            },
            {
              label: '📤 Share Mizan',
              bg: 'var(--bg-card)', color: 'var(--text)', border: 'var(--border)',
              action: () => {
                if (navigator.share) navigator.share({ title: 'Mizan', text: 'Track nutrition with AI!', url: 'https://calorie-tracker-fawn-sigma.vercel.app' })
                else { navigator.clipboard.writeText('https://calorie-tracker-fawn-sigma.vercel.app'); alert('Link copied!') }
              }
            },
            {
              label: 'Manage subscription',
              bg: 'var(--bg-card)', color: 'var(--text-muted)', border: 'var(--border)',
              action: () => {
                const email = user?.email || ''
                window.open(email ? `https://app.lemonsqueezy.com/my-orders?email=${encodeURIComponent(email)}` : 'https://app.lemonsqueezy.com/my-orders', '_blank')
              }
            },
            {
              label: '⚙️ Manage account',
              bg: 'var(--bg-card)', color: 'var(--text-muted)', border: 'var(--border)',
              action: () => setShowManageModal(true)
            },
            {
              label: 'Sign out',
              bg: 'var(--danger-dim)', color: 'var(--danger)', border: 'var(--danger)',
              action: () => supabase.auth.signOut()
            },
          ].map(({ label, bg, color, border, action }) => (
            <button key={label} onClick={action} style={{ width: '100%', padding: '14px', background: bg, borderRadius: 'var(--radius)', color, fontSize: 15, fontWeight: 600, border: `1px solid ${border}`, fontFamily: 'var(--font-display)' }}>{label}</button>
          ))}
        </div>
      ) : (
        <button onClick={() => { localStorage.removeItem('skip_auth'); location.reload() }} style={{ width: '100%', padding: '14px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', color: 'var(--text-muted)', fontSize: 15, fontWeight: 600, border: '1px solid var(--border)' }}>Switch to account</button>
      )}

      {/* About AI */}
      <div style={{ marginTop: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', marginBottom: 10 }}>About AI features</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 8 }}>
          Mizan's AI food scan is powered by <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Claude (Anthropic)</span>, one of the most advanced AI models available. It analyzes photos of your meals and estimates calories and macronutrients.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 8 }}>
          AI estimates are approximations — portion sizes and cooking methods affect accuracy. Always verify with a nutritionist for medical decisions.
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-hint)', lineHeight: 1.5 }}>
          Food search data from USDA FoodData Central & Open Food Facts. Arabic food database curated by the Mizan team.
        </p>
      </div>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-hint)' }}>Mizan · Patent pending · DTH Technology</p>
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 20 }}>
        {[['Privacy Policy', '/privacy.html'], ['Terms', '/terms.html'], ['About', '/about.html']].map(([label, href]) => (
          <a key={label} href={href} style={{ fontSize: 12, color: 'var(--text-hint)', textDecoration: 'none' }}>{label}</a>
        ))}
      </div>

      {/* ── Manage Account modal ───────────────────────────────────────────── */}
      {showManageModal && (
        <div
          onClick={closeManageModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, padding: '0 0 env(safe-area-inset-bottom)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: 430, display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Manage Account</span>
              <button onClick={closeManageModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
            </div>

            {!showDeleteFlow ? (
              <>
                {/* Email display */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Signed in as</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{user?.email}</span>
                </div>

                {/* Sign out */}
                <button
                  onClick={() => { closeManageModal(); supabase.auth.signOut() }}
                  style={{ width: '100%', padding: '14px', background: 'var(--bg-card-2, var(--bg-input))', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)' }}
                >
                  Sign Out
                </button>

                {/* Delete account */}
                <button
                  onClick={() => setShowDeleteFlow(true)}
                  style={{ width: '100%', padding: '14px', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)' }}
                >
                  Delete Account
                </button>
              </>
            ) : (
              <>
                {/* Warning */}
                <div style={{ background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.25)', borderRadius: 'var(--radius-xs)', padding: '14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    This will permanently delete your account and <strong style={{ color: 'var(--text)' }}>all your food logs</strong>. This cannot be undone.
                  </p>
                </div>

                {/* Email confirm */}
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Type your email to confirm:</p>
                <input
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}
                  type="email"
                  placeholder={user?.email}
                  value={confirmEmail}
                  onChange={e => { setConfirmEmail(e.target.value); setDeleteError('') }}
                  autoCapitalize="none"
                  autoCorrect="off"
                />

                {deleteError && (
                  <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0, padding: '8px 12px', background: 'var(--danger-dim)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--danger)' }}>{deleteError}</p>
                )}

                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  style={{ width: '100%', padding: '14px', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', opacity: deleteLoading ? 0.6 : 1 }}
                >
                  {deleteLoading ? 'Deleting…' : 'Yes, Delete My Account'}
                </button>

                <button
                  onClick={() => { setShowDeleteFlow(false); setDeleteError(''); setConfirmEmail('') }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, padding: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
