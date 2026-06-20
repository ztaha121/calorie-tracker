import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

// WebAuthn biometric helpers
async function isBiometricAvailable() {
  try {
    return window.PublicKeyCredential &&
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch { return false }
}

function b64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromB64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

async function registerBiometric(userId, email) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Mizan', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(userId),
        name: email,
        displayName: email
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60000,
    }
  })
  localStorage.setItem('biometric_id', b64url(cred.rawId))
  localStorage.setItem('biometric_user', JSON.stringify({ userId, email }))
  return true
}

async function authenticateBiometric() {
  const credId = localStorage.getItem('biometric_id')
  if (!credId) return null
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ id: fromB64url(credId), type: 'public-key' }],
      userVerification: 'required',
      timeout: 60000,
    }
  })
  const stored = JSON.parse(localStorage.getItem('biometric_user') || 'null')
  return stored
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
      // offer to register biometric after successful login
      if (biometricAvailable && !biometricRegistered && data.user) {
        try {
          await registerBiometric(data.user.id, data.user.email)
          setBiometricRegistered(true)
        } catch { /* user declined, that's fine */ }
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name } }
      })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    }
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email) { setError('Enter your email first, then tap Forgot password.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    if (error) setError(error.message)
    else setMessage('Password reset email sent! Check your inbox.')
    setLoading(false)
  }

  async function handleBiometric() {
    setError(''); setLoading(true)
    try {
      const stored = await authenticateBiometric()
      if (!stored) { setError('No biometric login set up yet. Sign in with password first.'); setLoading(false); return }
      // re-authenticate via stored session or magic link fallback
      setMessage('Biometric verified. Please also enter your password this session.')
      setEmail(stored.email)
    } catch (e) {
      if (e.name === 'NotAllowedError') setError('Biometric cancelled.')
      else setError('Biometric failed. Use password instead.')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '0.5px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#f0f0f0', fontSize: 16
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px', maxWidth: 430, margin: '0 auto' }}>

      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 13, color: '#a8e063', fontWeight: 500, marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Mizan</div>
        <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8 }}>
          {mode === 'forgot' ? 'Reset password' : mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p style={{ color: '#666', fontSize: 15 }}>
          {mode === 'forgot' ? "We'll send a reset link to your email." : mode === 'login' ? 'Sign in to see your progress.' : 'Start tracking your nutrition today.'}
        </p>
      </div>

      {/* biometric button - show on login if registered */}
      {mode === 'login' && biometricAvailable && biometricRegistered && (
        <button onClick={handleBiometric} style={{
          width: '100%', padding: '15px', marginBottom: 16,
          background: 'rgba(168,224,99,0.1)', border: '0.5px solid rgba(168,224,99,0.3)',
          borderRadius: 14, color: '#a8e063', fontSize: 16, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
        }}>
          <span style={{ fontSize: 22 }}>🔒</span> Sign in with Face ID / Fingerprint
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mode === 'signup' && (
          <input style={inputStyle} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
        )}
        <input
          style={inputStyle} placeholder="Email" type="email"
          value={email} onChange={e => setEmail(e.target.value)} autoCapitalize="none"
        />
        {mode !== 'forgot' && (
          <input
            style={inputStyle} placeholder="Password" type="password"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        )}

        {mode === 'login' && (
          <button onClick={handleForgotPassword} style={{
            background: 'none', color: '#555', fontSize: 13,
            textAlign: 'right', textDecoration: 'underline'
          }}>
            Forgot password?
          </button>
        )}

        {error && <p style={{ color: '#ff6b6b', fontSize: 13, padding: '8px 12px', background: 'rgba(255,107,107,0.08)', borderRadius: 8 }}>{error}</p>}
        {message && <p style={{ color: '#a8e063', fontSize: 13, padding: '8px 12px', background: 'rgba(168,224,99,0.08)', borderRadius: 8 }}>{message}</p>}

        {mode === 'forgot' ? (
          <button onClick={handleForgotPassword} disabled={loading} style={{
            marginTop: 8, padding: '15px', background: '#a8e063', borderRadius: 14,
            color: '#0e0e0f', fontSize: 16, fontWeight: 600, opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Sending...' : 'Send reset email'}
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} style={{
            marginTop: 8, padding: '15px', background: '#a8e063', borderRadius: 14,
            color: '#0e0e0f', fontSize: 16, fontWeight: 600, opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        )}
      </div>

      <div style={{ marginTop: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mode === 'login' && (
          <>
            <div>
              <span style={{ color: '#555', fontSize: 14 }}>Don't have an account? </span>
              <button onClick={() => { setMode('signup'); setError(''); setMessage('') }} style={{ background: 'none', color: '#a8e063', fontSize: 14, fontWeight: 500 }}>Sign up</button>
            </div>
            <button onClick={() => { setMode('forgot'); setError(''); setMessage('') }} style={{ background: 'none', color: '#555', fontSize: 13 }}>Reset my password</button>
          </>
        )}
        {mode !== 'login' && (
          <div>
            <span style={{ color: '#555', fontSize: 14 }}>Back to </span>
            <button onClick={() => { setMode('login'); setError(''); setMessage('') }} style={{ background: 'none', color: '#a8e063', fontSize: 14, fontWeight: 500 }}>Sign in</button>
          </div>
        )}
      </div>

      <p style={{ marginTop: 32, textAlign: 'center', color: '#333', fontSize: 12 }}>
        Or{' '}
        <button onClick={() => window.dispatchEvent(new CustomEvent('skip-auth'))} style={{ background: 'none', color: '#555', fontSize: 12, textDecoration: 'underline' }}>
          use without an account
        </button>
      </p>
    </div>
  )
}
