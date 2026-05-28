import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPOSConfig, setPOSType, saveCredentials, testConnection,
  connectPOS, syncMenu, getSyncLogs, disconnectPOS
} from '../api/pos'
import {
  Zap, CheckCircle, XCircle, AlertTriangle, RefreshCw, Link2, Unlink,
  ChevronDown, ChevronUp, Upload, ExternalLink, Copy, Clock, BarChart2
} from 'lucide-react'
import { C } from '../theme'

// ── Style helpers ────────────────────────────────────────────────────────────
const card = {
  background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
  padding: 24, marginBottom: 20
}
const label = {
  display: 'block', fontSize: 11, fontWeight: 700, color: C.t3,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5
}
const input = {
  width: '100%', padding: '9px 11px', fontSize: 13, background: C.input,
  border: `1px solid ${C.border}`, borderRadius: 7, color: C.t0,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
}
const btn = (variant = 'primary') => ({
  padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  borderRadius: 8, border: 'none', fontFamily: 'inherit',
  background: variant === 'primary' ? C.acc
    : variant === 'danger' ? '#ef4444'
    : variant === 'ghost' ? 'transparent'
    : C.card,
  color: variant === 'ghost' ? C.t0 : '#fff',
  border: variant === 'ghost' ? `1px solid ${C.border}` : 'none',
  opacity: 1
})

const POS_OPTIONS = [
  { value: 'square',     label: 'Square',      type: 'oauth',   badge: 'OAuth' },
  { value: 'toast',      label: 'Toast',       type: 'oauth',   badge: 'OAuth' },
  { value: 'clover',     label: 'Clover',      type: 'oauth',   badge: 'OAuth' },
  { value: 'abacus',     label: 'Abacus',      type: 'apikey',  badge: 'API Key' },
  { value: 'lightspeed', label: 'Lightspeed',  type: 'apikey',  badge: 'API Key' },
  { value: 'revel',      label: 'Revel',       type: 'apikey',  badge: 'API Key' },
  { value: 'other',      label: 'Other POS',   type: 'other',   badge: 'CSV / Manual' },
  { value: 'none',       label: 'None',        type: 'none',    badge: 'Dashboard Only' },
]

const OAUTH_INSTRUCTIONS = {
  square: {
    title: 'Connect with Square',
    steps: [
      'Click "Connect with Square" — you\'ll be redirected to Square.',
      'Log in and approve DineDesk access to your menu and orders.',
      'You\'ll return here automatically once connected.'
    ],
    docsUrl: 'https://developer.squareup.com/docs/oauth-api/overview',
    docsLabel: 'Square OAuth Guide'
  },
  toast: {
    title: 'Connect with Toast',
    steps: [
      'Enter your Toast Client ID and Client Secret from the Toast Developer Portal.',
      'Enter your Restaurant GUID (found in Toast > Settings > Restaurant Info).',
      'Click "Test & Connect" to verify.'
    ],
    docsUrl: 'https://dev.toasttab.com',
    docsLabel: 'Toast Developer Portal'
  },
  clover: {
    title: 'Connect with Clover',
    steps: [
      'Click "Connect with Clover" — you\'ll be redirected to Clover.',
      'Log in and approve DineDesk access to your inventory and orders.',
      'You\'ll return here automatically once connected.'
    ],
    docsUrl: 'https://docs.clover.com/docs/app-market-merchant-auth',
    docsLabel: 'Clover OAuth Guide'
  }
}

