export default function CalorieRing({ consumed, goal }) {
  const pct = Math.min(consumed / goal, 1)
  const r = 80
  const stroke = 10
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  const remaining = goal - consumed
  const over = consumed > goal

  const color = over ? 'var(--danger)' : pct > 0.85 ? 'var(--accent-2)' : 'var(--accent)'

  // Use currentColor trick via a foreignObject isn't possible in SVG,
  // so we inline a style tag to read CSS vars at runtime
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={200} height={200} viewBox="0 0 200 200">
        <defs>
          <style>{`
            .ring-track { stroke: var(--border); }
            .ring-text-main { fill: var(--text); font-size: 32px; font-weight: 700; font-family: var(--font-display); }
            .ring-text-sub { fill: var(--text-muted); font-size: 13px; font-family: var(--font-body); }
            .ring-text-status-ok { fill: var(--accent); font-size: 13px; font-weight: 600; font-family: var(--font-body); }
            .ring-text-status-over { fill: var(--danger); font-size: 13px; font-weight: 600; font-family: var(--font-body); }
          `}</style>
        </defs>
        {/* Track */}
        <circle cx={100} cy={100} r={r} fill="none" className="ring-track" strokeWidth={stroke} />
        {/* Progress */}
        <circle
          cx={100} cy={100} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={0}
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.3s ease' }}
        />
        <text x={100} y={92} textAnchor="middle" className="ring-text-main">
          {consumed.toLocaleString()}
        </text>
        <text x={100} y={114} textAnchor="middle" className="ring-text-sub">
          of {goal.toLocaleString()} kcal
        </text>
        <text x={100} y={136} textAnchor="middle" className={over ? 'ring-text-status-over' : 'ring-text-status-ok'}>
          {over ? `${Math.abs(remaining).toLocaleString()} over` : `${remaining.toLocaleString()} left`}
        </text>
      </svg>
    </div>
  )
}
