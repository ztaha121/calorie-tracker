import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// Generate a short unique code for sharing
function generateCode(userId) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function ProgressRing({ pct, size = 52, color = '#00b96b', calories, goal }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.min(pct, 1) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={size/2} y={size/2 + 4} textAnchor="middle"
        style={{ fontSize: 11, fontWeight: 800, fill: 'var(--text)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.03em' }}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}

export default function FriendsScreen({ user, allEntries, goal }) {
  const [myCode, setMyCode]         = useState('')
  const [friends, setFriends]       = useState([])
  const [friendsProgress, setFriendsProgress] = useState([])
  const [addCode, setAddCode]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError]           = useState('')
  const [copied, setCopied]         = useState(false)
  const [shareEnabled, setShareEnabled] = useState(true)

  // My calories today
  const todayKey = new Date().toISOString().split('T')[0]
  const myCalories = Math.round((allEntries[todayKey] || []).reduce((s, e) => s + (e.calories || 0), 0))
  const myPct = goal > 0 ? myCalories / goal : 0

  useEffect(() => {
    if (user) {
      ensureProfile()
      loadFriends()
    }
  }, [user])

  // Poll friends progress every 30s
  useEffect(() => {
    if (!friends.length) return
    loadFriendsProgress()
    const t = setInterval(loadFriendsProgress, 30000)
    return () => clearInterval(t)
  }, [friends])

  async function ensureProfile() {
    // Get or create friend code
    const { data } = await supabase
      .from('profiles')
      .select('friend_code, share_progress, display_name')
      .eq('id', user.id)
      .single()

    if (data?.friend_code) {
      setMyCode(data.friend_code)
      setShareEnabled(data.share_progress ?? true)
    } else {
      // Generate and save a code
      const code = generateCode(user.id)
      await supabase.from('profiles').upsert({
        id: user.id,
        friend_code: code,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        share_progress: true,
      })
      setMyCode(code)
    }
  }

  async function loadFriends() {
    setLoading(true)
    const { data } = await supabase
      .from('friends')
      .select('id, friend_id, user_id, status')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted')
    setFriends(data || [])
    setLoading(false)
  }

  async function loadFriendsProgress() {
    if (!friends.length) return
    const friendIds = friends.map(f => f.user_id === user.id ? f.friend_id : f.user_id)

    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, friend_code, share_progress, daily_goal')
      .in('id', friendIds)

    // Get today's food logs for each friend
    const today = new Date().toISOString().split('T')[0]
    const { data: logs } = await supabase
      .from('food_logs')
      .select('user_id, calories')
      .in('user_id', friendIds)
      .eq('date', today)

    // Aggregate
    const calMap = {}
    ;(logs || []).forEach(l => {
      calMap[l.user_id] = (calMap[l.user_id] || 0) + (l.calories || 0)
    })

    const progress = (profiles || [])
      .filter(p => p.share_progress)
      .map(p => ({
        id: p.id,
        name: p.display_name || 'Friend',
        calories: Math.round(calMap[p.id] || 0),
        goal: p.daily_goal || 2000,
        pct: p.daily_goal ? Math.min((calMap[p.id] || 0) / p.daily_goal, 1) : 0,
      }))
      .sort((a, b) => b.pct - a.pct) // leaderboard order

    setFriendsProgress(progress)
  }

  async function addFriend() {
    const code = addCode.trim().toUpperCase()
    if (!code || code.length < 6) { setError('Enter a valid 6-character friend code.'); return }
    if (code === myCode) { setError("That's your own code!"); return }
    setAddLoading(true); setError('')

    // Find profile with this code
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('friend_code', code)
      .single()

    if (!profile) { setError('No user found with that code.'); setAddLoading(false); return }

    // Check already friends
    const { data: existing } = await supabase
      .from('friends')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${user.id})`)
      .single()

    if (existing) { setError('Already friends!'); setAddLoading(false); return }

    // Add friend (auto-accept for simplicity)
    const { error: insertErr } = await supabase.from('friends').insert([
      { user_id: user.id, friend_id: profile.id, status: 'accepted' },
      { user_id: profile.id, friend_id: user.id, status: 'accepted' },
    ])

    if (insertErr) { setError('Could not add friend. Try again.'); setAddLoading(false); return }

    setAddCode('')
    await loadFriends()
    setAddLoading(false)
  }

  async function removeFriend(friendId) {
    if (!window.confirm('Remove this friend?')) return
    await supabase.from('friends').delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
    await loadFriends()
    setFriendsProgress(prev => prev.filter(f => f.id !== friendId))
  }

  async function toggleSharing() {
    const next = !shareEnabled
    setShareEnabled(next)
    await supabase.from('profiles').update({ share_progress: next }).eq('id', user.id)
  }

  function copyCode() {
    navigator.clipboard.writeText(myCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareCode() {
    const text = `Join me on Mizan! Add me as a friend using code: ${myCode} 🏆\nDownload: calorie-tracker-fawn-sigma.vercel.app`
    if (navigator.share) navigator.share({ title: 'Join me on Mizan', text })
    else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  // Build leaderboard: me + friends
  const leaderboard = [
    {
      id: user.id,
      name: user.user_metadata?.full_name?.split(' ')[0] || 'You',
      calories: myCalories,
      goal,
      pct: myPct,
      isMe: true,
    },
    ...friendsProgress.map(f => ({ ...f, isMe: false })),
  ].sort((a, b) => b.pct - a.pct)

  const myRank = leaderboard.findIndex(l => l.isMe) + 1

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24, background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>Friends</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Live leaderboard · updates every 30s</div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* My code card */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '18px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.08em', marginBottom: 10 }}>YOUR FRIEND CODE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, background: 'var(--bg-card-2)', borderRadius: 12, padding: '14px 18px', textAlign: 'center' }}>
              <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.18em', color: 'var(--accent)', fontFamily: 'monospace' }}>{myCode || '……'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyCode} style={{ flex: 1, padding: '11px', background: 'var(--accent-dim)', borderRadius: 10, color: 'var(--accent)', fontSize: 13, fontWeight: 700, border: '1px solid var(--accent-glow)' }}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button onClick={shareCode} style={{ flex: 1, padding: '11px', background: 'var(--accent)', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: 'var(--shadow-accent)' }}>
              📤 Share
            </button>
          </div>
        </div>

        {/* Add friend */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '18px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>Add a friend</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="Enter friend code"
              value={addCode}
              onChange={e => { setAddCode(e.target.value.toUpperCase()); setError('') }}
              maxLength={6}
              style={{ flex: 1, padding: '13px 16px', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 16, fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase' }}
            />
            <button onClick={addFriend} disabled={addLoading || addCode.length < 6} style={{ padding: '13px 18px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 15, fontWeight: 700, opacity: addCode.length < 6 ? 0.5 : 1 }}>
              {addLoading ? '…' : 'Add'}
            </button>
          </div>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8, padding: '8px 12px', background: 'var(--danger-dim)', borderRadius: 8 }}>{error}</div>}
        </div>

        {/* Privacy toggle */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-card)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Share my progress</div>
            <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 2 }}>Friends can see your daily calories</div>
          </div>
          <button onClick={toggleSharing} style={{
            width: 48, height: 28, borderRadius: 99,
            background: shareEnabled ? 'var(--accent)' : 'var(--bg-input)',
            border: '1.5px solid var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}>
            <div style={{ width: 22, height: 22, borderRadius: 99, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', position: 'absolute', top: 2, left: shareEnabled ? 22 : 2, transition: 'left 0.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
          </button>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 1 ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Today's leaderboard</div>
              <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>Rank #{myRank}</div>
            </div>

            {leaderboard.map((person, idx) => {
              const medals = ['🥇', '🥈', '🥉']
              const medal  = medals[idx] || `${idx + 1}.`
              const color  = person.pct >= 1 ? 'var(--accent)' : person.pct >= 0.75 ? 'var(--orange)' : 'var(--blue)'

              return (
                <div key={person.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  borderBottom: idx < leaderboard.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  background: person.isMe ? 'var(--accent-dim)' : 'transparent',
                }}>
                  {/* Rank */}
                  <div style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{medal}</div>

                  {/* Ring */}
                  <ProgressRing pct={person.pct} size={52} color={color} calories={person.calories} goal={person.goal} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {person.name}
                      </span>
                      {person.isMe && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 7px', borderRadius: 99 }}>YOU</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {person.calories.toLocaleString()} / {person.goal.toLocaleString()} kcal
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 4, background: 'var(--bg-card-2)', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(person.pct * 100, 100)}%`, background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>

                  {/* Remove button (only for non-me) */}
                  {!person.isMe && (
                    <button onClick={() => removeFriend(person.id)} style={{ width: 28, height: 28, background: 'var(--danger-dim)', borderRadius: 8, color: 'var(--danger)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1.5px dashed var(--border)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No friends yet</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>Share your code above to add friends and compete on the leaderboard.</div>
          </div>
        )}
      </div>
    </div>
  )
}
