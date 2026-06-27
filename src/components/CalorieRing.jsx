export default function CalorieRing({ consumed, goal }) {
  const pct = Math.min(consumed / goal, 1)
  const over = consumed > goal
  const r = 72
  const stroke = 6
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  const remaining = goal - consumed

  const color = over ? '#ef4444' : pct > 0.85 ? '#f59e0b' : '#10b981'
  const glowId = `glow-${Math.round(pct * 100)}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={180} height={180} viewBox="0 0 180 180">
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <style>{`
            .rc { fill: var(--text); font-size: 42px; font-weight: 700; letter-spacing: -0.06em; font-family: 'Space Grotesk', sans-serif; }
            .rl { fill: rgba(240,244,255,0.35); font-size: 10px; font-weight: 500; letter-spacing: 0.12em; font-family: 'Space Grotesk', sans-serif; }
            .rs-ok   { fill: #10b981; font-size: 12px; font-weight: 500; font-family: 'Space Grotesk', sans-serif; }
            .rs-warn { fill: #f59e0b; font-size: 12px; font-weight: 500; font-family: 'Space Grotesk', sans-serif; }
            .rs-over { fill: #ef4444; font-size: 12px; font-weight: 500; font-family: 'Space Grotesk', sans-serif; }
          `}</style>
        </defs>
        <circle cx={90} cy={90} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <circle
          cx={90} cy={90} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 90 90)"
          filter={`url(#${glowId})`}
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.34,1.2,0.64,1), stroke 0.4s ease' }}
        />
        <text x={90} y={80} textAnchor="middle" className="rc">{consumed.toLocaleString()}</text>
        <text x={90} y={97} textAnchor="middle" className="rl">CALORIES</text>
        <text x={90} y={116} textAnchor="middle"
          className={over ? 'rs-over' : pct > 0.85 ? 'rs-warn' : 'rs-ok'}>
          {over ? `${Math.abs(remaining).toLocaleString()} over` : `${remaining.toLocaleString()} left`}
        </text>
      </svg>
    </div>
  )
}
