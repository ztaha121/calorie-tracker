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

  const maxCal = Math.max(...days.map(d => d.calories), goal)
  const allEntryList = Object.values(allEntries).flat()
  const totalDays = Object.keys(allEntries).filter(k => (allEntries[k] || []).length > 0).length
  const avgCal = totalDays > 0 ? Math.round(allEntryList.reduce((sum, e) => sum + (e.calories || 0), 0) / totalDays) : 0
  const streak = (() => {
    let s = 0
    for (let i = 0; i < 30; i++) {
      const k = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
      if ((allEntries[k] || []).length > 0) s++
      else break
    }
    return s
  })()

  const daysUnderGoal = days.filter(d => d.calories > 0 && d.calories <= goal).length
  const daysLogged = days.filter(d => d.calories > 0).length

  const weeklyMessage = (() => {
    if (daysLogged === 0) return { text: "Start logging today — every meal counts.", emoji: '🌱', accent: false }
    if (daysUnderGoal === 7) return { text: "Perfect week! You hit your goal every day.", emoji: '🏆', accent: true }
    if (daysUnderGoal >= 5) return { text: `Great week! You hit your goal ${daysUnderGoal}/7 days.`, emoji: '🎯', accent: true }
    if (daysUnderGoal >= 3) return { text: `Good progress — ${daysUnderGoal}/7 days under goal.`, emoji: '💪', accent: false }
    if (daysLogged >= 5) return { text: `You logged ${daysLogged}/7 days. Consistency is the goal.`, emoji: '📈', accent: false }
    return { text: "Every day you log is a win. Keep going.", emoji: '✨', accent: false }
  })()

  const stats = [
    { label: 'Avg calories', value: avgCal ? `${avgCal}` : '—', unit: avgCal ? 'kcal/day' : '' },
    { label: 'Logging streak', value: streak, unit: streak === 1 ? 'day' : 'days' },
    { label: 'Days logged', value: totalDays, unit: 'total' },
    { label: 'Goal days', value: daysUnderGoal, unit: 'this week' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 100px' }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 20 }}>Progress ✦</h2>

      {/* Weekly summary */}
      <div style={{
        background: weeklyMessage.accent ? 'var(--accent-dim)' : 'var(--bg-card)',
        border: `1px solid ${weeklyMessage.accent ? 'var(--accent-glow)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', padding: '16px 18px',
        marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14
      }}>
        <div style={{ fontSize: 32, flexShrink: 0 }}>{weeklyMessage.emoji}</div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontWeight: 700, fontFamily: 'var(--font-display)' }}>This week</div>
          <div style={{ fontSize: 14, color: weeklyMessage.accent ? 'var(--accent)' : 'var(--text-muted)', lineHeight: 1.5, fontWeight: 500 }}>{weeklyMessage.text}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '16px 14px'
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{stat.unit}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Last 7 days</div>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
          {days.map(day => {
            const pct = maxCal > 0 ? (day.calories / maxCal) : 0
            const height = Math.max(pct * 110, day.calories > 0 ? 4 : 0)
            const isToday = day.label === 'Today'
            const overGoal = day.calories > goal
            const barColor = day.calories === 0 ? 'var(--border)' : overGoal ? 'var(--danger)' : 'var(--accent)'
            return (
              <div key={day.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                {day.calories > 0 && (
                  <div style={{ fontSize: 9, color: 'var(--text-hint)', fontWeight: 600 }}>{day.calories}</div>
                )}
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 110 }}>
                  <div style={{
                    width: '100%', height: `${height}px`,
                    background: barColor,
                    borderRadius: '5px 5px 3px 3px',
                    opacity: isToday ? 1 : 0.65,
                    transition: 'height 0.4s ease'
                  }} />
                </div>
                <div style={{
                  fontSize: 11, fontWeight: isToday ? 700 : 400,
                  color: isToday ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: isToday ? 'var(--font-display)' : 'var(--font-body)'
                }}>{day.label}</div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Under goal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--danger)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Over goal</span>
          </div>
        </div>
      </div>
    </div>
  )
}
