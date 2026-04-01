import React from 'react'
import { Container, DDLogo, useMediaQuery } from './Layout'
import { C } from '../theme'

export function TopNav({
  user,
  activeSite,
  globalNav,
  setGlobalNav,
  siteNav,
  setSiteNav,
  closeSite,
  setActiveSite,
  logout,
  globalNavItems,
  getSiteNavItems,
  canManageAll,
  isSuperAdmin,
  isManager
}) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isSmallMobile = useMediaQuery('(max-width: 480px)')

  return (
    <div style={{ minHeight: 52, background: '#0E1420', borderBottom: '1px solid #1E2D4A', flexShrink: 0, width: '100%' }}>
      <Container row height="100%">
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24, flex: 1, minWidth: 0, flexWrap: 'wrap', padding: '8px 0' }}>
          <div
            onClick={() => {
              setActiveSite(null)
              setGlobalNav('home')
              sessionStorage.removeItem('dd_active_site')
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: isMobile ? 0 : 8, cursor: 'pointer' }}>
            <DDLogo size={isMobile ? 24 : 32} />
            {!isSmallMobile && (
              <span style={{ fontWeight: 900, fontSize: isMobile ? 13 : 15, letterSpacing: '-0.03em' }}>
                <span style={{ color: '#F1F5FF' }}>Dine</span>
                <span style={{ color: '#FF6B2B' }}>Desk</span>
              </span>
            )}
          </div>

          {!activeSite && globalNavItems.map(({ key, label }) => (
            <button key={key} onClick={() => setGlobalNav(key)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: globalNav === key ? '#FF6B2B' : '#7A8BAD',
                fontWeight: globalNav === key ? 700 : 400,
                fontSize: isMobile ? 12 : 13, fontFamily: 'inherit',
                borderBottom: globalNav === key ? '2px solid #FF6B2B' : '2px solid transparent',
                padding: isMobile ? '8px 2px' : '14px 4px'
              }}>
              {label}
            </button>
          ))}

          {activeSite && (
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flexWrap: 'wrap' }}>
              <button onClick={closeSite}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A8BAD', fontSize: isMobile ? 11 : 13, fontFamily: 'inherit' }}>
                ← {isMobile ? '' : (canManageAll ? 'All Sites' : 'My Sites')}
              </button>
              {!isMobile && (
                <span style={{
                  color: '#FF6B2B', fontWeight: 700, fontSize: 14,
                  maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>{activeSite.name}</span>
              )}
              <div style={{ display: 'flex', gap: isMobile ? 4 : 8 }}>
                {getSiteNavItems(activeSite).map(({ key, label }) => (
                  <button key={key} onClick={() => setSiteNav(key)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: siteNav === key ? '#FF6B2B' : '#7A8BAD',
                      fontWeight: siteNav === key ? 700 : 400,
                      fontSize: isMobile ? 11 : 13, fontFamily: 'inherit',
                      borderBottom: siteNav === key ? '2px solid #FF6B2B' : '2px solid transparent',
                      padding: isMobile ? '8px 2px' : '14px 4px'
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flexShrink: 0 }}>
          {!isMobile && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#F1F5FF', fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: '#445572' }}>{isSuperAdmin ? 'Super Admin' : isManager ? 'Manager' : 'Client'}</div>
            </div>
          )}
          <div style={{
            width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B2B, #E85A1A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isMobile ? 10 : 12, fontWeight: 800, color: '#fff'
          }}>
            {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
          <button onClick={logout}
            style={{
              padding: isMobile ? '4px 8px' : '6px 14px', background: 'transparent',
              border: '1px solid #1E2D4A', borderRadius: 6,
              color: '#7A8BAD', fontSize: isMobile ? 10 : 12, cursor: 'pointer', fontFamily: 'inherit'
            }}>{isMobile ? 'Exit' : 'Logout'}</button>
        </div>
      </Container>
    </div>
  )
}

export function SiteActionBar({
  activeSite,
  siteNav,
  setSiteNav,
  deployStatus,
  setBuildMenu,
  buildMenu,
  setDeploying,
  setDeployStatus,
  deploying
}) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div style={{
      minHeight: 48, background: '#0A0F1A', borderBottom: `1px solid ${C.border}`,
      flexShrink: 0, position: 'relative', zIndex: 100, width: '100%',
      display: 'flex', alignItems: 'center', padding: isMobile ? '8px 0' : 0
    }}>
      <Container row rowWrap={isMobile} height="100%">
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flex: 1, minWidth: 0 }}>
          <button onClick={() => setSiteNav('dashboard')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0',
              color: siteNav === 'dashboard' ? '#FF6B2B' : '#7A8BAD',
              fontWeight: siteNav === 'dashboard' ? 700 : 500,
              fontSize: 13, fontFamily: 'inherit', transition: 'color 0.15s'
            }}>
            <span style={{ fontSize: 16 }}>🏠</span>{!isMobile && 'Home'}
          </button>
          <div style={{ width: 1, height: 16, background: C.border, margin: '0 4px' }} />
          <span title={activeSite.name} style={{ fontSize: 13, fontWeight: 700, color: '#F1F5FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{activeSite.name}</span>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: activeSite.status === 'live' && activeSite.indexing === 'allowed' ? '#22C55E' : '#F59E0B',
            background: activeSite.status === 'live' && activeSite.indexing === 'allowed' ? '#05201080' : '#1A100080',
            border: `1px solid ${activeSite.status === 'live' && activeSite.indexing === 'allowed' ? '#22C55E40' : '#F59E0B40'}`,
            padding: '2px 8px', borderRadius: 4
          }}>{activeSite.status === 'live' && activeSite.indexing === 'allowed' ? 'Live' : 'Draft'}</span>
          {!isMobile && deployStatus === 'success' && <span style={{ fontSize: 11, color: '#22C55E' }}>Build triggered</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, flexShrink: 0 }}>
          <button type="button" onClick={() => window.open(`http://localhost:3000?site=${activeSite.id}`, '_blank')}
            style={{ height: 32, padding: isMobile ? '0 8px' : '0 14px', background: 'transparent', border: `1px solid #2A3F63`, borderRadius: 6, color: '#7A8BAD', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxSizing: 'border-box' }}>
            {isMobile ? 'View' : 'Preview'}<span style={{ fontSize: 10, lineHeight: 1 }}>↗</span>
          </button>

          <div style={{ position: 'relative' }} onMouseEnter={() => setBuildMenu(true)} onMouseLeave={() => setBuildMenu(false)}>
            <button type="button" onClick={async () => {
              setDeploying(true); setDeployStatus(null)
              try {
                const res = await fetch(`http://localhost:3001/api/clients/${activeSite.id}/deploy`, { method: 'POST', headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') } })
                const data = await res.json(); setDeployStatus(data.success ? 'success' : 'error')
              } catch { setDeployStatus('error') }
              finally { setDeploying(false); setTimeout(() => setDeployStatus(null), 5000) }
            }} disabled={deploying}
              style={{ height: 32, padding: '0 18px', background: deploying ? '#1F2D4A' : '#FF6B2B', border: `1px solid ${deploying ? '#2A3F63' : '#FF6B2B'}`, borderRadius: 7, color: '#fff', fontWeight: 700, fontSize: 12, cursor: deploying ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxSizing: 'border-box', transition: 'all 0.15s' }}>
              {deploying ? 'Building…' : 'Deploy Live'}<span style={{ fontSize: 10, opacity: 0.7, lineHeight: 1 }}>▾</span>
            </button>

            {buildMenu && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 99, background: '#0E1420', border: `1px solid #1E2D4A`, borderRadius: 10, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', minWidth: 210, overflow: 'hidden', animation: 'fadeIn 0.1s ease' }}>
                <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 700, color: '#445572', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #1E2D4A' }}>Publish</div>
                {[
                  {
                    label: 'Deploy Live', hint: 'Trigger a Netlify build',
                    onClick: async () => {
                      setBuildMenu(false); setDeploying(true); setDeployStatus(null)
                      try {
                        const res = await fetch(`http://localhost:3001/api/clients/${activeSite.id}/deploy`, { method: 'POST', headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') } })
                        const data = await res.json(); setDeployStatus(data.success ? 'success' : 'error')
                      } catch { setDeployStatus('error') }
                      finally { setDeploying(false); setTimeout(() => setDeployStatus(null), 5000) }
                    }
                  },
                  { label: 'Preview Site', hint: 'Open local preview in new tab', onClick: () => window.open(`http://localhost:3000?site=${activeSite.id}`, '_blank') },
                  {
                    label: 'View Live Site', hint: 'Open published Netlify site',
                    onClick: async () => {
                      const res = await fetch(`http://localhost:3001/api/clients/${activeSite.id}/config`, { headers: { Authorization: 'Bearer ' + localStorage.getItem('dd_token') } })
                      const cfg = await res.json(); const url = cfg.netlify?.siteUrl
                      if (url) window.open(url, '_blank'); else alert('No live site URL — add it in Config → Netlify Setup')
                    }
                  },
                ].map(({ label, hint, onClick }) => (
                  <div key={label} onClick={onClick} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #1E2D4A15', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#1A2540'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5FF' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#445572', marginTop: 2 }}>{hint}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}