const APIKEY_INSTRUCTIONS = {
  abacus: {
    steps: [
      'Log in to your Abacus dashboard.',
      'Go to Settings → Integrations → API.',
      'Click "Generate API Key" and copy it.',
      'Find your Store ID under Settings → Locations.'
    ],
    docsLabel: 'Abacus API Docs'
  },
  lightspeed: {
    steps: [
      'Log in to your Lightspeed account.',
      'Go to Configuration → API Access.',
      'Create a new API token with "Read Items" and "Write Orders" permissions.',
      'Your Account ID is shown in your browser URL.'
    ],
    docsLabel: 'Lightspeed API Docs'
  },
  revel: {
    steps: [
      'Log in to your Revel dashboard.',
      'Go to Settings → API → Manage API Keys.',
      'Generate a new key and copy the API Key + Secret.',
      'Your Establishment URL is shown under Settings → Establishments.'
    ],
    docsLabel: 'Revel API Docs'
  }
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ connected, lastVerified }) {
  if (!connected) {
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12,
        background:'#fee2e2', color:'#dc2626', padding:'3px 10px', borderRadius:20 }}>
        <XCircle size={12}/> Disconnected
      </span>
    )
  }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12,
      background:'#dcfce7', color:'#16a34a', padding:'3px 10px', borderRadius:20 }}>
      <CheckCircle size={12}/> Connected
      {lastVerified && <span style={{ opacity:0.7 }}>· verified {timeAgo(lastVerified)}</span>}
    </span>
  )
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

// ── Collapsible section ───────────────────────────────────────────────────────
function Collapse({ title, children, defaultOpen = false, open: controlledOpen, onToggle }) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const toggle = () => isControlled ? onToggle(!controlledOpen) : setInternalOpen(o => !o)
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow:'hidden', marginTop:16 }}>
      <button onClick={toggle} style={{
        width:'100%', padding:'10px 14px', background: C.input, border:'none',
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between',
        fontFamily:'inherit', fontSize:13, fontWeight:600, color: C.t0
      }}>
        {title}
        {open ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
      </button>
      {open && <div style={{ padding:16, borderTop:`1px solid ${C.border}` }}>{children}</div>}
    </div>
  )
}

// ── POS type selector ─────────────────────────────────────────────────────────
function POSSelector({ value, onChange }) {
  return (
    <div>
      <label style={label}>Select your POS system</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...input, cursor:'pointer' }}>
        <option value="">-- Choose your POS --</option>
        {POS_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label} ({o.badge})</option>
        ))}
      </select>
    </div>
  )
}

