import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

async function isBiometricAvailable() {
  try { return window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() }
  catch { return false }
}
function b64url(buffer) { return btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'') }
function fromB64url(str) { str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4)str+='='; return Uint8Array.from(atob(str),c=>c.charCodeAt(0)) }

async function registerBiometric(userId, email) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const cred = await navigator.credentials.create({ publicKey: { challenge, rp: { name: 'Mizan', id: window.location.hostname }, user: { id: new TextEncoder().encode(userId), name: email, displayName: email }, pubKeyCredParams: [{ alg: -7, type: 'public-key' }], authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' }, timeout: 60000 } })
  localStorage.setItem('biometric_id', b64url(cred.rawId)); localStorage.setItem('biometric_user', JSON.stringify({ userId, email })); return true
}

async function authenticateBiometric() {
  const credId = localStorage.getItem('biometric_id'); if (!credId) return null
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  await navigator.credentials.get({ publicKey: { challenge, allowCredentials: [{ id: fromB64url(credId), type: 'public-key' }], userVerification: 'required', timeout: 60000 } })
  return JSON.parse(localStorage.getItem('biometric_user') || 'null')
}

export default function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricRegistered, setBiometricRegistered] = useState(false)

  useEffect(() => {
    isBiometricAvailable().then(ok => setBiometricAvailable(ok))
    setBiometricRegistered(!!localStorage.getItem('biometric_id'))
  }, [])

  async function handleSubmit() {
    setError(''); setMessage('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    if (mode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      if (biometricAvailable && !biometricRegistered && data.user) {
        try { await registerBiometric(data.user.id, data.user.email); setBiometricRegistered(true) } catch {}
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    }
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email) { setError('Enter your email first.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    if (error) setError(error.message)
    else setMessage('Password reset email sent!')
    setLoading(false)
  }

  async function handleBiometric() {
    setError(''); setLoading(true)
    try {
      const stored = await authenticateBiometric()
      if (!stored) { setError('No biometric login set up yet.'); setLoading(false); return }
      setMessage('Biometric verified. Please also enter your password.'); setEmail(stored.email)
    } catch (e) { setError(e.name === 'NotAllowedError' ? 'Biometric cancelled.' : 'Biometric failed.') }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, color: '#f0f4ff', fontSize: 16,
    fontFamily: "'Space Grotesk', sans-serif",
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', padding: '40px 28px',
      maxWidth: 430, margin: '0 auto', background: '#020408',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Cosmic bg */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', filter: 'blur(80px)', top: -80, left: -80 }} />
        <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: 'rgba(16,185,129,0.06)', filter: 'blur(60px)', bottom: -60, right: -60 }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ marginBottom: 44 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: '0 0 20px rgba(16,185,129,0.4)',
            }}>⚖️</div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f4ff' }}>Mizan</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-hint)', letterSpacing: '0.14em', marginBottom: 10 }}>
            {mode === 'forgot' ? 'RECOVERY' : mode === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1.1, marginBottom: 8, color: '#f0f4ff' }}>
            {mode === 'forgot' ? 'Reset password' : mode === 'login' ? 'Sign in' : 'Join Mizan'}
          </h1>
          <p style={{ color: 'rgba(240,244,255,0.45)', fontSize: 15, lineHeight: 1.6 }}>
            {mode === 'forgot' ? "We'll send a reset link to your email." : mode === 'login' ? 'Continue tracking your journey.' : 'Start tracking your nutrition today.'}
          </p>
        </div>

        {/* Biometric */}
        {mode === 'login' && biometricAvailable && biometricRegistered && (
          <button onClick={handleBiometric} style={{
            width: '100%', padding: '14px', marginBottom: 16,
            background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 14, color: '#6366f1', fontSize: 15, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 0 20px rgba(99,102,241,0.15)',
          }}>
            <span style={{ fontSize: 20 }}>🔒</span> Sign in with Face ID / Fingerprint
          </button>
        )}

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <input style={inputStyle} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
          )}
          <input style={inputStyle} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoCapitalize="none" />
          {mode !== 'forgot' && (
            <input style={inputStyle} placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          )}
          {mode === 'login' && (
            <button onClick={handleForgotPassword} style={{ background: 'none', color: 'rgba(240,244,255,0.3)', fontSize: 13, textAlign: 'right', textDecoration: 'underline' }}>Forgot password?</button>
          )}

          {error && <div style={{ color: '#ef4444', fontSize: 13, padding: '10px 14px', background: 'rgba(239,68,68,0.10)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)' }}>{error}</div>}
          {message && <div style={{ color: '#10b981', fontSize: 13, padding: '10px 14px', background: 'rgba(16,185,129,0.10)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.25)' }}>{message}</div>}

          {mode === 'forgot' ? (
            <button onClick={handleForgotPassword} disabled={loading} style={{ marginTop: 4, padding: '15px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700, opacity: loading ? 0.7 : 1, boxShadow: '0 4px 24px rgba(16,185,129,0.35)' }}>
              {loading ? 'Sending…' : 'Send reset email'}
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} style={{ marginTop: 4, padding: '15px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700, opacity: loading ? 0.7 : 1, boxShadow: '0 4px 24px rgba(16,185,129,0.35)' }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          )}
        </div>

        <div style={{ marginTop: 28, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'login' && (
            <div style={{ fontSize: 14, color: 'rgba(240,244,255,0.35)' }}>
              No account?{' '}
              <button onClick={() => { setMode('signup'); setError(''); setMessage('') }} style={{ background: 'none', color: '#10b981', fontSize: 14, fontWeight: 700 }}>Sign up</button>
            </div>
          )}
          {mode !== 'login' && (
            <div style={{ fontSize: 14, color: 'rgba(240,244,255,0.35)' }}>
              Back to{' '}
              <button onClick={() => { setMode('login'); setError(''); setMessage('') }} style={{ background: 'none', color: '#10b981', fontSize: 14, fontWeight: 700 }}>Sign in</button>
            </div>
          )}
        </div>

        <p style={{ marginTop: 36, textAlign: 'center', color: 'rgba(240,244,255,0.2)', fontSize: 13 }}>
          Or{' '}
          <button onClick={() => window.dispatchEvent(new CustomEvent('skip-auth'))} style={{ background: 'none', color: 'rgba(240,244,255,0.35)', fontSize: 13, textDecoration: 'underline' }}>
            use without an account
          </button>
        </p>
      </div>
    </div>
  )
}
