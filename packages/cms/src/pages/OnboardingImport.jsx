import { useState, useRef } from 'react'
import { C } from '../theme'
import { API } from '../api/utils'

const FIELD_MAP = [
  { label: 'Business Name',      key: 'businessName',       map: d => d.businessName },
  { label: 'Trading Name',       key: 'tradingName',        map: d => d.tradingName },
  { label: 'ABN',                key: 'abn',                map: d => d.abn },
  { label: 'Business Type',      key: 'businessType',       map: d => d.businessType },
  { label: 'Cuisine',            key: 'cuisineType',        map: d => d.cuisineType },
  { label: 'Business Address',   key: 'businessAddress',    map: d => d.businessAddress },
  { label: 'Contact Name',       key: 'contactName',        map: d => d.contactName },
  { label: 'Contact Role',       key: 'contactRole',        map: d => d.contactRole },
  { label: 'Contact Email',      key: 'contactEmail',       map: d => d.contactEmail },
  { label: 'Contact Phone',      key: 'contactPhone',       map: d => d.contactPhone },
  { label: 'Current Website',    key: 'currentWebsite',     map: d => d.currentWebsite },
  { label: 'Preferred Domain',   key: 'preferredDomain',    map: d => d.preferredDomain },
  { label: 'Primary Colour',     key: 'brandColorPrimary',  map: d => d.brandColorPrimary },
  { label: 'Secondary Colour',   key: 'brandColorSecondary',map: d => d.brandColorSecondary },
  { label: 'POS System',         key: 'posSystem',          map: d => d.posSystem },
  { label: 'Payment Provider',   key: 'paymentProvider',    map: d => d.paymentProvider },
  { label: 'Go-Live Date',       key: 'goLiveDate',         map: d => d.goLiveDate },
  { label: 'Plan',               key: 'plan',               map: d => d.plan },
  { label: 'Notes',              key: 'additionalNotes',    map: d => d.additionalNotes },
]

const SERVICE_LABELS = {
  menuDisplay: 'Menu Display', onlineOrdering: 'Online Ordering',
  reservations: 'Reservations', specials: 'Specials',
  loyalty: 'Loyalty Program', pos: 'POS Integration',
  multiLocation: 'Multi-Location', giftVouchers: 'Gift Vouchers',
}

function Inp({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      <input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '7px 10px', fontSize: 12, background: C.input,
          border: `1px solid ${C.border}`, borderRadius: 6, color: C.t0,
          outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit'
        }}
      />
    </div>
  )
}

