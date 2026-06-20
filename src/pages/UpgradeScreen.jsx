export default function UpgradeScreen({ onClose, scansUsed = 3 }) {
  const features = [
    'Unlimited AI food scans',
    'Scan any meal — just point and shoot',
    'Works with Arabic & international foods',
    'Priority support',
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end'
    }} onClick={onClose}>
      <div style={{
        width: '100%', background: '#1a1a1c', borderRadius: '24px 24px 0 0',
        padding: '28px 24px 48px', maxWidth: 430, margin: '0 auto'
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: 99,
            width: 32, height: 32, color: '#888', fontSize: 18
          }}>×</button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
          <h2 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Upgrade to Pro
          </h2>
          <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6 }}>
            You've used all {scansUsed} free AI scans.<br />
            Upgrade for unlimited scans.
          </p>
        </div>

        {/* pricing card */}
        <div style={{
          background: 'rgba(168,224,99,0.08)', border: '1px solid rgba(168,224,99,0.25)',
          borderRadius: 16, padding: '20px', marginBottom: 20, textAlign: 'center'
        }}>
          <div style={{ fontSize: 13, color: '#a8e063', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pro Plan</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 40, fontWeight: 300, color: '#f0f0f0', letterSpacing: '-0.03em' }}>$2.99</span>
            <span style={{ fontSize: 14, color: '#666' }}>/month</span>
          </div>
          <div style={{ fontSize: 13, color: '#555' }}>Cancel anytime</div>
        </div>

        {/* features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 99, background: 'rgba(168,224,99,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#a8e063', flexShrink: 0
              }}>✓</div>
              <span style={{ fontSize: 14, color: '#ccc' }}>{f}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => alert('Stripe coming soon! Deploy to Vercel first, then we add payments.')}
          style={{
            width: '100%', padding: '16px', background: '#a8e063',
            borderRadius: 14, color: '#0e0e0f', fontSize: 16, fontWeight: 600,
            marginBottom: 12
          }}>
          Upgrade for $2.99/month
        </button>

        <button onClick={onClose} style={{
          width: '100%', padding: '12px', background: 'none',
          color: '#555', fontSize: 14
        }}>
          Maybe later
        </button>
      </div>
    </div>
  )
}
