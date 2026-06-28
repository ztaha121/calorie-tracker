import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export default function NutritionCoach({ user, allEntries, goal, macroGoals }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `مرحباً! 👋 I'm your Mizan nutrition coach. I've analyzed your recent food logs and I'm here to help you hit your goals.\n\nAsk me anything — meal suggestions, why your energy is low, how to hit your protein target, or anything about your nutrition.`,
    }
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [isPro, setIsPro]       = useState(() => localStorage.getItem('is_premium') === 'true')
  const [freeUsed, setFreeUsed] = useState(() => Number(localStorage.getItem('coach_free_used') || 0))
  const [showUpgrade, setShowUpgrade] = useState(false)
  const bottomRef = useRef()
  const FREE_LIMIT = 3

  const GUMROAD_URL = 'https://zaytaha.gumroad.com/l/cyfiz'

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('is_premium').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.is_premium) { setIsPro(true); localStorage.setItem('is_premium', 'true') }
        })
    }
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return

    if (!isPro && freeUsed >= FREE_LIMIT) {
      setShowUpgrade(true)
      return
    }

    const userMsg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    const currentInput = input.trim()
    setInput('')
    setLoading(true)

    const newFreeUsed = freeUsed + 1
    if (!isPro) {
      setFreeUsed(newFreeUsed)
      localStorage.setItem('coach_free_used', newFreeUsed)
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not logged in')
      }

      const response = await fetch('https://rnwsnnvdgsxqamvofhno.supabase.co/functions/v1/nutrition-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: currentInput,
          mode: 'chat',
        })
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        if (data.code === 'NOT_PREMIUM') {
          setShowUpgrade(true)
          if (!isPro) {
            setFreeUsed(freeUsed)
            localStorage.setItem('coach_free_used', freeUsed)
          }
          setLoading(false)
          return
        }
        throw new Error(data.error || 'Something went wrong')
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble responding. Please try again.',
      }])
    }

    setLoading(false)
  }

  const remainingFree = Math.max(0, FREE_LIMIT - freeUsed)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>AI Coach ✦</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Personalized nutrition advice</div>
          </div>
          {!isPro && (
            <div style={{
              background: remainingFree > 0 ? 'var(--bg-card-2)' : 'var(--danger-dim)',
              border: `1px solid ${remainingFree > 0 ? 'var(--border)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 99, padding: '6px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: remainingFree > 0 ? 'var(--text)' : 'var(--danger)', lineHeight: 1 }}>{remainingFree}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.04em' }}>FREE LEFT</div>
            </div>
          )}
          {isPro && (
            <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', borderRadius: 99, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
              ✦ Pro
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 12,
          }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 28, height: 28, borderRadius: 99, background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginRight: 8, marginTop: 2 }}>✦</div>
            )}
            <div style={{
              maxWidth: '78%',
              padding: '12px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
              color: msg.role === 'user' ? '#fff' : 'var(--text)',
              fontSize: 14, lineHeight: 1.6,
              boxShadow: 'var(--shadow-card)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 99, background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✦</div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-hint)', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* Upgrade nudge when 1 free message left */}
        {!isPro && remainingFree === 1 && (
          <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', borderRadius: 14, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>1 free message left</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Upgrade to Pro for unlimited coaching</div>
            </div>
            <button onClick={() => setShowUpgrade(true)} style={{ padding: '6px 12px', background: 'var(--accent)', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>Upgrade</button>
          </div>
        )}

        {!isPro && remainingFree === 0 && (
          <div style={{ background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: '14px', marginBottom: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🔒</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Free messages used up</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Upgrade to Pro for unlimited AI coaching</div>
            <button onClick={() => setShowUpgrade(true)} style={{ padding: '10px 24px', background: 'var(--accent)', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, boxShadow: 'var(--shadow-accent)' }}>Upgrade to Pro</button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length === 1 && (
        <div style={{ padding: '0 16px 8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {[
              'How am I doing this week?',
              'What should I eat tonight?',
              'How to hit my protein goal?',
              'Why am I always hungry?',
            ].map(prompt => (
              <button key={prompt} onClick={() => setInput(prompt)} style={{
                padding: '8px 14px', background: 'var(--bg-card)', borderRadius: 99,
                fontSize: 13, color: 'var(--text-secondary)', border: '1px solid var(--border)',
                whiteSpace: 'nowrap', flexShrink: 0, boxShadow: 'var(--shadow-card)',
              }}>{prompt}</button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '8px 16px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={!isPro && remainingFree === 0 ? 'Upgrade to continue…' : 'Ask your coach…'}
            disabled={!isPro && remainingFree === 0}
            style={{
              flex: 1, padding: '12px 16px',
              background: 'var(--bg-input)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 15,
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading || (!isPro && remainingFree === 0)}
            style={{
              width: 46, height: 46, borderRadius: 'var(--radius-sm)',
              background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg-card-2)',
              color: input.trim() && !loading ? '#fff' : 'var(--text-hint)',
              fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: input.trim() && !loading ? 'var(--shadow-accent)' : 'none',
            }}
          >↑</button>
        </div>
      </div>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div onClick={() => setShowUpgrade(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ width: '100%', maxWidth: 430, background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: '28px 24px 48px', border: '1px solid var(--border)', borderBottom: 'none' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>✦</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>Unlock AI Coach</div>
              <div style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>You've used your {FREE_LIMIT} free messages. Upgrade for unlimited personalized coaching.</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {['Unlimited AI coaching messages', 'Personalized weekly insights', 'Unlimited food scans', 'Advanced progress charts'].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 99, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--accent)', flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { window.location.href = GUMROAD_URL }}
              style={{ width: '100%', padding: '15px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12, boxShadow: 'var(--shadow-accent)' }}
            >
              Upgrade for $4.99/month
            </button>
            <button onClick={() => setShowUpgrade(false)} style={{ width: '100%', padding: '12px', background: 'none', color: 'var(--text-muted)', fontSize: 14 }}>Maybe later</button>
          </div>
        </div>
      )}
    </div>
  )
}
