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
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function dayTotal(entries) {
    return Math.round(entries.reduce((sum, e) => sum + (e.calories || 0), 0))
  }

  function exportCSV() {
    const rows = [['Date','Time','Food','Meal','Calories','Protein (g)','Carbs (g)','Fat (g)','Portion (g)']]
    Object.keys(allEntries).sort().forEach(date => {
      (allEntries[date] || []).forEach(e => {
        rows.push([date, e.time||'', e.name, e.meal||'', Math.round(e.calories||0), Math.round(e.protein||0), Math.round(e.carbs||0), Math.round(e.fat||0), e.portion||100])
      })
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'mizan-food-log.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text)' }}>Food log</h2>
        {dates.length > 0 && (
          <button onClick={exportCSV} style={{
            background: 'var(--accent-dim)', borderRadius: 'var(--radius-xs)', padding: '7px 14px',
            color: 'var(--accent)', fontSize: 13, fontWeight: 600,
            border: '1px solid var(--accent-glow)', fontFamily: 'var(--font-display)'
          }}>Export CSV</button>
        )}
      </div>

      {dates.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--bg-card)', borderRadius: 'var(--radius)',
          border: '1px dashed var(--border)'
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: 6 }}>No entries yet</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Start logging food from the home tab.</div>
        </div>
      ) : (
        dates.map(date => (
          <div key={date} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{formatDate(date)}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>{dayTotal(grouped[date])} kcal</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {grouped[date].map(entry => (
                <div key={entry.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '12px 14px'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{entry.time}{entry.meal ? ` · ${entry.meal}` : ''}</div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)', marginLeft: 12, flexShrink: 0 }}>{Math.round(entry.calories)}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
