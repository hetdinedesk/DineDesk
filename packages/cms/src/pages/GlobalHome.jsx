import React, { useState, useEffect } from 'react'
import { C } from '../theme'
import { Container, useMediaQuery } from '../Components/Layout'

export function HomeInp({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ flex: 1 }}>
      {label && <label style={{
        fontSize: 11, fontWeight: 700, color: C.t3,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        display: 'block', marginBottom: 5
      }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 11px', background: C.input,
          border: `1px solid ${C.border}`, borderRadius: 7, color: C.t0,
          fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
        }}
        onFocus={e => e.target.style.borderColor = C.acc}
        onBlur={e => e.target.style.borderColor = C.border}
      />
    </div>
  )
}

export default function GlobalHome({ onOpenSite, isSuperAdmin }) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')
  const [clients, setClients] = useState([])
  const [groups, setGroups] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [addingClient, setAddingClient] = useState(false)
  const [addingGroup, setAddingGroup] = useState(false)
  const [clientName, setClientName] = useState('')
  const [clientDomain, setClientDomain] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupColor, setGroupColor] = useState('#FF6B2B')
  const [search, setSearch] = useState('')
  const [openGroup, setOpenGroup] = useState(null)
  const [editingGroup, setEditingGroup] = useState(null)

  const token = () => localStorage.getItem('dd_token')

  const loadClients = () => {
    setLoadingClients(true)
    fetch('http://localhost:3001/api/clients', {
      headers: { Authorization: 'Bearer ' + token() }
    }).then(r => {
      if (!r.ok) throw new Error('Failed to load clients')
      return r.json()
    })
      .then(d => { setClients(Array.isArray(d) ? d : []); setLoadingClients(false) })
      .catch((err) => {
        console.error('loadClients error:', err.message)
        setLoadingClients(false)
      })
  }

  const loadGroups = () => {
    setLoadingGroups(true)
    fetch('http://localhost:3001/api/groups', {
      headers: { Authorization: 'Bearer ' + token() }
    }).then(r => {
      if (!r.ok) throw new Error('Failed to load groups')
      return r.json()
    })
      .then(d => { setGroups(Array.isArray(d) ? d : []); setLoadingGroups(false) })
      .catch((err) => {
        console.error('loadGroups error:', err.message)
        setLoadingGroups(false)
      })
  }

  useEffect(() => { loadClients(); loadGroups() }, [])

  const addClient = async () => {
    if (!clientName) return
    const generatedDomain = clientName.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).join('-') + '.dinedesk.local'
    const finalDomain = clientDomain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase() || generatedDomain

    try {
      const res = await fetch('http://localhost:3001/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
        body: JSON.stringify({ name: clientName, domain: finalDomain, status: 'draft' })
      })
      if (!res.ok) throw new Error('Failed to add client')
      setClientName(''); setClientDomain(''); setAddingClient(false)
      loadClients()
    } catch (err) { alert(err.message) }
  }

  const addGroup = async () => {
    if (!groupName) return
    try {
      const res = await fetch('http://localhost:3001/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
        body: JSON.stringify({ name: groupName, color: groupColor })
      })
      if (!res.ok) throw new Error('Failed to add group')
      setGroupName(''); setGroupColor('#FF6B2B'); setAddingGroup(false)
      loadGroups()
    } catch (err) { alert(err.message) }
  }

  const saveGroupEdit = async () => {
    if (!editingGroup) return
    await fetch(`http://localhost:3001/api/groups/${editingGroup.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
      body: JSON.stringify({ name: editingGroup.name, color: editingGroup.color })
    })
    setEditingGroup(null)
    loadGroups()
    setOpenGroup(g => g ? { ...g, name: editingGroup.name, color: editingGroup.color } : null)
  }

  const assignSiteToGroup = async (clientId, groupId) => {
    await fetch(`http://localhost:3001/api/clients/${clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
      body: JSON.stringify({ groupId: groupId || null })
    })
    loadClients()
  }

  const deleteGroup = async (groupId) => {
    if (!window.confirm('Delete this group? Sites will be unassigned.')) return
    await fetch(`http://localhost:3001/api/groups/${groupId}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token() }
    })
    setOpenGroup(null)
    loadGroups(); loadClients()
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.domain.toLowerCase().includes(search.toLowerCase())
  )

  const metrics = [
    { label: 'Total Sites', value: clients.length, icon: '🌐', color: C.acc },
    { label: 'Live', value: clients.filter(c => c.status === 'live').length, icon: '✅', color: C.green },
    { label: 'Draft', value: clients.filter(c => c.status === 'draft').length, icon: '📝', color: C.amber },
    { label: 'Total Groups', value: groups.length, icon: '📁', color: '#A78BFA' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.page, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      {/* Group Detail Modal */}
      {openGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 560, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <div style={{ height: 4, background: openGroup.color }} />
            <div style={{ padding: '20px 32px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: openGroup.color, boxShadow: `0 0 10px ${openGroup.color}90` }} />
                {editingGroup ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input value={editingGroup.name} onChange={e => setEditingGroup(p => ({ ...p, name: e.target.value }))} style={{ padding: '6px 10px', fontSize: 16, fontWeight: 700, background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, color: C.t0, fontFamily: 'inherit', outline: 'none' }} />
                    <input type="color" value={editingGroup.color} onChange={e => setEditingGroup(p => ({ ...p, color: e.target.value }))} style={{ width: 36, height: 34, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                    <button onClick={saveGroupEdit} style={{ padding: '6px 14px', background: C.acc, border: 'none', borderRadius: 6, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                    <button onClick={() => setEditingGroup(null)} style={{ padding: '6px 10px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, color: C.t2, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.t0 }}>{openGroup.name}</div>
                    <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{clients.filter(c => c.groupId === openGroup.id).length} sites in this group</div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!editingGroup && (
                  <>
                    <button onClick={() => setEditingGroup({ ...openGroup })} style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 6, color: C.t2, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Edit</button>
                    <button onClick={() => deleteGroup(openGroup.id)} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #EF444440', borderRadius: 6, color: '#EF4444', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ Delete</button>
                  </>
                )}
                <button onClick={() => { setOpenGroup(null); setEditingGroup(null) }} style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, color: C.t2, fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>
            </div>
            <div style={{ padding: '16px 32px 8px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Sites in this group</div>
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {clients.filter(c => c.groupId === openGroup.id).length === 0 ? <div style={{ fontSize: 13, color: C.t3, padding: '8px 0' }}>No sites assigned yet.</div> : clients.filter(c => c.groupId === openGroup.id).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <div><span style={{ fontSize: 13, fontWeight: 600, color: openGroup.color }}>{c.name}</span><span style={{ fontSize: 11, color: C.t3, marginLeft: 8, fontFamily: 'monospace' }}>{c.domain}</span></div>
                    <button onClick={() => assignSiteToGroup(c.id, null)} style={{ fontSize: 11, color: '#EF4444', background: 'transparent', border: '1px solid #EF444430', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '8px 32px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Assign sites to this group</div>
              <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {clients.filter(c => c.groupId !== openGroup.id).length === 0 ? <div style={{ fontSize: 13, color: C.t3 }}>All sites are already in this group.</div> : clients.filter(c => c.groupId !== openGroup.id).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <div><span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{c.name}</span>{c.groupId && <span style={{ fontSize: 11, color: C.t3, marginLeft: 8 }}>(in {groups.find(g => g.id === c.groupId)?.name || 'another group'})</span>}</div>
                    <button onClick={() => assignSiteToGroup(c.id, openGroup.id)} style={{ fontSize: 11, color: C.acc, background: C.accBg, border: `1px solid ${C.acc}40`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontWeight: 600 }}>+ Assign</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Strip */}
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.t0 }}>Home</h1>
        <div style={{ position: 'relative' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sites..." style={{ padding: '7px 36px 7px 12px', fontSize: 13, background: C.card, border: `1px solid ${C.border2}`, borderRadius: 7, color: C.t0, fontFamily: 'inherit', outline: 'none', width: 240 }} onFocus={e => e.target.style.borderColor = C.acc} onBlur={e => e.target.style.borderColor = C.border2} />
          <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: C.t3, fontSize: 14, pointerEvents: 'none' }}>🔍</span>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ padding: '20px 0 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 24
        }}>
          {metrics.map(({ label, value, icon, color }) => (
            <div key={label} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px', borderTop: `3px solid ${color}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <span style={{ fontSize: 30, fontWeight: 900, color: C.t0, letterSpacing: '-0.03em' }}>{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        padding: '0 0 40px',
        display: 'grid',
        gridTemplateColumns: isTablet ? '1fr' : 'minmax(0, 1fr) minmax(280px, 360px)',
        gap: 20
      }}>
        {/* Left: Sites List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: 20, fontWeight: 800, color: C.t0 }}>{filteredClients.length}</span>
              <span style={{ fontSize: 14, color: C.t2, marginLeft: 6 }}>of {clients.length} Sites</span>
            </div>
            <button onClick={() => { setAddingClient(!addingClient); setAddingGroup(false) }} style={{ padding: '7px 16px', background: C.acc, border: 'none', borderRadius: 7, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Client</button>
          </div>

          {addingClient && (
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <HomeInp label="Restaurant Name" value={clientName} onChange={setClientName} placeholder="e.g. Urban Eats Melbourne" />
              <HomeInp label="Domain (optional)" value={clientDomain} onChange={setClientDomain} placeholder="Auto-generated if left blank" />
              <button onClick={addClient} style={{ padding: '9px 18px', background: C.acc, border: 'none', borderRadius: 7, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
              <button onClick={() => { setAddingClient(false); setClientDomain('') }} style={{ padding: '9px 14px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 7, color: C.t2, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 80px 100px', padding: '7px 14px', borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Client Name</span><span>Group</span><span>Status</span><span>Updated</span>
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
            {loadingClients ? <div style={{ padding: 24, textAlign: 'center', color: C.t3, fontSize: 13 }}>Loading...</div> : filteredClients.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: C.t3, fontSize: 13 }}>{search ? `No sites matching "${search}"` : 'No clients yet. Click + Add Client.'}</div> : filteredClients.map((cl, i) => {
              const group = groups.find(g => g.id === cl.groupId)
              return (
                <div key={cl.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 80px 100px', padding: '11px 14px', cursor: 'pointer', alignItems: 'center', borderBottom: i < filteredClients.length - 1 ? `1px solid ${C.border}20` : 'none' }} onClick={() => onOpenSite(cl)} onMouseEnter={e => e.currentTarget.style.background = C.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontWeight: 600, color: C.acc, fontSize: 14 }}>{cl.name}</span>
                  <span onClick={e => { e.stopPropagation(); if (group) setOpenGroup(group) }}>{group ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, background: group.color + '20', color: group.color, padding: '2px 8px', borderRadius: 4, border: `1px solid ${group.color}40`, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.75'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}><span style={{ width: 6, height: 6, borderRadius: '50%', background: group.color, flexShrink: 0 }} />{group.name}</span> : <span style={{ fontSize: 11, color: C.t3 }}>—</span>}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cl.status === 'live' ? C.green : C.amber }}>{cl.status}</span>
                  <span style={{ fontSize: 11, color: C.t3 }}>{new Date(cl.updatedAt).toLocaleDateString()}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Groups List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div><span style={{ fontSize: 20, fontWeight: 800, color: C.t0 }}>{groups.length}</span><span style={{ fontSize: 14, color: C.t2, marginLeft: 6 }}>Groups</span></div>
            <button onClick={() => { setAddingGroup(!addingGroup); setAddingClient(false) }} style={{ padding: '7px 16px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 7, color: C.t2, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Group</button>
          </div>

          {addingGroup && (
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <HomeInp label="Group Name" value={groupName} onChange={setGroupName} placeholder="e.g. Urban Eats Group" />
                <div style={{ flexShrink: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Colour</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="color" value={groupColor} onChange={e => setGroupColor(e.target.value)} style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none', flexShrink: 0 }} />
                    <input value={groupColor} onChange={e => { const v = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setGroupColor(v) }} maxLength={7} placeholder="#FF6B2B" style={{ width: 90, padding: '7px 9px', background: C.input, border: `1px solid ${C.border}`, borderRadius: 7, color: C.t0, fontSize: 12, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = C.acc} onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addGroup} style={{ padding: '8px 18px', background: C.acc, border: 'none', borderRadius: 7, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                <button onClick={() => setAddingGroup(false)} style={{ padding: '8px 14px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 7, color: C.t2, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {loadingGroups ? <div style={{ padding: 24, textAlign: 'center', color: C.t3, fontSize: 13 }}>Loading...</div> : groups.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: C.t3, fontSize: 13 }}>No groups yet. Click + Add Group.</div> : groups.map((g, i) => {
              const siteCount = clients.filter(c => c.groupId === g.id).length
              return (
                <div key={g.id} onClick={() => setOpenGroup(g)} style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < groups.length - 1 ? `1px solid ${C.border}20` : 'none', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = C.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: g.color, flexShrink: 0, boxShadow: `0 0 8px ${g.color}80` }} />
                    <div><div style={{ fontSize: 13, fontWeight: 700, color: C.t0 }}>{g.name}</div><div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>{siteCount} site{siteCount !== 1 ? 's' : ''}</div></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end', maxWidth: 160 }}>
                    {clients.filter(c => c.groupId === g.id).slice(0, 3).map(c => (
                      <span key={c.id} onClick={e => { e.stopPropagation(); onOpenSite(c) }} style={{ fontSize: 11, color: g.color, cursor: 'pointer', background: g.color + '15', padding: '1px 7px', borderRadius: 4, fontWeight: 600, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>{c.name}</span>
                    ))}
                    {clients.filter(c => c.groupId === g.id).length > 3 && <span style={{ fontSize: 10, color: C.t3 }}>+{clients.filter(c => c.groupId === g.id).length - 3} more</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
