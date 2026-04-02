import Head from 'next/head'
import { getSiteData } from '../lib/api'
import { replaceShortcodes } from '../lib/shortcodes'
import { CMSProvider } from '../contexts/CMSContext'
import { Header } from '../components/theme-d1/Header'
import { Footer } from '../components/theme-d1/Footer'
import AboutTemplate from '../templates/theme-d1/AboutTemplate.jsx'
import MenuTemplate from '../templates/theme-d1/MenuTemplate.jsx'
import ContactTemplate from '../templates/theme-d1/ContactTemplate.jsx'
import LocationsTemplate from '../templates/theme-d1/LocationsTemplate.jsx'
import SpecialsTemplate from '../templates/theme-d1/SpecialsTemplate.jsx'

export async function getServerSideProps({ query, params }) {
  const slugParts = Array.isArray(params?.slug) ? params.slug : []
  const slug = slugParts.join('/').replace(/^\//, '')

  // Don't fetch data for common static assets that might fall through to dynamic routes
  if (slug === 'favicon.ico' || slug.startsWith('_next/')) {
    return { notFound: true }
  }

  const siteId = query.site || process.env.SITE_ID || ''
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

  // Route specific hardcoded templates based on slug
  if (norm(slug) === 'about' || norm(slug) === 'about-us') {
    return (
      <CMSProvider data={data}>
        <Head>
          <title>{`${sc(title)}`}</title>
          {desc && <meta name="description" content={sc(desc)} />}
          <meta property="og:title" content={sc(title)} />
          {desc && <meta property="og:description" content={sc(desc)} />}
          {ogImage && <meta property="og:image" content={ogImage} />}
        </Head>
        <Header />
        <AboutTemplate />
        <Footer />
      </CMSProvider>
    )
  }

  if (norm(slug) === 'menu') {
    return (
      <CMSProvider data={data}>
        <Head>
          <title>{`${sc(title)}`}</title>
          {desc && <meta name="description" content={sc(desc)} />}
          <meta property="og:title" content={sc(title)} />
          {desc && <meta property="og:description" content={sc(desc)} />}
          {ogImage && <meta property="og:image" content={ogImage} />}
        </Head>
        <Header />
        <MenuTemplate />
        <Footer />
      </CMSProvider>
    )
  }

  if (norm(slug) === 'contact' || norm(slug) === 'contact-us') {
    return (
      <CMSProvider data={data}>
        <Head>
          <title>{`${sc(title)}`}</title>
          {desc && <meta name="description" content={sc(desc)} />}
          <meta property="og:title" content={sc(title)} />
          {desc && <meta property="og:description" content={sc(desc)} />}
          {ogImage && <meta property="og:image" content={ogImage} />}
        </Head>
        <Header />
        <ContactTemplate />
        <Footer />
      </CMSProvider>
    )
  }

  if (norm(slug) === 'locations') {
    return (
      <CMSProvider data={data}>
        <Head>
          <title>{`${sc(title)}`}</title>
          {desc && <meta name="description" content={sc(desc)} />}
          <meta property="og:title" content={sc(title)} />
          {desc && <meta property="og:description" content={sc(desc)} />}
          {ogImage && <meta property="og:image" content={ogImage} />}
        </Head>
        <Header />
        <LocationsTemplate />
        <Footer />
      </CMSProvider>
    )
  }

  if (norm(slug) === 'specials') {
    return (
      <CMSProvider data={data}>
        <Head>
          <title>{`${sc(title)}`}</title>
          {desc && <meta name="description" content={sc(desc)} />}
          <meta property="og:title" content={sc(title)} />
          {desc && <meta property="og:description" content={sc(desc)} />}
          {ogImage && <meta property="og:image" content={ogImage} />}
        </Head>
        <Header />
        <SpecialsTemplate />
        <Footer />
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Page not found</h1>
          <p className="text-lg text-gray-600">
            This page isn’t published yet or the link is incorrect.
          </p>
        </main>
        <Footer />
      </CMSProvider>
    )
  }

  return (
    <CMSProvider data={data}>
      <Head>
        <title>{`${sc(title)}`}</title>
        {desc && <meta name="description" content={sc(desc)} />}
        <meta property="og:title" content={sc(title)} />
        {desc && <meta property="og:description" content={sc(desc)} />}
        {ogImage && <meta property="og:image" content={ogImage} />}
      </Head>
      <Header />

      <main className="pt-20 min-h-screen">
        {banner && (banner.imageUrl || banner.text || banner.title) && (
          <section className="bg-gray-50 border-b border-gray-200 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className={`grid gap-8 items-center ${banner.imageUrl ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <div className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-2">
                    {banner.title || 'Page'}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
                    {sc(page.title)}
                  </h1>
                  {banner.text && (
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {sc(banner.text)}
                    </p>
                  )}
                </div>
                {banner.imageUrl && (
                  <div className="rounded-2xl overflow-hidden shadow-lg">
                    <img src={banner.imageUrl} alt="" className="w-full h-auto object-cover" />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {!banner && (
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
              {sc(page.title)}
            </h1>
          )}
          <div
            className="prose prose-lg max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: sc(page.content || '') }}
          />
        </div>
      </main>

      <Footer />
    </CMSProvider>
  )
}

