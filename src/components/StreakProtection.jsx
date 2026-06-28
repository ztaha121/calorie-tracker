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
    <div className="modal-overlay modal-overlay-center" style={{ zIndex: 300 }}>
      <div className="modal-card fade-in">
        <img src="/logo.png" alt="" style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: 8 }} />
        <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.06em', color: '#f97316', lineHeight: 1, marginBottom: 4 }}>{streak}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 16 }}>DAY STREAK</div>

        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Don't lose your streak!</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          You haven't logged today. Log a meal to keep your {streak}-day streak alive.
        </div>

        {isPro ? (
          <>
            <div className="glass-card glass-card-pad" style={{ marginBottom: 16, background: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.2)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f97316', marginBottom: 4 }}>Streak Freeze available</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>As a Pro user you can freeze your streak once per day.</div>
            </div>
            {!used ? (
              <button onClick={useFreeze} className="btn-primary" style={{ marginBottom: 10, background: 'linear-gradient(135deg, #fb923c, #f97316)', boxShadow: '0 4px 20px rgba(249,115,22,0.3)' }}>
                Use streak freeze
              </button>
            ) : (
              <div style={{ padding: '14px', background: 'rgba(249,115,22,0.08)', borderRadius: 14, fontSize: 14, color: '#f97316', fontWeight: 600, marginBottom: 10 }}>
                Streak frozen for today
              </div>
            )}
          </>
        ) : (
          <div className="glass-card glass-card-pad" style={{ marginBottom: 16, background: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.2)', textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f97316', marginBottom: 4 }}>Streak Freeze — Pro only</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Pro users can freeze their streak once per day.</div>
            <button onClick={onUpgrade} className="btn-primary">Upgrade to Pro</button>
          </div>
        )}

        <button onClick={onClose} className="btn-primary" style={{ marginBottom: 10 }}>Log a meal now</button>
        <button onClick={onClose} className="auth-skip">Remind me later</button>
      </div>
    </div>
  )
}
