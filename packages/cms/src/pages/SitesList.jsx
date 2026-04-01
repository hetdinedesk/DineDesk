import React, { useState, useEffect } from 'react'
import { C } from '../theme'

export default function SitesList({ onOpenSite, isSuperAdmin, clientAccess = {}, show = true }) {
  const [clients, setClients] = useState([])
  const [name, setName] = useState(() => sessionStorage.getItem('dd_new_site_name') || '')
  const [domain, setDomain] = useState(() => sessionStorage.getItem('dd_new_site_domain') || '')
  const [adding, setAdding] = useState(() => sessionStorage.getItem('dd_new_site_adding') === 'true')

  useEffect(() => {
    sessionStorage.setItem('dd_new_site_name', name)
    sessionStorage.setItem('dd_new_site_domain', domain)
    sessionStorage.setItem('dd_new_site_adding', adding)
  }, [name, domain, adding])

  const reload = () => fetch('http://localhost:3001/api/clients', {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') }
  }).then(r => {
    if (r.status === 401 || r.status === 403) {
      localStorage.removeItem('dd_token')
      window.location.href = '/login'
      return
    }
    return r.json()
  }).then(data => {
    if (!Array.isArray(data)) { setClients([]); return }
    if (isSuperAdmin) {
      setClients(data)
    } else {
      setClients(data.filter(c => {
        const tabs = clientAccess[c.id] || []
        return tabs.length > 0
      }))
    }
  }).catch(() => { })

  useEffect(() => { reload() }, [])

  if (!show) return null

  const add = async () => {
    if (!name) return
    const generatedDomain = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).join('-') + '.dinedesk.local'
    const finalDomain = domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase() || generatedDomain

    try {
      const res = await fetch('http://localhost:3001/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('dd_token')
        },
        body: JSON.stringify({ name, domain: finalDomain, status: 'draft' })
      })
      if (!res.ok) throw new Error('Failed to add client')
      setName(''); setDomain(''); setAdding(false)
      sessionStorage.removeItem('dd_new_site_name')
      sessionStorage.removeItem('dd_new_site_domain')
      sessionStorage.removeItem('dd_new_site_adding')
      reload()
    } catch (err) { alert(err.message) }
  }

  return (
    <div style={{ padding: '32px 0', overflowY: 'auto', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 800, color: C.t0 }}>
            {isSuperAdmin ? 'All Sites' : 'My Sites'}
          </h1>
          <div style={{ fontSize: 13, color: C.t3 }}>
            {clients.length} site{clients.length !== 1 ? 's' : ''}
          </div>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setAdding(!adding)}
            style={{
              padding: '9px 18px', background: C.acc, border: 'none',
              borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit'
            }}>
            + New Client
          </button>
        )}
      </div>

      {adding && isSuperAdmin && (
        <div style={{
          background: C.panel, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 20, marginBottom: 20,
          display: 'flex', gap: 12, alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Restaurant Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Urban Eats Melbourne"
              style={{
                width: '100%', padding: '9px 11px', background: C.input,
                border: `1px solid ${C.border}`, borderRadius: 7, color: C.t0,
                fontSize: 13, fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box'
              }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Domain (optional)</label>
            <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="Auto-generated if left blank"
              style={{
                width: '100%', padding: '9px 11px', background: C.input,
                border: `1px solid ${C.border}`, borderRadius: 7, color: C.t0,
                fontSize: 13, fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box'
              }} />
          </div>
          <button onClick={add} style={{ padding: '9px 20px', background: C.acc, border: 'none', borderRadius: 7, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
          <button onClick={() => setAdding(false)} style={{ padding: '9px 16px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 7, color: C.t2, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        </div>
      )}

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 200px 100px 120px',
          padding: '9px 18px', background: C.card,
          borderBottom: `1px solid ${C.border}`
        }}>
          {['Client', 'Domain', 'Status', 'Updated'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {clients.map((c, i) => (
          <div key={c.id} onClick={() => onOpenSite(c)}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 200px 100px 120px',
              padding: '12px 18px',
              borderBottom: i < clients.length - 1 ? `1px solid ${C.border}20` : 'none',
              cursor: 'pointer', alignItems: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.hover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div>
              <span style={{ fontWeight: 600, color: C.acc }}>{c.name}</span>
              {!isSuperAdmin && (
                <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                  {(clientAccess[c.id] || []).map(tab => (
                    <span key={tab} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: '#FF6B2B20', color: '#FF6B2B', padding: '1px 5px', borderRadius: 3 }}>{tab}</span>
                  ))}
                </div>
              )}
            </div>
            <span style={{ fontSize: 12, color: C.t3, fontFamily: 'monospace' }}>{c.domain}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: c.status === 'live' ? C.green : C.amber }}>{c.status}</span>
            <span style={{ fontSize: 11, color: C.t3 }}>{new Date(c.updatedAt).toLocaleDateString()}</span>
          </div>
        ))}

        {clients.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: C.t3, fontSize: 13 }}>
            {isSuperAdmin ? 'No clients yet. Click + New Client to add one.' : 'No sites have been assigned to your account yet. Contact your administrator.'}
          </div>
        )}
      </div>
    </div>
  )
}
