import { replaceShortcodes } from '../lib/shortcodes'

export default function LocationsSection({ data={}, booking={} }) {
  const locations  = data.client?.locations || []
  if (locations.length === 0) return null

  const colours    = data.colours    || {}
  const shortcodes = data.shortcodes || {}
  const sc         = (text) => replaceShortcodes(text || '', shortcodes)

  const bookUrl    = booking.bookingUrl
    || (booking.bookingPhone ? `tel:${booking.bookingPhone}` : '#book')
  const orderUrl   = booking.orderUrl
    || booking.uberEatsUrl
    || booking.doorDashUrl
    || booking.menulogUrl

  const primaryCol = colours.primary  || '#C8823A'
  const bodyBg     = colours.bodyBg   || '#fff'
  const accentBg   = colours.accentBg || '#F7F2EA'
  const bodyText   = colours.bodyText || '#1A1A1A'
  const ctaBg      = colours.ctaBg    || primaryCol
  const ctaText    = colours.ctaText  || '#fff'

  const formatHours = (hours) => {
    if (!hours) return null
    if (typeof hours === 'string') return hours
    return Object.entries(hours).map(([d,t]) => `${d}: ${t}`).join(' · ')
  }

  return (
    <section id="locations" style={{ padding:'80px 64px', background:bodyBg }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:800, color:primaryCol,
            letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>
            Find Us
          </div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:36,
            fontWeight:900, color:bodyText }}>
            Our Locations
          </h2>
        </div>

        <div style={{ display:'grid',
          gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',
          gap:24 }}>
          {locations.map(loc => {
            const hours = formatHours(loc.hours)
            return (
              <div key={loc.id}
                style={{ background:'#fff', border:'1px solid #E8E0D4',
                  borderRadius:14, overflow:'hidden',
                  boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ padding:'20px 22px 0' }}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:19,
                    fontWeight:700, color:bodyText, marginBottom:14 }}>
                    {sc(loc.name)}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column',
                    gap:10, marginBottom:16 }}>
                    {loc.address && (
                      <div style={{ display:'flex', gap:10,
                        fontSize:13.5, color:'#5C5C5C', alignItems:'flex-start' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24"
                          fill="none" stroke={primaryCol} strokeWidth="2"
                          style={{ flexShrink:0, marginTop:2 }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>{sc(loc.address)}</span>
                      </div>
                    )}
                    {loc.phone && (
                      <div style={{ display:'flex', gap:10,
                        fontSize:13.5, alignItems:'center' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24"
                          fill="none" stroke={primaryCol} strokeWidth="2"
                          style={{ flexShrink:0 }}>
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        <a href={`tel:${loc.phone}`}
                          style={{ color:primaryCol,
                            textDecoration:'none', fontWeight:600 }}>
                          {loc.phone}
                        </a>
                      </div>
                    )}
                    {hours && (
                      <div style={{ display:'flex', gap:10,
                        fontSize:13.5, color:'#5C5C5C', alignItems:'flex-start' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24"
                          fill="none" stroke={primaryCol} strokeWidth="2"
                          style={{ flexShrink:0, marginTop:2 }}>
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>{hours}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ padding:'0 22px 20px', display:'flex', gap:10 }}>
                  {/* Book button — controlled by showOnLocations */}
                  {booking.showOnLocations !== false && (
                    <a href={bookUrl}
                      style={{ flex:1, padding:'10px', borderRadius:8,
                        background:ctaBg, color:ctaText, fontWeight:700,
                        fontSize:13, textDecoration:'none', textAlign:'center',
                        transition:'opacity 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
                      onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                      {booking.bookLabel || 'Book a Table'}
                    </a>
                  )}
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(loc.address || loc.name)}`}
                    target="_blank" rel="noreferrer"
                    style={{ flex:1, padding:'10px', borderRadius:8,
                      background:accentBg, color:'#5C5C5C', fontWeight:600,
                      fontSize:13, textDecoration:'none', textAlign:'center',
                      border:'1px solid #E8E0D4', transition:'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#EDE8E0'}
                    onMouseLeave={e => e.currentTarget.style.background=accentBg}>
                    Get Directions
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}