import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { squareOAuthCallback } from '../api/pos'
import { C } from '../theme'

export default function POSOAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing') // processing | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      setMessage(error === 'access_denied' ? 'You cancelled the Square connection.' : `Square error: ${error}`)
      return
    }

    if (!code || !state) {
      setStatus('error')
      setMessage('Missing OAuth code or state. Please try again.')
      return
    }

    let clientId
    try {
      clientId = JSON.parse(decodeURIComponent(state)).clientId
    } catch {
      setStatus('error')
      setMessage('Invalid state parameter. Please try again.')
      return
    }

    squareOAuthCallback(clientId, code)
      .then(() => {
        setStatus('success')
        setTimeout(() => {
          navigate(`/site/${clientId}/config/pos-integration`)
        }, 1800)
      })
      .catch(e => {
        setStatus('error')
        setMessage(e.response?.data?.error || e.message || 'Failed to connect Square.')
      })
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: C.page, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans',system-ui,sans-serif"
    }}>
      <div style={{
        background: C.panel, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: '40px 48px', textAlign: 'center',
        maxWidth: 420, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
      }}>
        {status === 'processing' && (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
            <h2 style={{ color: C.t0, margin: '0 0 8px', fontSize: 20 }}>Connecting Square...</h2>
            <p style={{ color: C.t2, fontSize: 14, margin: 0 }}>Exchanging credentials, please wait.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#22c55e', margin: '0 0 8px', fontSize: 20 }}>Square Connected!</h2>
            <p style={{ color: C.t2, fontSize: 14, margin: 0 }}>Redirecting you back...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: '#ef4444', margin: '0 0 8px', fontSize: 20 }}>Connection Failed</h2>
            <p style={{ color: C.t2, fontSize: 14, margin: '0 0 20px' }}>{message}</p>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: '10px 24px', background: C.acc, color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontSize: 14, fontWeight: 700, fontFamily: 'inherit'
              }}
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}
