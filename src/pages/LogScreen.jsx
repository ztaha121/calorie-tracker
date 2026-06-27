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

  const totalEntries = Object.values(allEntries).flat().length
  const totalDays = dates.length
  const totalCals = Math.round(Object.values(allEntries).flat().reduce((s, e) => s + (e.calories || 0), 0))

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 120, background: 'var(--bg)', position: 'relative' }}>
      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: 'rgba(168,85,247,0.05)', filter: 'blur(80px)', top: 0, right: -60 }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(99,102,241,0.05)', filter: 'blur(60px)', bottom: 100, left: -40 }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '22px 22px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-hint)', letterSpacing: '0.14em', marginBottom: 6 }}>MISSION LOG</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' }}>Food history</div>
          </div>
          {dates.length > 0 && (
            <button onClick={exportCSV} style={{
              background: 'rgba(16,185,129,0.10)', borderRadius: 10, padding: '8px 14px',
              color: '#10b981', fontSize: 13, fontWeight: 600,
              border: '1px solid rgba(16,185,129,0.25)', marginTop: 8,
            }}>Export ↓</button>
          )}
        </div>

        {/* Summary strip */}
        {totalEntries > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            gap: 8, marginBottom: 24,
          }}>
            {[
              { label: 'TOTAL DAYS', value: totalDays },
              { label: 'TOTAL ENTRIES', value: totalEntries },
              { label: 'TOTAL KCAL', value: totalCals.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '12px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em' }}>{value}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.10em', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {dates.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 20, border: '1px dashed rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🌌</div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>Your log is empty</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>Start tracking meals from the home screen.</div>
          </div>
        ) : (
          dates.map((date, dateIdx) => (
            <div key={date} style={{ marginBottom: 28 }}>
              {/* Date header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: dateIdx === 0 ? '#10b981' : 'rgba(255,255,255,0.2)',
                    boxShadow: dateIdx === 0 ? '0 0 8px rgba(16,185,129,0.6)' : 'none',
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: dateIdx === 0 ? '#10b981' : 'var(--text-muted)', letterSpacing: '0.06em' }}>
                    {formatDate(date).toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981', letterSpacing: '-0.01em' }}>
                  {dayTotal(grouped[date])} kcal
                </span>
              </div>

              {/* Entries */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
                {grouped[date].map((entry, idx) => (
                  <div key={entry.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: idx < grouped[date].length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>
                        {entry.time}{entry.meal ? ` · ${entry.meal}` : ''}
                        {entry.protein ? ` · P${Math.round(entry.protein)}g` : ''}
                        {entry.carbs ? ` C${Math.round(entry.carbs)}g` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#10b981', marginLeft: 12, flexShrink: 0, letterSpacing: '-0.02em' }}>
                      {Math.round(entry.calories)}
                    </span>
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
