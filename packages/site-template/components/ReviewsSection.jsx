export default function ReviewsSection({ data={} }) {
  const reviews    = data.reviews || {}
  const colours    = data.colours || {}

  // Use live Google reviews if available, otherwise nothing
  const reviewCards = reviews.googleReviews || []

  // Don't render if no data at all
  if (!reviews.overallScore && reviewCards.length === 0) return null

  const bg      = 'var(--color-secondary, #1C2B1A)'
  const gold    = '#F5A623'
  const heading = reviews.carouselHeading    || 'What Our Customers Say'
  const subhead = reviews.carouselSubHeading || ''
  const content = reviews.carouselContent    || ''
  const ctas    = (reviews.ctas || []).filter(c => c.active !== false)

  const renderCta = (cta, i) => {
    const href = cta.type === 'internal' ? cta.value
      : cta.type === 'phone' ? `tel:${cta.value}`
      : cta.type === 'email' ? `mailto:${cta.value}`
      : cta.value

    const styles = {
      primary: {
        background: 'var(--color-cta-bg, #C8823A)',
        color:      'var(--color-cta-text, #fff)',
        border:     'none',
      },
      secondary: {
        background: 'rgba(255,255,255,0.1)',
        color:      '#fff',
        border:     '1px solid rgba(255,255,255,0.3)',
      },
      outline: {
        background: 'transparent',
        color:      'var(--color-cta-bg, #C8823A)',
        border:     '2px solid var(--color-cta-bg, #C8823A)',
      },
      text: {
        background: 'transparent',
        color:      'rgba(255,255,255,0.7)',
        border:     'none',
        textDecoration: 'underline',
      },
    }

    const variantStyle = styles[cta.variant || 'primary']

    return (
      <a key={cta.id || i} href={href}
        target={cta.type === 'external' ? '_blank' : undefined}
        rel={cta.type === 'external' ? 'noreferrer' : undefined}
        style={{ ...variantStyle,
          padding:'12px 28px', borderRadius:10,
          fontWeight:700, fontSize:14, textDecoration:'none',
          display:'inline-block', transition:'opacity 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity='1'}>
        {cta.label}
      </a>
    )
  }

  return (
    <section id="reviews" style={{ padding:'80px 64px', background:bg }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* Section heading — from CMS */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:800,
            color:'var(--color-primary)',
            letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>
            What People Say
          </div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:36,
            fontWeight:900, color:'#fff', marginBottom: subhead ? 12 : 0 }}>
            {heading}
          </h2>
          {subhead && (
            <p style={{ fontSize:15, color:'rgba(255,255,255,0.6)', marginTop:8 }}>
              {subhead}
            </p>
          )}
          {content && (
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)',
              marginTop:10, maxWidth:600, margin:'10px auto 0' }}>
              {content}
            </p>
          )}
        </div>

        {/* Aggregate score */}
        {reviews.overallScore && (
          <div style={{ display:'flex', alignItems:'center', gap:32,
            background:'rgba(255,255,255,0.05)',
            border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:14, padding:'24px 32px',
            marginBottom:40, flexWrap:'wrap' }}>

            <div style={{ textAlign:'center', paddingRight:24,
              borderRight:'1px solid rgba(255,255,255,0.15)', flexShrink:0 }}>
              <div style={{ fontFamily:'Georgia,serif', fontSize:56,
                fontWeight:900, color:'#fff', lineHeight:1 }}>
                {reviews.overallScore}
              </div>
              <div style={{ color:gold, fontSize:20, margin:'6px 0 4px' }}>★★★★★</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>
                {reviews.totalReviews ? reviews.totalReviews + ' reviews' : 'reviews'}
              </div>
            </div>

            <div style={{ display:'flex', gap:28, flex:1,
              justifyContent:'center', flexWrap:'wrap' }}>
              {[
                { name:'Google',      score:reviews.googleScore, count:reviews.googleCount },
                { name:'TripAdvisor', score:reviews.tripScore,   count:reviews.tripCount   },
                { name:'Facebook',    score:reviews.fbScore,     count:reviews.fbCount     },
              ].filter(p => p.score).map(p => (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)',
                      fontWeight:600 }}>{p.name}</div>
                    <div style={{ fontSize:13, color:gold, fontWeight:700 }}>
                      {p.score} ★{p.count ? ` (${p.count})` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review cards — from Google Places API */}
        {reviewCards.length > 0 && (
          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',
            gap:20, marginBottom:40 }}>
            {reviewCards.map((item, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:14, padding:24 }}>

                <div style={{ display:'flex', alignItems:'center',
                  gap:12, marginBottom:14 }}>
                  {/* Google profile photo or initial */}
                  {item.photo ? (
                    <img src={item.photo} alt={item.name}
                      style={{ width:44, height:44, borderRadius:'50%',
                        objectFit:'cover', flexShrink:0 }}/>
                  ) : (
                    <div style={{ width:44, height:44, borderRadius:'50%',
                      background:'var(--color-primary)', display:'flex',
                      alignItems:'center', justifyContent:'center',
                      fontSize:17, fontWeight:800, color:'#fff', flexShrink:0 }}>
                      {item.name?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:'#fff' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize:11,
                      color:'rgba(255,255,255,0.4)', marginTop:2 }}>
                      {[item.date, item.source].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>

                <div style={{ color:gold, fontSize:15, marginBottom:10, letterSpacing:2 }}>
                  {Array(parseInt(item.stars) || 5).fill('★').join('')}
                  {Array(5 - (parseInt(item.stars) || 5)).fill('☆').join('')}
                </div>

                <div style={{ fontSize:13.5, color:'rgba(255,255,255,0.70)',
                  lineHeight:1.7 }}>
                  {item.text ? `\u201C${item.text}\u201D` : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTAs from CMS Reviews → Calls To Action */}
        {ctas.length > 0 && (
          <div style={{ display:'flex', alignItems:'center',
            justifyContent:'center', gap:16, flexWrap:'wrap' }}>
            {ctas.map(renderCta)}
          </div>
        )}

      </div>
    </section>
  )
}