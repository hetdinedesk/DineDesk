import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAnalytics } from '../api/analytics'
import { getMenuItems } from '../api/menuItems'
import { getPages } from '../api/pages'
import { getSpecials } from '../api/specials'
import { C } from '../theme'
import { useMediaQuery } from '../Components/Layout'

const DASH_NAV = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'analytics', label: 'Analytics', icon: '📈' },
  { key: 'engagements', label: 'Engagements', icon: '👆' },
  { key: 'content', label: 'Content', icon: '📝' },
  { key: 'traffic', label: 'Traffic', icon: '🔄' },
  { key: 'report', label: 'Report', icon: '📋' },
]

export default function DashboardSection({ clientId }) {
  const [subNav, setSubNav] = useState('analytics')
  const [period, setPeriod] = useState('M')
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>

      {/* Sidebar nav */}
      <div style={{
        width: isMobile ? '100%' : 160,
        minWidth: isMobile ? '100%' : 160,
        background: C.panel,
        borderRight: isMobile ? 'none' : `1px solid ${C.border}`,
        borderBottom: isMobile ? `1px solid ${C.border}` : 'none',
        display: 'flex',
        flexDirection: isMobile ? 'row' : 'column',
        overflowX: isMobile ? 'auto' : 'visible',
        flexShrink: 0
      }}>
        {DASH_NAV.map(item => (
          <button key={item.key} onClick={() => setSubNav(item.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: isMobile ? 'auto' : '100%',
              padding: isMobile ? '12px 16px' : '9px 14px',
              border: 'none',
              background: subNav === item.key ? C.active : 'transparent',
              color: subNav === item.key ? C.t0 : C.t2,
              fontWeight: subNav === item.key ? 700 : 400, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              borderLeft: isMobile ? 'none' : `2px solid ${subNav === item.key ? C.acc : 'transparent'}`,
              borderBottom: isMobile ? `2px solid ${subNav === item.key ? C.acc : 'transparent'}` : 'none',
              whiteSpace: 'nowrap'
            }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>{!isMobile && item.label}
          </button>
        ))}
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, padding: isMobile ? '16px' : '28px 32px', overflowY: 'auto', background: C.page }}>
        {subNav === 'analytics' && (
          <AnalyticsTab clientId={clientId} period={period} setPeriod={setPeriod}/>
        )}
        {subNav === 'overview' && (
          <OverviewTab clientId={clientId} period={period}/>
        )}
        {!['analytics','overview'].includes(subNav) && (
          <PlaceholderTab label={DASH_NAV.find(d => d.key===subNav)?.label}/>
        )}
      </div>
    </div>
  )
}

