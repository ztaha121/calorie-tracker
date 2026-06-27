export default function MacroBar({ label, value, goal, color }) {
  const pct = Math.min((value / goal) * 100, 100)
  const over = value > goal
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <div style={{ width: 54, fontSize: 12, fontWeight: 600, color: 'rgba(240,244,255,0.40)', flexShrink: 0, letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', minWidth: 0 }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 99,
          background: over ? '#ef4444' : color,
          boxShadow: over ? 'none' : `0 0 10px ${color}80`,
          transition: 'width 0.6s cubic-bezier(0.34,1.2,0.64,1)',
        }} />
      </div>
      <div style={{ width: 72, fontSize: 12, fontWeight: 600, textAlign: 'right', flexShrink: 0 }}>
        <span style={{ color: over ? '#ef4444' : 'var(--text)', fontWeight: 700 }}>{Math.round(value)}</span>
        <span style={{ color: 'rgba(240,244,255,0.25)' }}>/{goal}g</span>
      </div>
    </div>
  )
}
