export default function CalorieRing({ consumed, goal }) {
  const pct = Math.min(consumed / goal, 1)
  const r = 80
  const stroke = 10
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  const remaining = goal - consumed
  const over = consumed > goal

  const color = over ? '#ff6b6b' : pct > 0.85 ? '#ffd166' : '#a8e063'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={200} height={200} viewBox="0 0 200 200">
        <circle
          cx={100} cy={100} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
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
        <text x={100} y={90} textAnchor="middle" fill="#f0f0f0" fontSize={32} fontWeight={500} fontFamily="Inter, sans-serif">
          {consumed.toLocaleString()}
        </text>
        <text x={100} y={114} textAnchor="middle" fill="#888" fontSize={13} fontFamily="Inter, sans-serif">
          of {goal.toLocaleString()} kcal
        </text>
        <text x={100} y={138} textAnchor="middle" fill={over ? '#ff6b6b' : '#a8e063'} fontSize={13} fontFamily="Inter, sans-serif">
          {over ? `${Math.abs(remaining).toLocaleString()} over` : `${remaining.toLocaleString()} left`}
        </text>
      </svg>
    </div>
  )
}
