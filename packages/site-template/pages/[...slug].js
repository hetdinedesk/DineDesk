import Head from 'next/head'
import { getSiteData } from '../lib/api'
import { replaceShortcodes } from '../lib/shortcodes'
import { CMSProvider } from '../contexts/CMSContext'
import { Header } from '../components/theme-d1/Header'
import { Footer } from '../components/theme-d1/Footer'
import { FloatingReviewWidget } from '../components/theme-d1/FloatingReviewWidget'
import MenuTemplate from '../templates/theme-d1/MenuTemplate.jsx'
import SpecialsTemplate from '../templates/theme-d1/SpecialsTemplate.jsx'
import TeamTemplate from '../templates/theme-d1/TeamTemplate.jsx'
import LocationsTemplate from '../templates/theme-d1/LocationsTemplate.jsx'
import CustomTemplate from '../templates/theme-d1/CustomTemplate.jsx'
import DOMPurify from 'dompurify'

export async function getServerSideProps({ query, params }) {
  const slugParts = Array.isArray(params?.slug) ? params.slug : []
  const slug = slugParts.join('/').replace(/^\//, '')

  // Don't fetch data for common static assets that might fall through to dynamic routes
  if (slug === 'favicon.ico' || slug.startsWith('_next/')) {
    return { notFound: true }
  }

  // Reject literal string "undefined" as invalid site ID
  const rawSite = query.site
  const siteId = (rawSite && rawSite !== 'undefined' && rawSite.trim() !== '')
    ? rawSite
    : (process.env.NEXT_PUBLIC_SITE_ID || process.env.SITE_ID || '')
  const data = await getSiteData(siteId)

  return {
    props: {
      data,
      colours: data.colours || null,
      slug
    }
  }
}

export default function DynamicPage({ data, slug }) {
  const pages = data?.pages || []
  const shortcodes = data?.shortcodes || {}
  const settings = data?.settings || {}

  const norm = (s) => String(s || '').replace(/^\//, '')
  const page = pages.find((p) => norm(p.slug) === norm(slug))

  const sc = (text) => replaceShortcodes(text || '', shortcodes)

  const siteName = settings.displayName || settings.restaurantName || data?.client?.name || ''
  const title = page?.metaTitle || page?.title || siteName || 'Page'
  const desc = page?.metaDesc || ''
  const ogImage = page?.ogImage || null

  const banner = page?.bannerId ? (data?.banners || []).find((b) => b.id === page.bannerId) : null
  const pageType = page?.pageType || null

  // pageType takes precedence; slug is the fallback for legacy routes
  // Locked templates: Menu, Specials, Team, Locations
  const isMenu     = pageType === 'menu'     || norm(slug) === 'menu'
  const isSpecials = pageType === 'specials' || norm(slug) === 'specials'
  const isTeam     = pageType === 'team'     || norm(slug) === 'team'
  const isLocations= pageType === 'locations'|| norm(slug) === 'locations'
  const isHardcoded = isMenu || isSpecials || isTeam || isLocations

  const headTags = (
    <Head>
      <title>{sc(title)}</title>
      {desc && <meta name="description" content={sc(desc)} />}
      <meta property="og:title" content={sc(title)} />
      {desc && <meta property="og:description" content={sc(desc)} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
    </Head>
  )

  // Hardcoded page types ALWAYS use their own templates (toggles don't affect them)
  if (isMenu) {
    return (
      <CMSProvider data={data}>
        {headTags}
        <Header />
        <MenuTemplate data={data} />
        <Footer />
        <FloatingReviewWidget />
      </CMSProvider>
    )
  }

  if (isSpecials) {
    return (
      <CMSProvider data={data}>
        {headTags}
        <Header />
        <SpecialsTemplate data={data} />
        <Footer />
        <FloatingReviewWidget />
      </CMSProvider>
    )
  }

  if (isTeam) {
    return (
      <CMSProvider data={data}>
        {headTags}
        <Header />
        <TeamTemplate data={data} />
        <Footer />
        <FloatingReviewWidget />
      </CMSProvider>
    )
  }

  if (isLocations) {
    return (
      <CMSProvider data={data}>
        {headTags}
        <Header />
        <LocationsTemplate data={data} page={page} banner={banner} />
        <Footer />
        <FloatingReviewWidget />
      </CMSProvider>
    )
  }

  if (!page) {
    return (
      <CMSProvider data={data}>
        <Head>
          <title>{siteName ? `${siteName} — Not Found` : 'Not Found'}</title>
        </Head>
        <Header />
        <main className="pt-32 pb-20 px-4 max-w-4xl mx-auto min-h-screen text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-primary, #111)' }}>Page not found</h1>
          <p className="text-lg text-gray-600">This page isn&apos;t published yet or the link is incorrect.</p>
        </main>
        <Footer />
        <FloatingReviewWidget />
      </CMSProvider>
    )
  }

  // For custom pages only (not hardcoded types), check for form/map toggles
  const showEnquiryForm = page.showEnquiryForm || false
  const showLocationMap = page.showLocationMap || false
  
  if (!isHardcoded && (showEnquiryForm || showLocationMap)) {
    return (
      <CMSProvider data={data}>
        {headTags}
        <Header />
        <CustomTemplate data={data} page={page} banner={banner} />
        <Footer />
        <FloatingReviewWidget />
      </CMSProvider>
    )
  }

  // Simple custom page layout (no toggles enabled)
  const bannerImg = banner?.imageUrl || page.ogImage || null

  return (
    <CMSProvider data={data}>
      {headTags}
      <Header />

      <main className="min-h-screen">
        {/* Hero Banner */}
        <div 
          className="relative flex items-center justify-center text-white overflow-hidden"
          style={{ 
            minHeight: '60vh',
            marginTop: 'calc(var(--header-offset, 5rem) * -1)',
            paddingTop: 'var(--header-offset, 5rem)',
            background: bannerImg ? 'transparent' : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary, #8B5A2B) 100%)'
          }}
        >
          {bannerImg && (
            <>
              <img src={bannerImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/55" />
            </>
          )}
          
          {!bannerImg && (
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            />
          )}
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
              style={{ 
                fontFamily: 'var(--font-heading, inherit)',
                textShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
            >
              {sc(page.title)}
            </h1>
            {(page?.subtitle || page?.metaDesc) && (
              <p className="text-xl md:text-2xl max-w-2xl mx-auto opacity-90" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                {sc(page?.subtitle || page?.metaDesc)}
              </p>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
            </svg>
          </div>
        </div>

        {/* Page body */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div
            className="prose prose-lg max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sc(page.content || '')) }}
          />
        </div>
      </main>
      <Footer />
      <FloatingReviewWidget />
    </CMSProvider>
  )
}

