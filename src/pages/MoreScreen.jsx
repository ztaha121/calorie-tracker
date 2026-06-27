import { useState } from 'react'

export default function MoreScreen({ onNavigate, user }) {
  const sections = [
    {
      title: 'Tools',
      items: [
        { icon: '🌙', label: 'Ramadan Mode', sub: 'Fasting timer & prayer times', tab: 'ramadan' },
        { icon: '⚖️', label: 'Weight Tracker', sub: 'Log & chart your weight', tab: 'weight' },
        { icon: '🫕', label: 'Arabic Recipe AI', sub: 'Describe a dish, get macros', tab: 'arabic' },
        { icon: '👥', label: 'Friends', sub: 'Live leaderboard', tab: 'friends' },
      ],
    },
    {
      title: 'App',
      items: [
        { icon: '📋', label: 'Food log', sub: 'Full history of logged meals', tab: 'log' },
        { icon: '📈', label: 'Progress', sub: 'Weekly stats & streaks', tab: 'progress' },
        { icon: '👤', label: 'Profile & goals', sub: 'Edit your targets', tab: 'profile' },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: '✦', label: 'AI features', sub: 'Powered by Claude (Anthropic)', info: true },
        { icon: '🔒', label: 'Privacy Policy', sub: 'How we handle your data', href: '/privacy.html' },
        { icon: '📄', label: 'Terms of Use', sub: '', href: '/terms.html' },
      ],
    },
  ]

  const [showAIInfo, setShowAIInfo] = useState(false)

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', paddingBottom: 24 }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>More</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Features & settings</div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {sections.map(section => (
          <div key={section.title} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 4 }}>
              {section.title.toUpperCase()}
            </div>
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.href) { window.open(item.href, '_blank'); return }
                    if (item.info) { setShowAIInfo(true); return }
                    onNavigate?.(item.tab)
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', background: 'transparent', textAlign: 'left',
                    borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-card-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{item.label}</div>
                    {item.sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{item.sub}</div>}
                  </div>
                  <span style={{ color: 'var(--text-hint)', fontSize: 18, flexShrink: 0 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-hint)', marginTop: 8 }}>Mizan · Patent pending · DTH Technology</p>
      </div>

      {/* AI info sheet */}
      {showAIInfo && (
        <div onClick={() => setShowAIInfo(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 430, border: '1px solid var(--border)', borderBottom: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>About AI features</span>
              <button onClick={() => setShowAIInfo(false)} style={{ background: 'var(--bg-card-2)', borderRadius: 99, width: 30, height: 30, color: 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              Mizan's AI food scan and Arabic Recipe features are powered by <strong style={{ color: 'var(--accent)' }}>Claude (Anthropic)</strong>, one of the most advanced AI models available.
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              AI estimates are approximations — portion sizes and cooking methods affect accuracy. Always verify with a nutritionist for medical decisions.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Food data from USDA FoodData Central & Open Food Facts. Arabic food database curated by the Mizan team.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
