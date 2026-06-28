import { useState } from 'react'
import ScreenLayout from '../components/ScreenLayout.jsx'
import { IconRamadan, IconWeight, IconRecipe, IconFriends, IconCoach, IconLog, IconProgress, IconProfile, IconPrivacy, IconDoc, IconSpark, IconChevron, IconClose, IconTile } from '../components/AppIcons.jsx'

export default function MoreScreen({ onNavigate, user }) {
  const sections = [
    {
      title: 'Tools',
      items: [
        { icon: IconRamadan, color: 'purple', label: 'Ramadan Mode', sub: 'Fasting timer & prayer times', tab: 'ramadan' },
        { icon: IconWeight, color: 'teal', label: 'Weight Tracker', sub: 'Log & chart your weight', tab: 'weight' },
        { icon: IconRecipe, color: 'orange', label: 'Arabic Recipe AI', sub: 'Describe a dish, get macros', tab: 'arabic' },
        { icon: IconFriends, color: 'blue', label: 'Friends', sub: 'Live leaderboard', tab: 'friends' },
        { icon: IconCoach, color: 'green', label: 'AI Coach', sub: 'Personalized nutrition advice', tab: 'coach' },
      ],
    },
    {
      title: 'App',
      items: [
        { icon: IconLog, color: 'green', label: 'Food log', sub: 'Full history of logged meals', tab: 'log' },
        { icon: IconProgress, color: 'blue', label: 'Progress', sub: 'Weekly stats & streaks', tab: 'progress' },
        { icon: IconProfile, color: 'purple', label: 'Profile & goals', sub: 'Edit your targets', tab: 'profile' },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: IconSpark, color: 'green', label: 'AI features', sub: 'Powered by Claude (Anthropic)', info: true },
        { icon: IconPrivacy, color: 'blue', label: 'Privacy Policy', sub: 'How we handle your data', href: '/privacy.html' },
        { icon: IconDoc, color: 'orange', label: 'Terms of Use', sub: '', href: '/terms.html' },
      ],
    },
  ]

  const [showAIInfo, setShowAIInfo] = useState(false)

  return (
    <ScreenLayout title="More" subtitle="Features & settings">
      {sections.map(section => (
        <div key={section.title} style={{ marginBottom: 24 }}>
          <div className="section-label">{section.title.toUpperCase()}</div>
          <div className="ios-group">
            {section.items.map((item, i) => (
              <button
                key={item.label}
                className="ios-row"
                style={{ borderTop: i > 0 ? undefined : 'none' }}
                onClick={() => {
                  if (item.href) { window.open(item.href, '_blank'); return }
                  if (item.info) { setShowAIInfo(true); return }
                  onNavigate?.(item.tab)
                }}
              >
                <IconTile icon={item.icon} color={item.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ios-row-label">{item.label}</div>
                  {item.sub && <div className="ios-row-sub">{item.sub}</div>}
                </div>
                <IconChevron />
              </button>
            ))}
          </div>
        </div>
      ))}

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-hint)', marginTop: 8 }}>Mizan · Patent pending · DTH Technology</p>

      {showAIInfo && (
        <div className="modal-overlay" onClick={() => setShowAIInfo(false)}>
          <div className="modal-sheet sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>About AI features</span>
              <button onClick={() => setShowAIInfo(false)} className="modal-close"><IconClose /></button>
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
    </ScreenLayout>
  )
}
