export default function Navbar({ settings={}, booking={}, data={} }) {
  const header     = data.header || {}
  const pages      = data.pages  || []
  const bookUrl    = booking.bookingUrl || '#book'
  const utilityOn  = header.utilityBelt !== false
  const headerType = header.type || 'standard-full'
  const topOffset  = utilityOn ? 40 + 80 : 80

  // Minimal header handles its own nav — no separate navbar
  if (headerType === 'minimal') return null

  // Build nav links — use published pages + defaults
  const pageLinks = pages.filter(p => p.status === 'published').map(p => ({
    label: p.title,
    href:  `/${p.slug}`
  }))

  const defaultLinks = [
    { label:'Home',      href:'/'          },
    { label:'Menu',      href:'/menu'      },
    { label:'Book',      href:bookUrl      },
    { label:'Specials',  href:'/specials'  },
    { label:'Locations', href:'/locations' },
    { label:'Reviews',   href:'#reviews'   },
    { label:'Contact',   href:'/contact'   },
  ]

  const navLinks = pageLinks.length > 0 ? pageLinks : defaultLinks

  return (
    <nav style={{ background:'var(--color-nav-bg, #1C2B1A)', padding:'0 32px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      height:48, position:'sticky', top: topOffset, zIndex:190 }}>

      <div style={{ display:'flex', alignItems:'center', gap:2 }}>
        {navLinks.map(({ label, href }) => (
          <a key={label} href={href}
            style={{ color:'var(--color-nav-text, rgba(255,255,255,0.75))',
              fontSize:13.5, fontWeight:600, padding:'6px 14px',
              borderRadius:6, textDecoration:'none',
              transition:'background 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            {label}
          </a>
        ))}
      </div>

      {/* Search */}
      <div style={{ display:'flex', alignItems:'center', gap:8,
        background:'rgba(255,255,255,0.1)',
        border:'1px solid rgba(255,255,255,0.15)',
        borderRadius:8, padding:'6px 14px', width:200 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.5)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" placeholder="Search..."
          style={{ background:'none', border:'none', outline:'none',
            color:'var(--color-nav-text, #fff)',
            fontSize:13, fontFamily:'inherit', width:'100%' }}/>
      </div>
    </nav>
  )
}