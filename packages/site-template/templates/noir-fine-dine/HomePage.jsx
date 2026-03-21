import Head from 'next/head'
import UtilityBelt      from '../../components/UtilityBelt'
import SiteHeader       from '../../components/SiteHeader'
import ReviewsSection   from '../../components/ReviewsSection'
import LocationsSection from '../../components/LocationsSection'
import SiteFooter       from '../../components/SiteFooter'

export default function NoirFineDineHome({ data }) {
  const { settings={}, homepage={}, booking={}, menuCategories=[], specials=[], banners=[] } = data
  const name     = settings.restaurantName || data.client?.name || 'Fine Dining'
  const bookUrl  = booking.bookingUrl || '#book'
  const featured = menuCategories.flatMap(c => c.items).filter(i => i.isFeatured).slice(0,3)
  const gold = '#C9A84C'

  return (
    <>
      <Head><title>{name}</title></Head>

      <style>{`
        body { background:#0A0A0A; }
        .noir-nav a { color:rgba(255,255,255,0.7); text-decoration:none; font-size:13px; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; transition:color 0.15s; }
        .noir-nav a:hover { color:#C9A84C; }
        .noir-dish { background:#141414; border:1px solid #2A2A2A; border-radius:12px; overflow:hidden; transition:border-color 0.2s; }
        .noir-dish:hover { border-color:#C9A84C; }
      `}</style>

      {/* Minimal dark utility belt */}
      <div style={{background:'#0A0A0A',borderBottom:'1px solid #1A1A1A',padding:'0 40px',height:36,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontSize:12,color:'#666',letterSpacing:'0.1em'}}>{settings.address}</span>
        <div style={{display:'flex',gap:20,alignItems:'center'}}>
          <span style={{fontSize:12,color:'#666',letterSpacing:'0.08em'}}>{settings.phone}</span>
          <a href={bookUrl} style={{fontSize:11,color:gold,letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:700,textDecoration:'none'}}>Reserve a Table</a>
        </div>
      </div>

      {/* Header */}
      <header style={{background:'#0A0A0A',borderBottom:'1px solid #1A1A1A',padding:'0 40px',height:70,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:36,zIndex:200}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:42,height:42,background:gold,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🥂</div>
          <div>
            <div style={{fontFamily:'Georgia,serif',fontSize:20,fontWeight:700,color:'#fff',letterSpacing:'-0.01em'}}>{name}</div>
            <div style={{fontSize:10,color:'#555',letterSpacing:'0.15em',textTransform:'uppercase'}}>Fine Dining</div>
          </div>
        </div>
        <nav className="noir-nav" style={{display:'flex',gap:28}}>
          <a href="/">Home</a><a href="/menu">Menu</a><a href="/specials">Specials</a>
          <a href="/locations">Locations</a><a href="/contact">Contact</a>
        </nav>
        <a href={bookUrl} style={{background:gold,color:'#0A0A0A',padding:'10px 22px',borderRadius:6,
          fontWeight:700,fontSize:13,letterSpacing:'0.05em',textDecoration:'none',textTransform:'uppercase'}}>
          {booking.bookLabel || 'Reserve'}
        </a>
      </header>

      {/* Banners strip */}
      {banners.length > 0 && (
        <div style={{background:'#111',borderBottom:'1px solid #2A2A2A',padding:'0 32px',height:44,display:'flex',alignItems:'center',gap:32,overflow:'hidden'}}>
          {banners.map(function(b) { return (
            <span key={b.id} style={{fontSize:13,color:'rgba(255,255,255,0.6)',flexShrink:0}}>
              <span style={{color:gold,marginRight:8}}>✦</span>{b.text}
            </span>
          )})}
        </div>
      )}

      {/* Hero — full width dark cinematic */}
      <section style={{position:'relative',height:640,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',background:'#050505'}}>
        {homepage.heroBgImage && (
          <img src={homepage.heroBgImage} alt="hero"
            style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:0.35}}/>
        )}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(5,5,5,0.3),rgba(5,5,5,0.85))'}}/>
        <div style={{position:'relative',zIndex:2,textAlign:'center',padding:'0 40px',maxWidth:800}}>
          <div style={{width:48,height:2,background:gold,margin:'0 auto 24px'}}/>
          {homepage.heroBadge && (
            <div style={{fontSize:11,color:gold,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:20,fontWeight:600}}>
              {homepage.heroBadge}
            </div>
          )}
          <h1 style={{fontFamily:'Georgia,serif',fontSize:68,fontWeight:400,color:'#fff',lineHeight:1.08,letterSpacing:'-0.02em',marginBottom:20}}>
            {homepage.heroHeadline || name}
          </h1>
          <p style={{fontSize:16,color:'rgba(255,255,255,0.6)',lineHeight:1.7,marginBottom:36,maxWidth:520,margin:'0 auto 36px'}}>
            {homepage.heroSubtext}
          </p>
          <div style={{display:'flex',gap:16,justifyContent:'center'}}>
            <a href={bookUrl} style={{background:gold,color:'#0A0A0A',padding:'14px 36px',
              fontWeight:700,fontSize:13,letterSpacing:'0.08em',textDecoration:'none',textTransform:'uppercase',borderRadius:4}}>
              {booking.bookLabel || 'Reserve a Table'}
            </a>
            <a href="/menu" style={{background:'transparent',color:'rgba(255,255,255,0.8)',padding:'14px 36px',
              fontWeight:600,fontSize:13,letterSpacing:'0.08em',textDecoration:'none',textTransform:'uppercase',
              border:'1px solid rgba(255,255,255,0.25)',borderRadius:4}}>
              Explore Menu
            </a>
          </div>
        </div>
      </section>

      {/* Signature dishes */}
      {featured.length > 0 && (
        <section style={{padding:'80px 64px',background:'#0A0A0A'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <div style={{width:32,height:1,background:gold,margin:'0 auto 16px'}}/>
            <h2 style={{fontFamily:'Georgia,serif',fontSize:36,fontWeight:400,color:'#fff',letterSpacing:'-0.01em'}}>Signature Dishes</h2>
            <div style={{width:32,height:1,background:gold,margin:'16px auto 0'}}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,maxWidth:1100,margin:'0 auto'}}>
            {featured.map(function(item) { return (
              <div key={item.id} className="noir-dish">
                <div style={{height:200,background:'#1A1A1A',display:'flex',alignItems:'center',justifyContent:'center',fontSize:60}}>
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : '🍽️'}
                </div>
                <div style={{padding:20}}>
                  <div style={{fontSize:10,color:gold,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:6,fontWeight:700}}>{item.category?.name}</div>
                  <div style={{fontFamily:'Georgia,serif',fontSize:18,color:'#fff',marginBottom:6}}>{item.name}</div>
                  <div style={{fontSize:12,color:'#555',lineHeight:1.5,marginBottom:14}}>{item.description}</div>
                  <div style={{fontSize:20,fontWeight:700,color:gold}}>${item.price}</div>
                </div>
              </div>
            )})}
          </div>
        </section>
      )}

      {/* About */}
      <section style={{padding:'80px 64px',background:'#060606',borderTop:'1px solid #1A1A1A'}}>
        <div style={{maxWidth:700,margin:'0 auto',textAlign:'center'}}>
          <div style={{width:32,height:1,background:gold,margin:'0 auto 24px'}}/>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:36,fontWeight:400,color:'#fff',marginBottom:24}}>
            {homepage.aboutTitle || 'The Art of Fine Dining'}
          </h2>
          <p style={{fontSize:16,color:'rgba(255,255,255,0.5)',lineHeight:1.8,marginBottom:14}}>{homepage.aboutPara1}</p>
          <p style={{fontSize:16,color:'rgba(255,255,255,0.5)',lineHeight:1.8,marginBottom:32}}>{homepage.aboutPara2}</p>
          <a href={bookUrl} style={{display:'inline-block',background:gold,color:'#0A0A0A',
            padding:'13px 32px',fontWeight:700,textDecoration:'none',letterSpacing:'0.08em',textTransform:'uppercase',fontSize:13}}>
            {booking.bookLabel || 'Make a Reservation'}
          </a>
        </div>
      </section>

      <ReviewsSection data={data} dark={true}/>
      <LocationsSection data={data} booking={booking} dark={true}/>

      {/* Footer */}
      <footer style={{background:'#040404',borderTop:'1px solid #1A1A1A',padding:'48px 64px',textAlign:'center'}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:22,color:'#fff',marginBottom:8}}>{name}</div>
        <p style={{fontSize:12,color:'#444',marginBottom:20,letterSpacing:'0.08em'}}>{settings.address}</p>
        <div style={{display:'flex',gap:24,justifyContent:'center',marginBottom:24}}>
          {[['Menu','/menu'],['Locations','/locations'],['Contact','/contact']].map(function([l,h]) { return (
            <a key={h} href={h} style={{fontSize:11,color:'#444',textDecoration:'none',letterSpacing:'0.12em',textTransform:'uppercase'}}>{l}</a>
          )})}
        </div>
        <p style={{fontSize:11,color:'#333'}}>© 2025 {name}. All rights reserved.</p>
      </footer>
    </>
  )
}