// ── OAuth form (Square, Clover = redirect; Toast = credentials) ───────────────
function OAuthForm({ posType, clientId, posConfig, onSuccess }) {
  const qc = useQueryClient()
  const info = OAUTH_INSTRUCTIONS[posType] || {}
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual] = useState({ accessToken: '', locationId: '', clientId: '', clientSecret: '', restaurantGuid: '' })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [oauthError, setOauthError] = useState(null)

  const isToast = posType === 'toast'
  const isSquare = posType === 'square'
  const isClover = posType === 'clover'

  const SQUARE_APP_ID = import.meta.env.VITE_SQUARE_APP_ID
  const CLOVER_APP_ID = import.meta.env.VITE_CLOVER_APP_ID

  const handleOAuthRedirect = () => {
    setOauthError(null)
    if (isSquare) {
      if (!SQUARE_APP_ID) {
        setOauthError('Square OAuth not configured — enter your access token manually below.')
        setManualOpen(true)
        return
      }
      const redirectUri = `${window.location.origin}/pos/oauth/square/callback`
      const state = encodeURIComponent(JSON.stringify({ clientId }))
      const isSandbox = SQUARE_APP_ID.startsWith('sandbox-')
      const squareHost = isSandbox ? 'connect.squareupsandbox.com' : 'connect.squareup.com'
      window.location.href = `https://${squareHost}/oauth2/authorize?client_id=${SQUARE_APP_ID}&scope=MERCHANT_PROFILE_READ+ORDERS_WRITE+ORDERS_READ+INVENTORY_READ&session=false&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
    } else if (isClover) {
      if (!CLOVER_APP_ID) {
        setOauthError('Clover OAuth not configured — enter your access token manually below.')
        setManualOpen(true)
        return
      }
      window.location.href = `https://sandbox.dev.clover.com/oauth/authorize?client_id=${CLOVER_APP_ID}`
    }
  }

  const handleManualSave = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      if (isToast) {
        await saveCredentials(clientId, {
          posType,
          apiKey: manual.clientSecret,
          storeId: manual.restaurantGuid,
          baseUrl: 'https://ws-api.toasttab.com',
          accessToken: manual.accessToken
        })
      } else {
        await saveCredentials(clientId, {
          posType,
          accessToken: manual.accessToken,
          locationId: manual.locationId
        })
      }
      const result = await connectPOS(clientId)
      setTestResult({ success: true, ...result })
      qc.invalidateQueries(['pos', clientId])
      onSuccess?.()
    } catch (e) {
      setTestResult({ error: e.response?.data?.error || e.message })
    } finally {
      setTesting(false)
    }
  }

  if (posConfig?.connected) {
    return (
      <ConnectedPanel posConfig={posConfig} clientId={clientId} />
    )
  }

  return (
    <div>
      <h4 style={{ margin:'0 0 10px', fontSize:15, color:C.t0 }}>{info.title}</h4>

      {info.steps && (
        <ol style={{ margin:'0 0 16px', paddingLeft:20, lineHeight:1.8 }}>
          {info.steps.map((s, i) => <li key={i} style={{ fontSize:13, color:C.t1 }}>{s}</li>)}
        </ol>
      )}

      {info.docsUrl && (
        <a href={info.docsUrl} target="_blank" rel="noreferrer"
          style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12,
            color: C.acc, textDecoration:'none', marginBottom:16 }}>
          {info.docsLabel} <ExternalLink size={11}/>
        </a>
      )}

      {!isToast && (
        <>
          <button onClick={handleOAuthRedirect}
            style={{ ...btn('primary'), display:'flex', alignItems:'center', gap:8, width:'100%',
              justifyContent:'center', padding:'12px 20px', fontSize:14 }}>
            <Link2 size={16}/> Connect with {posType.charAt(0).toUpperCase() + posType.slice(1)}
          </button>
          {oauthError && (
            <div style={{ marginTop:10, padding:'10px 12px', borderRadius:8, fontSize:13,
              background:'#fefce8', color:'#854d0e', border:'1px solid #fde047' }}>
              ⚠️ {oauthError}
            </div>
          )}
        </>
      )}

      <Collapse title={isToast ? 'Enter Credentials' : '⚙️ Advanced — Enter credentials manually'}
        open={manualOpen} onToggle={setManualOpen}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {isToast && (
            <>
              <div>
                <label style={label}>Toast Client ID</label>
                <input style={input} value={manual.clientId}
                  onChange={e => setManual(p => ({ ...p, clientId: e.target.value }))}
                  placeholder="From Toast Developer Portal"/>
              </div>
              <div>
                <label style={label}>Toast Client Secret</label>
                <input type="password" style={input} value={manual.clientSecret}
                  onChange={e => setManual(p => ({ ...p, clientSecret: e.target.value }))}
                  placeholder="From Toast Developer Portal"/>
              </div>
              <div>
                <label style={label}>Restaurant GUID</label>
                <input style={input} value={manual.restaurantGuid}
                  onChange={e => setManual(p => ({ ...p, restaurantGuid: e.target.value }))}
                  placeholder="Toast → Settings → Restaurant Info"/>
              </div>
            </>
          )}
          {!isToast && (
            <>
              <div>
                <label style={label}>Access Token</label>
                <input type="password" style={input} value={manual.accessToken}
                  onChange={e => setManual(p => ({ ...p, accessToken: e.target.value }))}
                  placeholder="Paste your access token"/>
              </div>
              <div>
                <label style={label}>Location ID</label>
                <input style={input} value={manual.locationId}
                  onChange={e => setManual(p => ({ ...p, locationId: e.target.value }))}
                  placeholder="Your location/merchant ID"/>
              </div>
            </>
          )}

          {testResult && (
            <div style={{
              padding:'10px 12px', borderRadius:8, fontSize:13,
              background: testResult.error ? '#fee2e2' : '#dcfce7',
              color: testResult.error ? '#dc2626' : '#15803d'
            }}>
              {testResult.error
                ? <><XCircle size={13} style={{ verticalAlign:'middle', marginRight:5 }}/>{testResult.error}</>
                : <><CheckCircle size={13} style={{ verticalAlign:'middle', marginRight:5 }}/>
                    Connected{testResult.locationName ? ` · ${testResult.locationName}` : ''}</>
              }
            </div>
          )}

          <button onClick={handleManualSave} disabled={testing} style={btn('primary')}>
            {testing ? 'Connecting...' : 'Save & Connect'}
          </button>
        </div>
      </Collapse>
    </div>
  )
}

