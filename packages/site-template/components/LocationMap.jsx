import { getActiveLocations } from '../lib/locations.js'

export default function LocationMap({ data = {}, height = 600 }) {
  const locations = getActiveLocations(data)
  if (locations.length === 0) return null

  // Simple Google Maps embed with multiple markers (use My Maps or JS API for production)
  const markers = locations.map(loc => 
    loc.lat && loc.lng 
      ? `|${loc.lat},${loc.lng}`
      : ''
  ).filter(Boolean).join('')

  const mapUrl = markers 
    ? `https://www.google.com/maps/embed/v1/directions?key=YOUR_GOOGLE_API_KEY&origin=${locations[0].lat},${locations[0].lng}&destination=${markers.substring(1)}&mode=walking`
    : `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_API_KEY&q=${encodeURIComponent(locations[0].address)}`

  return (
    <section style={{ padding: '60px 0', background: 'var(--color-section-bg, #f8f9fa)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary, #C8823A)',
            letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
            Our Locations
          </div>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 36,
            fontWeight: 900, color: 'var(--color-heading, #1A1A1A)' }}>
            Find Us On The Map
          </h2>
        </div>
        <div style={{ height, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0, display: 'block' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade">
          </iframe>
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ color: 'var(--color-body-text, #666)', fontSize: 14 }}>
            Click locations for directions. Call to book a table.
          </p>
        </div>
      </div>
    </section>
  )
}
