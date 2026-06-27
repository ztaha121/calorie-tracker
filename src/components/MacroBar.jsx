export default function MacroBar({ label, value, goal, color }) {
  const pct = Math.min((value / goal) * 100, 100)
  const over = value > goal
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <div style={{ width: 52, fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-card-2)', borderRadius: 99, overflow: 'hidden', minWidth: 0 }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 99,
          background: over ? 'var(--danger)' : color,
          transition: 'width 0.5s cubic-bezier(0.34,1.2,0.64,1)',
        }} />
      </div>
      <div style={{ width: 72, fontSize: 13, fontWeight: 600, textAlign: 'right', flexShrink: 0 }}>
        <span style={{ color: over ? 'var(--danger)' : 'var(--text)', fontWeight: 700 }}>{Math.round(value)}</span>
        <span style={{ color: 'var(--text-hint)' }}>/{goal}g</span>
      </div>
    </div>
  )
}