// ── API Key form (Abacus, Lightspeed, Revel) ──────────────────────────────────
function APIKeyForm({ posType, clientId, posConfig, onSuccess }) {
  const qc = useQueryClient()
  const info = APIKEY_INSTRUCTIONS[posType] || {}
  const [form, setForm] = useState({ apiKey: '', apiSecret: '', storeId: '', baseUrl: '' })
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)

  const handleTest = async () => {
    setTesting(true)
    setResult(null)
    try {
      await saveCredentials(clientId, form)
      const r = await connectPOS(clientId)
      setResult({ success: true, ...r })
      qc.invalidateQueries(['pos', clientId])
      onSuccess?.()
    } catch (e) {
      setResult({ error: e.response?.data?.error || e.message })
    } finally {
      setTesting(false)
    }
  }

  if (posConfig?.connected) {
    return <ConnectedPanel posConfig={posConfig} clientId={clientId} />
  }

  return (
    <div>
      <h4 style={{ margin:'0 0 12px', fontSize:15, color:C.t0 }}>
        Connect to {posType.charAt(0).toUpperCase() + posType.slice(1)}
      </h4>

      {info.steps && (
        <div style={{ background: C.input, borderRadius:8, padding:'12px 16px', marginBottom:16 }}>
          <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:C.t2 }}>SETUP STEPS</p>
          <ol style={{ margin:0, paddingLeft:18, lineHeight:1.9 }}>
            {info.steps.map((s, i) => <li key={i} style={{ fontSize:13, color:C.t1 }}>{s}</li>)}
          </ol>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div>
          <label style={label}>API Key</label>
          <input type="password" style={input} value={form.apiKey}
            onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))}
            placeholder="Your API key"/>
        </div>
        {posType === 'revel' && (
          <div>
            <label style={label}>API Secret</label>
            <input type="password" style={input} value={form.apiSecret}
              onChange={e => setForm(p => ({ ...p, apiSecret: e.target.value }))}
              placeholder="Your API secret"/>
          </div>
        )}
        <div>
          <label style={label}>{posType === 'lightspeed' ? 'Account ID' : 'Store / Location ID'}</label>
          <input style={input} value={form.storeId}
            onChange={e => setForm(p => ({ ...p, storeId: e.target.value }))}
            placeholder={posType === 'lightspeed' ? 'Your Lightspeed account ID' : 'Your store ID'}/>
        </div>
        {posType === 'revel' && (
          <div>
            <label style={label}>Establishment URL</label>
            <input style={input} value={form.baseUrl}
              onChange={e => setForm(p => ({ ...p, baseUrl: e.target.value }))}
              placeholder="https://myrestaurant.revelup.com"/>
          </div>
        )}
      </div>

      {result && (
        <div style={{
          marginTop:12, padding:'10px 12px', borderRadius:8, fontSize:13,
          background: result.error ? '#fee2e2' : '#dcfce7',
          color: result.error ? '#dc2626' : '#15803d'
        }}>
          {result.error
            ? <><XCircle size={13} style={{ verticalAlign:'middle', marginRight:5 }}/>{result.error}</>
            : <><CheckCircle size={13} style={{ verticalAlign:'middle', marginRight:5 }}/>Connected successfully</>
          }
          {result.error && (
            <div style={{ marginTop:8, fontSize:12 }}>
              <strong>Common issues:</strong>
              <ul style={{ margin:'4px 0 0', paddingLeft:16 }}>
                <li>API Key has expired — generate a new one</li>
                <li>Store ID doesn't match — check your dashboard</li>
                <li>API access not enabled — contact {posType} support</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <button onClick={handleTest} disabled={testing || !form.apiKey}
        style={{ ...btn('primary'), marginTop:16, opacity: !form.apiKey ? 0.5 : 1 }}>
        {testing ? 'Testing...' : 'Test Connection'}
      </button>
    </div>
  )
}

// ── Other POS (CSV + Manual + Webhook) ───────────────────────────────────────
function OtherPOSForm({ clientId }) {
  const [csvFile, setCsvFile] = useState(null)
  const [posRequest, setPosRequest] = useState('')
  const webhookUrl = `${import.meta.env.VITE_CMS_API_URL || 'http://localhost:3001/api'}/webhooks/${clientId}`

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <div>
      <h4 style={{ margin:'0 0 8px', fontSize:15, color:C.t0 }}>Other POS System</h4>
      <p style={{ fontSize:13, color:C.t2, marginBottom:20 }}>
        We don't have a direct integration with your POS yet, but you can still use DineDesk!
      </p>

      <div style={{ ...card, marginBottom:16 }}>
        <p style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:C.t0 }}>
          📄 Option A: Import menu via CSV
        </p>
        <div style={{
          border:`2px dashed ${C.border}`, borderRadius:8, padding:24,
          textAlign:'center', cursor:'pointer',
          background: csvFile ? '#f0fdf4' : C.input
        }}
          onClick={() => document.getElementById('csv-upload').click()}>
          <input id="csv-upload" type="file" accept=".csv" style={{ display:'none' }}
            onChange={e => setCsvFile(e.target.files?.[0])}/>
          <Upload size={20} style={{ color:C.t3, marginBottom:8 }}/>
          <p style={{ margin:'4px 0 0', fontSize:13, color:C.t2 }}>
            {csvFile ? csvFile.name : 'Click to upload CSV or drag and drop'}
          </p>
        </div>
        <div style={{ marginTop:10, display:'flex', gap:10 }}>
          <button style={btn('ghost')}>Download CSV Template</button>
          {csvFile && <button style={btn('primary')}>Import Menu</button>}
        </div>
        <p style={{ fontSize:11, color:C.t3, marginTop:8 }}>
          CSV columns: item_name, category, description, price, modifiers
        </p>
      </div>

      <div style={{ ...card, marginBottom:16 }}>
        <p style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:C.t0 }}>
          ✏️ Option B: Build menu manually
        </p>
        <p style={{ fontSize:13, color:C.t2, margin:'0 0 10px' }}>
          Use DineDesk's menu builder to create and manage your menu directly.
        </p>
        <button style={btn('ghost')}>Go to Menu Builder →</button>
      </div>

      <div style={{ ...card, marginBottom:0 }}>
        <p style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:C.t0 }}>
          💡 Option C: Request an integration
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <input style={{ ...input, flex:1 }} value={posRequest}
            onChange={e => setPosRequest(e.target.value)}
            placeholder="What POS do you use? (e.g. Kounta, Lightspeed K)"/>
          <button style={btn('primary')}>Submit Request</button>
        </div>
        <p style={{ fontSize:11, color:C.t3, marginTop:6 }}>
          We'll notify you when we add support for your POS.
        </p>
      </div>

      <Collapse title="⚙️ For Developers — Webhook Integration">
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={label}>Webhook URL</label>
            <div style={{ display:'flex', gap:8 }}>
              <input readOnly style={{ ...input, fontFamily:'monospace', fontSize:12, flex:1 }}
                value={webhookUrl}/>
              <button onClick={() => handleCopy(webhookUrl)} style={btn('ghost')}>
                <Copy size={13}/>
              </button>
            </div>
          </div>
          <p style={{ fontSize:12, color:C.t2, margin:0 }}>
            Send a <code>X-DineDesk-Signature: sha256=&lt;hmac&gt;</code> header with every request.
            Signature is HMAC-SHA256 of the raw request body using your webhook secret.
          </p>
          <a href="#" style={{ fontSize:12, color:C.acc, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>
            View API Documentation <ExternalLink size={11}/>
          </a>
        </div>
      </Collapse>
    </div>
  )
}

