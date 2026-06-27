import { useEffect } from 'react'

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
    if (daysLogged === 0) return { text: 'Start logging today — every meal counts.', emoji: '🌱' }
    if (daysUnderGoal === 7) return { text: 'Perfect week! You hit your goal every day.', emoji: '🏆' }
    if (daysUnderGoal >= 5) return { text: `Great week — ${daysUnderGoal}/7 days under goal.`, emoji: '🎯' }
    if (daysUnderGoal >= 3) return { text: `Good progress — ${daysUnderGoal}/7 days on track.`, emoji: '💪' }
    return { text: 'Every log is a step forward. Keep going.', emoji: '✨' }
  })()

  const stats = [
    { label: 'Avg / day', value: avgCal ? `${avgCal}` : '—', unit: avgCal ? 'kcal' : '', color: 'var(--accent)' },
    { label: 'Streak', value: streak, unit: streak === 1 ? 'day' : 'days', color: '#f97316' },
    { label: 'Days logged', value: totalDays, unit: 'total', color: 'var(--blue)' },
    { label: 'On goal', value: daysUnderGoal, unit: 'this week', color: 'var(--purple)' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24, background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>Progress</div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Weekly insight */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 32, flexShrink: 0 }}>{msg.emoji}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.08em', marginBottom: 4 }}>THIS WEEK</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>{msg.text}</div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {stats.map(stat => (
            <div key={stat.label} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '16px 14px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.08em', marginBottom: 8 }}>{stat.label.toUpperCase()}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: stat.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{stat.unit}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '18px 16px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16 }}>Last 7 days</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 130, position: 'relative' }}>
            {/* Goal line */}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${(goal / maxCal) * 100}px`, borderTop: '1.5px dashed var(--border)', zIndex: 0 }} />
            {days.map(day => {
              const pct = maxCal > 0 ? (day.calories / maxCal) : 0
              const height = Math.max(pct * 100, day.calories > 0 ? 4 : 0)
              const isToday = day.label === 'Today'
              const over = day.calories > goal
              const barColor = day.calories === 0 ? 'var(--bg-card-2)' : over ? 'var(--danger)' : 'var(--accent)'
              return (
                <div key={day.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
                  {day.calories > 0 && (
                    <div style={{ fontSize: 9, color: 'var(--text-hint)', fontWeight: 600, letterSpacing: '-0.01em' }}>{day.calories}</div>
                  )}
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
      </div>
    </div>
  )
}
