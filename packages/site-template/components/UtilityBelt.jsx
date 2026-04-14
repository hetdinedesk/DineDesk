import { replaceShortcodes } from '../lib/shortcodes'
import { useCMS } from '../contexts/CMSContext'

export default function UtilityBelt() {
  const { rawSettings: settings, rawBooking: booking, rawData: data, siteConfig, reviews: cmsReviews } = useCMS()
  const header       = data.header     || {}
  const reviews      = data.reviews    || {}
  const shortcodes   = data.shortcodes || {}
  const utilityItems = header.utilityItems || {}
  const sc           = (text) => replaceShortcodes(text || '', shortcodes)
  const social       = siteConfig.social

  const bookUrl  = booking.bookingUrl
    || (booking.bookingPhone ? `tel:${booking.bookingPhone}` : '#book')
  const orderUrl = booking.orderUrl
    || booking.uberEatsUrl
    || booking.doorDashUrl
    || booking.menulogUrl

  // Don't render if utility belt disabled in header config
  if (!header.utilityBelt) return null

  // Social Links mapping
  const socialPlatforms = [
    { key: 'facebook',  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
    { key: 'instagram', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> },
    { key: 'twitter',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { key: 'tiktok',    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.44 6.44 0 0 1-1.87-1.53c-.02 2.23.01 4.48-.02 6.72-.11 2.3-.96 4.67-2.73 6.18a7.06 7.06 0 0 1-6.14 1.25 7.15 7.15 0 0 1-4.04-2.88 7.33 7.33 0 0 1-1.04-5.22c.24-2.16 1.4-4.22 3.23-5.38 1.48-.95 3.27-1.33 5.01-1.1v4.11a3.03 3.03 0 0 0-1.89.84c-.69.66-1.03 1.62-.92 2.58.11.96.7 1.84 1.56 2.27.91.46 2.05.35 2.87-.27.75-.57 1.12-1.51 1.12-2.45V0z"/></svg> },
  ]

  // Header CTAs
  const headerCtas = data.headerCtas || []

  // Component renderers
  const components = {
    'contact-info': (
      <div key="contact-info" className="flex items-center gap-3 md:gap-5">
        {(utilityItems['contact-info'] !== false && settings.address) && (
          <span className="hidden md:flex items-center gap-1.5 truncate">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="truncate max-w-[150px] lg:max-w-none">{sc(settings.address)}</span>
          </span>
        )}
        {(utilityItems['contact-info'] !== false && settings.phone) && (
          <a href={`tel:${settings.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {settings.phone}
          </a>
        )}
      </div>
    ),
    'social-links': (utilityItems['social-links'] !== false && social?.showInUtility !== false) && (
      <div key="social-links" className="hidden sm:flex items-center gap-3 ml-2 pl-4 border-l border-white/10">
        {socialPlatforms.map(platform => {
          const url = social[platform.key]
          if (!url) return null
          return (
            <a key={platform.key} href={url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors opacity-70 hover:opacity-100">
              {platform.icon}
            </a>
          )
        })}
      </div>
    ),
    'reviews': (utilityItems.reviews !== false && reviews.enableHeader !== false && reviews.overallScore) && (
      <a key="reviews" href="#reviews" className="hidden sm:flex items-center gap-1 hover:text-white transition-colors">
        <span className="text-[#F5A623]">★</span>
        {reviews.overallScore}
        {reviews.totalReviews && ` (${reviews.totalReviews})`}
      </a>
    ),
    'header-ctas': (utilityItems['header-ctas'] !== false && headerCtas.length > 0) && (
      <div key="header-ctas" className="flex items-center gap-2">
        {headerCtas.filter(cta => cta.active).map(cta => (
          <a
            key={cta.id}
            href={cta.type === 'phone' ? `tel:${cta.value}` : cta.value}
            target={cta.type === 'url' ? '_blank' : undefined}
            rel={cta.type === 'url' ? 'noopener noreferrer' : undefined}
            className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
              cta.variant === 'primary' 
                ? 'bg-[var(--color-cta-bg,#C8823A)] text-[var(--color-cta-text,#fff)] hover:opacity-90'
                : 'border border-white/20 text-white hover:bg-white/10'
            }`}
          >
            {cta.label}
          </a>
        ))}
      </div>
    ),
    'order': (utilityItems.order !== false && booking.showOrderBtn !== false && orderUrl) && (
      <a key="order" href={orderUrl} className="hover:text-white transition-colors">
        {booking.orderLabel || 'Order Online'}
      </a>
    ),
    'reservations': (utilityItems.reservations !== false && booking.showInUtility !== false) && (
      <a key="reservations" href={bookUrl} className="bg-[var(--color-cta-bg,#C8823A)] text-[var(--color-cta-text,#fff)] px-3.5 py-1 rounded-full font-bold hover:opacity-90 transition-opacity">
        {booking.bookLabel || 'Book a Table'}
      </a>
    )
  }

  // Get current order or default
  const order = Array.isArray(utilityItems?.order) ? utilityItems.order : ['contact-info', 'social-links', 'reviews', 'header-ctas']

  return (
    <div className="bg-[var(--color-nav-bg,#1C2B1A)] text-white/75 text-xs font-medium px-4 md:px-8 h-10 flex items-center justify-between sticky top-0 z-[300] overflow-hidden">
      {/* Left side — usually contact info & social */}
      <div className="flex items-center gap-3 md:gap-5">
        {order.filter(key => ['contact-info', 'social-links'].includes(key)).map(key => components[key])}
      </div>

      {/* Right side — reviews, ctas, order, book */}
      <div className="flex items-center gap-3 md:gap-4">
        {order.filter(key => !['contact-info', 'social-links'].includes(key)).map(key => components[key])}
      </div>
    </div>
  )
}