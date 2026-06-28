import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

import ScreenLayout from '../components/ScreenLayout.jsx'

export default function WeightTracker({ user }) {
  const [logs, setLogs]         = useState([])
  const [weight, setWeight]     = useState('')
  const [note, setNote]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [unit, setUnit]         = useState(() => localStorage.getItem('weight_unit') || 'kg')

  const toKg  = w => unit === 'lbs' ? w / 2.205 : w
  const fromKg = w => unit === 'lbs' ? +(w * 2.205).toFixed(1) : +w.toFixed(1)

  useEffect(() => { if (user) loadLogs() }, [user])

  async function loadLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: true })
      .limit(90)
    setLogs(data || [])
    setLoading(false)
  }

  async function saveWeight() {
    if (!weight || !user) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const kg = toKg(Number(weight))
    // Upsert today's entry
    const { error } = await supabase.from('weight_logs').upsert({
      user_id: user.id,
      weight_kg: +kg.toFixed(2),
      logged_at: today,
      note: note || null,
    }, { onConflict: 'user_id,logged_at' })
    if (!error) { setWeight(''); setNote(''); await loadLogs() }
    setSaving(false)
  }

  // Chart data — last 30 entries
  const chartData = logs.slice(-30)
  const weights   = chartData.map(l => fromKg(l.weight_kg))
  const minW      = Math.min(...weights) - 1
  const maxW      = Math.max(...weights) + 1
  const range     = maxW - minW || 1

  const todayKey  = new Date().toISOString().split('T')[0]
  const todayLog  = logs.find(l => l.logged_at === todayKey)
  const latest    = logs[logs.length - 1]
  const first     = logs[0]
  const change    = latest && first && logs.length > 1
    ? +(fromKg(latest.weight_kg) - fromKg(first.weight_kg)).toFixed(1)
    : null

  const W = 320, H = 120, PAD = 16

  function pointX(i) { return PAD + (i / Math.max(chartData.length - 1, 1)) * (W - PAD * 2) }
  function pointY(w) { return H - PAD - ((w - minW) / range) * (H - PAD * 2) }

  const polyline = chartData.map((l, i) => `${pointX(i)},${pointY(fromKg(l.weight_kg))}`).join(' ')

  return (
    <ScreenLayout
      title="Weight"
      subtitle="Track your progress over time"
      headerRight={
        <div className="segment-ios">
          {['kg', 'lbs'].map(u => (
            <button key={u} onClick={() => { setUnit(u); localStorage.setItem('weight_unit', u) }} className={`segment-ios-btn${unit === u ? ' active' : ''}`}>{u}</button>
          ))}
        </div>
      }
    >

        {/* Stats row */}
        {logs.length > 0 && (
          <div className="stat-grid stat-grid-3" style={{ marginBottom: 12 }}>
            {[
              { label: 'Current', value: latest ? fromKg(latest.weight_kg) : '—', unit, color: 'var(--accent)' },
              { label: 'Starting', value: first ? fromKg(first.weight_kg) : '—', unit, color: 'var(--text)' },
              { label: 'Change', value: change !== null ? (change > 0 ? `+${change}` : change) : '—', unit: change !== null ? unit : '', color: change === null ? 'var(--text)' : change < 0 ? 'var(--accent)' : 'var(--orange)' },
            ].map(({ label, value, unit: u, color }) => (
              <div key={label} className="stat-box" style={{ padding: '14px 10px', textAlign: 'center' }}>
                <div className="stat-box-label">{label.toUpperCase()}</div>
                <div className="stat-box-value" style={{ fontSize: 22, color }}>{value}</div>
                <div className="stat-box-unit">{u}</div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>Last {chartData.length} entries</div>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(t => (
                <line key={t} x1={PAD} x2={W - PAD} y1={PAD + t * (H - PAD * 2)} y2={PAD + t * (H - PAD * 2)} stroke="var(--border)" strokeWidth="1" strokeDasharray="4,4" />
              ))}
              {/* Area fill */}
              <defs>
                <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18"/>
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <polygon
                points={`${pointX(0)},${H - PAD} ${polyline} ${pointX(chartData.length - 1)},${H - PAD}`}
                fill="url(#wgrad)"
              />
              {/* Line */}
              <polyline points={polyline} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Dots */}
              {chartData.map((l, i) => (
                <circle key={i} cx={pointX(i)} cy={pointY(fromKg(l.weight_kg))} r="4"
                  fill={l.logged_at === todayKey ? 'var(--accent)' : 'var(--bg-card)'}
                  stroke="var(--accent)" strokeWidth="2"
                />
              ))}
            </svg>
            {/* X axis labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {[chartData[0], chartData[Math.floor(chartData.length / 2)], chartData[chartData.length - 1]].map((l, i) => (
                <div key={i} style={{ fontSize: 10, color: 'var(--text-hint)' }}>
                  {l ? new Date(l.logged_at + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Log today */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14 }}>
            {todayLog ? `Today: ${fromKg(todayLog.weight_kg)} ${unit} — update` : 'Log today\'s weight'}
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input
              type="number" step="0.1" placeholder={`Weight in ${unit}`}
              value={weight} onChange={e => setWeight(e.target.value)}
              style={{ flex: 1, padding: '13px 16px', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 16, fontFamily: 'inherit' }}
            />
            <button onClick={saveWeight} disabled={!weight || saving} style={{ padding: '13px 20px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 15, fontWeight: 700, boxShadow: 'var(--shadow-accent)', opacity: !weight || saving ? 0.6 : 1 }}>
              {saving ? '…' : 'Save'}
            </button>
          </div>
          <input
            type="text" placeholder="Optional note (e.g. 'After gym')"
            value={note} onChange={e => setNote(e.target.value)}
            style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit' }}
          />
        </div>

        {/* History */}
        {logs.length > 0 && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>History</div>
            {[...logs].reverse().slice(0, 20).map((l, i) => {
              const prev = [...logs].reverse()[i + 1]
              const diff = prev ? +(fromKg(l.weight_kg) - fromKg(prev.weight_kg)).toFixed(1) : null
              return (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', borderBottom: i < Math.min(logs.length, 20) - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{fromKg(l.weight_kg)} {unit}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 2 }}>
                      {new Date(l.logged_at + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {l.note ? ` · ${l.note}` : ''}
                    </div>
                  </div>
                  {diff !== null && (
                    <div style={{ fontSize: 13, fontWeight: 700, color: diff < 0 ? 'var(--accent)' : diff > 0 ? 'var(--orange)' : 'var(--text-hint)' }}>
                      {diff > 0 ? `+${diff}` : diff} {unit}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {logs.length === 0 && !loading && (
          <div className="empty-state">
            <img src="/logo.png" alt="Mizan" />
            <div className="empty-state-title">No weight logged yet</div>
            <div className="empty-state-sub">Log your weight above to start tracking.</div>
          </div>
        )}
    </ScreenLayout>
  )
}