// ── Analytics Tab ────────────────────────────────────────────
function AnalyticsTab({ clientId, period, setPeriod }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', clientId, period],
    queryFn:  () => getAnalytics(clientId, period),
    staleTime: 1000 * 60 * 5  // cache 5 minutes
  })

  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:17, fontWeight:700, color:C.t0 }}>Visitors</h2>

      {/* Period selector — matching prototype exactly */}
      <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:20,
        padding:'14px 18px', background:C.panel, borderRadius:10, border:`1px solid ${C.border}` }}>
        <span style={{ fontSize:13, color:C.t2 }}>Choose the Most Recent</span>
        <div style={{ display:'flex', gap:0 }}>
          {['W','M','Y'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding:'5px 14px', border:`1px solid ${C.border2}`,
                background: period===p ? C.acc : 'transparent',
                color: period===p ? '#fff' : C.t2,
                fontSize:13, fontWeight: period===p ? 700 : 400,
                cursor:'pointer', fontFamily:'inherit',
                borderRadius: p==='W' ? '6px 0 0 6px' : p==='Y' ? '0 6px 6px 0' : '0' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ background:C.panel, border:`1px solid ${C.border}`,
              borderRadius:10, padding:32, textAlign:'center' }}>
              <div style={{ fontSize:52, fontWeight:800, color:C.border2 }}>...</div>
              <div style={{ fontSize:13, color:C.t3, marginTop:4 }}>Loading...</div>
            </div>
          ))}
        </div>
      )}

      {/* Error / not configured state */}
      {!isLoading && data?.error && (
        <div style={{ background:'#1A0A00', border:`1px solid ${C.amber}40`,
          borderRadius:10, padding:'20px 24px', marginBottom:20,
          fontSize:14, color:C.amber }}>
          ⚠️ {data.error}
        </div>
      )}

      {/* Real data */}
      {!isLoading && data && !data.error && (
        <>
          {/* 4 metric cards — matching prototype layout */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
            {[
              [data.uniqueVisitors, 'Unique Visitors'],
              [data.pageviews,      'Total Pageviews'],
              [data.bounceRate,     'Bounce Rate'],
              [data.avgDuration,    'Avg Visit Duration'],
            ].map(([value, label]) => (
              <div key={label} style={{ background:C.panel, border:`1px solid ${C.border}`,
                borderRadius:10, padding:32, textAlign:'center' }}>
                <div style={{ fontSize:52, fontWeight:800, color:C.t0, lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:13, color:C.acc, fontWeight:600, marginTop:8 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Pageviews line chart */}
          <div style={{ background:C.panel, border:`1px solid ${C.border}`,
            borderRadius:10, padding:'20px 24px' }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:16 }}>
              <span style={{ fontSize:32, fontWeight:800, color:C.t0 }}>{data.pageviews}</span>
              <span style={{ fontSize:14, color:C.t2 }}>Website Pageviews</span>
            </div>
            <MiniChart data={data.chartData || []} color={C.acc} height={160}/>
            {/* X-axis date labels */}
            <div style={{ display:'flex', justifyContent:'space-between',
              fontSize:10, color:C.t3, marginTop:6, overflow:'hidden' }}>
              {(data.chartData || []).filter((_,i,a) => i===0 || i===Math.floor(a.length/2) || i===a.length-1)
                .map(d => <span key={d.date}>{d.date.slice(4,6)}/{d.date.slice(6,8)}</span>)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── SVG Line Chart ────────────────────────────────────────────
function MiniChart({ data, color, height }) {
  if (!data || data.length === 0) {
    return <div style={{ height, background:C.card, borderRadius:8,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:C.t3, fontSize:13 }}>No chart data yet</div>
  }
  const values = data.map(d => d.views)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100
    const y = height - ((v - min) / (max - min || 1)) * (height - 8) - 4
    return x + ',' + y
  }).join(' ')
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none"
      style={{ width:'100%', height }}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} 100,${height}`} fill="url(#cg)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
    </svg>
  )
}

// ── Overview Tab ─────────────────────────────────────────────
function OverviewTab({ clientId, period }) {
  const { data: analytics } = useQuery({
    queryKey: ['analytics', clientId, period],
    queryFn:  () => getAnalytics(clientId, period),
    staleTime: 1000 * 60 * 5
  })
  const { data: items    = [] } = useQuery({ queryKey:['menu-items',clientId],  queryFn:() => getMenuItems(clientId)  })
  const { data: pages    = [] } = useQuery({ queryKey:['pages',clientId],       queryFn:() => getPages(clientId)      })
  const { data: specials = [] } = useQuery({ queryKey:['specials',clientId],    queryFn:() => getSpecials(clientId)   })

  const metrics = [
    { label:'Menu Items',            value: items.length,                  icon:'🍽️' },
    { label:'Pages',                  value: pages.length,                  icon:'📄' },
    { label:'Specials',               value: specials.length,               icon:'⭐', color: C.acc },
    { label:'Unique Visitors',        value: analytics?.uniqueVisitors || '—', icon:'👥' },
    { label:'Pageviews',              value: analytics?.pageviews || '—',      icon:'📊' },
    { label:'Bounce Rate',            value: analytics?.bounceRate || '—',    icon:'↩️', color: C.amber },
  ]

  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:17, fontWeight:700, color:C.t0 }}>Overview</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background:C.panel, border:`1px solid ${C.border}`,
            borderRadius:10, padding:'16px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase',
                  letterSpacing:'0.05em', marginBottom:8 }}>{m.label}</div>
                <div style={{ fontSize:28, fontWeight:800, color:m.color || C.t0, lineHeight:1 }}>
                  {m.value}
                </div>
              </div>
              <span style={{ fontSize:24, opacity:0.7 }}>{m.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pages status list */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'13px 18px', borderBottom:`1px solid ${C.border}`,
            fontSize:13, fontWeight:700, color:C.t0 }}>Pages Status</div>
          <div style={{ padding:18 }}>
            {pages.slice(0,6).map((pg,i) => (
              <div key={pg.id} style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', padding:'8px 0',
                borderBottom: i<Math.min(pages.length,6)-1 ? `1px solid ${C.border}20` : 'none' }}>
                <span style={{ fontSize:13, color:C.t0 }}>{pg.title || pg.slug}</span>
                <span style={{ background: pg.status==='published' ? '#052010' : '#1A1000',
                  color: pg.status==='published' ? C.green : C.amber,
                  padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:700 }}>
                  {pg.status}
                </span>
              </div>
            ))}
            {pages.length===0 && <div style={{ fontSize:13, color:C.t3 }}>No pages yet.</div>}
          </div>
        </div>

        {/* Specials list */}
        <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'13px 18px', borderBottom:`1px solid ${C.border}`,
            fontSize:13, fontWeight:700, color:C.t0 }}>Recent Specials</div>
          <div style={{ padding:18 }}>
            {specials.map((s,i) => (
              <div key={s.id} style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', padding:'8px 0',
                borderBottom: i<specials.length-1 ? `1px solid ${C.border}20` : 'none' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.t0 }}>{s.title}</div>
                </div>
                <span style={{ fontSize:13, color:C.amber, fontFamily:'monospace', fontWeight:700 }}>
                  {s.price ? `$${s.price}` : '—'}
                </span>
              </div>
            ))}
            {specials.length===0 && <div style={{ fontSize:13, color:C.t3 }}>No specials yet.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Placeholder for other tabs ────────────────────────────────
function PlaceholderTab({ label }) {
  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:17, fontWeight:700, color:C.t0 }}>{label}</h2>
      <div style={{ background:C.card, borderLeft:'3px solid #00D4FF', padding:'9px 14px',
        borderRadius:'0 7px 7px 0', fontSize:12, color:C.t2, marginBottom:20 }}>
        This section shows {label} data from your connected analytics integrations.
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[['Coming Soon','—','🔄'],['Connect Analytics','→','⚙️'],['GA4 Required','Setup','📊']].map(([lbl,val,icon]) => (
          <div key={lbl} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px 20px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.t3, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>{lbl}</div>
            <div style={{ fontSize:28, fontWeight:800, color:C.t0 }}>{val} <span style={{fontSize:18}}>{icon}</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}