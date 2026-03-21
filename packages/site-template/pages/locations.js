import Head from 'next/head'
import { getSiteData } from '../lib/api'
import UtilityBelt      from '../components/UtilityBelt'
import SiteHeader       from '../components/SiteHeader'
import Navbar           from '../components/Navbar'
import SiteFooter       from '../components/SiteFooter'

export async function getStaticProps() {
  const data = await getSiteData()
  return {
    props:      { data, colours: data.colours || null },
    revalidate: 60
  }
}

export default function LocationsPage({ data }) {
  const { settings={}, booking={} } = data
  const locations = data.client?.locations || []
  const name      = settings.restaurantName || data.client?.name || 'Our Restaurant'
  const bookUrl   = booking.bookingUrl || '#book'

  return (
    <>
      <Head>
        <title>Locations — {name}</title>
        <meta name="description" content={`Find ${name} near you`}/>
      </Head>

      <UtilityBelt settings={settings} booking={booking} data={data}/>
      <SiteHeader  settings={settings} booking={booking} data={data}/>
      <Navbar      settings={settings} booking={booking}/>

      <main style={{ maxWidth:960, margin:'0 auto', padding:'56px 32px' }}>
        <h1 style={{ fontFamily:'Georgia,serif', fontSize:40, fontWeight:900,
          color:'var(--color-text,#1A1A1A)', marginBottom:8 }}>Our Locations</h1>
        <p style={{ fontSize:15, color:'#888', marginBottom:48 }}>
          Come visit us — we would love to see you
        </p>

        {locations.length === 0 && (
          <p style={{ color:'#888' }}>Location details coming soon.</p>
        )}

        <div style={{ display:'grid',
          gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:24 }}>
          {locations.map(loc => (
            <div key={loc.id} style={{ background:'#fff', border:'1px solid #E8E0D4',
              borderRadius:14, overflow:'hidden',
              boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>

              {/* Map placeholder */}
              <div style={{ height:140, background:'linear-gradient(135deg,#E8F0E8,#D0E0D0)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:40, color:'#888' }}>📍</div>

              <div style={{ padding:24 }}>
                <h2 style={{ fontFamily:'Georgia,serif', fontSize:20, fontWeight:700,
                  color:'var(--color-primary)', marginBottom:16 }}>{loc.name}</h2>

                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
                  {loc.address && (
                    <div style={{ display:'flex', gap:10, fontSize:14, color:'#555' }}>
                      <span>📍</span><span>{loc.address}</span>
                    </div>
                  )}
                  {loc.phone && (
                    <div style={{ display:'flex', gap:10, fontSize:14, color:'#555' }}>
                      <span>📞</span>
                      <a href={`tel:${loc.phone}`}
                        style={{ color:'var(--color-primary)', fontWeight:600,
                          textDecoration:'none' }}>{loc.phone}</a>
                    </div>
                  )}
                  {loc.hours && (
                    <div style={{ display:'flex', gap:10, fontSize:14, color:'#555' }}>
                      <span>🕐</span>
                      <span>{typeof loc.hours === 'string'
                        ? loc.hours : JSON.stringify(loc.hours)}</span>
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <a href={bookUrl}
                    style={{ flex:1, padding:'10px', borderRadius:8, textAlign:'center',
                      background:'var(--color-primary)', color:'#fff',
                      fontWeight:700, fontSize:13, textDecoration:'none' }}>
                    {booking.bookLabel || 'Book a Table'}
                  </a>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(loc.address || loc.name)}`}
                    target="_blank" rel="noreferrer"
                    style={{ flex:1, padding:'10px', borderRadius:8, textAlign:'center',
                      background:'#F7F2EA', color:'#555', fontWeight:600,
                      fontSize:13, textDecoration:'none',
                      border:'1px solid #E8E0D4' }}>
                    Get Directions
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter settings={settings} data={data}/>
    </>
  )
}