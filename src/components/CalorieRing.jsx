export default function CalorieRing({ consumed, goal }) {
  const pct = Math.min(consumed / goal, 1)
  const over = consumed > goal
  const r = 74
  const stroke = 10
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  const remaining = goal - consumed
  const trackColor = 'rgba(0,0,0,0.06)'
  const fillColor = over ? '#ef4444' : pct > 0.85 ? '#f97316' : '#00b96b'

  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      <defs>
        <style>{`
          .rc { fill: var(--text); font-size: 40px; font-weight: 800; letter-spacing: -0.05em; font-family: 'Inter', sans-serif; }
          .rl { fill: var(--text-muted); font-size: 11px; font-weight: 500; letter-spacing: 0.04em; font-family: 'Inter', sans-serif; }
          .rs { font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; }
          .rs-ok   { fill: #00b96b; }
          .rs-warn { fill: #f97316; }
          .rs-over { fill: #ef4444; }
        `}</style>
        <filter id="ring-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={fillColor} floodOpacity="0.3"/>
        </filter>
      </defs>
      <circle cx={90} cy={90} r={r} fill="none" stroke={trackColor} strokeWidth={stroke}/>
      <circle cx={90} cy={90} r={r} fill="none"
        stroke={fillColor} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 90 90)"
        filter="url(#ring-shadow)"
        style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.34,1.2,0.64,1), stroke 0.3s' }}
      />
      <text x={90} y={82} textAnchor="middle" className="rc">{consumed.toLocaleString()}</text>
      <text x={90} y={99} textAnchor="middle" className="rl">CALORIES</text>
      <text x={90} y={118} textAnchor="middle"
        className={`rs ${over ? 'rs-over' : pct > 0.85 ? 'rs-warn' : 'rs-ok'}`}>
        {over ? `${Math.abs(remaining).toLocaleString()} over` : `${remaining.toLocaleString()} remaining`}
      </text>
    </svg>
  )
}