// ── None / Dashboard only ─────────────────────────────────────────────────────
function NoneForm() {
  return (
    <div style={{ textAlign:'center', padding:'32px 16px' }}>
      <CheckCircle size={40} style={{ color:'#16a34a', marginBottom:12 }}/>
      <h4 style={{ margin:'0 0 8px', fontSize:16, color:C.t0 }}>You're all set!</h4>
      <div style={{ maxWidth:400, margin:'0 auto', textAlign:'left' }}>
        <ul style={{ lineHeight:2, fontSize:13, color:C.t1 }}>
          <li>Online orders appear in your DineDesk Dashboard</li>
          <li>You'll get email notifications for new orders</li>
          <li>Manually mark orders as accepted, preparing, ready, or completed</li>
        </ul>
        <p style={{ fontSize:12, color:C.t3 }}>
          You can connect a POS any time by changing your selection above.
        </p>
      </div>
    </div>
  )
}

// ── Connected panel (shown when POS is connected) ─────────────────────────────
function ConnectedPanel({ posConfig, clientId }) {
  const qc = useQueryClient()
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  const { data: logs = [] } = useQuery({
    queryKey: ['pos-sync-logs', clientId],
    queryFn: () => getSyncLogs(clientId),
    enabled: !!clientId
  })

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const r = await syncMenu(clientId)
      setSyncResult(r)
      qc.invalidateQueries(['pos', clientId])
    } catch (e) {
      setSyncResult({ error: e.response?.data?.error || e.message })
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect this POS? Orders will show in dashboard only.')) return
    try {
      await disconnectPOS(clientId)
      qc.invalidateQueries(['pos', clientId])
    } catch (e) {
      console.error(e)
    }
  }

  const posName = posConfig.posType?.charAt(0).toUpperCase() + posConfig.posType?.slice(1)

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h4 style={{ margin:'0 0 4px', fontSize:15, color:C.t0 }}>✅ Connected to {posName}</h4>
          {posConfig.locationName && (
            <p style={{ margin:0, fontSize:13, color:C.t2 }}>📍 {posConfig.locationName}</p>
          )}
        </div>
        <StatusBadge connected={posConfig.connected} lastVerified={posConfig.connectionVerifiedAt}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
        <Stat label="Menu Items" value={posConfig.menuItemsCount || 0}/>
        <Stat label="Last Sync" value={posConfig.lastMenuSyncAt ? timeAgo(posConfig.lastMenuSyncAt) : 'Never'}/>
        <Stat label="Last Order Push" value={posConfig.lastOrderPushAt ? timeAgo(posConfig.lastOrderPushAt) : 'None'}/>
        <Stat label="Status" value={posConfig.connected ? 'Healthy ✅' : 'Issue ❌'}/>
      </div>

      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <button onClick={handleSync} disabled={syncing}
          style={{ ...btn('primary'), display:'flex', alignItems:'center', gap:6 }}>
          <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }}/>
          {syncing ? 'Syncing...' : 'Sync Menu Now'}
        </button>
        <button onClick={handleDisconnect}
          style={{ ...btn('ghost'), display:'flex', alignItems:'center', gap:6, color:'#ef4444', borderColor:'#fca5a5' }}>
          <Unlink size={13}/> Disconnect
        </button>
      </div>

      {syncResult && (
        <div style={{
          marginTop:14, padding:'12px 16px', borderRadius:8, fontSize:13,
          background: syncResult.error ? '#fee2e2' : '#f0fdf4',
          color: syncResult.error ? '#dc2626' : '#15803d',
          border: `1px solid ${syncResult.error ? '#fca5a5' : '#86efac'}`
        }}>
          {syncResult.error
            ? <><XCircle size={13} style={{ verticalAlign:'middle', marginRight:5 }}/>{syncResult.error}</>
            : <>
                <CheckCircle size={13} style={{ verticalAlign:'middle', marginRight:5 }}/>
                Sync complete — {syncResult.totalItems} items
                {syncResult.itemsAdded > 0 && <span style={{ marginLeft:8 }}>+{syncResult.itemsAdded} new</span>}
                {syncResult.itemsUpdated > 0 && <span style={{ marginLeft:8 }}>~{syncResult.itemsUpdated} updated</span>}
                {syncResult.itemsRemoved > 0 && <span style={{ marginLeft:8 }}>-{syncResult.itemsRemoved} removed</span>}
                {syncResult.durationMs && <span style={{ opacity:0.6, marginLeft:8 }}>({syncResult.durationMs}ms)</span>}
              </>
          }
        </div>
      )}

      {logs.length > 0 && (
        <div style={{ marginTop:20 }}>
          <p style={{ ...label, marginBottom:8 }}>Recent Syncs</p>
          {logs.slice(0, 5).map(log => (
            <div key={log.id} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'7px 0', borderBottom:`1px solid ${C.border}`, fontSize:12
            }}>
              <span style={{ display:'flex', alignItems:'center', gap:6, color: log.status === 'success' ? '#15803d' : '#dc2626' }}>
                {log.status === 'success' ? <CheckCircle size={11}/> : <XCircle size={11}/>}
                {log.syncType} — {log.totalItems} items
              </span>
              <span style={{ color:C.t3 }}>{timeAgo(log.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label: lbl, value }) {
  return (
    <div style={{ background:C.input, borderRadius:8, padding:'10px 14px' }}>
      <p style={{ margin:'0 0 2px', fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase' }}>{lbl}</p>
      <p style={{ margin:0, fontSize:14, fontWeight:700, color:C.t0 }}>{value}</p>
    </div>
  )
}

// ── Main exported component ───────────────────────────────────────────────────
export default function POSIntegrationSection({ clientId }) {
  const qc = useQueryClient()

  const { data: posConfig, isLoading } = useQuery({
    queryKey: ['pos', clientId],
    queryFn: () => getPOSConfig(clientId),
    enabled: !!clientId,
    retry: false
  })

  const [selectedType, setSelectedType] = useState('')

  useEffect(() => {
    if (posConfig?.posType) setSelectedType(posConfig.posType)
  }, [posConfig?.posType])

  const handleTypeChange = async (newType) => {
    setSelectedType(newType)
    try {
      await setPOSType(clientId, newType)
      qc.invalidateQueries(['pos', clientId])
    } catch (e) {
      console.error(e)
    }
  }

  if (isLoading) {
    return <div style={{ padding:40, color:C.t3, textAlign:'center' }}>Loading POS configuration...</div>
  }

  const selected = POS_OPTIONS.find(o => o.value === selectedType)
  const posType = selected?.type

  return (
    <div style={{ maxWidth:680, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, color:C.t0 }}>POS Integration</h2>
        <p style={{ margin:0, fontSize:13, color:C.t2 }}>
          Connect your Point of Sale system to sync your menu and automatically send orders.
        </p>
      </div>

      {/* Connection status banner */}
      {posConfig?.connected && posConfig?.posType && posConfig.posType !== 'none' && (
        <div style={{
          display:'flex', alignItems:'center', gap:10, padding:'10px 16px', marginBottom:20,
          background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, fontSize:13
        }}>
          <CheckCircle size={16} style={{ color:'#16a34a', flexShrink:0 }}/>
          <span style={{ color:'#15803d' }}>
            <strong>{posConfig.posType.charAt(0).toUpperCase() + posConfig.posType.slice(1)}</strong> is connected
            {posConfig.locationName && <> · {posConfig.locationName}</>}
            {posConfig.lastMenuSyncAt && <> · Last synced {timeAgo(posConfig.lastMenuSyncAt)}</>}
          </span>
        </div>
      )}

      {/* POS type selector */}
      <div style={card}>
        <POSSelector value={selectedType} onChange={handleTypeChange}/>
      </div>

      {/* Render form based on type */}
      {selectedType && (
        <div style={card}>
          {posType === 'oauth' && (
            <OAuthForm
              posType={selectedType}
              clientId={clientId}
              posConfig={posConfig}
              onSuccess={() => qc.invalidateQueries(['pos', clientId])}
            />
          )}
          {posType === 'apikey' && (
            <APIKeyForm
              posType={selectedType}
              clientId={clientId}
              posConfig={posConfig}
              onSuccess={() => qc.invalidateQueries(['pos', clientId])}
            />
          )}
          {posType === 'other' && <OtherPOSForm clientId={clientId}/>}
          {posType === 'none' && <NoneForm/>}
        </div>
      )}

      {/* Already connected → show management panel regardless */}
      {posConfig?.connected && posType !== 'oauth' && posType !== 'apikey' && (
        <div style={card}>
          <ConnectedPanel posConfig={posConfig} clientId={clientId}/>
        </div>
      )}
    </div>
  )
}
