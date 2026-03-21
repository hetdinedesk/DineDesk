import Link from 'next/link'
export default function SiteFooter({ settings={}, data={} }) {
  const name = settings.restaurantName || data.client?.name || 'Restaurant'
  return (
    <footer style={{ background:'var(--color-secondary,#1C2B1A)', color:'rgba(255,255,255,0.6)' }}>
      <div style={{ padding:'56px 64px 40px',display:'grid',gridTemplateColumns:'1.6fr 1fr 1fr 1fr',gap:48,maxWidth:1200,margin:'0 auto' }}>
        <div>
          <div style={{ fontFamily:'Georgia,serif',fontSize:20,fontWeight:800,color:'#fff',marginBottom:12 }}>{name}</div>
          <p style={{ fontSize:13.5,lineHeight:1.7,marginBottom:16 }}>{settings.suburb ? `Proudly serving ${settings.suburb} since ${data.client?.createdAt ? new Date(data.client.createdAt).getFullYear() : ''}.` : ''}</p>
        </div>
        <div>
          <h4 style={{ fontSize:11,fontWeight:800,color:'#fff',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14 }}>Menu</h4>
          {[['Starters','/menu'],['Mains','/menu'],['Desserts','/menu'],['Drinks','/menu']].map(function([l,h]){return(<div key={l} style={{marginBottom:8}}><Link href={h} style={{fontSize:13.5,color:'rgba(255,255,255,0.6)',textDecoration:'none'}}>{l}</Link></div>)})}
        </div>
        <div>
          <h4 style={{ fontSize:11,fontWeight:800,color:'#fff',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14 }}>Visit</h4>
          {[['Locations','/locations'],['Specials','/specials'],['Contact','/contact']].map(function([l,h]){return(<div key={l} style={{marginBottom:8}}><Link href={h} style={{fontSize:13.5,color:'rgba(255,255,255,0.6)',textDecoration:'none'}}>{l}</Link></div>)})}
        </div>
        <div>
          <h4 style={{ fontSize:11,fontWeight:800,color:'#fff',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14 }}>Contact</h4>
          {settings.phone   && <div style={{fontSize:13,marginBottom:10}}>📞 {settings.phone}</div>}
          {settings.address && <div style={{fontSize:13,marginBottom:10}}>📍 {settings.address}</div>}
          {settings.defaultEmail && <div style={{fontSize:13}}>✉️ {settings.defaultEmail}</div>}
        </div>
      </div>
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)',padding:'18px 64px',display:'flex',justifyContent:'space-between',fontSize:12 }}>
        <span>© {new Date().getFullYear()} {name}. All rights reserved.</span>
        <div style={{display:'flex',gap:16}}>
          {['Privacy Policy','Terms'].map(l=><a key={l} href="#" style={{color:'rgba(255,255,255,0.4)',textDecoration:'none'}}>{l}</a>)}
        </div>
      </div>
    </footer>
  )
}