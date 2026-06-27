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

  useEffect(() => {
    if (streak > 0 && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => reg.active?.postMessage({ type: 'CHECK_STREAK', streak }))
    }
  }, [streak])

  const weeklyMessage = (() => {
    if (daysLogged === 0) return { text: 'Begin your mission — every meal counts.', emoji: '🌱', color: '#10b981' }
    if (daysUnderGoal === 7) return { text: 'Perfect week. You hit your goal every day.', emoji: '🏆', color: '#f59e0b' }
    if (daysUnderGoal >= 5) return { text: `Strong week — ${daysUnderGoal}/7 days under goal.`, emoji: '🎯', color: '#10b981' }
    if (daysUnderGoal >= 3) return { text: `Good progress — ${daysUnderGoal}/7 days on track.`, emoji: '💪', color: '#6366f1' }
    if (daysLogged >= 5) return { text: `You logged ${daysLogged}/7 days. Consistency is the goal.`, emoji: '📈', color: '#a855f7' }
    return { text: 'Every log is a step forward. Keep going.', emoji: '✨', color: '#6366f1' }
  })()

  const stats = [
    { label: 'Avg calories', value: avgCal ? avgCal.toLocaleString() : '—', unit: avgCal ? 'kcal/day' : '', color: '#10b981' },
    { label: 'Streak', value: streak, unit: streak === 1 ? 'day' : 'days', color: '#f59e0b' },
    { label: 'Days logged', value: totalDays, unit: 'total', color: '#6366f1' },
    { label: 'On goal', value: daysUnderGoal, unit: 'this week', color: '#a855f7' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 120, background: 'var(--bg)', position: 'relative' }}>
      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'rgba(99,102,241,0.07)', filter: 'blur(80px)', top: -40, left: -80 }} />
        <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'rgba(168,85,247,0.05)', filter: 'blur(60px)', bottom: 80, right: -60 }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '22px 22px 0' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-hint)', letterSpacing: '0.14em', marginBottom: 6 }}>MISSION CONTROL</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em' }}>Progress</div>
        </div>

        {/* Weekly insight card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${weeklyMessage.color}30`,
          borderRadius: 20, padding: '18px 20px',
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: `${weeklyMessage.color}15`,
            border: `1px solid ${weeklyMessage.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>{weeklyMessage.emoji}</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.12em', marginBottom: 5 }}>THIS WEEK</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>{weeklyMessage.text}</div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {stats.map(stat => (
            <div key={stat.label} style={{
              background: 'rgba(255,255,255,0.025)',
              border: `1px solid ${stat.color}20`,
              borderRadius: 18, padding: '18px 16px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.12em', marginBottom: 10 }}>{stat.label.toUpperCase()}</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: stat.color, letterSpacing: '-0.05em', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5, fontWeight: 500 }}>{stat.unit}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.12em', marginBottom: 14 }}>LAST 7 DAYS</div>
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20, padding: '20px 16px 16px',
          marginBottom: 24,
        }}>
          {/* Goal line indicator */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--text-hint)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.2)', borderTop: '1px dashed rgba(255,255,255,0.2)' }} />
              Goal: {goal.toLocaleString()}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 130, position: 'relative' }}>
            {/* Dashed goal line */}
            <div style={{
              position: 'absolute',
              left: 0, right: 0,
              bottom: `${(goal / maxCal) * 110}px`,
              height: 1,
              borderTop: '1px dashed rgba(255,255,255,0.12)',
              pointerEvents: 'none',
            }} />

            {days.map(day => {
              const pct = maxCal > 0 ? (day.calories / maxCal) : 0
              const height = Math.max(pct * 110, day.calories > 0 ? 3 : 0)
              const isToday = day.label === 'Today'
              const over = day.calories > goal
              const barColor = day.calories === 0 ? 'rgba(255,255,255,0.07)' : over ? '#f43f5e' : '#10b981'
              const glowColor = over ? 'rgba(244,63,94,0.4)' : 'rgba(16,185,129,0.4)'

              return (
                <div key={day.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  {day.calories > 0 && (
                    <div style={{ fontSize: 9, color: 'var(--text-hint)', fontWeight: 600, letterSpacing: '-0.01em' }}>{day.calories}</div>
                  )}
                  <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 110 }}>
                    <div style={{
                      width: '100%', height: `${height}px`,
                      background: barColor,
                      borderRadius: '6px 6px 3px 3px',
                      opacity: isToday ? 1 : 0.55,
                      boxShadow: day.calories > 0 && isToday ? `0 0 12px ${glowColor}` : 'none',
                      transition: 'height 0.5s cubic-bezier(0.34,1.2,0.64,1)',
                    }} />
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: isToday ? 700 : 500,
                    color: isToday ? '#10b981' : 'var(--text-hint)',
                    letterSpacing: isToday ? '-0.01em' : '0',
                  }}>{day.label}</div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {[['#10b981', 'Under goal'], ['#f43f5e', 'Over goal']].map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color, boxShadow: `0 0 6px ${color}80` }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly orbit map */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.12em', marginBottom: 14 }}>WEEKLY ORBIT</div>
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20, padding: '16px',
          display: 'flex', gap: 6,
        }}>
          {days.map(day => {
            const over = day.calories > goal
            const logged = day.calories > 0
            const isToday = day.label === 'Today'
            const dotColor = !logged ? 'rgba(255,255,255,0.08)' : over ? '#f43f5e' : '#10b981'
            return (
              <div key={day.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: logged ? `${dotColor}20` : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${dotColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                  boxShadow: logged && isToday ? `0 0 12px ${dotColor}60` : 'none',
                }}>
                  {logged ? (over ? '⚠' : '✓') : '○'}
                </div>
                <div style={{ fontSize: 9, fontWeight: isToday ? 700 : 500, color: isToday ? '#10b981' : 'var(--text-hint)' }}>
                  {day.label.slice(0, 3).toUpperCase()}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
