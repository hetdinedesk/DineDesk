import Link from 'next/link'
import Head from 'next/head'
import UtilityBelt      from '../../components/UtilityBelt'
import SiteHeader       from '../../components/SiteHeader'
import Navbar           from '../../components/Navbar'
import BannerStrip      from '../../components/BannerStrip'
import ReviewsSection   from '../../components/ReviewsSection'
import LocationsSection from '../../components/LocationsSection'
import SiteFooter       from '../../components/SiteFooter'

export default function UrbanBistroHome({ data }) {
  const { settings={}, homepage={}, booking={}, menuCategories=[], specials=[], banners=[] } = data
  const name    = settings.restaurantName || data.client?.name || 'Our Restaurant'
  const bookUrl = booking.bookingUrl || (booking.bookingPhone ? `tel:${booking.bookingPhone}` : '#contact')
  const featured = menuCategories.flatMap(c => c.items).filter(i => i.isFeatured).slice(0,4)
  const stats = [
    homepage.stat1 ? homepage.stat1.split('|') : ['4.8★','Google Rating'],
    homepage.stat2 ? homepage.stat2.split('|') : ['300+','Reviews'],
    homepage.stat3 ? homepage.stat3.split('|') : ['2','Locations'],
  ]
  const features = [homepage.feature1,homepage.feature2,homepage.feature3,homepage.feature4].filter(Boolean)

  return (
    <>
      <Head>
        <title>{name}</title>
        <meta name="description" content={homepage.heroSubtext || `Welcome to ${name}`}/>
      </Head>

      <style>{`
        .ub-hero { background: linear-gradient(135deg, #1C2B1A 0%, #2D4A2A 100%); }
        .ub-hero-img { object-fit:cover; width:52%; height:100%; position:absolute; right:0; top:0; opacity:0.55; }
        .ub-card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08); transition:transform 0.2s; }
        .ub-card:hover { transform:translateY(-4px); }
        .ub-special { background:#1C2B1A; border-radius:14px; padding:28px; color:#fff; position:relative; overflow:hidden; transition:transform 0.2s; }
        .ub-special:hover { transform:translateY(-3px); }
      `}</style>

      {/* Utility Belt */}
      <UtilityBelt settings={settings} booking={booking} data={data}/>

      {/* Header */}
      <SiteHeader settings={settings} booking={booking} data={data}/>

      {/* Navbar */}
      <Navbar settings={settings} booking={booking}/>

      {/* Banner strip */}
      <BannerStrip banners={banners} booking={booking}/>

      {/* Hero */}
      <section className="ub-hero" style={{ position:'relative',height:580,display:'flex',alignItems:'center',overflow:'hidden' }}>
        {homepage.heroBgImage && <img src={homepage.heroBgImage} alt="hero" className="ub-hero-img"/>}
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(90deg,#1C2B1A 45%,rgba(28,43,26,0) 100%)' }}/>
        <div style={{ position:'relative',zIndex:2,padding:'0 64px',maxWidth:620 }}>
          {homepage.heroBadge && (
            <div style={{ display:'inline-flex',alignItems:'center',gap:8,background:'rgba(200,130,58,0.2)',
              border:'1px solid rgba(200,130,58,0.4)',color:'#F5C87A',padding:'6px 16px',
              borderRadius:20,fontSize:11.5,fontWeight:700,letterSpacing:'0.1em',
              textTransform:'uppercase',marginBottom:20 }}>
              ⭐ {homepage.heroBadge}
            </div>
          )}
          <h1 style={{ fontFamily:'Georgia,serif',fontSize:60,fontWeight:900,color:'#fff',
            lineHeight:1.05,letterSpacing:'-0.02em',marginBottom:18 }}>
            {homepage.heroHeadline || `Welcome to ${name}`}
          </h1>
          <p style={{ fontSize:17,color:'rgba(255,255,255,0.72)',lineHeight:1.65,marginBottom:32 }}>
            {homepage.heroSubtext || settings.suburb || 'Exceptional dining experience'}
          </p>
          <div style={{ display:'flex',gap:14,alignItems:'center' }}>
            <a href="/menu" style={{ background:'var(--color-primary)',color:'#fff',padding:'15px 32px',
              borderRadius:10,fontWeight:700,fontSize:15,textDecoration:'none',
              boxShadow:'0 4px 20px rgba(200,130,58,0.4)' }}>
              {homepage.heroCta || 'Explore Our Menu'}
            </a>
            <a href={bookUrl} style={{ color:'rgba(255,255,255,0.85)',fontWeight:600,fontSize:15,
              textDecoration:'none',borderBottom:'1px solid rgba(255,255,255,0.3)' }}>
              {booking.bookLabel || 'Book a Table'} →
            </a>
          </div>
        </div>
        {/* Stats bar */}
        <div style={{ position:'absolute',bottom:32,left:64,right:64,display:'flex',zIndex:2 }}>
          {stats.map(function(s,i) { return (
            <div key={i} style={{ flex:1,padding:'16px 24px',background:'rgba(255,255,255,0.08)',
              backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,0.12)',textAlign:'center',
              borderRadius:i===0?'10px 0 0 10px':i===stats.length-1?'0 10px 10px 0':'0',
              borderLeft:i>0?'none':undefined }}>
              <div style={{fontSize:26,fontWeight:800,color:'#fff'}}>{s[0]}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{s[1]}</div>
            </div>
          )})}
        </div>
      </section>

      {/* Welcome / About */}
      <section style={{ padding:'80px 64px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:80,alignItems:'center',maxWidth:1200,margin:'0 auto' }}>
        <div style={{ position:'relative' }}>
          <div style={{ height:440,borderRadius:20,overflow:'hidden',background:'#F7F2EA',display:'flex',alignItems:'center',justifyContent:'center',fontSize:80 }}>
            {homepage.aboutImage
              ? <img src={homepage.aboutImage} alt="about" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : '🍳'}
          </div>
          {homepage.yearsOpen && (
            <div style={{ position:'absolute',bottom:-20,right:-20,background:'var(--color-primary)',
              color:'#fff',width:110,height:110,borderRadius:'50%',display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',fontFamily:'Georgia,serif',
              boxShadow:'0 8px 24px rgba(200,130,58,0.4)',textAlign:'center' }}>
              <span style={{fontSize:26,fontWeight:900,lineHeight:1}}>{homepage.yearsOpen}</span>
              <span style={{fontSize:10,fontWeight:700,opacity:0.85,marginTop:2}}>YRS</span>
            </div>
          )}
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:'var(--color-primary)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:12}}>Our Story</div>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:40,fontWeight:900,lineHeight:1.1,marginBottom:20,color:'var(--color-text)'}}>
            {homepage.aboutTitle || `A Passion for ${name}`}
          </h2>
          <p style={{fontSize:15,color:'#5C5C5C',lineHeight:1.75,marginBottom:14}}>{homepage.aboutPara1 || ''}</p>
          <p style={{fontSize:15,color:'#5C5C5C',lineHeight:1.75,marginBottom:24}}>{homepage.aboutPara2 || ''}</p>
          {features.length > 0 && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:28}}>
              {features.map(function(f,i) { return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,fontSize:13.5,fontWeight:600,color:'var(--color-text)'}}>
                  {f}
                </div>
              )})}
            </div>
          )}
          <a href="/menu" style={{display:'inline-flex',alignItems:'center',gap:10,
            background:'var(--color-primary)',color:'#fff',padding:'13px 26px',borderRadius:10,
            fontWeight:700,fontSize:14,textDecoration:'none'}}>View Full Menu →</a>
          <a href={bookUrl} style={{display:'inline-flex',alignItems:'center',gap:10,
            marginLeft:12,background:'transparent',color:'var(--color-text)',padding:'13px 26px',
            borderRadius:10,fontWeight:700,fontSize:14,textDecoration:'none',border:'2px solid #E8E0D4'}}>
            {booking.bookLabel || 'Book a Table'}
          </a>
        </div>
      </section>

      {/* Best sellers */}
      {featured.length > 0 && (
        <section style={{ padding:'70px 64px',background:'#F7F2EA' }}>
          <div style={{textAlign:'center',marginBottom:40}}>
            <div style={{fontSize:11,fontWeight:800,color:'var(--color-primary)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:8}}>Our Menu</div>
            <h2 style={{fontFamily:'Georgia,serif',fontSize:38,fontWeight:900,color:'var(--color-text)'}}>Best Selling Dishes</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:20,maxWidth:1100,margin:'0 auto'}}>
            {featured.map(function(item) { return (
              <div key={item.id} className="ub-card">
                <div style={{height:180,background:'linear-gradient(135deg,#F5E6D0,#E8D5B0)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:56,position:'relative'}}>
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
                    : '🍽️'}
                </div>
                <div style={{padding:'16px 18px'}}>
                  <div style={{fontSize:10.5,fontWeight:700,color:'var(--color-primary)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>{item.category?.name}</div>
                  <div style={{fontFamily:'Georgia,serif',fontSize:17,fontWeight:700,color:'var(--color-text)',marginBottom:5}}>{item.name}</div>
                  <div style={{fontSize:12,color:'#9A9A9A',marginBottom:12,lineHeight:1.5}}>{item.description}</div>
                  <div style={{fontSize:20,fontWeight:800,color:'var(--color-primary)'}}>${item.price}</div>
                </div>
              </div>
            )})}
          </div>
          <div style={{textAlign:'center',marginTop:36}}>
            <a href="/menu" style={{display:'inline-flex',background:'var(--color-primary)',color:'#fff',
              padding:'13px 28px',borderRadius:10,fontWeight:700,textDecoration:'none'}}>View Full Menu</a>
          </div>
        </section>
      )}

      {/* Specials */}
      {specials.length > 0 && (
        <section style={{padding:'70px 64px'}}>
          <div style={{textAlign:'center',marginBottom:36}}>
            <div style={{fontSize:11,fontWeight:800,color:'var(--color-primary)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:8}}>Limited Time</div>
            <h2 style={{fontFamily:'Georgia,serif',fontSize:38,fontWeight:900,color:'var(--color-text)'}}>Current Specials</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20,maxWidth:1100,margin:'0 auto'}}>
            {specials.map(function(s,i) { return (
              <div key={s.id} className="ub-special" style={{background:i===1?'var(--color-primary)':'var(--color-secondary)'}}>
                <div style={{fontSize:11,fontWeight:800,background:'rgba(255,255,255,0.2)',display:'inline-block',padding:'3px 10px',borderRadius:20,color:'#fff',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>Special</div>
                <div style={{fontFamily:'Georgia,serif',fontSize:22,fontWeight:700,color:'#fff',marginBottom:8}}>{s.title}</div>
                {s.price && <div style={{fontSize:28,fontWeight:800,color:i===1?'#fff':'var(--color-primary)'}}>${s.price}</div>}
                {s.description && <div style={{fontSize:13,color:'rgba(255,255,255,0.65)',marginTop:8}}>{s.description}</div>}
              </div>
            )})}
          </div>
        </section>
      )}

      {/* Reviews */}
      <ReviewsSection data={data}/>

      {/* Locations */}
      <LocationsSection data={data} booking={booking}/>

      {/* Footer */}
      <SiteFooter settings={settings} data={data}/>
    </>
  )
}