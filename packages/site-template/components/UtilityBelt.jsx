export default function UtilityBelt({ settings={}, booking={}, data={} }) {
  const header       = data.header       || {}
  const reviews      = data.reviews      || {}
  const utilityItems = header.utilityItems || {}
  const bookUrl      = booking.bookingUrl || '#book'

  // Don't render if utility belt is disabled in header config
  if (header.utilityBelt === false) return null

  return (
    <div style={{ background:'var(--color-nav-bg, #1C2B1A)',
      color:'rgba(255,255,255,0.75)', fontSize:12.5, fontWeight:500,
      padding:'0 32px', height:40, display:'flex', alignItems:'center',
      justifyContent:'space-between', position:'sticky', top:0, zIndex:300 }}>

      {/* Left — address, phone, hours */}
      <div style={{ display:'flex', alignItems:'center', gap:20 }}>
        {settings.address && (
          <span style={{ display:'flex', alignItems:'center', gap:6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {settings.address}
          </span>
        )}
        {settings.phone && (
          <a href={`tel:${settings.phone}`}
            style={{ color:'inherit', textDecoration:'none',
              display:'flex', alignItems:'center', gap:6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {settings.phone}
          </a>
        )}
        {settings.openingHours && (
          <span style={{ display:'flex', alignItems:'center', gap:6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {settings.openingHours}
          </span>
        )}
      </div>

      {/* Right — reviews, order, book */}
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        {utilityItems.reviews !== false && reviews.overallScore && (
          <a href="#reviews" style={{ color:'rgba(255,255,255,0.7)',
            textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ color:'#F5A623' }}>★</span>
            {reviews.overallScore}
            {reviews.totalReviews && ` (${reviews.totalReviews} reviews)`}
          </a>
        )}
        {booking.orderUrl && (
          <a href={booking.orderUrl}
            style={{ color:'rgba(255,255,255,0.7)', textDecoration:'none' }}>
            {booking.orderLabel || 'Order Online'}
          </a>
        )}
        <a href={bookUrl}
          style={{ background:'var(--color-cta-bg, #C8823A)',
            color:'var(--color-cta-text, #fff)',
            padding:'4px 14px', borderRadius:20,
            fontWeight:700, fontSize:12, textDecoration:'none' }}>
          {booking.bookLabel || 'Book a Table'}
        </a>
      </div>
    </div>
  )
}