export default function OnboardingImport({ onClientCreated }) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [parsed, setParsed] = useState(null)
  const [fields, setFields] = useState({})
  const [suggestedId, setSuggestedId] = useState('')
  const [clientId, setClientId] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [parseError, setParseError] = useState('')
  const fileRef = useRef()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setParseError('')
    setParsed(null)

    try {
      const formData = new FormData()
      formData.append('pdf', file)
      const res = await fetch(`${API}/onboarding/parse-pdf`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') },
        body: formData
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Parse failed')

      const extracted = {}
      FIELD_MAP.forEach(f => { extracted[f.key] = f.map(json.data) || '' })
      setFields(extracted)
      setParsed(json.data)
      setSuggestedId(json.suggestedId || '')
      setClientId(json.suggestedId || '')
    } catch (err) {
      setParseError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleCreate = async () => {
    if (!clientId || !fields.businessName) {
      setError('Client ID and Business Name are required.')
      return
    }
    setCreating(true)
    setError('')
    try {
      const token = localStorage.getItem('dd_token')

      // 1. Create the client
      const res = await fetch(`${API}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          id: clientId,
          name: fields.businessName,
          domain: fields.preferredDomain || fields.currentWebsite || `${clientId}.dinedesk.local`,
          status: 'draft'
        })
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error || 'Failed to create client')
      }
      const client = await res.json()

      // 2. Prefill site config with onboarding data
      const p = parsed
      const configPayload = {
        settings: {
          siteName: fields.businessName,
          tagline: fields.cuisineType || '',
          contactEmail: fields.contactEmail || '',
          contactPhone: fields.contactPhone || '',
          address: fields.businessAddress || '',
          abn: fields.abn || '',
          businessType: fields.businessType || '',
        },
        colours: {
          theme: p.theme || '',
          primary: fields.brandColorPrimary || '',
          secondary: fields.brandColorSecondary || '',
        },
        header: {
          type: p.headerType || 'standard-full',
          headerTheme: p.headerTheme || 'not-set',
          utilityBelt: p.utilityBelt !== false,
          utilityItems: p.utilityItems || {
            'contact-info': true, 'social-links': true, reviews: true, 'header-ctas': true
          },
        },
        headerCtas: p.headerCtas || [],
        pages: p.pages || {},
        homepageLayout: p.homepageLayout
          ? { sections: Object.keys(p.homepageLayout).filter(k => p.homepageLayout[k]) }
          : undefined,
        reviews: p.reviewsPlaceId ? { placeId: p.reviewsPlaceId, source: p.reviewsSource || 'google' } : undefined,
        onboarding: {
          menuUploadType: p.menuUploadType || '',
          menuCategoryCount: p.menuCategoryCount || '',
          menuItemCount: p.menuItemCount || '',
          menuNotes: p.menuNotes || '',
          hasLogo: p.hasLogo || '',
          hasBannerImages: p.hasBannerImages || '',
          hasMenuImages: p.hasMenuImages || '',
          hasGalleryImages: p.hasGalleryImages || '',
          assetDeliveryMethod: p.assetDeliveryMethod || '',
          goLiveDate: fields.goLiveDate || '',
          plan: fields.plan || '',
          posSystem: fields.posSystem || '',
          paymentProvider: fields.paymentProvider || '',
          signedByName: p.signedByName || '',
          submittedAt: new Date().toISOString(),
          rawData: p,
        },
        notes: {
          internal: [
            fields.contactName ? `Contact: ${fields.contactName} (${fields.contactRole || ''})` : '',
            fields.plan ? `Plan: ${fields.plan}` : '',
            fields.goLiveDate ? `Go-live: ${fields.goLiveDate}` : '',
            fields.posSystem ? `POS: ${fields.posSystem}` : '',
            fields.paymentProvider ? `Payment: ${fields.paymentProvider}` : '',
            fields.additionalNotes ? `Notes: ${fields.additionalNotes}` : '',
          ].filter(Boolean).join('\n'),
        }
      }
      // Strip undefined keys
      Object.keys(configPayload).forEach(k => configPayload[k] === undefined && delete configPayload[k])
      await fetch(`${API}/clients/${client.id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(configPayload)
      })

      setOpen(false)
      setParsed(null)
      setFields({})
      setClientId('')
      if (onClientCreated) onClientCreated(client)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const reset = () => {
    setParsed(null)
    setFields({})
    setClientId('')
    setError('')
    setParseError('')
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 18px', background: 'transparent',
          border: `1px dashed ${C.border}`, borderRadius: 8,
          color: C.t2, fontWeight: 600, fontSize: 13,
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#f97316' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.t2 }}
      >
        <span style={{ fontSize: 16 }}>📋</span>
        Import from Onboarding PDF
      </button>
    )
  }

  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 24, marginBottom: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.t0 }}>Import from Onboarding PDF</div>
          <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>
            Upload the signed DineDesk onboarding PDF to auto-fill client details
          </div>
        </div>
        <button onClick={() => { setOpen(false); reset() }}
          style={{ background: 'transparent', border: 'none', color: C.t3, cursor: 'pointer', fontSize: 18 }}>×</button>
      </div>

      {!parsed ? (
        <div>
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${parseError ? '#ef4444' : C.border}`,
              borderRadius: 10, padding: '32px 20px', textAlign: 'center',
              cursor: 'pointer', background: C.card, transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#f97316'}
            onMouseLeave={e => e.currentTarget.style.borderColor = parseError ? '#ef4444' : C.border}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.t0, marginBottom: 4 }}>
              {uploading ? 'Parsing PDF...' : 'Click to upload PDF'}
            </div>
            <div style={{ fontSize: 11, color: C.t3 }}>DineDesk Onboarding PDF only · Max 20MB</div>
            {parseError && (
              <div style={{ marginTop: 12, fontSize: 11, color: '#ef4444', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 6, padding: '6px 10px', display: 'inline-block' }}>
                ⚠ {parseError}
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,application/pdf"
            onChange={handleFile} style={{ display: 'none' }} />

          <div style={{ marginTop: 12, fontSize: 11, color: C.t3 }}>
            Don't have the PDF yet?{' '}
            <a href={import.meta.env.VITE_ONBOARDING_URL || 'http://localhost:5175'} target="_blank" rel="noopener noreferrer"
              style={{ color: '#f97316', textDecoration: 'none', fontWeight: 600 }}>
              Send client the onboarding link →
            </a>
          </div>
        </div>
      ) : (
        <div>
          {/* Extracted data review */}
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8,
            padding: '8px 14px', marginBottom: 16, fontSize: 12, color: '#166534', fontWeight: 600
          }}>
            ✓ PDF parsed successfully — review and edit the extracted data below
          </div>

          {/* Services detected */}
          {parsed.services && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Services Requested
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(parsed.services).map(([k, v]) => (
                  <span key={k} style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                    background: v ? '#f0fdf4' : C.card,
                    color: v ? '#166534' : C.t3,
                    border: `1px solid ${v ? '#86efac' : C.border}`
                  }}>
                    {v ? '✓' : '—'} {SERVICE_LABELS[k] || k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Client ID field */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Client ID <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <input
              value={clientId}
              onChange={e => setClientId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="e.g. urban-eats-melbourne"
              style={{
                padding: '7px 10px', fontSize: 12, background: C.input,
                border: `1px solid ${C.border}`, borderRadius: 6, color: C.t0,
                outline: 'none', width: '100%', boxSizing: 'border-box',
                fontFamily: 'monospace'
              }}
            />
            <div style={{ fontSize: 10, color: C.t3, marginTop: 3 }}>
              Unique ID used in the system. Lowercase, hyphens only. Cannot be changed later.
            </div>
          </div>

          {/* All extracted fields in 2-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 16 }}>
            {FIELD_MAP.map(f => (
              <Inp key={f.key} label={f.label}
                value={fields[f.key]}
                onChange={v => setFields(prev => ({ ...prev, [f.key]: v }))} />
            ))}
          </div>

          {error && (
            <div style={{
              marginBottom: 12, padding: '8px 12px', background: '#fef2f2',
              border: '1px solid #fee2e2', borderRadius: 6, fontSize: 12, color: '#dc2626'
            }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleCreate} disabled={creating}
              style={{
                padding: '9px 22px', background: '#f97316', border: 'none',
                borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13,
                cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1,
                fontFamily: 'inherit'
              }}>
              {creating ? 'Creating...' : '✓ Create Client & Prefill'}
            </button>
            <button onClick={reset}
              style={{
                padding: '9px 16px', background: 'transparent',
                border: `1px solid ${C.border}`, borderRadius: 8,
                color: C.t2, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
              }}>
              Upload Different PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
