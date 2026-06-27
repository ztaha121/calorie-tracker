import FoodImage from '../components/FoodImage.jsx'

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
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24, background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>Food log</div>
        {dates.length > 0 && (
          <button onClick={exportCSV} style={{ background: 'var(--accent-dim)', borderRadius: 10, padding: '7px 14px', color: 'var(--accent)', fontSize: 13, fontWeight: 600, border: '1px solid var(--accent-glow)' }}>Export CSV</button>
        )}
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {dates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1.5px dashed var(--border)', marginTop: 8 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No entries yet</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Start logging food from the home tab.</div>
          </div>
        ) : (
          dates.map(date => (
            <div key={date} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>{formatDate(date)}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{dayTotal(grouped[date])} kcal</span>
              </div>
              <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                {grouped[date].map((entry, idx) => (
                  <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center',
                    padding: '10px 14px', gap: 12,
                    borderBottom: idx < grouped[date].length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <FoodImage name={entry.name} meal={entry.meal} size={40} borderRadius={9} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{entry.time}{entry.meal ? ` · ${entry.meal}` : ''}</div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{Math.round(entry.calories)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
