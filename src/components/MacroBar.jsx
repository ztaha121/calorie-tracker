export default function MacroBar({ label, value, goal, color }) {
  const pct = Math.min((value / goal) * 100, 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>
          {Math.round(value)}g <span style={{ color: 'var(--text-hint)' }}>/ {goal}g</span>
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 99,
          transition: 'width 0.4s ease'
        }} />
      </div>
    </div>
  )
}
