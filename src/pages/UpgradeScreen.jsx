import { useState } from 'react'

export default function UpgradeScreen({ onClose, scansUsed = 3, user }) {
  const [loading, setLoading] = useState(false)

  const GUMROAD_URL = 'https://zaytaha.gumroad.com/l/cyfiz'

  const features = [
    { icon: '✦', text: 'Unlimited AI food scans' },
    { icon: '🌙', text: 'Arabic & Gulf food recognition' },
    { icon: '🔄', text: 'Syncs across all devices' },
    { icon: '📊', text: 'Advanced progress analytics' },
    { icon: '⚡', text: 'Priority support' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div className="sheet" style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg-card)', borderRadius: '24px 24px 0 0', padding: '28px 24px 48px', border: '1px solid var(--border)', borderBottom: 'none' }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button onClick={onClose} style={{ background: 'var(--bg-card-2)', borderRadius: 99, width: 30, height: 30, color: 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--accent)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, boxShadow: 'var(--shadow-accent)' }}>✦</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>Upgrade to Pro</h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>You've used all {scansUsed} free AI scans.<br />Upgrade for unlimited access.</p>
        </div>

        <div style={{ background: 'var(--accent-dim)', border: '1.5px solid var(--accent-glow)', borderRadius: 'var(--radius)', padding: '18px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: 6 }}>PRO PLAN</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em' }}>$4.99</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/month</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cancel anytime · 7-day free trial</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{f.icon}</div>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{f.text}</span>
            </div>
          ))}
        </div>

        {!user ? (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', marginBottom: 12 }}>Create an account to upgrade.</p>
            <button onClick={() => { localStorage.removeItem('skip_auth'); location.reload() }} style={{ width: '100%', padding: '15px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12, boxShadow: 'var(--shadow-accent)' }}>Create account</button>
          </>
        ) : (
          <button
            onClick={() => { window.location.href = GUMROAD_URL }}
            disabled={loading}
            style={{ width: '100%', padding: '15px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12, opacity: loading ? 0.7 : 1, boxShadow: 'var(--shadow-accent)' }}
          >
            Upgrade for $4.99/month
          </button>
        )}
        <button onClick={onClose} style={{ width: '100%', padding: '12px', background: 'none', color: 'var(--text-muted)', fontSize: 14 }}>Maybe later</button>
      </div>
    </div>
  )
}
