import { useState } from 'react'
import { IconClose } from '../components/AppIcons.jsx'

export default function UpgradeScreen({ onClose, scansUsed = 3, user }) {
  const GUMROAD_URL = 'https://zaytaha.gumroad.com/l/cyfiz'

  const features = [
    'Unlimited AI food scans',
    'Arabic & Gulf food recognition',
    'Syncs across all devices',
    'Advanced progress analytics',
    'Priority support',
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet sheet" style={{ maxWidth: 430, margin: '0 auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button onClick={onClose} className="modal-close"><IconClose /></button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/logo.png" alt="Mizan Pro" style={{ width: 72, height: 72, objectFit: 'contain', margin: '0 auto 16px', filter: 'drop-shadow(0 4px 16px rgba(0,185,107,0.2))' }} />
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>Upgrade to Pro</h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>You've used all {scansUsed} free AI scans.<br />Upgrade for unlimited access.</p>
        </div>

        <div className="glass-card glass-card-pad" style={{ marginBottom: 20, textAlign: 'center', background: 'var(--accent-dim)', borderColor: 'var(--accent-glow)' }}>
          <div className="section-label" style={{ color: 'var(--accent)', marginBottom: 6 }}>PRO PLAN</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em' }}>$4.99</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/month</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cancel anytime · 7-day free trial</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {features.map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent)', fontSize: 14, fontWeight: 700 }}>✓</div>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{text}</span>
            </div>
          ))}
        </div>

        {!user ? (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', marginBottom: 12 }}>Create an account to upgrade.</p>
            <button onClick={() => { localStorage.removeItem('skip_auth'); location.reload() }} className="btn-primary" style={{ marginBottom: 12 }}>Create account</button>
          </>
        ) : (
          <button onClick={() => { window.location.href = GUMROAD_URL }} className="btn-primary" style={{ marginBottom: 12 }}>
            Upgrade for $4.99/month
          </button>
        )}
        <button onClick={onClose} className="auth-skip" style={{ width: '100%', padding: 12 }}>Maybe later</button>
      </div>
    </div>
  )
}
