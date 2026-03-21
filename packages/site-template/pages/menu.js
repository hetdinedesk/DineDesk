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

export default function MenuPage({ data }) {
  const { settings={}, booking={}, menuCategories=[] } = data
  const name = settings.restaurantName || data.client?.name || 'Our Restaurant'

  return (
    <>
      <Head>
        <title>Menu — {name}</title>
        <meta name="description" content={`View the full menu at ${name}`}/>
      </Head>

      <UtilityBelt settings={settings} booking={booking} data={data}/>
      <SiteHeader  settings={settings} booking={booking} data={data}/>
      <Navbar      settings={settings} booking={booking}/>

      <main style={{ maxWidth:960, margin:'0 auto', padding:'56px 32px' }}>
        <h1 style={{ fontFamily:'Georgia,serif', fontSize:40, fontWeight:900,
          color:'var(--color-text,#1A1A1A)', marginBottom:8 }}>Our Menu</h1>
        <p style={{ fontSize:15, color:'#888', marginBottom:48 }}>
          Fresh ingredients, crafted with care
        </p>

        {menuCategories.length === 0 && (
          <p style={{ color:'#888' }}>Menu coming soon.</p>
        )}

        {menuCategories.map(cat => (
          <section key={cat.id} style={{ marginBottom:56 }}>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:26, fontWeight:800,
              color:'var(--color-primary)', marginBottom:6, paddingBottom:12,
              borderBottom:'2px solid var(--color-primary)' }}>
              {cat.name}
            </h2>
            {cat.description && (
              <p style={{ fontSize:13, color:'#888', marginBottom:20 }}>{cat.description}</p>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {cat.items.filter(i => i.isAvailable !== false).map(item => (
                <div key={item.id} style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'flex-start', padding:'16px 20px',
                  background:'#F9F9F9', borderRadius:10,
                  border:'1px solid #EFEFEF' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                      <span style={{ fontWeight:700, fontSize:16,
                        color:'var(--color-text,#1A1A1A)' }}>{item.name}</span>
                      {item.isFeatured && (
                        <span style={{ background:'var(--color-primary)', color:'#fff',
                          fontSize:10, fontWeight:700, padding:'2px 8px',
                          borderRadius:20 }}>Featured</span>
                      )}
                    </div>
                    {item.description && (
                      <p style={{ fontSize:13, color:'#888', margin:0, lineHeight:1.5 }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  <span style={{ fontWeight:800, fontSize:18,
                    color:'var(--color-primary)', marginLeft:24, flexShrink:0 }}>
                    ${item.price}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      <SiteFooter settings={settings} data={data}/>
    </>
  )
}