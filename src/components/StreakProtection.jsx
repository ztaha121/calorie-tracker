// Streak protection modal — shown when user hasn't logged today
// and has a streak >= 3 days
import { useState } from 'react'

export default function StreakProtection({ streak, isPro, onClose, onUpgrade }) {
  const [used, setUsed] = useState(() => {
    const today = new Date().toISOString().split('T')[0]
    return localStorage.getItem('streak_freeze_' + today) === 'true'
  })

  function useFreeze() {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem('streak_freeze_' + today, 'true')
    setUsed(true)
    onClose()
  }

  if (streak < 3) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: 380, background: 'var(--bg-card)', borderRadius: 24, padding: '28px 24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🔥</div>
        <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.06em', color: '#f97316', lineHeight: 1, marginBottom: 4 }}>{streak}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 16 }}>DAY STREAK</div>

        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Don't lose your streak!</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          You haven't logged today. Log a meal to keep your {streak}-day streak alive.
        </div>

        {isPro ? (
          <>
            <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f97316', marginBottom: 4 }}>🧊 Streak Freeze available</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>As a Pro user you can freeze your streak once per day. Your streak will be safe until tomorrow.</div>
            </div>
            {!used ? (
              <button onClick={useFreeze} style={{ width: '100%', padding: '14px', background: '#f97316', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 10, boxShadow: '0 4px 20px rgba(249,115,22,0.3)' }}>
                🧊 Use streak freeze
              </button>
            ) : (
              <div style={{ padding: '14px', background: 'rgba(249,115,22,0.08)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: '#f97316', fontWeight: 600, marginBottom: 10 }}>
                ✓ Streak frozen for today
              </div>
            )}
          </>
        ) : (
          <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f97316', marginBottom: 4 }}>🧊 Streak Freeze — Pro only</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Pro users can freeze their streak once per day. Upgrade to protect your {streak}-day streak.</div>
            <button onClick={onUpgrade} style={{ width: '100%', padding: '11px', background: 'var(--accent)', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, boxShadow: 'var(--shadow-accent)' }}>
              Upgrade to Pro — $2.99/mo
            </button>
          </div>
        )}

        <button onClick={onClose} style={{ width: '100%', padding: '13px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 10, boxShadow: 'var(--shadow-accent)' }}>
          + Log a meal now
        </button>
        <button onClick={onClose} style={{ background: 'none', color: 'var(--text-muted)', fontSize: 14, padding: '8px' }}>Remind me later</button>
      </div>
    </div>
  )
}
