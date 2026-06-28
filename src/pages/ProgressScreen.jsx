import { useEffect } from 'react'
import ScreenLayout from '../components/ScreenLayout.jsx'

export default function ProgressScreen({ allEntries, goal }) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().split('T')[0]
    const label = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' })
    const entries = allEntries[key] || []
    const calories = Math.round(entries.reduce((sum, e) => sum + (e.calories || 0), 0))
    days.push({ key, label, calories })
  }

  const maxCal = Math.max(...days.map(d => d.calories), goal, 1)
  const allEntryList = Object.values(allEntries).flat()
  const totalDays = Object.keys(allEntries).filter(k => (allEntries[k] || []).length > 0).length
  const avgCal = totalDays > 0 ? Math.round(allEntryList.reduce((s, e) => s + (e.calories || 0), 0) / totalDays) : 0
  const streak = (() => { let s = 0; for (let i = 0; i < 30; i++) { const k = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]; if ((allEntries[k]||[]).length > 0) s++; else break; } return s })()
  const daysUnderGoal = days.filter(d => d.calories > 0 && d.calories <= goal).length
  const daysLogged = days.filter(d => d.calories > 0).length

  useEffect(() => {
    if (streak > 0 && 'serviceWorker' in navigator) navigator.serviceWorker.ready.then(reg => reg.active?.postMessage({ type: 'CHECK_STREAK', streak }))
  }, [streak])

  const msg = (() => {
    if (daysLogged === 0) return { text: 'Start logging today — every meal counts.', accent: 'var(--accent)' }
    if (daysUnderGoal === 7) return { text: 'Perfect week! You hit your goal every day.', accent: '#f97316' }
    if (daysUnderGoal >= 5) return { text: `Great week — ${daysUnderGoal}/7 days under goal.`, accent: 'var(--accent)' }
    if (daysUnderGoal >= 3) return { text: `Good progress — ${daysUnderGoal}/7 days on track.`, accent: 'var(--blue)' }
    return { text: 'Every log is a step forward. Keep going.', accent: 'var(--purple)' }
  })()

  const stats = [
    { label: 'Avg / day', value: avgCal ? `${avgCal}` : '—', unit: avgCal ? 'kcal' : '', color: 'var(--accent)' },
    { label: 'Streak', value: streak, unit: streak === 1 ? 'day' : 'days', color: '#f97316' },
    { label: 'Days logged', value: totalDays, unit: 'total', color: 'var(--blue)' },
    { label: 'On goal', value: daysUnderGoal, unit: 'this week', color: 'var(--purple)' },
  ]

  return (
    <ScreenLayout title="Progress" subtitle="Weekly insights & trends">
      <div className="glass-card glass-card-pad" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${msg.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: msg.accent, boxShadow: `0 0 12px ${msg.accent}` }} />
        </div>
        <div>
          <div className="section-label" style={{ marginBottom: 4 }}>THIS WEEK</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>{msg.text}</div>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 12 }}>
        {stats.map(stat => (
          <div key={stat.label} className="stat-box">
            <div className="stat-box-label">{stat.label.toUpperCase()}</div>
            <div className="stat-box-value" style={{ color: stat.color }}>{stat.value}</div>
            <div className="stat-box-unit">{stat.unit}</div>
          </div>
        ))}
      </div>

      <div className="glass-card glass-card-pad">
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16 }}>Last 7 days</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 130, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${(goal / maxCal) * 100}px`, borderTop: '1.5px dashed var(--border)', zIndex: 0 }} />
          {days.map(day => {
            const pct = maxCal > 0 ? (day.calories / maxCal) : 0
            const height = Math.max(pct * 100, day.calories > 0 ? 4 : 0)
            const isToday = day.label === 'Today'
            const over = day.calories > goal
            const barColor = day.calories === 0 ? 'rgba(0,0,0,0.06)' : over ? 'var(--danger)' : 'var(--accent)'
            return (
              <div key={day.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
                {day.calories > 0 && <div style={{ fontSize: 9, color: 'var(--text-hint)', fontWeight: 600 }}>{day.calories}</div>}
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 100 }}>
                  <div style={{ width: '100%', height: `${height}px`, background: barColor, borderRadius: '6px 6px 3px 3px', opacity: isToday ? 1 : 0.65, transition: 'height 0.5s cubic-bezier(0.34,1.2,0.64,1)' }} />
                </div>
                <div style={{ fontSize: 10, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--accent)' : 'var(--text-hint)' }}>{day.label}</div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
          {[['var(--accent)', 'Under goal'], ['var(--danger)', 'Over goal']].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </ScreenLayout>
  )
}
