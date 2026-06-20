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
    const rows = [['Date', 'Time', 'Food', 'Meal', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Portion (g)']]
    Object.keys(allEntries).sort().forEach(date => {
      (allEntries[date] || []).forEach(e => {
        rows.push([date, e.time || '', e.name, e.meal || '', Math.round(e.calories || 0), Math.round(e.protein || 0), Math.round(e.carbs || 0), Math.round(e.fat || 0), e.portion || 100])
      })
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mizan-food-log.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 90px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 500 }}>Food log</h2>
        {dates.length > 0 && (
          <button onClick={exportCSV} style={{
            background: 'rgba(168,224,99,0.1)', borderRadius: 10, padding: '7px 14px',
            color: '#a8e063', fontSize: 13, fontWeight: 500
          }}>Export CSV</button>
        )}
      </div>

      {dates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#444' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14 }}>No entries yet.<br />Start logging food from the home tab.</div>
        </div>
      ) : (
        dates.map(date => (
          <div key={date} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#888' }}>{formatDate(date)}</span>
              <span style={{ fontSize: 13, color: '#a8e063', fontWeight: 500 }}>{dayTotal(grouped[date])} kcal</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {grouped[date].map(entry => (
                <div key={entry.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px'
                }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#f0f0f0', marginBottom: 2 }}>{entry.name}</div>
                    <div style={{ fontSize: 12, color: '#555' }}>{entry.time}{entry.meal ? ` · ${entry.meal}` : ''}</div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 500, color: '#a8e063', alignSelf: 'center' }}>{Math.round(entry.calories)}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
