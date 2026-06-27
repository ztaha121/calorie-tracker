import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

async function isBiometricAvailable() {
  try { return window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() } catch { return false }
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

  useEffect(() => { isBiometricAvailable().then(ok => setBiometricAvailable(ok)); setBiometricRegistered(!!localStorage.getItem('biometric_id')) }, [])

  async function handleSubmit() {
    setError(''); setMessage('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    if (mode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      if (biometricAvailable && !biometricRegistered && data.user) { try { await registerBiometric(data.user.id, data.user.email); setBiometricRegistered(true) } catch {} }
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      if (error) setError(error.message); else setMessage('Check your email to confirm your account.')
    }
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email) { setError('Enter your email first.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    if (error) setError(error.message); else setMessage('Password reset email sent!')
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

  const inp = { width: '100%', padding: '14px 16px', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 16, fontFamily: 'inherit' }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Top green bar */}
      <div style={{ height: 4, background: 'var(--accent)' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px', maxWidth: 430, margin: '0 auto', width: '100%' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: 'var(--shadow-accent)' }}>⚖️</div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Mizan</div>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
          {mode === 'forgot' ? 'Reset password' : mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 28 }}>
          {mode === 'forgot' ? "We'll send a reset link to your email." : mode === 'login' ? 'Sign in to continue tracking.' : 'Start your nutrition journey today.'}
        </p>

        {mode === 'login' && biometricAvailable && biometricRegistered && (
          <button onClick={handleBiometric} style={{ width: '100%', padding: '14px', marginBottom: 14, background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: 'var(--shadow-card)' }}>
            <span style={{ fontSize: 20 }}>🔒</span> Sign in with Face ID / Fingerprint
          </button>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && <input style={inp} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />}
          <input style={inp} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoCapitalize="none" />
          {mode !== 'forgot' && <input style={inp} placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />}

          {mode === 'login' && (
            <button onClick={handleForgotPassword} style={{ background: 'none', color: 'var(--text-hint)', fontSize: 13, textAlign: 'right', textDecoration: 'underline' }}>Forgot password?</button>
          )}

          {error && <div style={{ color: 'var(--danger)', fontSize: 13, padding: '10px 14px', background: 'var(--danger-dim)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
          {message && <div style={{ color: 'var(--accent)', fontSize: 13, padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: 10, border: '1px solid var(--accent-glow)' }}>{message}</div>}

          {mode === 'forgot'
            ? <button onClick={handleForgotPassword} disabled={loading} style={{ padding: '15px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 16, fontWeight: 700, opacity: loading ? 0.7 : 1, boxShadow: 'var(--shadow-accent)' }}>{loading ? 'Sending…' : 'Send reset email'}</button>
            : <button onClick={handleSubmit} disabled={loading} style={{ padding: '15px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 16, fontWeight: 700, opacity: loading ? 0.7 : 1, boxShadow: 'var(--shadow-accent)', marginTop: 4 }}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
          }
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'login' && (
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              No account?{' '}
              <button onClick={() => { setMode('signup'); setError(''); setMessage('') }} style={{ background: 'none', color: 'var(--accent)', fontSize: 14, fontWeight: 700 }}>Sign up</button>
            </div>
          )}
          {mode !== 'login' && (
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Back to{' '}
              <button onClick={() => { setMode('login'); setError(''); setMessage('') }} style={{ background: 'none', color: 'var(--accent)', fontSize: 14, fontWeight: 700 }}>Sign in</button>
            </div>
          )}
          <button onClick={() => window.dispatchEvent(new CustomEvent('skip-auth'))} style={{ background: 'none', color: 'var(--text-hint)', fontSize: 13, textDecoration: 'underline' }}>Use without an account</button>
        </div>
      </div>
    </div>
  )
}
