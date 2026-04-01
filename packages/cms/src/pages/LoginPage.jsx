import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { C } from '../theme'
import { DDLogo } from '../Components/Layout'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const login    = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const submit = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    try {
      setError(''); setLoading(true)
      const user = await login(email, password)
      // Redirect based on role — no manual selection needed
      if (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') {
        navigate('/home')
      } else {
        // EDITOR goes to sites (their assigned sites only)
        navigate('/sites')
      }
    } catch(e) {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') submit() }

  return (
    <>
      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}

      <div style={{ minHeight:'100vh', background:C.page, display:'flex',
        flexDirection:'column', alignItems:'center', justifyContent:'center',
        fontFamily:"'DM Sans',system-ui,sans-serif", padding:24 }}>

        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap" rel="stylesheet"/>

        {/* Background glow */}
        <div style={{ position:'fixed', top:'15%', left:'50%',
          transform:'translateX(-50%)', width:700, height:350,
          borderRadius:'50%', pointerEvents:'none', zIndex:0,
          background:`radial-gradient(ellipse, ${C.acc}15 0%, transparent 70%)` }}/>

        {/* Logo + wordmark */}
        <div style={{ display:'flex', alignItems:'center', gap:16,
          marginBottom:36, position:'relative', zIndex:1 }}>
          <DDLogo size={48}/>
          <div>
            <div style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.04em', lineHeight:1 }}>
              <span style={{ color:C.t0 }}>Dine</span>
              <span style={{ background:'linear-gradient(135deg,#FF6B2B,#C0310A)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Desk</span>
            </div>
            <div style={{ fontSize:12, color:C.t3, marginTop:4, fontWeight:500 }}>
              Restaurant CMS Platform
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{ width:'100%', maxWidth:420, background:C.panel,
          border:`1px solid ${C.border}`, borderRadius:18, overflow:'hidden',
          boxShadow:'0 32px 80px rgba(0,0,0,0.7)', position:'relative', zIndex:1 }}>

          {/* Accent bar */}
          <div style={{ height:3, background:`linear-gradient(90deg,${C.acc},${C.cyan})` }}/>

          <div style={{ padding:'36px 36px 32px' }}>
            <h2 style={{ margin:'0 0 4px', fontSize:22, fontWeight:800, color:C.t0 }}>
              Sign in
            </h2>
            <p style={{ margin:'0 0 28px', fontSize:13, color:C.t2 }}>
              Enter your credentials to access the dashboard
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Email */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700,
                  color:C.t3, textTransform:'uppercase', letterSpacing:'0.07em',
                  marginBottom:7 }}>Email Address</label>
                <input type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="you@dinedesk.io"
                  style={{ width:'100%', padding:'11px 14px', fontSize:14,
                    background:C.input, border:`1px solid ${C.border}`,
                    borderRadius:9, color:C.t0, fontFamily:'inherit',
                    outline:'none', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor=C.acc}
                  onBlur={e  => e.target.style.borderColor=C.border}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:7 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:C.t3,
                    textTransform:'uppercase', letterSpacing:'0.07em' }}>
                    Password
                  </label>
                  <span onClick={() => setShowForgot(true)}
                    style={{ fontSize:12, color:C.acc, cursor:'pointer', fontWeight:600 }}
                    onMouseEnter={e => e.target.style.color=C.accHov}
                    onMouseLeave={e => e.target.style.color=C.acc}>
                    Forgot password?
                  </span>
                </div>
                <div style={{ position:'relative' }}>
                  <input type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="••••••••"
                    style={{ width:'100%', padding:'11px 44px 11px 14px', fontSize:14,
                      background:C.input, border:`1px solid ${C.border}`,
                      borderRadius:9, color:C.t0, fontFamily:'inherit',
                      outline:'none', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor=C.acc}
                    onBlur={e  => e.target.style.borderColor=C.border}
                  />
                  <button onClick={() => setShowPass(!showPass)}
                    style={{ position:'absolute', right:12, top:'50%',
                      transform:'translateY(-50%)', background:'none',
                      border:'none', color:C.t3, cursor:'pointer',
                      fontSize:16, padding:2, lineHeight:1 }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding:'10px 14px', background:C.redBg,
                  border:`1px solid ${C.red}40`, borderRadius:8,
                  fontSize:13, color:C.red, display:'flex',
                  alignItems:'center', gap:8 }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Submit */}
              <button onClick={submit} disabled={loading}
                style={{ width:'100%', padding:13,
                  background: loading ? C.card
                    : `linear-gradient(135deg,${C.acc},${C.accHov})`,
                  border:'none', borderRadius:9, fontSize:15, fontWeight:800,
                  color:'#fff', cursor:loading?'not-allowed':'pointer',
                  fontFamily:'inherit', transition:'all 0.2s',
                  boxShadow:loading?'none':`0 4px 20px ${C.acc}50` }}>
                {loading ? '⏳ Signing in…' : 'Sign In →'}
              </button>

            </div>

            {/* Bottom link — Site Admin portal */}
            <div style={{ marginTop:24, paddingTop:20,
              borderTop:`1px solid ${C.border}`,
              display:'flex', justifyContent:'space-between',
              alignItems:'center' }}>
              <span style={{ fontSize:12, color:C.t3 }}>
                DineDesk staff?
              </span>
              <a href="/site-admin"
                style={{ fontSize:12, color:C.acc, fontWeight:700,
                  textDecoration:'none', display:'flex',
                  alignItems:'center', gap:5 }}
                onMouseEnter={e => e.currentTarget.style.color=C.accHov}
                onMouseLeave={e => e.currentTarget.style.color=C.acc}>
                Go to Site Admin →
              </a>
            </div>
          </div>
        </div>

        <p style={{ marginTop:28, fontSize:12, color:C.t3,
          position:'relative', zIndex:1 }}>
          © 2025 DineDesk · Restaurant CMS Platform
        </p>
      </div>
    </>
  )
}

