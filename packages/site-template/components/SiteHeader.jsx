export default function SiteHeader({ settings={}, booking={}, data={} }) {
  const header      = data.header     || {}
  const headerCtas  = data.headerCtas || []
  const colours     = data.colours    || {}
  const name        = settings.displayName || settings.restaurantName || data.client?.name || 'Our Restaurant'
  const bookUrl     = booking.bookingUrl || '#book'
  const headerType  = header.type || 'standard-full'
  const isSticky    = headerType === 'sticky'
  const utilityOn   = header.utilityBelt !== false
  const topOffset   = utilityOn ? 40 : 0

  const renderCta = (cta, i) => {
    const href = cta.type === 'internal' ? cta.value
      : cta.type === 'phone'    ? `tel:${cta.value}`
      : cta.type === 'email'    ? `mailto:${cta.value}`
      : cta.value

    const variantStyle = {
      primary: {
        background: 'var(--color-cta-bg, #C8823A)',
        color:      'var(--color-cta-text, #fff)',
        border:     'none',
      },
      secondary: {
        background: 'var(--color-secondary, #1C2B1A)',
        color:      '#fff',
        border:     'none',
      },
      outline: {
        background: 'transparent',
        color:      'var(--color-header-text, #1A1A1A)',
        border:     '2px solid var(--color-cta-bg, #C8823A)',
      },
      text: {
        background: 'transparent',
        color:      'var(--color-cta-bg, #C8823A)',
        border:     'none',
        padding:    '0',
      },
    }[cta.variant || 'primary']

    return (
      <a key={cta.id || i} href={href}
        style={{ ...variantStyle, padding: variantStyle.padding || '10px 20px',
          borderRadius:8, fontWeight:700, fontSize:14,
          textDecoration:'none', display:'inline-block',
          transition:'opacity 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity='1'}>
        {cta.label}
      </a>
    )
  }

  // Minimal header — logo + hamburger only
  if (headerType === 'minimal') {
    return (
      <header style={{ background:'var(--color-header-bg, #fff)',
        borderBottom:'1px solid #E8E0D4',
        padding:'0 32px', height:70, display:'flex', alignItems:'center',
        justifyContent:'space-between',
        position: isSticky ? 'sticky' : 'relative',
        top: isSticky ? topOffset : 'auto', zIndex:200 }}>
        <HeaderLogo name={name} data={data} settings={settings}/>
        <button style={{ background:'none', border:'none', cursor:'pointer',
          display:'flex', flexDirection:'column', gap:5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:24, height:2,
              background:'var(--color-header-text, #1A1A1A)',
              borderRadius:2 }}/>
          ))}
        </button>
      </header>
    )
  }

  // Split header — logo centre, nav both sides
  if (headerType === 'split') {
    const activeCtas = headerCtas.filter(c => c.active !== false)
    return (
      <header style={{ background:'var(--color-header-bg, #fff)',
        borderBottom:'1px solid #E8E0D4',
        padding:'0 32px', height:80, display:'grid',
        gridTemplateColumns:'1fr auto 1fr', alignItems:'center',
        position: isSticky ? 'sticky' : 'relative',
        top: isSticky ? topOffset : 'auto', zIndex:200 }}>
        <div style={{ display:'flex', gap:12 }}>
          {activeCtas.slice(0, Math.floor(activeCtas.length/2)).map(renderCta)}
        </div>
        <HeaderLogo name={name} data={data} settings={settings} centre/>
        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          {activeCtas.slice(Math.floor(activeCtas.length/2)).map(renderCta)}
        </div>
      </header>
    )
  }

  // Standard Full / Sticky — default
  return (
    <header style={{ background:'var(--color-header-bg, #fff)',
      borderBottom:'1px solid rgba(0,0,0,0.06)',
      padding:'0 32px', height:80, display:'flex', alignItems:'center',
      justifyContent:'space-between',
      position: isSticky ? 'sticky' : 'relative',
      top: isSticky ? topOffset : 'auto', zIndex:200,
      boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>

      <HeaderLogo name={name} data={data} settings={settings}/>

      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {headerCtas.filter(c => c.active !== false).length > 0
          ? headerCtas.filter(c => c.active !== false).map(renderCta)
          : (
            <>
              {booking.orderUrl && (
                <a href={booking.orderUrl}
                  style={{ background:'var(--color-secondary, #1A1A1A)',
                    color:'#fff', padding:'11px 20px', borderRadius:8,
                    fontWeight:600, fontSize:14, textDecoration:'none' }}>
                  {booking.orderLabel || 'Order Online'}
                </a>
              )}
              <a href={bookUrl}
                style={{ background:'var(--color-cta-bg, #C8823A)',
                  color:'var(--color-cta-text, #fff)', padding:'11px 24px',
                  borderRadius:8, fontWeight:700, fontSize:14,
                  textDecoration:'none' }}>
                {booking.bookLabel || 'Book a Table'}
              </a>
            </>
          )
        }
      </div>
    </header>
  )
}

function HeaderLogo({ name, data, settings, centre=false }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14,
      justifyContent: centre ? 'center' : 'flex-start' }}>
      <div style={{ width:52, height:52, background:'var(--color-primary)',
        borderRadius:14, display:'flex', alignItems:'center',
        justifyContent:'center', overflow:'hidden',
        boxShadow:'0 4px 12px rgba(0,0,0,0.15)', flexShrink:0 }}>
        {settings.logoLight
          ? <img src={settings.logoLight} alt={name}
              style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
          : <span style={{ fontSize:22 }}>🍽️</span>
        }
      </div>
      <div>
        <div style={{ fontFamily:'Georgia,serif', fontSize:22, fontWeight:900,
          color:'var(--color-header-text, #1A1A1A)',
          lineHeight:1.1, letterSpacing:'-0.02em' }}>
          {settings.displayName || name}
        </div>
        {settings.suburb && (
          <div style={{ fontSize:11, color:'rgba(0,0,0,0.4)', fontWeight:500,
            letterSpacing:'0.1em', textTransform:'uppercase', marginTop:2 }}>
            {settings.suburb}
          </div>
        )}
      </div>
    </div>
  )
}