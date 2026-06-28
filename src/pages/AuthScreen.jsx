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

const ORBITS = [
  { color: '#3b82f6', label: 'Protein' },
  { color: '#f97316', label: 'Carbs' },
  { color: '#8b5cf6', label: 'Fat' },
]

function MacroOrbits() {
  return (
    <div className="auth-orbit-wrap" aria-hidden="true">
      {ORBITS.map((o, i) => (
        <div key={o.label} className={`auth-orbit auth-orbit-${i + 1}`}>
          <div className="auth-orbit-dot" style={{ color: o.color, background: o.color }} />
        </div>
      ))}
      <div className="auth-logo-glow">
        <img src="/logo.png" alt="Mizan" className="auth-logo-img" />
      </div>
    </div>
  )
}

function FaceIdIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 10V9a2 2 0 0 1 4 0v1M14 10V9a2 2 0 0 1 4 0v1M9 15s1 2 3 2 3-2 3-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  )
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

  function switchMode(next) {
    setMode(next)
    setError('')
    setMessage('')
  }

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

  const isForgot = mode === 'forgot'
  const isSignup = mode === 'signup'

  return (
    <div className="auth-screen">
      <div className="auth-ambient">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
      </div>

      <div className="auth-hero">
        <MacroOrbits />
        <div className="auth-brand">Mizan</div>
        <div className="auth-tagline">Balance your nutrition, beautifully</div>
        <div className="auth-stats">
          <span className="auth-stat-pill">40+ Arabic foods</span>
          <span className="auth-stat-pill">AI coaching</span>
          <span className="auth-stat-pill">Ramadan mode</span>
        </div>
      </div>

      <div className="auth-sheet">
        <div className="auth-sheet-handle" />

        {!isForgot && (
          <div className="auth-segment" role="tablist">
            <button
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-segment-btn${mode === 'login' ? ' active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign in
            </button>
            <button
              role="tab"
              aria-selected={isSignup}
              className={`auth-segment-btn${isSignup ? ' active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Create account
            </button>
          </div>
        )}

        <h1 className="auth-heading">
          {isForgot ? 'Reset password' : mode === 'login' ? 'Welcome back' : 'Start your journey'}
        </h1>
        <p className="auth-sub">
          {isForgot
            ? "We'll send a reset link to your email."
            : mode === 'login'
              ? 'Pick up right where you left off.'
              : 'Track macros, build streaks, feel your best.'}
        </p>

        {mode === 'login' && biometricAvailable && biometricRegistered && (
          <button type="button" onClick={handleBiometric} className="auth-biometric">
            <FaceIdIcon />
            Sign in with Face ID
          </button>
        )}

        <div className="auth-group">
          {isSignup && (
            <div className="auth-field">
              <label htmlFor="auth-name">Name</label>
              <input id="auth-name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
            </div>
          )}
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} autoCapitalize="none" autoComplete="email" />
          </div>
          {!isForgot && (
            <div className="auth-field">
              <label htmlFor="auth-pass">Password</label>
              <input id="auth-pass" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} autoComplete={isSignup ? 'new-password' : 'current-password'} />
            </div>
          )}
        </div>

        {mode === 'login' && !isForgot && (
          <button type="button" onClick={() => switchMode('forgot')} className="auth-forgot">Forgot password?</button>
        )}

        {error && <div className="auth-alert auth-alert-error" role="alert">{error}</div>}
        {message && <div className="auth-alert auth-alert-success" role="status">{message}</div>}

        {isForgot ? (
          <button type="button" onClick={handleForgotPassword} disabled={loading} className="auth-cta">
            {loading ? 'Sending…' : 'Send reset email'}
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={loading} className="auth-cta">
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        )}

        <div className="auth-footer">
          {isForgot ? (
            <button type="button" onClick={() => switchMode('login')} className="auth-link">Back to sign in</button>
          ) : null}
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('skip-auth'))} className="auth-skip">
            Continue without an account
          </button>
        </div>
      </div>
    </div>
  )
}
