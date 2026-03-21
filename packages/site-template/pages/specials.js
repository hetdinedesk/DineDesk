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

export default function SpecialsPage({ data }) {
  const { settings={}, booking={}, specials=[] } = data
  const name    = settings.restaurantName || data.client?.name || 'Our Restaurant'
  const bookUrl = booking.bookingUrl || '#book'

  return (
    <>
      <Head>
        <title>Specials — {name}</title>
        <meta name="description" content={`Current specials and events at ${name}`}/>
      </Head>

      <UtilityBelt settings={settings} booking={booking} data={data}/>
      <SiteHeader  settings={settings} booking={booking} data={data}/>
      <Navbar      settings={settings} booking={booking}/>

      <main style={{ maxWidth:960, margin:'0 auto', padding:'56px 32px' }}>
        <h1 style={{ fontFamily:'Georgia,serif', fontSize:40, fontWeight:900,
          color:'var(--color-text,#1A1A1A)', marginBottom:8 }}>Specials &amp; Events</h1>
        <p style={{ fontSize:15, color:'#888', marginBottom:48 }}>
          Limited time offers — don&apos;t miss out
        </p>

        {specials.length === 0 && (
          <p style={{ color:'#888' }}>No current specials. Check back soon!</p>
        )}

        <div style={{ display:'grid',
          gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:24 }}>
          {specials.map((s, i) => (
            <div key={s.id} style={{ borderRadius:14, overflow:'hidden',
              background: i % 2 === 0
                ? 'var(--color-secondary,#1C2B1A)'
                : 'var(--color-primary)',
              position:'relative', minHeight:220,
              display:'flex', flexDirection:'column', justifyContent:'flex-end',
              padding:28, transition:'transform 0.2s' }}>
              {s.imageUrl && (
                <img src={s.imageUrl} alt={s.title}
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%',
                    objectFit:'cover', opacity:0.25 }}/>
              )}
              <div style={{ position:'relative', zIndex:1 }}>
                <span style={{ display:'inline-block', background:'rgba(255,255,255,0.2)',
                  color:'#fff', fontSize:10, fontWeight:800, padding:'3px 10px',
                  borderRadius:20, letterSpacing:'0.08em', textTransform:'uppercase',
                  marginBottom:8 }}>Special</span>
                <div style={{ fontFamily:'Georgia,serif', fontSize:22, fontWeight:700,
                  color:'#fff', marginBottom:8 }}>{s.title}</div>
                {s.price && (
                  <div style={{ fontSize:28, fontWeight:800, color:'#fff' }}>
                    ${s.price}
                  </div>
                )}
                {s.description && (
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)',
                    marginTop:8, lineHeight:1.5 }}>{s.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {specials.length > 0 && (
          <div style={{ textAlign:'center', marginTop:48 }}>
            <a href={bookUrl}
              style={{ display:'inline-block', background:'var(--color-primary)',
                color:'#fff', padding:'14px 32px', borderRadius:10,
                fontWeight:700, fontSize:15, textDecoration:'none' }}>
              {booking.bookLabel || 'Book a Table'}
            </a>
          </div>
        )}
      </main>

      <SiteFooter settings={settings} data={data}/>
    </>
  )
}