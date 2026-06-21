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
  const [guestEmail, setGuestEmail] = useState('')
  const [showEmailCapture, setShowEmailCapture] = useState(false)

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

  function continueAsGuest() {
    localStorage.setItem('skip_auth', 'true')
    if (guestEmail) localStorage.setItem('guest_email', guestEmail)
    window.dispatchEvent(new CustomEvent('skip-auth'))
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 16
  }

  const accentBtn = (label, action, disabled) => (
    <button onClick={action} disabled={disabled} style={{
      marginTop: 4, padding: '15px', background: 'var(--accent)',
      borderRadius: 'var(--radius-sm)', color: '#0e0e0f', fontSize: 16,
      fontWeight: 700, fontFamily: 'var(--font-display)',
      opacity: disabled ? 0.7 : 1,
      boxShadow: disabled ? 'none' : '0 4px 20px var(--accent-glow)'
    }}>{label}</button>
  )

  if (showEmailCapture) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px', maxWidth: 430, margin: '0 auto', background: 'var(--bg)' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mizan ✦</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 8, color: 'var(--text)' }}>Get tips & updates</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Optional — enter your email to receive nutrition tips.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={inputStyle} placeholder="your@email.com" type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
          {accentBtn('Continue to app →', continueAsGuest, false)}
          <button onClick={continueAsGuest} style={{ background: 'none', color: 'var(--text-hint)', fontSize: 13 }}>Skip</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px', maxWidth: 430, margin: '0 auto', background: 'var(--bg)' }}>

      {/* Logo */}
      <div style={{ marginBottom: 44 }}>
        <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mizan ✦</div>
        <h1 style={{ fontSize: 34, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8, color: 'var(--text)' }}>
          {mode === 'forgot' ? 'Reset password' : mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.5 }}>
          {mode === 'forgot' ? "We'll send a reset link to your email." : mode === 'login' ? 'Sign in to see your progress.' : 'Start tracking your nutrition today.'}
        </p>
      </div>

      {mode === 'login' && biometricAvailable && biometricRegistered && (
        <button onClick={handleBiometric} style={{
          width: '100%', padding: '14px', marginBottom: 16,
          background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
          borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: 15, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontFamily: 'var(--font-display)'
        }}>
          <span style={{ fontSize: 20 }}>🔒</span> Sign in with Face ID / Fingerprint
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mode === 'signup' && (
          <input style={inputStyle} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
        )}
        <input style={inputStyle} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoCapitalize="none" />
        {mode !== 'forgot' && (
          <input style={inputStyle} placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        )}
        {mode === 'login' && (
          <button onClick={handleForgotPassword} style={{ background: 'none', color: 'var(--text-hint)', fontSize: 13, textAlign: 'right', textDecoration: 'underline' }}>
            Forgot password?
          </button>
        )}
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, padding: '10px 14px', background: 'var(--danger-dim)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--danger)' }}>{error}</p>}
        {message && <p style={{ color: 'var(--accent)', fontSize: 13, padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--accent-glow)' }}>{message}</p>}
        {mode === 'forgot'
          ? accentBtn(loading ? 'Sending...' : 'Send reset email', handleForgotPassword, loading)
          : accentBtn(loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account', handleSubmit, loading)
        }
      </div>

      <div style={{ marginTop: 28, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {mode === 'login' && (
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <button onClick={() => { setMode('signup'); setError(''); setMessage('') }} style={{ background: 'none', color: 'var(--accent)', fontSize: 14, fontWeight: 700 }}>Sign up</button>
          </div>
        )}
        {mode !== 'login' && (
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Back to{' '}
            <button onClick={() => { setMode('login'); setError(''); setMessage('') }} style={{ background: 'none', color: 'var(--accent)', fontSize: 14, fontWeight: 700 }}>Sign in</button>
          </div>
        )}
      </div>

      <p style={{ marginTop: 36, textAlign: 'center', color: 'var(--text-hint)', fontSize: 13 }}>
        Or{' '}
        <button onClick={() => setShowEmailCapture(true)} style={{ background: 'none', color: 'var(--text-muted)', fontSize: 13, textDecoration: 'underline' }}>
          use without an account
        </button>
      </p>
    </div>
  )
}
