import Head from 'next/head'
import ReviewsSection   from '../../components/ReviewsSection'
import LocationsSection from '../../components/LocationsSection'
import SiteFooter       from '../../components/SiteFooter'

export default function GardenFreshHome({ data }) {
  const { settings={}, homepage={}, booking={}, menuCategories=[], specials=[], banners=[] } = data
  const name     = settings.restaurantName || data.client?.name || 'Fresh Kitchen'
  const bookUrl  = booking.bookingUrl || '#book'
  const featured = menuCategories.flatMap(c => c.items).filter(i => i.isFeatured).slice(0,4)
  const features = [homepage.feature1,homepage.feature2,homepage.feature3,homepage.feature4].filter(Boolean)
  const sage   = '#4A7C59'
  const sageLt = '#E8F5E8'

  return (
    <>
      <Head><title>{name}</title></Head>

      <style>{`
        body { background:#FAFCFA; }
        .gf-nav a { color:#444; text-decoration:none; font-size:14px; font-weight:600; transition:color 0.15s; }
        .gf-nav a:hover { color:${sage}; }
        .gf-card { background:#fff; border:1px solid #E8F0E8; border-radius:16px; overflow:hidden; transition:transform 0.2s,box-shadow 0.2s; }
        .gf-card:hover { transform:translateY(-3px); box-shadow:0 8px 32px rgba(74,124,89,0.12); }
      `}</style>

      {/* Utility belt — clean white */}
      <div style={{background:'#fff',borderBottom:'1px solid #E8F0E8',padding:'0 32px',height:38,
        display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:12.5}}>
        <div style={{display:'flex',gap:20,color:'#888'}}>
          {settings.address      && <span>📍 {settings.address}</span>}
          {settings.phone        && <span>📞 {settings.phone}</span>}
          {settings.openingHours && <span>🕐 {settings.openingHours}</span>}
        </div>
        <a href={bookUrl} style={{background:sage,color:'#fff',padding:'4px 14px',borderRadius:20,fontSize:12,fontWeight:700,textDecoration:'none'}}>
          {booking.bookLabel || 'Book a Table'}
        </a>
      </div>

      {/* Header */}
      <header style={{background:'#fff',borderBottom:'1px solid #E8F0E8',padding:'0 32px',height:72,
        display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:38,zIndex:200}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:44,height:44,background:sageLt,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🌿</div>
          <div>
            <div style={{fontFamily:'Georgia,serif',fontSize:20,fontWeight:700,color:'#1A1A1A'}}>{name}</div>
            <div style={{fontSize:10,color:'#888',letterSpacing:'0.1em',textTransform:'uppercase'}}>Fresh &amp; Local</div>
          </div>
        </div>
        <nav className="gf-nav" style={{display:'flex',gap:24}}>
          <a href="/">Home</a><a href="/menu">Menu</a>
          <a href="/specials">Specials</a><a href="/locations">Visit</a>
          <a href="/contact">Contact</a>
        </nav>
        <div style={{display:'flex',gap:10}}>
          {booking.orderUrl && (
            <a href={booking.orderUrl} style={{background:'#1A1A1A',color:'#fff',padding:'9px 18px',borderRadius:8,fontWeight:600,fontSize:13,textDecoration:'none'}}>
              {booking.orderLabel || 'Order Online'}
            </a>
          )}
          <a href={bookUrl} style={{background:sage,color:'#fff',padding:'9px 18px',borderRadius:8,fontWeight:700,fontSize:13,textDecoration:'none'}}>
            {booking.bookLabel || 'Book'}
          </a>
        </div>
      </header>

      {/* Banners */}
      {banners.length > 0 && (
        <div style={{background:sageLt,borderBottom:'1px solid #C8E0C8',padding:'0 32px',height:44,display:'flex',alignItems:'center',gap:32}}>
          {banners.map(function(b) { return (
            <span key={b.id} style={{fontSize:13,color:sage,fontWeight:600}}>🌿 {b.text}</span>
          )})}
        </div>
      )}

      {/* Hero — clean two column */}
      <section style={{background:sageLt,padding:'80px 64px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:64,alignItems:'center',maxWidth:1200,margin:'0 auto'}}>
        <div>
          {homepage.heroBadge && (
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(74,124,89,0.15)',
              color:sage,padding:'5px 14px',borderRadius:20,fontSize:11,fontWeight:700,
              letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:18}}>
              🌿 {homepage.heroBadge}
            </div>
          )}
          <h1 style={{fontFamily:'Georgia,serif',fontSize:52,fontWeight:900,color:'#1A1A1A',
            lineHeight:1.08,letterSpacing:'-0.02em',marginBottom:18}}>
            {homepage.heroHeadline || 'Fresh Food, Happy People'}
          </h1>
          <p style={{fontSize:17,color:'#5C5C5C',lineHeight:1.7,marginBottom:32}}>
            {homepage.heroSubtext}
          </p>
          <div style={{display:'flex',gap:12}}>
            <a href="/menu" style={{background:sage,color:'#fff',padding:'13px 28px',
              borderRadius:10,fontWeight:700,textDecoration:'none'}}>
              {homepage.heroCta || 'Explore Menu'}
            </a>
            <a href={bookUrl} style={{background:'transparent',color:sage,padding:'13px 28px',
              borderRadius:10,fontWeight:700,textDecoration:'none',border:`2px solid ${sage}`}}>
              {booking.bookLabel || 'Book a Table'}
            </a>
          </div>
        </div>
        <div style={{height:420,borderRadius:24,overflow:'hidden',background:'#C8E0C8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:80}}>
          {homepage.heroBgImage
            ? <img src={homepage.heroBgImage} alt="hero" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            : '🌿'}
        </div>
      </section>

      {/* Featured dishes */}
      {featured.length > 0 && (
        <section style={{padding:'72px 64px',background:'#fff'}}>
          <div style={{textAlign:'center',marginBottom:40}}>
            <div style={{fontSize:11,fontWeight:800,color:sage,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:8}}>Our Menu</div>
            <h2 style={{fontFamily:'Georgia,serif',fontSize:36,fontWeight:900,color:'#1A1A1A'}}>Seasonal Favourites</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:20,maxWidth:1100,margin:'0 auto'}}>
            {featured.map(function(item) { return (
              <div key={item.id} className="gf-card">
                <div style={{height:180,background:sageLt,display:'flex',alignItems:'center',justifyContent:'center',fontSize:52}}>
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : '🥗'}
                </div>
                <div style={{padding:18}}>
                  <div style={{fontSize:10,fontWeight:700,color:sage,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>{item.category?.name}</div>
                  <div style={{fontFamily:'Georgia,serif',fontSize:17,fontWeight:700,color:'#1A1A1A',marginBottom:4}}>{item.name}</div>
                  <div style={{fontSize:12,color:'#888',lineHeight:1.5,marginBottom:12}}>{item.description}</div>
                  <div style={{fontSize:20,fontWeight:800,color:sage}}>${item.price}</div>
                </div>
              </div>
            )})}
          </div>
        </section>
      )}

      {/* About section */}
      <section style={{padding:'72px 64px',background:sageLt}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:64,alignItems:'center'}}>
          <div>
            <div style={{fontSize:11,fontWeight:800,color:sage,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:12}}>Our Story</div>
            <h2 style={{fontFamily:'Georgia,serif',fontSize:36,fontWeight:900,color:'#1A1A1A',marginBottom:20}}>
              {homepage.aboutTitle || 'Fresh from Farm to Table'}
            </h2>
            <p style={{fontSize:15,color:'#5C5C5C',lineHeight:1.75,marginBottom:14}}>{homepage.aboutPara1}</p>
            <p style={{fontSize:15,color:'#5C5C5C',lineHeight:1.75,marginBottom:24}}>{homepage.aboutPara2}</p>
            {features.length > 0 && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:28}}>
                {features.map(function(f,i) { return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,fontSize:13.5,fontWeight:600,color:'#1A1A1A'}}>{f}</div>
                )})}
              </div>
            )}
            <a href={bookUrl} style={{display:'inline-block',background:sage,color:'#fff',padding:'12px 24px',borderRadius:10,fontWeight:700,fontSize:14,textDecoration:'none'}}>
              {booking.bookLabel || 'Book a Table'}
            </a>
          </div>
          <div style={{height:380,borderRadius:20,overflow:'hidden',background:'#C8E0C8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:72}}>
            {homepage.aboutImage
              ? <img src={homepage.aboutImage} alt="about" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : '🌱'}
          </div>
        </div>
      </section>

      <ReviewsSection data={data}/>
      <LocationsSection data={data} booking={booking}/>
      <SiteFooter settings={settings} data={data}/>
    </>
  )
}