// ── Forgot Password Modal ───────────────────────────────────────
function ForgotModal({ onClose }) {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!email) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setSent(true); setLoading(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:999,
      background:'rgba(0,0,0,0.75)', display:'flex',
      alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400, background:C.panel,
        border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden',
        boxShadow:'0 32px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${C.acc},${C.cyan})` }}/>
        <div style={{ padding:'28px 28px 24px' }}>
          {!sent ? (
            <>
              <h3 style={{ margin:'0 0 6px', fontSize:18, fontWeight:800, color:C.t0 }}>
                Reset your password
              </h3>
              <p style={{ margin:'0 0 20px', fontSize:13, color:C.t2 }}>
                Enter your email and we'll send a reset link.
              </p>
              <input type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key==='Enter' && send()}
                placeholder="you@dinedesk.io" autoFocus
                style={{ width:'100%', padding:'11px 14px', fontSize:14,
                  background:C.input, border:`1px solid ${C.border}`,
                  borderRadius:9, color:C.t0, fontFamily:'inherit',
                  outline:'none', boxSizing:'border-box', marginBottom:16 }}
                onFocus={e => e.target.style.borderColor=C.acc}
                onBlur={e  => e.target.style.borderColor=C.border}
              />
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={send} disabled={loading || !email}
                  style={{ flex:1, padding:11, background:C.acc,
                    border:'none', borderRadius:9, fontSize:14,
                    fontWeight:700, color:'#fff',
                    cursor:loading||!email?'not-allowed':'pointer',
                    fontFamily:'inherit', opacity:!email?0.5:1 }}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button onClick={onClose}
                  style={{ padding:'11px 18px', background:'transparent',
                    border:`1px solid ${C.border}`, borderRadius:9,
                    color:C.t2, cursor:'pointer', fontFamily:'inherit',
                    fontSize:14 }}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'8px 0' }}>
              <div style={{ fontSize:40, marginBottom:16 }}>📬</div>
              <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:800, color:C.t0 }}>
                Check your inbox
              </h3>
              <p style={{ margin:'0 0 20px', fontSize:13, color:C.t2, lineHeight:1.6 }}>
                If <strong style={{ color:C.t1 }}>{email}</strong> has an account,
                a reset link has been sent.
              </p>
              <button onClick={onClose}
                style={{ padding:'11px 28px', background:C.acc,
                  border:'none', borderRadius:9, fontSize:14,
                  fontWeight:700, color:'#fff', cursor:'pointer',
                  fontFamily:'inherit' }}>
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}