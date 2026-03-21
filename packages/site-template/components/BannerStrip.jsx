export default function BannerStrip({ banners=[], booking={} }) {
  if (banners.length === 0) return null

  const bookUrl = booking.bookingUrl || '#book'

  return (
    <div style={{ background:'var(--color-primary)', padding:'0 32px',
      height:52, display:'flex', alignItems:'center',
      overflow:'hidden', gap:0 }}>

      {/* Banner items */}
      {banners.map(function(b, i) {
        return (
          <div key={b.id} style={{ display:'flex', alignItems:'center', gap:10,
            padding:'0 28px', height:'100%', color:'#fff',
            fontSize:13.5, fontWeight:600, flexShrink:0,
            borderRight: i < banners.length - 1
              ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
            <span style={{ width:6, height:6, borderRadius:'50%',
              background:'rgba(255,255,255,0.6)',
              display:'inline-block', flexShrink:0 }}/>
            {b.text}
          </div>
        )
      })}

      {/* Book Now CTA on the right */}
      <a href={bookUrl}
        style={{ marginLeft:'auto', background:'rgba(255,255,255,0.2)',
          color:'#fff', padding:'7px 20px', borderRadius:20,
          fontSize:13, fontWeight:700, textDecoration:'none',
          flexShrink:0, whiteSpace:'nowrap' }}>
        {booking.bookLabel || 'Book Now'} →
      </a>
    </div>
  )
}