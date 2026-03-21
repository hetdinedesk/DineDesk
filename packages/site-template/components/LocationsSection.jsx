export default function LocationsSection({ data={}, booking={}, dark=false }) {
  const locations = data.client?.locations || []
  if (locations.length === 0) return null
  const bookUrl = booking.bookingUrl || '#book'
  const bg = dark ? '#060606' : '#fff'
  const cardBg = dark ? '#111' : '#fff'
  const textC = dark ? '#fff' : 'var(--color-text,#1A1A1A)'

  return (
    <section id="locations" style={{ padding:'80px 64px', background:bg }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:11,fontWeight:800,color:'var(--color-primary)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:8 }}>Find Us</div>
          <h2 style={{ fontFamily:'Georgia,serif',fontSize:36,fontWeight:900,color:textC }}>Our Locations</h2>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:24 }}>
          {locations.map(function(loc) { return (
            <div key={loc.id} style={{ background:cardBg,border:dark?'1px solid #2A2A2A':'1px solid #E8E0D4',
              borderRadius:14,overflow:'hidden' }}>
              <div style={{ padding:'20px 22px 0' }}>
                <div style={{ fontFamily:'Georgia,serif',fontSize:19,fontWeight:700,color:textC,marginBottom:14 }}>{loc.name}</div>
                <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:16 }}>
                  {loc.address && <div style={{ display:'flex',gap:8,fontSize:13.5,color:dark?'#888':'#5C5C5C' }}><span>📍</span><span>{loc.address}</span></div>}
                  {loc.phone   && <div style={{ display:'flex',gap:8,fontSize:13.5,color:dark?'#888':'#5C5C5C' }}><span>📞</span><a href={`tel:${loc.phone}`} style={{color:'var(--color-primary)',textDecoration:'none',fontWeight:600}}>{loc.phone}</a></div>}
                  {loc.hours   && <div style={{ display:'flex',gap:8,fontSize:13.5,color:dark?'#888':'#5C5C5C' }}><span>🕐</span><span>{typeof loc.hours==='string'?loc.hours:JSON.stringify(loc.hours)}</span></div>}
                </div>
              </div>
              <div style={{ padding:'0 22px 20px',display:'flex',gap:10 }}>
                <a href={bookUrl} style={{ flex:1,padding:'9px',borderRadius:8,background:'var(--color-primary)',
                  color:'#fff',fontWeight:700,fontSize:13,textDecoration:'none',textAlign:'center' }}>
                  {booking.bookLabel || 'Book'}
                </a>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(loc.address||loc.name)}`}
                  target="_blank" rel="noreferrer"
                  style={{ flex:1,padding:'9px',borderRadius:8,
                    background:dark?'#1A1A1A':'#F7F2EA',color:dark?'#999':'#5C5C5C',
                    fontWeight:600,fontSize:13,textDecoration:'none',textAlign:'center',
                    border:dark?'1px solid #2A2A2A':'1px solid #E8E0D4' }}>
                  Directions
                </a>
              </div>
            </div>
          )})}
        </div>
      </div>
    </section>
  )
}