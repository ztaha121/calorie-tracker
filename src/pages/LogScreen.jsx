import FoodImage from '../components/FoodImage.jsx'
import ScreenLayout from '../components/ScreenLayout.jsx'

export default function LogScreen({ allEntries }) {
  const grouped = {}
  Object.keys(allEntries).sort((a, b) => b.localeCompare(a)).forEach(date => {
    if (allEntries[date]?.length > 0) grouped[date] = allEntries[date]
  })
  const dates = Object.keys(grouped)

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (dateStr === today) return 'Today'
    if (dateStr === yesterday) return 'Yesterday'
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  function dayTotal(entries) {
    return Math.round(entries.reduce((sum, e) => sum + (e.calories || 0), 0))
  }

  function exportCSV() {
    const rows = [['Date','Time','Food','Meal','Calories','Protein','Carbs','Fat','Portion']]
    Object.keys(allEntries).sort().forEach(date => {
      (allEntries[date] || []).forEach(e => {
        rows.push([date, e.time||'', e.name, e.meal||'', Math.round(e.calories||0), Math.round(e.protein||0), Math.round(e.carbs||0), Math.round(e.fat||0), e.portion||100])
      })
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'mizan-log.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ScreenLayout
      title="Food log"
      subtitle="Your complete meal history"
      headerRight={dates.length > 0 ? (
        <button onClick={exportCSV} className="btn-accent-pill">Export CSV</button>
      ) : null}
    >
      {dates.length === 0 ? (
        <div className="empty-state">
          <img src="/logo.png" alt="Mizan" />
          <div className="empty-state-title">No entries yet</div>
          <div className="empty-state-sub">Start logging food from the Home tab.</div>
        </div>
      ) : (
        dates.map(date => (
          <div key={date} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>{formatDate(date)}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{dayTotal(grouped[date])} kcal</span>
            </div>
            <div className="ios-group">
              {grouped[date].map((entry, idx) => (
                <div key={entry.id} className="ios-row" style={{ borderTop: idx > 0 ? undefined : 'none' }}>
                  <FoodImage name={entry.name} meal={entry.meal} size={40} borderRadius={9} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ios-row-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                    <div className="ios-row-sub">{entry.time}{entry.meal ? ` · ${entry.meal}` : ''}</div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{Math.round(entry.calories)}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </ScreenLayout>
  )
}
