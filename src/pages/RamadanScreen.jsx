import { useState, useEffect, useCallback } from 'react'

// ── Prayer time fetcher ───────────────────────────────────────────────────────
async function fetchPrayerTimes(lat, lon) {
  const today = new Date()
  const dd = String(today.getDate()).padStart(2, '0')
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const yyyy = today.getFullYear()
  const res = await fetch(
    `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lon}&method=4`
  )
  const data = await res.json()
  return data.data?.timings
}

function parseTime(timeStr) {
  // timeStr like "04:32"
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const min = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// ── Fasting progress arc SVG ──────────────────────────────────────────────────
function FastingArc({ pct, isFasting, label, countdown }) {
  const r = 88
  const stroke = 10
  const circ = 2 * Math.PI * r
  const dash = Math.min(pct, 1) * circ
  const color = isFasting ? '#6366f1' : '#00b96b'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={210} height={210} viewBox="0 0 210 210">
        <defs>
          <filter id="fast-glow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <style>{`
            .fa-big { fill: var(--text); font-size: 28px; font-weight: 800; letter-spacing: -0.05em; font-family: 'Inter', sans-serif; }
            .fa-label { fill: var(--text-muted); font-size: 11px; font-weight: 500; letter-spacing: 0.04em; font-family: 'Inter', sans-serif; }
            .fa-sub { fill: var(--text-hint); font-size: 12px; font-weight: 500; font-family: 'Inter', sans-serif; }
          `}</style>
        </defs>
        <circle cx={105} cy={105} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke}/>
        <circle cx={105} cy={105} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 105 105)"
          filter="url(#fast-glow)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x={105} y={93} textAnchor="middle" className="fa-big">{countdown}</text>
        <text x={105} y={112} textAnchor="middle" className="fa-label">{label}</text>
        <text x={105} y={130} textAnchor="middle" className="fa-sub">{Math.round(pct * 100)}%</text>
      </svg>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RamadanScreen({ entries, goal, macroGoals, onAdd, user }) {
  const [prayerTimes, setPrayerTimes]   = useState(null)
  const [locationErr, setLocationErr]   = useState('')
  const [loading, setLoading]           = useState(false)
  const [now, setNow]                   = useState(new Date())
  const [fastingDays, setFastingDays]   = useState(() => Number(localStorage.getItem('ramadan_days') || 0))
  const [fastingNiyya, setFastingNiyya] = useState(() => localStorage.getItem('ramadan_niyya_' + new Date().toISOString().split('T')[0]) === 'true')

  // Tick every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-load saved location
  useEffect(() => {
    const saved = localStorage.getItem('ramadan_location')
    if (saved) {
      const { lat, lon } = JSON.parse(saved)
      loadPrayerTimes(lat, lon)
    }
  }, [])

  async function loadPrayerTimes(lat, lon) {
    setLoading(true)
    try {
      const times = await fetchPrayerTimes(lat, lon)
      setPrayerTimes(times)
      localStorage.setItem('ramadan_location', JSON.stringify({ lat, lon }))

      // Schedule fasting notifications
      if ('serviceWorker' in navigator) {
        const fajr = parseTime(times.Fajr)
        const maghrib = parseTime(times.Maghrib)
        const reg = await navigator.serviceWorker.ready
        reg.active?.postMessage({
          type: 'SCHEDULE_FASTING_ALERTS',
          fajrTime: fajr.getTime(),
          maghribTime: maghrib.getTime(),
        })
      }
    } catch {
      setLocationErr('Could not load prayer times. Check your connection.')
    }
    setLoading(false)
  }

  function requestLocation() {
    if (!navigator.geolocation) { setLocationErr('Location not supported on this device.'); return }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => loadPrayerTimes(pos.coords.latitude, pos.coords.longitude),
      () => { setLocationErr('Location permission denied. Please enable it in settings.'); setLoading(false) }
    )
  }

  function markNiyya() {
    const todayKey = new Date().toISOString().split('T')[0]
    localStorage.setItem('ramadan_niyya_' + todayKey, 'true')
    setFastingNiyya(true)
    const newDays = fastingDays + 1
    setFastingDays(newDays)
    localStorage.setItem('ramadan_days', newDays)
  }

  // ── Derived state ───────────────────────────────────────────────────────────
  let fajr, maghrib, isFasting, isEating, pct, countdownMs, countdownLabel, nextEventLabel, nextEventTime

  if (prayerTimes) {
    fajr    = parseTime(prayerTimes.Fajr)
    maghrib = parseTime(prayerTimes.Maghrib)

    isFasting = now >= fajr && now < maghrib
    isEating  = now < fajr || now >= maghrib

    if (isFasting) {
      // During fast: progress from Fajr to Maghrib
      const totalFast = maghrib - fajr
      const elapsed   = now - fajr
      pct             = Math.min(elapsed / totalFast, 1)
      countdownMs     = maghrib - now
      countdownLabel  = 'UNTIL IFTAR'
      nextEventLabel  = 'Iftar'
      nextEventTime   = formatTime(maghrib)
    } else if (now < fajr) {
      // Before Fajr (eating window overnight)
      const prevMaghrib = new Date(maghrib); prevMaghrib.setDate(prevMaghrib.getDate() - 1)
      const totalEat = fajr - prevMaghrib
      const elapsed  = now - prevMaghrib
      pct            = Math.min(Math.max(elapsed / totalEat, 0), 1)
      countdownMs    = fajr - now
      countdownLabel = 'UNTIL SUHOOR ENDS'
      nextEventLabel = 'Suhoor ends (Fajr)'
      nextEventTime  = formatTime(fajr)
    } else {
      // After Maghrib (eating window)
      const nextFajr = new Date(fajr); nextFajr.setDate(nextFajr.getDate() + 1)
      const totalEat = nextFajr - maghrib
      const elapsed  = now - maghrib
      pct            = Math.min(elapsed / totalEat, 1)
      countdownMs    = nextFajr - now
      countdownLabel = 'UNTIL NEXT SUHOOR'
      nextEventLabel = 'Fajr (next fast)'
      nextEventTime  = formatTime(nextFajr)
    }
  }

  // Totals for today
  const totals = entries.reduce((acc, e) => ({
    calories: acc.calories + (e.calories || 0),
    protein:  acc.protein  + (e.protein  || 0),
    carbs:    acc.carbs    + (e.carbs    || 0),
  }), { calories: 0, protein: 0, carbs: 0 })
  const calories  = Math.round(totals.calories)
  const remaining = Math.max(0, goal - calories)

  // Ramadan meal slots
  const RAMADAN_MEALS = [
    { id: 'Suhoor', icon: '🌙', label: 'Suhoor', sub: 'Pre-dawn meal', time: prayerTimes ? `Before ${prayerTimes.Fajr}` : '' },
    { id: 'Iftar', icon: '🌅', label: 'Iftar', sub: 'Break fast', time: prayerTimes ? `At ${prayerTimes.Maghrib}` : '' },
    { id: 'Dinner', icon: '🍽️', label: 'After Tarawih', sub: 'Night meal', time: '' },
    { id: 'Snack', icon: '⚡', label: 'Snack', sub: 'Dates & water', time: '' },
  ]

  const grouped = RAMADAN_MEALS.reduce((acc, m) => {
    acc[m.id] = entries.filter(e => e.meal === m.id || (m.id === 'Iftar' && e.meal === 'Lunch') || (m.id === 'Suhoor' && e.meal === 'Breakfast'))
    return acc
  }, {})

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24, background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-hint)', fontWeight: 500, marginBottom: 2 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>رمضان ✨</div>
          {fastingDays > 0 && (
            <div style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 14, padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#6366f1', letterSpacing: '-0.03em', lineHeight: 1 }}>{fastingDays}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(99,102,241,0.6)', letterSpacing: '0.04em' }}>DAYS FASTED</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* Location / prayer time setup */}
        {!prayerTimes && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: 12, boxShadow: 'var(--shadow-card)', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📍</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Enable prayer times</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
              Allow location access to get accurate Fajr, Maghrib, and prayer times for your city.
            </div>
            {locationErr && (
              <div style={{ color: 'var(--danger)', fontSize: 13, background: 'var(--danger-dim)', padding: '10px', borderRadius: 10, marginBottom: 12 }}>{locationErr}</div>
            )}
            <button onClick={requestLocation} disabled={loading} style={{ width: '100%', padding: '14px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 15, fontWeight: 700, boxShadow: 'var(--shadow-accent)', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Getting location…' : '📍 Use my location'}
            </button>
          </div>
        )}

        {/* Fasting arc + countdown */}
        {prayerTimes && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: 12, boxShadow: 'var(--shadow-card)', textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isFasting ? '#6366f1' : 'var(--accent)', letterSpacing: '0.10em', marginBottom: 8 }}>
              {isFasting ? '🌙 FASTING' : '🍽️ EATING WINDOW'}
            </div>

            <FastingArc
              pct={pct}
              isFasting={isFasting}
              label={countdownLabel}
              countdown={formatCountdown(countdownMs)}
            />

            {/* Next event */}
            <div style={{ marginTop: 4, fontSize: 14, color: 'var(--text-muted)' }}>
              {nextEventLabel}: <strong style={{ color: 'var(--text)' }}>{nextEventTime}</strong>
            </div>

            {/* Prayer times strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16 }}>
              {[
                { label: 'Fajr', time: prayerTimes.Fajr, icon: '🌅' },
                { label: 'Dhuhr', time: prayerTimes.Dhuhr, icon: '☀️' },
                { label: 'Asr', time: prayerTimes.Asr, icon: '🌤️' },
                { label: 'Maghrib', time: prayerTimes.Maghrib, icon: '🌆' },
                { label: 'Isha', time: prayerTimes.Isha, icon: '🌙' },
                { label: 'Midnight', time: prayerTimes.Midnight, icon: '⭐' },
              ].map(({ label, time, icon }) => (
                <div key={label} style={{ background: 'var(--bg-card-2)', borderRadius: 10, padding: '8px 6px' }}>
                  <div style={{ fontSize: 14 }}>{icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 1 }}>{time}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Niyya (intention) for today */}
        {!fastingNiyya ? (
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius)', padding: '18px', marginBottom: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>🤲</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Set your intention</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
              نَوَيْتُ صَوْمَ غَدٍ عَنْ أَدَاءِ فَرْضِ رَمَضَانَ
            </div>
            <button onClick={markNiyya} style={{ width: '100%', padding: '13px', background: '#6366f1', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 15, fontWeight: 700 }}>
              ✓ I intend to fast today
            </button>
          </div>
        ) : (
          <div style={{ background: 'rgba(0,185,107,0.06)', border: '1px solid rgba(0,185,107,0.2)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>Intention set for today</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>May your fast be accepted 🤲</div>
            </div>
          </div>
        )}

        {/* Calories summary for eating window */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>Today's nutrition</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { label: 'Calories', value: calories, unit: `/${goal}`, color: 'var(--accent)' },
              { label: 'Protein', value: `${Math.round(totals.protein)}g`, unit: `/${macroGoals.protein}g`, color: 'var(--blue)' },
              { label: 'Remaining', value: remaining, unit: 'kcal', color: remaining > 0 ? 'var(--orange)' : 'var(--accent)' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} style={{ background: 'var(--bg-card-2)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 3 }}>{unit}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ramadan meal sections */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>Meals</div>
        {RAMADAN_MEALS.map(m => {
          const mealEntries = grouped[m.id] || []
          const mealCals = Math.round(mealEntries.reduce((s, e) => s + (e.calories || 0), 0))
          return (
            <div key={m.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{m.label}</div>
                    {m.time && <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>{m.time}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {mealCals > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{mealCals} kcal</span>}
                </div>
              </div>
              {mealEntries.length > 0 ? (
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {mealEntries.map((entry, idx) => (
                    <div key={entry.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 10, borderBottom: idx < mealEntries.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>{entry.per}</div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{Math.round(entry.calories)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '14px', border: '1.5px dashed var(--border)', textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-hint)' }}>Nothing logged yet</span>
                </div>
              )}
            </div>
          )
        })}

        {/* Tips */}
        <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 'var(--radius)', padding: '16px 18px', marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', letterSpacing: '0.08em', marginBottom: 12 }}>RAMADAN NUTRITION TIPS</div>
          {[
            { icon: '💧', tip: 'Drink 8+ glasses of water between Iftar and Suhoor' },
            { icon: '🥜', tip: 'Start Iftar with dates and water — the Sunnah way' },
            { icon: '🥗', tip: 'Include complex carbs at Suhoor to sustain energy' },
            { icon: '🚫', tip: 'Avoid salty and fried foods — they increase thirst' },
          ].map(({ icon, tip }) => (
            <div key={tip} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
