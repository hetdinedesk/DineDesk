export default function ReviewsSection({ data={}, dark=false }) {
  const reviews = data.reviews || {}
  const items   = reviews.items || []

  // Return nothing if no review data has been entered in CMS
  if (!reviews.overallScore && items.length === 0) return null

  const bg   = dark ? '#0A0A0A' : 'var(--color-secondary,#1C2B1A)'
  const gold = '#F5A623'

  return (
    <section id="reviews" style={{ padding:'80px 64px', background:bg }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* Section heading */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'var(--color-primary)',
            letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>
            What People Say
          </div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:36,
            fontWeight:900, color:'#fff' }}>
            Our Reviews
          </h2>
        </div>

        {/* Aggregate score row */}
        {reviews.overallScore && (
          <div style={{ display:'flex', alignItems:'center', gap:32,
            background:'rgba(255,255,255,0.05)',
            border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:14, padding:'24px 32px',
            marginBottom:40, flexWrap:'wrap' }}>

            {/* Big score number */}
            <div style={{ textAlign:'center', paddingRight:24,
              borderRight:'1px solid rgba(255,255,255,0.15)', flexShrink:0 }}>
              <div style={{ fontFamily:'Georgia,serif', fontSize:56,
                fontWeight:900, color:'#fff', lineHeight:1 }}>
                {reviews.overallScore}
              </div>
              <div style={{ color:gold, fontSize:20, margin:'6px 0 4px' }}>
                ★★★★★
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>
                {reviews.totalReviews
                  ? reviews.totalReviews + ' reviews'
                  : 'reviews'}
              </div>
            </div>

            {/* Platform breakdown */}
            <div style={{ display:'flex', gap:28, flex:1,
              justifyContent:'center', flexWrap:'wrap' }}>
              {[
                { icon:'🔍', name:'Google',      score:reviews.googleScore, count:reviews.googleCount },
                { icon:'🌍', name:'TripAdvisor', score:reviews.tripScore,   count:reviews.tripCount   },
                { icon:'👍', name:'Facebook',    score:reviews.fbScore,     count:reviews.fbCount     },
              ].filter(function(p) { return p.score }).map(function(p) {
                return (
                  <div key={p.name} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:32, height:32, borderRadius:8,
                      background:'rgba(255,255,255,0.1)', display:'flex',
                      alignItems:'center', justifyContent:'center', fontSize:16 }}>
                      {p.icon}
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)',
                        fontWeight:600 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize:13, color:gold, fontWeight:700 }}>
                        {p.score} ★
                        {p.count ? ' (' + p.count + ')' : ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Review cards */}
        {items.length > 0 && (
          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',
            gap:20, marginBottom:40 }}>
            {items.filter(function(item) { return item.name }).map(function(item, i) {
              var stars = parseInt(item.stars) || 5
              return (
                <div key={i} style={{ background:'rgba(255,255,255,0.05)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:14, padding:24 }}>

                  {/* Reviewer info */}
                  <div style={{ display:'flex', alignItems:'center',
                    gap:12, marginBottom:14 }}>
                    <div style={{ width:44, height:44, borderRadius:'50%',
                      background:'var(--color-primary)', display:'flex',
                      alignItems:'center', justifyContent:'center',
                      fontSize:17, fontWeight:800, color:'#fff', flexShrink:0 }}>
                      {item.name.charAt(0).toUpperCase()}
                    </div>
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

                  {/* Stars */}
                  <div style={{ color:gold, fontSize:15, marginBottom:10,
                    letterSpacing:2 }}>
                    {Array(stars).fill('★').join('')}
                    {Array(5 - stars).fill('☆').join('')}
                  </div>

                  {/* Review text */}
                  <div style={{ fontSize:13.5, color:'rgba(255,255,255,0.70)',
                    lineHeight:1.7 }}>
                    {item.text
                      ? '\u201C' + item.text + '\u201D'
                      : ''}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display:'flex', alignItems:'center',
          justifyContent:'center', gap:16, flexWrap:'wrap' }}>
          {reviews.leaveReviewUrl && (
            <a href={reviews.leaveReviewUrl} target="_blank" rel="noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:8,
                background:'var(--color-primary)', color:'#fff',
                padding:'12px 28px', borderRadius:10, fontWeight:700,
                fontSize:14, textDecoration:'none' }}>
              ✏️ Leave a Review
            </a>
          )}
          <a href="#reviews"
            style={{ color:'rgba(255,255,255,0.6)', fontSize:14,
              fontWeight:600, textDecoration:'none',
              borderBottom:'1px solid rgba(255,255,255,0.3)',
              paddingBottom:2 }}>
            Read all {reviews.totalReviews || ''} reviews →
          </a>
        </div>

      </div>
    </section>
  )
}