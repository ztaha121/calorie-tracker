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

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 90px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 24 }}>Progress</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Avg calories', value: avgCal ? `${avgCal}` : '—', unit: avgCal ? 'kcal/day' : '' },
          { label: 'Logging streak', value: streak, unit: streak === 1 ? 'day' : 'days' },
          { label: 'Days logged', value: totalDays, unit: 'total' },
          { label: 'Daily goal', value: goal, unit: 'kcal' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '16px 14px' }}>
            <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 26, fontWeight: 300, color: '#f0f0f0', letterSpacing: '-0.02em' }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{stat.unit}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 13, color: '#555', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last 7 days</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, marginBottom: 8 }}>
        {days.map(day => {
          const pct = maxCal > 0 ? (day.calories / maxCal) : 0
          const height = Math.max(pct * 130, day.calories > 0 ? 4 : 0)
          const isToday = day.label === 'Today'
          const overGoal = day.calories > goal
          const barColor = day.calories === 0 ? 'rgba(255,255,255,0.06)' : overGoal ? '#ff6b6b' : '#a8e063'
          return (
            <div key={day.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {day.calories > 0 && (
                <div style={{ fontSize: 10, color: '#888' }}>{day.calories}</div>
              )}
              <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 130 }}>
                <div style={{
                  width: '100%', height: `${height}px`,
                  background: barColor, borderRadius: '6px 6px 3px 3px',
                  opacity: isToday ? 1 : 0.6,
                  transition: 'height 0.4s ease'
                }} />
              </div>
              <div style={{ fontSize: 11, color: isToday ? '#a8e063' : '#555', fontWeight: isToday ? 500 : 400 }}>{day.label}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#a8e063' }} />
          <span style={{ fontSize: 12, color: '#555' }}>Under goal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#ff6b6b' }} />
          <span style={{ fontSize: 12, color: '#555' }}>Over goal</span>
        </div>
      </div>
    </div>
  )
}
